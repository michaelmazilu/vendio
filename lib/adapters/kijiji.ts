import type { Locator, Page } from "playwright";

import { getAutomationPage } from "@/lib/browser";
import type { ListingCategory, ListingDraft, ListingCondition, StoredImageRecord } from "@/types/listing";

type KijijiPostInput = {
  listing: ListingDraft;
  images: StoredImageRecord[];
};

type KijijiPostResult = {
  listingUrl?: string;
  message: string;
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
  const url = page.url();
  if (/\/(login|sign-?in|auth)/i.test(url)) {
    return "Kijiji needs you to log in. Complete login in the opened browser, then try posting again.";
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
  await fileInput.setInputFiles(
    images.map((image) => image.absolutePath),
    { timeout: 10_000 },
  );
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
      return;
    }
  }

  const radio = await firstVisible(page.getByRole("radio", { name: matcher }), 2_000);
  if (radio) {
    await radio.click();
  }
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
  await clickButton(page, /^(next|go|continue|search)$/i);
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
      message: `${message} The title step is filled — finish category and details in the browser.`,
    };
  }

  await uploadPhotos(page, images);

  try {
    await fillTextField(page, /price/i, String(listing.price));
  } catch {
    // Some categories use "Please Contact" or alternate price controls.
  }

  await fillTextField(page, /description/i, listing.description);

  try {
    await chooseCondition(page, listing.condition);
  } catch {
    // Condition fields vary by Kijiji category.
  }

  try {
    await fillTextField(page, /location|postal|city/i, listing.location);
  } catch {
    // Kijiji often pre-fills location from the account profile.
  }

  const published = await clickButton(page, /post your ad|post ad|publish/i);

  if (!published) {
    return {
      listingUrl: page.url(),
      message:
        "Kijiji draft is filled in the browser. Review it there and click Post Your Ad if everything looks right.",
    };
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);

  return {
    listingUrl: page.url(),
    message: "Kijiji accepted the post action. Check the opened browser for the live listing.",
  };
}
