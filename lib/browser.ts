import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type BrowserContext, type Page } from "playwright";

export type AutomationProfile = "facebook" | "kijiji";

const dataDir = path.join(process.cwd(), ".vendio");

const profileDirs: Record<AutomationProfile, string> = {
  facebook: path.join(dataDir, "facebook-profile"),
  kijiji: path.join(dataDir, "kijiji-profile"),
};

const sessionMarkerPath = path.join(dataDir, "facebook-session.json");
const kijijiSessionMarkerPath = path.join(dataDir, "kijiji-session.json");

export type FacebookSession = {
  userId: string;
  connectedAt: string;
};

export type KijijiSession = {
  connectedAt: string;
};

type BrowserGlobal = typeof globalThis & {
  __vendioBrowserContexts?: Partial<Record<AutomationProfile, Promise<BrowserContext>>>;
};

const browserGlobal = globalThis as BrowserGlobal;

function resetAutomationContext(profile: AutomationProfile) {
  if (!browserGlobal.__vendioBrowserContexts) {
    return;
  }

  browserGlobal.__vendioBrowserContexts[profile] = undefined;
}

async function launchAutomationContext(profile: AutomationProfile): Promise<BrowserContext> {
  const browserProfileDir = profileDirs[profile];
  await mkdir(browserProfileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(browserProfileDir, {
    headless: false,
    slowMo: 160,
    viewport: { width: 1280, height: 900 },
  });

  context.on("close", () => resetAutomationContext(profile));
  return context;
}

async function getAutomationContext(profile: AutomationProfile): Promise<BrowserContext> {
  browserGlobal.__vendioBrowserContexts ??= {};

  browserGlobal.__vendioBrowserContexts[profile] ??= launchAutomationContext(profile);

  try {
    return await browserGlobal.__vendioBrowserContexts[profile]!;
  } catch (error) {
    resetAutomationContext(profile);
    throw error;
  }
}

export async function getAutomationPage(profile: AutomationProfile = "facebook"): Promise<Page> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const context = await getAutomationContext(profile);
      const page =
        context.pages().find((candidate) => !candidate.isClosed()) ?? (await context.newPage());
      await page.bringToFront();
      return page;
    } catch (error) {
      resetAutomationContext(profile);
      if (attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error(`Could not open the ${profile} browser session.`);
}

/**
 * Stored session marker. The real source of truth is the persistent Chromium
 * profile's cookies, but reading this file lets API routes gate requests
 * without launching a headed browser on every call (mirrors getIGSession()).
 */
export async function getFacebookSession(): Promise<FacebookSession | null> {
  try {
    const contents = await readFile(sessionMarkerPath, "utf8");
    const parsed = JSON.parse(contents) as Partial<FacebookSession>;
    if (typeof parsed.userId === "string" && parsed.userId.length > 0) {
      return { userId: parsed.userId, connectedAt: parsed.connectedAt ?? "" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function isFacebookLoggedIn(): Promise<boolean> {
  const verified = await verifyFacebookSession();
  return verified.connected;
}

export async function clearFacebookSession() {
  try {
    await unlink(sessionMarkerPath);
  } catch {
    // No marker on disk — already disconnected.
  }
}

async function writeFacebookSession(userId: string) {
  await mkdir(dataDir, { recursive: true });
  const session: FacebookSession = { userId, connectedAt: new Date().toISOString() };
  await writeFile(sessionMarkerPath, JSON.stringify(session, null, 2));
}

/**
 * Reads the live `c_user` cookie from the persistent profile. Facebook sets it
 * to the logged-in user's id, so its presence is a reliable login signal.
 */
async function readFacebookUserId(context: BrowserContext): Promise<string | null> {
  const cookies = await context.cookies("https://www.facebook.com");
  const cUser = cookies.find((cookie) => cookie.name === "c_user" && Boolean(cookie.value));
  return cUser?.value ?? null;
}

/**
 * Opens a headed Facebook login page and waits for the user to complete login
 * manually. Resolves as soon as the `c_user` cookie appears, persisting a
 * session marker for later gating.
 */
/**
 * Confirms login via the live `c_user` cookie and syncs the on-disk session marker.
 */
export async function verifyFacebookSession(): Promise<{
  connected: boolean;
  userId?: string;
}> {
  try {
    const context = await getAutomationContext("facebook");
    const userId = await readFacebookUserId(context);
    if (userId) {
      await writeFacebookSession(userId);
      return { connected: true, userId };
    }

    await clearFacebookSession();
    return { connected: false };
  } catch {
    await clearFacebookSession();
    return { connected: false };
  }
}

export async function loginToFacebook(
  timeoutMs = 110_000,
): Promise<{ loggedIn: boolean; message: string; userId?: string }> {
  const context = await getAutomationContext("facebook");

  const existingUserId = await readFacebookUserId(context).catch(() => null);
  if (existingUserId) {
    await writeFacebookSession(existingUserId);
    return {
      loggedIn: true,
      message: "Facebook session is already connected.",
      userId: existingUserId,
    };
  }

  const page = await getAutomationPage("facebook");
  await page
    .goto("https://www.facebook.com/login", { waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => undefined);
  await page.bringToFront();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const userId = await readFacebookUserId(context).catch(() => null);
    if (userId) {
      await writeFacebookSession(userId);
      return {
        loggedIn: true,
        message: "Facebook connected. You can post your listing now.",
        userId,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  return {
    loggedIn: false,
    message: "Login wasn't completed in time. Click Connect to open the browser and try again.",
  };
}

export async function openFacebookMarketplace() {
  const page = await getAutomationPage("facebook");
  await page.goto("https://www.facebook.com/marketplace", { waitUntil: "domcontentloaded" });
  await page.bringToFront();

  return {
    url: page.url(),
    message:
      "Facebook Marketplace is open in the persistent browser. Log in manually if prompted, then return to Vendio.",
  };
}

/**
 * Kijiji has no clean equivalent of Facebook's `c_user` cookie, so login is
 * confirmed via a DOM signal during connect and recorded in a marker file.
 * The post-time `detectKijijiBlocker` check is the second layer that catches a
 * stale/expired session.
 */
export async function getKijijiSession(): Promise<KijijiSession | null> {
  try {
    const contents = await readFile(kijijiSessionMarkerPath, "utf8");
    const parsed = JSON.parse(contents) as Partial<KijijiSession>;
    return { connectedAt: parsed.connectedAt ?? "" };
  } catch {
    return null;
  }
}

export async function isKijijiLoggedIn(): Promise<boolean> {
  return (await getKijijiSession()) !== null;
}

export async function clearKijijiSession() {
  try {
    await unlink(kijijiSessionMarkerPath);
  } catch {
    // No marker on disk — already disconnected.
  }
}

async function writeKijijiSession() {
  await mkdir(dataDir, { recursive: true });
  const session: KijijiSession = { connectedAt: new Date().toISOString() };
  await writeFile(kijijiSessionMarkerPath, JSON.stringify(session, null, 2));
}

/**
 * Best-effort logged-in check: on kijiji.ca, away from any auth path, with no
 * visible "Sign In" / "Register" link in the header.
 */
async function isKijijiSignedInOnPage(page: Page): Promise<boolean> {
  const url = page.url();
  if (!/kijiji\.ca/i.test(url)) {
    return false;
  }
  if (/t-login|\/login|sign-?in|register|\/auth/i.test(url)) {
    return false;
  }

  const signInVisible = await page
    .getByRole("link", { name: /sign in|register|log in/i })
    .first()
    .isVisible()
    .catch(() => false);

  return !signInVisible;
}

/**
 * Opens the headed Kijiji login page and waits for the user to complete login
 * manually. Resolves once the header no longer shows a sign-in link, persisting
 * a session marker for later gating.
 */
export async function loginToKijiji(
  timeoutMs = 110_000,
): Promise<{ loggedIn: boolean; message: string }> {
  const page = await getAutomationPage("kijiji");
  await page
    .goto("https://www.kijiji.ca/t-login.html", { waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => undefined);
  await page.bringToFront();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isKijijiSignedInOnPage(page).catch(() => false)) {
      await writeKijijiSession();
      return { loggedIn: true, message: "Kijiji connected. You can post your listing now." };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  return {
    loggedIn: false,
    message: "Login wasn't completed in time. Click Connect to open the browser and try again.",
  };
}

export async function openKijijiPostAd() {
  const page = await getAutomationPage("kijiji");
  await page.goto("https://www.kijiji.ca/p-post-ad.html", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.bringToFront();

  return {
    url: page.url(),
    message:
      "Kijiji Post Ad is open in the persistent browser. Log in manually if prompted, then return to Vendio.",
  };
}
