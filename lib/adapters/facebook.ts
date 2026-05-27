import type { Locator, Page } from "playwright";

import { getAutomationPage } from "@/lib/browser";
import type {
  ListingCategory,
  ListingCondition,
  ListingDraft,
  StoredImageRecord,
} from "@/types/listing";

type FacebookPostInput = {
  listing: ListingDraft;
  images: StoredImageRecord[];
};

type FacebookPostResult = {
  listingUrl?: string;
  message: string;
};

const createItemUrl = "https://www.facebook.com/marketplace/create/item";

/** Facebook's category labels differ from Vendio's — try in order until one matches. */
const facebookCategoryOptions: Record<ListingCategory, string[]> = {
  Electronics: ["Electronics", "Computers", "Cell Phones"],
  Furniture: ["Furniture", "Home & Garden"],
  "Home Goods": ["Home Goods", "Household", "Home & Garden", "Garden"],
  Clothing: ["Clothing", "Apparel", "Clothing & Accessories"],
  Collectibles: ["Collectibles", "Antiques & Collectibles", "Antiques"],
  Sports: ["Sports & Outdoors", "Sporting Goods", "Sports"],
  Books: ["Books, Movies & Music", "Books", "Entertainment"],
  Other: ["Other", "Miscellaneous", "Everything Else", "Free Stuff"],
};

const facebookConditionLabels: Record<ListingCondition, string[]> = {
  New: ["New"],
  "Like New": ["Used - Like New", "Like New"],
  Good: ["Used - Good", "Good"],
  Fair: ["Used - Fair", "Fair"],
};

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
    return "Facebook needs you to log in. Connect Facebook again and complete login in the opened browser.";
  }

  if (url.includes("/checkpoint")) {
    return "Facebook is showing an account checkpoint. Resolve it in the opened browser, then try posting again.";
  }

  const blockerText = await firstVisible(
    page.getByText(/captcha|confirm your identity|marketplace isn't available|not available to you/i),
    1_000,
  );

  if (blockerText) {
    return "Facebook is blocking Marketplace access or asking for verification. Resolve it in the opened browser, then try again.";
  }

  return null;
}

async function waitForCreateForm(page: Page) {
  const titleField =
    (await firstVisible(page.getByLabel(/^title$/i), 8_000)) ??
    (await firstVisible(page.getByRole("textbox", { name: /^title$/i }), 5_000));

  if (!titleField) {
    throw new Error(
      "Facebook Marketplace create form did not load. Open Marketplace in the browser and try again.",
    );
  }
}

async function fillTextField(page: Page, label: RegExp, value: string) {
  const candidates = [
    page.getByLabel(label).first(),
    page.getByPlaceholder(label).first(),
    page.getByRole("textbox", { name: label }).first(),
  ];

  for (const candidate of candidates) {
    try {
      await candidate.click({ timeout: 2_000 }).catch(() => undefined);
      await candidate.fill("", { timeout: 2_000 }).catch(() => undefined);
      await candidate.fill(value, { timeout: 4_000 });
      // FB's React forms only update validation state when a real key event fires;
      // a no-op End keypress nudges them without changing the value.
      await candidate.press("End", { timeout: 1_000 }).catch(() => undefined);
      return true;
    } catch {
      // Facebook labels change frequently, so try the next accessible selector.
    }
  }

  // Description on FB is often a contenteditable <div>, not a labelled textbox.
  if (/description/i.test(label.source)) {
    const editable = page.locator('[contenteditable="true"]').first();
    try {
      await editable.click({ timeout: 2_000 });
      await page.keyboard.press("Control+A").catch(() => undefined);
      await page.keyboard.press("Delete").catch(() => undefined);
      await page.keyboard.type(value, { delay: 5 });
      return true;
    } catch {
      // give up, the caller will record this as a warning
    }
  }

  return false;
}

async function chooseOption(page: Page, label: RegExp, option: string) {
  const control =
    (await firstVisible(page.getByLabel(label), 2_000)) ??
    (await firstVisible(page.getByRole("combobox", { name: label }), 2_000)) ??
    (await firstVisible(page.getByText(label), 2_000));

  if (!control) {
    return false;
  }

  await control.click();

  const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const optionLocator =
    (await firstVisible(page.getByRole("option", { name: new RegExp(escaped, "i") }), 2_000)) ??
    (await firstVisible(page.getByText(new RegExp(`^${escaped}$`, "i")), 2_000));

  if (!optionLocator) {
    return false;
  }

  await optionLocator.click();
  return true;
}

async function chooseFirstMatchingOption(page: Page, label: RegExp, options: string[]) {
  for (const option of options) {
    if (await chooseOption(page, label, option)) {
      return option;
    }
  }
  return null;
}

async function uploadPhotos(page: Page, images: StoredImageRecord[]) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.waitFor({ state: "attached", timeout: 10_000 });
  await fileInput.setInputFiles(
    images.map((image) => image.absolutePath),
    { timeout: 15_000 },
  );
}

/**
 * Click a Facebook button only if it becomes enabled within the wait window.
 * FB's submit buttons are <div role="button" aria-disabled="true"> until every
 * required field is satisfied; Playwright's default .click() then blocks 30s
 * waiting for "enabled" and throws. We poll aria-disabled / disabled instead
 * and bail out fast so the caller can return a "draft ready" message.
 */
async function clickWhenEnabled(
  page: Page,
  name: RegExp,
  { findTimeout = 4_000, enabledTimeout = 6_000 }: { findTimeout?: number; enabledTimeout?: number } = {},
): Promise<"clicked" | "stayed-disabled" | "not-found"> {
  const button = await firstVisible(page.getByRole("button", { name }), findTimeout);
  if (!button) {
    return "not-found";
  }

  const deadline = Date.now() + enabledTimeout;
  while (Date.now() < deadline) {
    const ariaDisabled = await button.getAttribute("aria-disabled").catch(() => null);
    const nativeDisabled = await button.getAttribute("disabled").catch(() => null);
    const isDisabled = ariaDisabled === "true" || nativeDisabled !== null;

    if (!isDisabled) {
      await button.click({ timeout: 4_000 }).catch(() => undefined);
      return "clicked";
    }

    await page.waitForTimeout(300);
  }

  return "stayed-disabled";
}

function formatManualNote(warnings: string[]) {
  return warnings.length > 0
    ? ` Finish ${warnings.join(", ")} manually in the browser before publishing.`
    : "";
}

export async function postToFacebookMarketplace({
  listing,
  images,
}: FacebookPostInput): Promise<FacebookPostResult> {
  if (images.length === 0) {
    throw new Error("Facebook posting requires at least one photo.");
  }

  const page = await getAutomationPage("facebook");
  await page.goto(createItemUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.bringToFront();

  const blocker = await detectFacebookBlocker(page);
  if (blocker) {
    throw new Error(blocker);
  }

  await waitForCreateForm(page);

  const warnings: string[] = [];

  try {
    await uploadPhotos(page, images);
  } catch {
    warnings.push("photos");
  }

  if (!(await fillTextField(page, /^title$/i, listing.title))) {
    warnings.push("title");
  }

  if (!(await fillTextField(page, /^price$/i, String(listing.price)))) {
    warnings.push("price");
  }

  const categoryChosen = await chooseFirstMatchingOption(
    page,
    /^category$/i,
    facebookCategoryOptions[listing.category],
  );
  if (!categoryChosen) {
    warnings.push("category");
  }

  const conditionChosen = await chooseFirstMatchingOption(
    page,
    /^condition$/i,
    facebookConditionLabels[listing.condition],
  );
  if (!conditionChosen) {
    warnings.push("condition");
  }

  if (!(await fillTextField(page, /^description$/i, listing.description))) {
    warnings.push("description");
  }

  if (!(await fillTextField(page, /^location$/i, listing.location))) {
    // Facebook often pre-fills location from the account profile.
  }

  const nextResult = await clickWhenEnabled(page, /^next$/i);

  const manualNote =
    warnings.length > 0
      ? ` Finish ${warnings.join(", ")} manually in the browser if needed.`
      : "";

  if (nextResult === "stayed-disabled") {
    return {
      listingUrl: page.url(),
      message: `Facebook draft is open in the browser, but the Next button stayed disabled — at least one required field needs attention.${manualNote} Finish it manually and click Publish.`,
    };
  }

  const publishResult = await clickWhenEnabled(page, /^(publish|post)$/i);

  if (publishResult !== "clicked") {
    return {
      listingUrl: page.url(),
      message: `Facebook draft is ready in the browser. Review and click Publish when it looks right.${manualNote}`,
    };
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);

  return {
    listingUrl: page.url(),
    message: `Facebook accepted the publish action. Confirm the listing in the opened browser.${manualNote}`,
  };
}
