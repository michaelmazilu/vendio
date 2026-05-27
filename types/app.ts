import type { ListingCategory, ListingCondition } from "@/types/listing";

export type AppStep =
  | "home"
  | "connect"
  | "upload"
  | "generating"
  | "review"
  | "posting"
  | "dashboard"
  | "inbox";

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

export type MessageSender = "buyer" | "seller_ai" | "seller_user";

export type Message = {
  id: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
};

export type ConversationStatus =
  | "new"
  | "chatting"
  | "negotiating"
  | "meetup_scheduled"
  | "sold"
  | "closed";

export type BuyerArchetype = "eager" | "negotiator" | "curious" | "lowballer";

export type BuyerPersona = {
  name: string;
  initials: string;
  avatarColor: string;
  archetype: BuyerArchetype;
};

export type Meetup = {
  location: string;
  time: string;
  payment: "cash" | "etransfer";
};

export type Conversation = {
  id: string;
  buyer: BuyerPersona;
  marketplace: Marketplace;
  messages: Message[];
  status: ConversationStatus;
  unread: number;
  autopilot: boolean;
  lastMessageAt: string;
  meetup?: Meetup;
};

export type ListingWithActivity = PostedListingSummary & {
  views: number;
  saves: number;
  conversations: Conversation[];
};

export type AiReplyIntent =
  | "answer_question"
  | "confirm_availability"
  | "negotiate"
  | "propose_meetup"
  | "confirm_meetup"
  | "close_sale"
  | "decline";

export type AiReplyResult = {
  reply: string;
  intent: AiReplyIntent;
  meetup?: Meetup;
  source: "openai" | "fallback";
};
