import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, type BrowserContext, type Page } from "playwright";

const browserProfileDir = path.join(process.cwd(), ".vendio", "facebook-profile");

type BrowserGlobal = typeof globalThis & {
  __vendioBrowserContext?: Promise<BrowserContext>;
};

const browserGlobal = globalThis as BrowserGlobal;

function resetAutomationContext() {
  browserGlobal.__vendioBrowserContext = undefined;
}

async function launchAutomationContext(): Promise<BrowserContext> {
  await mkdir(browserProfileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(browserProfileDir, {
    headless: false,
    slowMo: 160,
    viewport: { width: 1280, height: 900 },
  });

  context.on("close", resetAutomationContext);
  return context;
}

export async function getAutomationPage(): Promise<Page> {
  browserGlobal.__vendioBrowserContext ??= launchAutomationContext();

  let context: BrowserContext;
  try {
    context = await browserGlobal.__vendioBrowserContext;
  } catch (error) {
    resetAutomationContext();
    throw error;
  }

  const page =
    context.pages().find((candidate) => !candidate.isClosed()) ?? (await context.newPage());
  await page.bringToFront();

  return page;
}

export async function openFacebookMarketplace() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const page = await getAutomationPage();
      await page.goto("https://www.facebook.com/marketplace", { waitUntil: "domcontentloaded" });
      await page.bringToFront();

      return {
        url: page.url(),
        message:
          "Facebook Marketplace is open in the persistent browser. Log in manually if prompted, then return to Vendio.",
      };
    } catch (error) {
      resetAutomationContext();
      if (attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error("Could not open Facebook Marketplace.");
}
