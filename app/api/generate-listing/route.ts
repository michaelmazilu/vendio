import { generateDescriptionFromImages, normalizeListingBasics } from "@/lib/ai";
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

    const basics = normalizeListingBasics({
      title: formData.get("title"),
      price: formData.get("price"),
      category: formData.get("category"),
      condition: formData.get("condition"),
      location: formData.get("location"),
    });
    const images = await saveUploadedImages(files);
    const generated = await generateDescriptionFromImages({ basics, images });

    const response: GenerateListingResponse = {
      listing: {
        ...basics,
        description: generated.description,
      },
      images: toPublicImages(images),
      aiMode: generated.aiMode,
    };

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate listing.";
    return Response.json({ error: message }, { status: 500 });
  }
}
