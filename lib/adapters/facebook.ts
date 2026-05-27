import type { Locator, Page } from "playwright";

import { getAutomationPage } from "@/lib/browser";
import type { ListingDraft, StoredImageRecord } from "@/types/listing";

type FacebookPostInput = {
  listing: ListingDraft;
  images: StoredImageRecord[];
};

type FacebookPostResult = {
  listingUrl?: string;
  message: string;
};

const createItemUrl = "https://www.facebook.com/marketplace/create/item";

async function firstVisible(locator: Locator, timeout = 2_000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return locator.first();
  } catch {
    return null;
  }
}

async function detectFacebookBlocker(page: Page) {
  const url = page.url();
  if (url.includes("/login") || url.includes("login.php")) {
    return "Facebook needs you to log in. Complete login in the opened browser, then try posting again.";
  }

  if (url.includes("/checkpoint")) {
    return "Facebook is showing an account checkpoint. Resolve it in the opened browser, then try posting again.";
  }

  const blockerText = await firstVisible(
    page.getByText(/captcha|confirm your identity|marketplace isn't available|not available to you/i),
    1_000,
  );

  if (blockerText) {
    return "Facebook is blocking Marketplace access or asking for verification. Resolve it in the opened browser, then try posting again.";
  }

  return null;
}

async function fillTextField(page: Page, label: RegExp, value: string) {
  const candidates = [
    page.getByLabel(label).first(),
    page.getByPlaceholder(label).first(),
    page.getByRole("textbox", { name: label }).first(),
  ];

  for (const candidate of candidates) {
    try {
      await candidate.fill(value, { timeout: 4_000 });
      return;
    } catch {
      // Facebook labels change frequently, so try the next accessible selector.
    }
  }

  throw new Error(`Could not find the Facebook field for ${label.source}.`);
}

async function chooseOption(page: Page, label: RegExp, option: string) {
  const control =
    (await firstVisible(page.getByLabel(label), 2_000)) ??
    (await firstVisible(page.getByRole("combobox", { name: label }), 2_000)) ??
    (await firstVisible(page.getByText(label), 2_000));

  if (!control) {
    throw new Error(`Could not find the Facebook selector for ${label.source}.`);
  }

  await control.click();
  const optionLocator =
    (await firstVisible(page.getByRole("option", { name: new RegExp(`^${option}$`, "i") }), 2_000)) ??
    (await firstVisible(page.getByText(new RegExp(`^${option}$`, "i")), 2_000));

  if (!optionLocator) {
    throw new Error(`Could not choose "${option}" in Facebook for ${label.source}.`);
  }

  await optionLocator.click();
}

async function uploadPhotos(page: Page, images: StoredImageRecord[]) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(
    images.map((image) => image.absolutePath),
    { timeout: 10_000 },
  );
}

async function clickOptionalButton(page: Page, name: RegExp) {
  const button = await firstVisible(page.getByRole("button", { name }), 3_000);
  if (!button) {
    return false;
  }

  await button.click();
  return true;
}

export async function postToFacebookMarketplace({
  listing,
  images,
}: FacebookPostInput): Promise<FacebookPostResult> {
  if (images.length === 0) {
    throw new Error("Facebook posting requires at least one photo.");
  }

  const page = await getAutomationPage();
  await page.goto(createItemUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.bringToFront();

  const blocker = await detectFacebookBlocker(page);
  if (blocker) {
    throw new Error(blocker);
  }

  await uploadPhotos(page, images);
  await fillTextField(page, /^title$/i, listing.title);
  await fillTextField(page, /^price$/i, String(listing.price));
  await chooseOption(page, /^category$/i, listing.category);
  await chooseOption(page, /^condition$/i, listing.condition);
  await fillTextField(page, /^description$/i, listing.description);

  try {
    await fillTextField(page, /^location$/i, listing.location);
  } catch {
    // Facebook often pre-fills location from the account profile.
  }

  await clickOptionalButton(page, /^next$/i);
  const published = await clickOptionalButton(page, /^(publish|post)$/i);

  if (!published) {
    return {
      listingUrl: page.url(),
      message:
        "Facebook draft is filled in the browser. Review it there and click Publish if everything looks right.",
    };
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);

  return {
    listingUrl: page.url(),
    message: "Facebook accepted the publish action. Check the opened browser for the final listing.",
  };
}
