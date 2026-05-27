import { getAutomationPage } from "@/lib/browser";
import { getMarketplaceListing } from "@/lib/marketplace";
import type { ListingDraft, PostedListing, StoredImageRecord } from "@/types/listing";

export async function postToMockMarketplace({
  baseUrl,
  listing,
  image,
}: {
  baseUrl: string;
  listing: ListingDraft;
  image: StoredImageRecord;
}): Promise<{ listingUrl: string; listing: PostedListing }> {
  const page = await getAutomationPage();
  await page.goto(`${baseUrl}/demo-marketplace/new`, { waitUntil: "domcontentloaded" });

  await page.getByLabel("Title", { exact: true }).fill(listing.title);
  await page.getByLabel("Price", { exact: true }).fill(String(listing.price));
  await page.getByLabel("Category", { exact: true }).selectOption(listing.category);
  await page.getByLabel("Condition", { exact: true }).selectOption(listing.condition);
  await page.getByLabel("Location", { exact: true }).fill(listing.location);
  await page.getByLabel("Description", { exact: true }).fill(listing.description);
  await page.getByLabel("Photo", { exact: true }).setInputFiles(image.absolutePath);

  await Promise.all([
    page.waitForURL(/\/demo-marketplace\/listing\/[^/]+$/, { timeout: 30_000 }),
    page.getByRole("button", { name: "Publish listing" }).click(),
  ]);

  const listingUrl = page.url();
  const listingId = listingUrl.split("/").filter(Boolean).at(-1);
  if (!listingId) {
    throw new Error("Mock marketplace did not return a listing id.");
  }

  const postedListing = await getMarketplaceListing(listingId);
  if (!postedListing) {
    throw new Error("Mock marketplace listing was not saved.");
  }

  return { listingUrl, listing: postedListing };
}
