import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { saveUploadedImage } from "@/lib/imageStorage";
import { normalizeListingDraft } from "@/lib/ai";
import type { PostedListing } from "@/types/listing";

const dataDir = path.join(process.cwd(), ".vendio");
const marketplaceIndexPath = path.join(dataDir, "marketplace-listings.json");

async function ensureMarketplaceStorage() {
  await mkdir(dataDir, { recursive: true });
}

async function readListings(): Promise<PostedListing[]> {
  try {
    const contents = await readFile(marketplaceIndexPath, "utf8");
    return JSON.parse(contents) as PostedListing[];
  } catch {
    return [];
  }
}

async function writeListings(listings: PostedListing[]) {
  await ensureMarketplaceStorage();
  await writeFile(marketplaceIndexPath, JSON.stringify(listings, null, 2));
}

export async function createMarketplaceListing(formData: FormData): Promise<PostedListing> {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Marketplace listing requires an image.");
  }

  const storedImage = await saveUploadedImage(image);
  const draft = normalizeListingDraft({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    location: formData.get("location"),
  });

  const listing: PostedListing = {
    ...draft,
    id: randomUUID(),
    imageUrl: storedImage.url,
    imageUrls: [storedImage.url],
    createdAt: new Date().toISOString(),
  };

  const listings = await readListings();
  listings.unshift(listing);
  await writeListings(listings.slice(0, 100));

  return listing;
}

export async function getMarketplaceListing(id: string): Promise<PostedListing | null> {
  const listings = await readListings();
  return listings.find((listing) => listing.id === id) ?? null;
}
