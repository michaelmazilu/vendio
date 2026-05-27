import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.UI_SNAPSHOT_URL ?? "http://localhost:3000";
const outputDir = new URL("../artifacts/ui-snapshots/", import.meta.url);

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

const journeys = [
  {
    name: "home",
    run: async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(450);
    },
  },
  {
    name: "connect",
    run: async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#get-started").getByRole("button", { name: /get started/i }).click();
      await page.waitForTimeout(450);
    },
  },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const journey of journeys) {
    try {
      await journey.run(page);
      await page.screenshot({
        path: new URL(`${viewport.name}-${journey.name}.png`, outputDir).pathname,
        fullPage: true,
      });
    } catch (error) {
      failures.push(`${viewport.name}/${journey.name}: ${error.message}`);
    }
  }

  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.error("UI snapshots failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Saved UI snapshots to ${outputDir.pathname}`);
