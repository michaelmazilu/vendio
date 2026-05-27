import type { Locator, Page } from "playwright";

import { getAutomationPage } from "@/lib/browser";
import type {
  ListingCategory,
  ListingDraft,
  ListingCondition,
  MarketplacePostStatus,
  StoredImageRecord,
} from "@/types/listing";

type KijijiPostInput = {
  listing: ListingDraft;
  images: StoredImageRecord[];
};

type KijijiPostResult = {
  listingUrl?: string;
  publishedUrl?: string;
  message: string;
  status: MarketplacePostStatus;
  manualActionRequired?: boolean;
};

const postAdUrl = "https://www.kijiji.ca/p-post-ad.html";

const categoryMatchers: Record<ListingCategory, RegExp> = {
  Electronics: /electronics|computers|cell phones|phones|tv|audio/i,
  Furniture: /furniture|home - indoor|decor/i,
  "Home Goods": /home - indoor|appliances|decor|kitchen/i,
  Clothing: /clothes|fashion|accessories/i,
  Collectibles: /collectibles|antiques|art/i,
  Sports: /sports|outdoor|exercise/i,
  Books: /books|music|movies/i,
  Other: /other|misc|buy & sell/i,
};

const conditionMatchers: Record<ListingCondition, RegExp> = {
  New: /^new$/i,
  "Like New": /like new|mint/i,
  Good: /^good$/i,
  Fair: /^fair$/i,
};

async function firstVisible(locator: Locator, timeout = 2_000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return locator.first();
  } catch {
    return null;
  }
}

async function detectKijijiBlocker(page: Page) {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (/page not found|no longer exists/i.test(bodyText) || /t-login\.html/i.test(page.url())) {
    return "Kijiji returned a missing page. Connect Kijiji again and sign in from the homepage (Register or Sign In).";
  }

  const url = page.url();
  if (/\/(login|sign-?in|auth|forgot-password)/i.test(url)) {
    return "Kijiji needs you to log in. Connect Kijiji and use Register or Sign In on kijiji.ca, then try posting again.";
  }

  const blockerText = await firstVisible(
    page.getByText(/captcha|verify your account|confirm your identity|posting is unavailable/i),
    1_000,
  );

  if (blockerText) {
    return "Kijiji is asking for verification or blocking posting. Resolve it in the opened browser, then try again.";
  }

  return null;
}

async function fillTextField(
  page: Page,
  label: RegExp,
  value: string,
  options: { fallbackToFirstTextbox?: boolean } = {},
) {
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
      // Kijiji labels change frequently, so try the next accessible selector.
    }
  }

  if (options.fallbackToFirstTextbox) {
    // The first Kijiji step is a keyword box with no accessible label, so fall
    // back to the first visible text input on the page.
    const firstInput = page
      .locator('input[type="text"], input:not([type]), textarea')
      .first();
    try {
      await firstInput.fill(value, { timeout: 4_000 });
      return;
    } catch {
      // Fall through to the error below.
    }
  }

  throw new Error(`Could not find the Kijiji field for ${label.source}.`);
}

async function clickButton(page: Page, name: RegExp) {
  const button =
    (await firstVisible(page.getByRole("button", { name }), 3_000)) ??
    (await firstVisible(page.getByRole("link", { name }), 2_000));

  if (!button) {
    return false;
  }

  await button.click();
  return true;
}

async function uploadPhotos(page: Page, images: StoredImageRecord[]) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.waitFor({ state: "attached", timeout: 10_000 });
  await fileInput.setInputFiles(
    images.map((image) => image.absolutePath),
    { timeout: 10_000 },
  );
}

function formatManualNote(warnings: string[]) {
  return warnings.length > 0
    ? ` Finish ${warnings.join(", ")} manually in the browser before posting.`
    : "";
}

async function pickCategory(page: Page, category: ListingCategory) {
  const matcher = categoryMatchers[category];
  const suggestion =
    (await firstVisible(page.getByRole("button", { name: matcher }), 2_500)) ??
    (await firstVisible(page.getByRole("link", { name: matcher }), 2_500)) ??
    (await firstVisible(page.getByText(matcher), 2_500));

  if (suggestion) {
    await suggestion.click();
    return;
  }

  const buySell =
    (await firstVisible(page.getByRole("button", { name: /buy & sell/i }), 2_000)) ??
    (await firstVisible(page.getByText(/buy & sell/i), 2_000));

  if (buySell) {
    await buySell.click();
    const fallback =
      (await firstVisible(page.getByRole("button", { name: matcher }), 2_500)) ??
      (await firstVisible(page.getByText(matcher), 2_500));
    if (fallback) {
      await fallback.click();
      return;
    }
  }

  const other =
    (await firstVisible(page.getByRole("button", { name: /other/i }), 2_000)) ??
    (await firstVisible(page.getByText(/^other$/i), 2_000));

  if (other) {
    await other.click();
    return;
  }

  throw new Error(
    `Could not choose a Kijiji category for "${category}". Pick the category manually in the browser, then try again.`,
  );
}

async function chooseCondition(page: Page, condition: ListingCondition) {
  const matcher = conditionMatchers[condition];
  const control =
    (await firstVisible(page.getByLabel(/condition/i), 2_000)) ??
    (await firstVisible(page.getByRole("combobox", { name: /condition/i }), 2_000));

  if (control) {
    await control.click();
    const option =
      (await firstVisible(page.getByRole("option", { name: matcher }), 2_000)) ??
      (await firstVisible(page.getByText(matcher), 2_000));
    if (option) {
      await option.click();
      return true;
    }
  }

  const radio = await firstVisible(page.getByRole("radio", { name: matcher }), 2_000);
  if (radio) {
    await radio.click();
    return true;
  }

  return false;
}

export async function postToKijiji({ listing, images }: KijijiPostInput): Promise<KijijiPostResult> {
  if (images.length === 0) {
    throw new Error("Kijiji posting requires at least one photo.");
  }

  const page = await getAutomationPage("kijiji");
  await page.goto(postAdUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.bringToFront();

  const blocker = await detectKijijiBlocker(page);
  if (blocker) {
    throw new Error(blocker);
  }

  await fillTextField(page, /title|what are you selling|keyword/i, listing.title, {
    fallbackToFirstTextbox: true,
  });
  const titleStepAdvanced = await clickButton(page, /^(next|go|continue|search)$/i);
  if (!titleStepAdvanced) {
    return {
      listingUrl: page.url(),
      status: "needs_manual_review",
      manualActionRequired: true,
      message:
        "Kijiji title is filled in the browser. Continue manually to category and details before posting.",
    };
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);

  const postNavBlocker = await detectKijijiBlocker(page);
  if (postNavBlocker) {
    throw new Error(postNavBlocker);
  }

  try {
    await pickCategory(page, listing.category);
    await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not choose a Kijiji category.";
    return {
      listingUrl: page.url(),
      status: "needs_manual_review",
      manualActionRequired: true,
      message: `${message} The title step is filled — finish category and details in the browser.`,
    };
  }

  const warnings: string[] = [];

  try {
    await uploadPhotos(page, images);
  } catch {
    warnings.push("photos");
  }

  try {
    await fillTextField(page, /price/i, String(listing.price));
  } catch {
    warnings.push("price");
  }

  try {
    await fillTextField(page, /description/i, listing.description);
  } catch {
    warnings.push("description");
  }

  try {
    if (!(await chooseCondition(page, listing.condition))) {
      warnings.push("condition");
    }
  } catch {
    warnings.push("condition");
  }

  try {
    await fillTextField(page, /location|postal|city/i, listing.location);
  } catch {
    // Kijiji often pre-fills location from the account profile.
  }

  const manualNote = formatManualNote(warnings);
  if (warnings.length > 0) {
    return {
      listingUrl: page.url(),
      status: "needs_manual_review",
      manualActionRequired: true,
      message: `Kijiji draft is open in the browser, but Vendio could not confidently fill every required field.${manualNote}`,
    };
  }

  const published = await clickButton(page, /post your ad|post ad|publish/i);

  if (!published) {
    return {
      listingUrl: page.url(),
      status: "needs_manual_review",
      manualActionRequired: true,
      message:
        "Kijiji draft is filled in the browser. Review it there and click Post Your Ad if everything looks right.",
    };
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);

  // Kijiji bounces to /v-view-my-ads or the listing detail when posting succeeds;
  // if we're still on /p-post-ad.html, the click didn't actually publish.
  const postUrl = page.url();
  const stillOnForm = /p-post-ad\.html/i.test(postUrl);

  return {
    listingUrl: postUrl,
    publishedUrl: stillOnForm ? undefined : postUrl,
    status: stillOnForm ? "needs_manual_review" : "published",
    manualActionRequired: stillOnForm,
    message: stillOnForm
      ? "Kijiji accepted the click but is still showing the form. Finish anything that's missing in the browser."
      : "Kijiji posted your listing. Check the opened browser to confirm.",
  };
}
