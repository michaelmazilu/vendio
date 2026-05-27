import type { GeneratedListing, Marketplace, MarketplacePostResult } from "@/types/app";
import type { GenerateListingResponse, PostListingResponse } from "@/types/listing";

const defaultLocation = "Toronto, ON";

export async function connectMarketplace(marketplace: Marketplace) {
  const endpoint =
    marketplace === "facebook" ? "/api/facebook/connect" : "/api/kijiji/connect";
  const response = await fetch(endpoint, { method: "POST" });
  const payload = (await response.json()) as { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Could not connect ${marketplace}.`);
  }

  return payload.message ?? "Browser session opened.";
}

export async function disconnectMarketplace(marketplace: Marketplace) {
  if (marketplace !== "facebook") {
    return;
  }

  const response = await fetch("/api/facebook/disconnect", { method: "POST" });
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not disconnect Facebook.");
  }
}

export async function generateListingFromPhotos({
  photos,
  notes,
  location = defaultLocation,
}: {
  photos: File[];
  notes: string;
  location?: string;
}) {
  const formData = new FormData();
  photos.forEach((photo) => formData.append("photos", photo));
  formData.append("location", location);
  if (notes.trim()) {
    formData.append("title", notes.trim().slice(0, 80));
  }

  const response = await fetch("/api/generate-listing", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as GenerateListingResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not generate listing.");
  }

  const listing: GeneratedListing = {
    title: payload.listing.title,
    description: payload.listing.description,
    price: payload.listing.price,
    category: payload.listing.category,
    condition: payload.listing.condition,
    location: payload.listing.location,
  };

  return {
    listing,
    imageIds: payload.images.map((image) => image.id),
    aiMode: payload.aiMode,
  };
}

export async function postListingToMarketplace({
  marketplace,
  listing,
  imageIds,
}: {
  marketplace: Marketplace;
  listing: GeneratedListing;
  imageIds: string[];
}): Promise<MarketplacePostResult> {
  const response = await fetch("/api/post-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: marketplace,
      listing,
      imageIds,
    }),
  });
  const payload = (await response.json()) as PostListingResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Could not post to ${marketplace}.`);
  }

  return {
    marketplace,
    listingUrl: payload.listingUrl,
    message: payload.message,
  };
}
