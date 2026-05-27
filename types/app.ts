import type { ListingCategory, ListingCondition } from "@/types/listing";

export type AppStep =
  | "home"
  | "connect"
  | "upload"
  | "generating"
  | "review"
  | "posting"
  | "dashboard";

export type Marketplace = "facebook" | "kijiji";

export type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
};

export type GeneratedListing = {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  location: string;
};

export type MarketplacePostResult = {
  marketplace: Marketplace;
  listingUrl?: string;
  message: string;
};

export type PostedListingSummary = {
  id: string;
  listing: GeneratedListing;
  marketplaces: Marketplace[];
  primaryPhotoUrl: string;
  photoUrls: string[];
  postedAt: string;
  listingUrl: string;
  marketplaceUrls: Partial<Record<Marketplace, string>>;
  postMessages: Partial<Record<Marketplace, string>>;
};
