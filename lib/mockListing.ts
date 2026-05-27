import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  type ListingCategory,
  type ListingCondition,
} from "@/types/listing";
import type { GeneratedListing } from "@/types/app";

const categoryHints: { keywords: string[]; category: ListingCategory; price: number }[] = [
  { keywords: ["sofa", "chair", "desk", "table", "dresser", "shelf", "couch", "bed"], category: "Furniture", price: 220 },
  { keywords: ["laptop", "iphone", "macbook", "tv", "camera", "console", "ps5", "xbox", "ipad", "headphone"], category: "Electronics", price: 380 },
  { keywords: ["lamp", "rug", "vase", "kitchen", "decor", "mug"], category: "Home Goods", price: 45 },
  { keywords: ["jacket", "shoes", "boots", "shirt", "dress", "jeans", "hat"], category: "Clothing", price: 35 },
  { keywords: ["bike", "skis", "snowboard", "tennis", "golf", "weights"], category: "Sports", price: 140 },
  { keywords: ["book", "novel", "textbook"], category: "Books", price: 12 },
  { keywords: ["coin", "card", "figure", "vintage", "antique"], category: "Collectibles", price: 60 },
];

function pickCategory(notes: string): { category: ListingCategory; price: number } {
  const lower = notes.toLowerCase();
  for (const hint of categoryHints) {
    if (hint.keywords.some((keyword) => lower.includes(keyword))) {
      return { category: hint.category, price: hint.price };
    }
  }
  return { category: "Other", price: 75 };
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function pickTitle(notes: string, category: ListingCategory): string {
  const cleaned = notes.trim();
  if (cleaned.length > 0) {
    const words = cleaned.split(/\s+/).slice(0, 6).join(" ");
    return titleCase(words);
  }

  const generic: Record<ListingCategory, string> = {
    Electronics: "Excellent Condition Electronics",
    Furniture: "Quality Pre-Owned Furniture Piece",
    "Home Goods": "Lovely Home Accent",
    Clothing: "Stylish Clothing Item",
    Sports: "Well-Maintained Sports Gear",
    Books: "Like-New Book",
    Collectibles: "Unique Collectible",
    Other: "Quality Pre-Owned Item",
  };
  return generic[category];
}

function buildDescription(
  title: string,
  notes: string,
  category: ListingCategory,
  condition: ListingCondition,
): string {
  const noteLine = notes.trim().length > 0
    ? `Quick notes from the owner: ${notes.trim()}`
    : "Has been gently used and well taken care of.";

  return [
    `Selling this ${title.toLowerCase()} in ${condition.toLowerCase()} condition.`,
    noteLine,
    `Comes from a clean, smoke-free home. ${category === "Electronics" ? "Powers on and works as expected." : "Everything is in great working order."}`,
    "Pickup is preferred but happy to arrange local delivery for the right buyer.",
    "Cash or e-transfer accepted. Message me with any questions — happy to send extra photos.",
  ].join("\n\n");
}

export function generateMockListing(notes: string): GeneratedListing {
  const { category, price } = pickCategory(notes);
  const conditionIndex = Math.min(LISTING_CONDITIONS.length - 1, notes.length % 3);
  const condition = LISTING_CONDITIONS[conditionIndex] ?? LISTING_CONDITIONS[1];
  const title = pickTitle(notes, category);
  const description = buildDescription(title, notes, category, condition);

  return {
    title,
    description,
    price,
    category: category ?? LISTING_CATEGORIES[LISTING_CATEGORIES.length - 1],
    condition,
  };
}
