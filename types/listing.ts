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
export type ListingStatus =
  | "draft"
  | "generated"
  | "ready_to_post"
  | "posting_assist"
  | "needs_manual_review"
  | "published"
  | "failed"
  | "sold"
  | "archived";
export type MarketplacePostStatus =
  | "pending"
  | "filling"
  | "needs_manual_review"
  | "published"
  | "failed";

export type ListingDraft = {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  location: string;
  confidence?: number;
  detectedItem?: string;
  pricingRationale?: string;
  photoWarnings?: string[];
  qualityIssues?: string[];
  marketplaceCopy?: Partial<Record<"facebook" | "kijiji", string>>;
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
  listingId: string;
  listing: ListingDraft;
  images: StoredImagePublic[];
  aiMode: "openai" | "fallback";
};

export type PostListingResponse = {
  success: true;
  marketplace: "facebook" | "kijiji" | "mock";
  status?: MarketplacePostStatus;
  attemptId?: string;
  listingUrl?: string;
  publishedUrl?: string;
  message: string;
  fieldWarnings?: string[];
  screenshotPath?: string;
  manualActionRequired?: boolean;
  listing: ListingDraft;
};
