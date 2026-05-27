import type {
  ActivityEvent,
  GeneratedListing,
  ListingStatus,
  ListingWithActivity,
  Marketplace,
  MarketplacePostResult,
  MarketplacePostStatus,
} from "@/types/app";

function newActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function resolvePostStatus(result: MarketplacePostResult): MarketplacePostStatus {
  if (result.status) {
    return result.status;
  }
  if (result.manualActionRequired) {
    return "needs_manual_review";
  }
  if (result.listingUrl || result.publishedUrl) {
    return "published";
  }
  return "needs_manual_review";
}

export function deriveListingStatus(
  marketplaceStatuses: Partial<Record<Marketplace, MarketplacePostStatus>>,
): ListingStatus {
  const statuses = Object.values(marketplaceStatuses);
  if (statuses.length === 0) {
    return "published";
  }
  if (statuses.every((status) => status === "published")) {
    return "published";
  }
  if (statuses.some((status) => status === "failed")) {
    return "failed";
  }
  if (statuses.some((status) => status === "needs_manual_review")) {
    return "needs_manual_review";
  }
  return "posting_assist";
}

export function buildListingWithActivity({
  id,
  listing,
  marketplaces,
  photoUrls,
  postedAt,
  results,
}: {
  id: string;
  listing: GeneratedListing;
  marketplaces: Marketplace[];
  photoUrls: string[];
  postedAt: string;
  results: MarketplacePostResult[];
}): ListingWithActivity {
  const marketplaceUrls = Object.fromEntries(
    results
      .map((result) => [result.marketplace, result.publishedUrl ?? result.listingUrl] as const)
      .filter((entry): entry is [Marketplace, string] => Boolean(entry[1])),
  ) as Partial<Record<Marketplace, string>>;

  const postMessages = Object.fromEntries(
    results.map((result) => [result.marketplace, result.message]),
  ) as Partial<Record<Marketplace, string>>;

  const marketplaceStatuses = Object.fromEntries(
    results.map((result) => [result.marketplace, resolvePostStatus(result)]),
  ) as Partial<Record<Marketplace, MarketplacePostStatus>>;

  const primaryUrl =
    results.find((result) => result.publishedUrl ?? result.listingUrl)?.publishedUrl ??
    results.find((result) => result.publishedUrl ?? result.listingUrl)?.listingUrl ??
    (marketplaces[0] === "facebook"
      ? "https://www.facebook.com/marketplace"
      : "https://www.kijiji.ca");

  const activity: ActivityEvent[] = [
    {
      id: newActivityId(),
      type: "photos_uploaded",
      message: "Photos uploaded",
      createdAt: postedAt,
    },
    {
      id: newActivityId(),
      type: "listing_generated",
      message: "Listing generated",
      createdAt: postedAt,
    },
    {
      id: newActivityId(),
      type: "listing_submitted",
      message: "Listing submitted to marketplaces",
      createdAt: postedAt,
    },
    ...results.map((result) => ({
      id: newActivityId(),
      type: "marketplace_post",
      message: `${result.marketplace === "facebook" ? "Facebook" : "Kijiji"}: ${result.message}`,
      createdAt: postedAt,
    })),
  ];

  return {
    id,
    listing,
    status: deriveListingStatus(marketplaceStatuses),
    marketplaces: [...marketplaces],
    primaryPhotoUrl: photoUrls[0] ?? "",
    photoUrls,
    postedAt,
    listingUrl: primaryUrl,
    marketplaceUrls,
    postMessages,
    marketplaceStatuses,
    activity,
    views: 0,
    saves: 0,
    conversations: [],
  };
}

export function revokeUploadedPhotos(photos: { previewUrl: string }[]) {
  photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
}
