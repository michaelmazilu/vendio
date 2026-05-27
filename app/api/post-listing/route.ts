import { postToFacebookMarketplace } from "@/lib/adapters/facebook";
import { postToMockMarketplace } from "@/lib/adapters/mockMarketplace";
import { normalizeListingDraft } from "@/lib/ai";
import { getStoredImage, getStoredImages } from "@/lib/imageStorage";
import type { PostListingResponse } from "@/types/listing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      listing?: unknown;
      imageId?: unknown;
      imageIds?: unknown;
      target?: unknown;
    };
    const imageIds = Array.isArray(payload.imageIds)
      ? payload.imageIds.filter((id): id is string => typeof id === "string")
      : typeof payload.imageId === "string"
        ? [payload.imageId]
        : [];

    if (imageIds.length === 0) {
      return Response.json({ error: "Missing uploaded photo ids." }, { status: 400 });
    }

    const images = await getStoredImages(imageIds);

    const listing = normalizeListingDraft(
      payload.listing && typeof payload.listing === "object" ? payload.listing : {},
    );
    const target = payload.target === "mock" ? "mock" : "facebook";

    if (target === "mock") {
      const image = await getStoredImage(imageIds[0]);
      if (!image) {
        return Response.json({ error: "Uploaded image was not found." }, { status: 404 });
      }

      const { listingUrl } = await postToMockMarketplace({
        baseUrl: new URL(request.url).origin,
        listing,
        image,
      });

      const response: PostListingResponse = {
        success: true,
        marketplace: "mock",
        listingUrl,
        message: "Posted to the local mock marketplace.",
        listing,
      };

      return Response.json(response);
    }

    const result = await postToFacebookMarketplace({ listing, images });

    const response: PostListingResponse = {
      success: true,
      marketplace: "facebook",
      listingUrl: result.listingUrl,
      message: result.message,
      listing,
    };

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Browser automation could not post the listing.";
    return Response.json({ error: message }, { status: 500 });
  }
}
