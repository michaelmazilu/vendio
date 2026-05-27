import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type BrowserContext, type Locator, type Page } from "playwright";

export type AutomationProfile = "facebook" | "kijiji";

const dataDir = path.join(process.cwd(), ".vendio");

const profileDirs: Record<AutomationProfile, string> = {
  facebook: path.join(dataDir, "facebook-profile"),
  kijiji: path.join(dataDir, "kijiji-profile"),
};

const sessionMarkerPath = path.join(dataDir, "facebook-session.json");
const kijijiSessionMarkerPath = path.join(dataDir, "kijiji-session.json");
const kijijiHomeUrl = "https://www.kijiji.ca/";
const kijijiPostAdUrl = "https://www.kijiji.ca/p-post-ad.html";

export type FacebookSession = {
  userId: string;
  connectedAt: string;
};

export type KijijiSession = {
  connectedAt: string;
};

type KijijiAuthState = "signed-in" | "signed-out" | "unknown";

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
    const marker = await getFacebookSession();
    if (!marker) {
      return { connected: false };
    }

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
    if (typeof parsed.connectedAt !== "string" || parsed.connectedAt.length === 0) {
      return null;
    }

    return { connectedAt: parsed.connectedAt };
  } catch {
    return null;
  }
}

export async function isKijijiLoggedIn(): Promise<boolean> {
  const verified = await verifyKijijiSession();
  return verified.connected;
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

async function isKijijiErrorPage(page: Page): Promise<boolean> {
  const url = page.url();
  if (/t-login\.html|m-user-login\.html/i.test(url)) {
    return true;
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");
  return /page not found|no longer exists|404/i.test(bodyText);
}

function isKijijiAuthUrl(url: string) {
  return /\/(login|sign-?in|auth|forgot-password|register)/i.test(url);
}

async function isVisible(locator: Locator, timeout = 1_000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function getKijijiAuthState(page: Page): Promise<KijijiAuthState> {
  const url = page.url();
  if (!/kijiji\.ca/i.test(url)) {
    return "unknown";
  }

  if ((await isKijijiErrorPage(page)) || isKijijiAuthUrl(url)) {
    return "signed-out";
  }

  const signedOutControl = page
    .locator("a, button")
    .filter({ hasText: /register\s*or\s*sign\s*in|^sign\s*in$|^log\s*in$/i });

  if (await isVisible(signedOutControl)) {
    return "signed-out";
  }

  const signedInControl = page
    .locator("a, button")
    .filter({ hasText: /my kijiji|my ads|messages|notifications|account|profile|sign out/i });

  if (await isVisible(signedInControl)) {
    return "signed-in";
  }

  if (/\/p-post-ad\.html/i.test(url)) {
    const postAdFormControl = page.locator('form, input, textarea, [contenteditable="true"]');
    if (await isVisible(postAdFormControl, 2_000)) {
      return "signed-in";
    }
  }

  return "unknown";
}

/**
 * Kijiji retired legacy login URLs (e.g. t-login.html). Open sign-in from the
 * live homepage header, or via post-ad when that flow redirects to auth.
 */
async function openKijijiSignIn(page: Page) {
  await page.goto(kijijiHomeUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.bringToFront();
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

  if ((await getKijijiAuthState(page)) === "signed-in") {
    return;
  }

  const signInLink = page
    .locator("a, button")
    .filter({ hasText: /register\s*or\s*sign\s*in|^sign\s*in$|^log\s*in$/i })
    .first();

  try {
    await signInLink.waitFor({ state: "visible", timeout: 8_000 });
    await signInLink.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);
  } catch {
    await page.goto(kijijiPostAdUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
  }

  if (await isKijijiErrorPage(page)) {
    await page.goto(kijijiHomeUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    throw new Error(
      "Kijiji could not open the sign-in page. Click Register or Sign In at the top of kijiji.ca in the browser window.",
    );
  }
}

/**
 * Opens Kijiji sign-in and waits for the user to complete login manually.
 * Resolves only after Kijiji shows an explicit signed-in signal.
 */
export async function loginToKijiji(
  timeoutMs = 110_000,
): Promise<{ loggedIn: boolean; message: string }> {
  const page = await getAutomationPage("kijiji");
  await openKijijiSignIn(page);

  if ((await getKijijiAuthState(page).catch(() => "unknown")) === "signed-in") {
    await writeKijijiSession();
    return { loggedIn: true, message: "Kijiji session is already connected." };
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const authState = await getKijijiAuthState(page).catch(() => "unknown");
    if (authState === "signed-in") {
      await writeKijijiSession();
      return { loggedIn: true, message: "Kijiji connected. You can post your listing now." };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  return {
    loggedIn: false,
    message:
      "Login wasn't completed in time. Use Register or Sign In at kijiji.ca in the browser window, then click Connect again.",
  };
}

export async function verifyKijijiSession(): Promise<{ connected: boolean }> {
  try {
    const marker = await getKijijiSession();
    if (!marker) {
      return { connected: false };
    }

    const page = await getAutomationPage("kijiji");
    await page.goto(kijijiPostAdUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    const authState = await getKijijiAuthState(page);
    if (authState === "signed-in" || (authState === "unknown" && !isKijijiAuthUrl(page.url()))) {
      await writeKijijiSession();
      return { connected: true };
    }

    await clearKijijiSession();
    return { connected: false };
  } catch {
    await clearKijijiSession();
    return { connected: false };
  }
}

export async function openKijijiPostAd() {
  const page = await getAutomationPage("kijiji");
  await page.goto(kijijiPostAdUrl, {
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
