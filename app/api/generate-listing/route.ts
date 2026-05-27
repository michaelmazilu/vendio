import { randomUUID } from "node:crypto";

import {
  generateDescriptionFromImages,
  generateFullListingFromImages,
  normalizeListingBasics,
} from "@/lib/ai";
import { saveUploadedImages, toPublicImages } from "@/lib/imageStorage";
import type { GenerateListingResponse } from "@/types/listing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("photos")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (files.length === 0) {
      return Response.json({ error: "Upload at least one item photo first." }, { status: 400 });
    }

    const images = await saveUploadedImages(files);
    const listingId = randomUUID();

    const titleField = formData.get("title");
    const notes = (formData.get("notes") as string | null)?.trim() ?? "";
    const location =
      (formData.get("location") as string | null)?.trim() || "Toronto, ON";

    if (typeof titleField === "string" && titleField.trim().length > 0) {
      const basics = normalizeListingBasics({
        title: titleField,
        price: formData.get("price"),
        category: formData.get("category"),
        condition: formData.get("condition"),
        location: formData.get("location"),
      });
      const generated = await generateDescriptionFromImages({ basics, images });
      const response: GenerateListingResponse = {
        listingId,
        listing: { ...basics, description: generated.description },
        images: toPublicImages(images),
        aiMode: generated.aiMode,
      };
      return Response.json(response);
    }

    const full = await generateFullListingFromImages({ images, notes, location });
    const response: GenerateListingResponse = {
      listingId,
      listing: full.listing,
      images: toPublicImages(images),
      aiMode: full.aiMode,
    };
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate listing.";
    return Response.json({ error: message }, { status: 500 });
  }
}
