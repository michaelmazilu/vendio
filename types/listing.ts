export const LISTING_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Home Goods",
  "Clothing",
  "Collectibles",
  "Sports",
  "Books",
  "Other",
] as const;

export const LISTING_CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export type ListingDraft = {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  location: string;
};

export type ListingBasics = Omit<ListingDraft, "description">;

export type StoredImagePublic = {
  id: string;
  url: string;
  filename: string;
};

export type StoredImageRecord = StoredImagePublic & {
  absolutePath: string;
  mimeType: string;
  createdAt: string;
};

export type PostedListing = ListingDraft & {
  id: string;
  imageUrl: string;
  imageUrls: string[];
  createdAt: string;
};

export type GenerateListingResponse = {
  listing: ListingDraft;
  images: StoredImagePublic[];
  aiMode: "openai" | "fallback";
};

export type PostListingResponse = {
  success: true;
  marketplace: "facebook" | "kijiji" | "mock";
  listingUrl?: string;
  message: string;
  listing: ListingDraft;
};
