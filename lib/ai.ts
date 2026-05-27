import { readFile } from "node:fs/promises";

import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  type ListingBasics,
  type ListingCategory,
  type ListingCondition,
  type ListingDraft,
  type StoredImageRecord,
} from "@/types/listing";

type AiListingPayload = {
  title?: unknown;
  description?: unknown;
  price?: unknown;
  category?: unknown;
  condition?: unknown;
  location?: unknown;
};

const defaultLocation = "Toronto, ON";

function clampText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function normalizeCategory(value: unknown): ListingCategory {
  if (typeof value === "string" && LISTING_CATEGORIES.includes(value as ListingCategory)) {
    return value as ListingCategory;
  }

  return "Other";
}

function normalizeCondition(value: unknown): ListingCondition {
  if (typeof value === "string" && LISTING_CONDITIONS.includes(value as ListingCondition)) {
    return value as ListingCondition;
  }

  return "Good";
}

function normalizePrice(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 45;
  }

  return Math.round(parsed);
}

export function normalizeListingDraft(payload: AiListingPayload): ListingDraft {
  const basics = normalizeListingBasics(payload);

  return {
    ...basics,
    description: clampText(
      payload.description,
      "Well-kept item ready for a new home. See photo for details and message with any questions.",
      900,
    ),
  };
}

export function normalizeListingBasics(payload: AiListingPayload): ListingBasics {
  return {
    title: clampText(payload.title, "Quality pre-owned item", 80),
    price: normalizePrice(payload.price),
    category: normalizeCategory(payload.category),
    condition: normalizeCondition(payload.condition),
    location: clampText(payload.location, defaultLocation, 80),
  };
}

function extractResponseText(response: unknown): string | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const directText = (response as { output_text?: unknown }).output_text;
  if (typeof directText === "string") {
    return directText;
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") {
        return text;
      }
    }
  }

  return null;
}

async function imageToDataUrl(image: StoredImageRecord) {
  const buffer = await readFile(image.absolutePath);
  return `data:${image.mimeType};base64,${buffer.toString("base64")}`;
}

function fallbackDescription(basics: ListingBasics, images: StoredImageRecord[]) {
  return `${basics.title} available in ${basics.location}. This ${basics.condition.toLowerCase()} ${basics.category.toLowerCase()} item is ready for a new owner. Photos are included so buyers can review the condition clearly. Priced at $${basics.price}. Message if you have questions or want to arrange pickup. (${images.length} photo${images.length === 1 ? "" : "s"} attached.)`;
}

export async function generateDescriptionFromImages({
  basics,
  images,
}: {
  basics: ListingBasics;
  images: StoredImageRecord[];
}): Promise<{ description: string; aiMode: "openai" | "fallback" }> {
  if (!process.env.OPENAI_API_KEY) {
    return { description: fallbackDescription(basics, images), aiMode: "fallback" };
  }

  try {
    const imageContent = await Promise.all(
      images.slice(0, 6).map(async (image) => ({
        type: "input_image",
        image_url: await imageToDataUrl(image),
      })),
    );

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Write only the description for a Facebook Marketplace listing. Do not invent title, price, category, condition, or location. Known fields: title="${basics.title}", price="${basics.price} CAD", category="${basics.category}", condition="${basics.condition}", location="${basics.location}". Keep it friendly, specific to the photos, honest, concise, and under 900 characters. Return JSON only: {"description":"..."}.`,
              },
              ...imageContent,
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "listing_description",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["description"],
              properties: {
                description: { type: "string" },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const body = (await response.json()) as unknown;
    const text = extractResponseText(body);
    if (!text) {
      throw new Error("OpenAI response did not include description JSON.");
    }

    const parsed = JSON.parse(text) as { description?: unknown };
    return {
      description: clampText(parsed.description, fallbackDescription(basics, images), 900),
      aiMode: "openai",
    };
  } catch (error) {
    console.warn("Falling back to deterministic description generation:", error);
    return { description: fallbackDescription(basics, images), aiMode: "fallback" };
  }
}

export async function generateListingFromImage(
  image: StoredImageRecord,
): Promise<{ listing: ListingDraft; aiMode: "openai" | "fallback" }> {
  const basics = normalizeListingBasics({});
  const generated = await generateDescriptionFromImages({ basics, images: [image] });

  return {
    listing: {
      ...basics,
      description: generated.description,
    },
    aiMode: generated.aiMode,
  };
}

