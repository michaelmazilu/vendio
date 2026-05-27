import { generateAiReply } from "@/lib/aiReply";
import {
  ensureListingThreads,
  saveListingThreads,
  type ListingThreads,
} from "@/lib/conversationStore";
import { getMessageSource, type InboundMessage } from "@/lib/messageSource";
import type {
  ActivityEvent,
  AiReplyIntent,
  BuyerArchetype,
  BuyerPersona,
  Conversation,
  ConversationStatus,
  GeneratedListing,
  Message,
} from "@/types/app";

const SETTLED: ConversationStatus[] = ["meetup_scheduled", "sold", "closed"];

const avatarColors = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
];

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "B";
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return avatarColors[hash % avatarColors.length]!;
}

function personaFromName(name: string, archetype: BuyerArchetype): BuyerPersona {
  return { name, initials: initials(name), avatarColor: colorFor(name), archetype };
}

function intentToStatus(intent: AiReplyIntent, current: ConversationStatus): ConversationStatus {
  if (intent === "confirm_meetup") {
    return "meetup_scheduled";
  }
  if (intent === "propose_meetup") {
    return current === "meetup_scheduled" ? current : "chatting";
  }
  if (intent === "negotiate") {
    return "negotiating";
  }
  if (intent === "close_sale") {
    return "sold";
  }
  if (intent === "decline") {
    return "closed";
  }
  return current === "new" ? "chatting" : current;
}

function pushActivity(entry: ListingThreads, type: string, message: string) {
  entry.activity.unshift({
    id: newId("activity"),
    type,
    message,
    createdAt: new Date().toISOString(),
  });
  entry.activity = entry.activity.slice(0, 50);
}

function ingestInbound(entry: ListingThreads, inbound: InboundMessage) {
  let conversation = entry.conversations.find((convo) => convo.id === inbound.threadId);

  const buyerMessage: Message = {
    id: newId("msg"),
    sender: "buyer",
    content: inbound.text,
    createdAt: inbound.receivedAt,
    source: "imported",
  };

  if (!conversation) {
    conversation = {
      id: inbound.threadId,
      buyer: personaFromName(inbound.buyerName, inbound.archetype),
      marketplace: inbound.marketplace,
      messages: [buyerMessage],
      status: "new",
      unread: 1,
      autopilot: true,
      lastMessageAt: inbound.receivedAt,
    };
    entry.conversations.unshift(conversation);
  } else {
    conversation.messages.push(buyerMessage);
    conversation.unread += 1;
    conversation.lastMessageAt = inbound.receivedAt;
  }

  pushActivity(entry, "message_received", `New message from ${conversation.buyer.name}`);
}

async function autoReplyToConversation(
  listing: GeneratedListing,
  entry: ListingThreads,
  conversation: Conversation,
) {
  const ai = await generateAiReply({
    listing,
    location: listing.location,
    buyerName: conversation.buyer.name,
    status: conversation.status,
    messages: conversation.messages,
    latestBuyerMessage: conversation.messages[conversation.messages.length - 1]?.content ?? "",
  });

  const source = getMessageSource();
  try {
    await source.send(conversation.id, ai.reply);
  } catch (error) {
    pushActivity(
      entry,
      "reply_failed",
      `Could not deliver reply to ${conversation.buyer.name}: ${
        error instanceof Error ? error.message : "send failed"
      }`,
    );
    return;
  }

  conversation.messages.push({
    id: newId("msg"),
    sender: "seller_ai",
    content: ai.reply,
    createdAt: new Date().toISOString(),
    source: ai.source,
    aiDraft: false,
  });
  conversation.lastMessageAt = new Date().toISOString();
  conversation.status = intentToStatus(ai.intent, conversation.status);
  if (ai.meetup) {
    conversation.meetup = ai.meetup;
  }

  pushActivity(entry, "reply_sent", `Vendio AI replied to ${conversation.buyer.name}`);
  if (ai.meetup && (conversation.status === "meetup_scheduled" || ai.intent === "propose_meetup")) {
    pushActivity(
      entry,
      "meetup",
      `Meetup with ${conversation.buyer.name}: ${ai.meetup.time} at ${ai.meetup.location}`,
    );
  }
  if (conversation.status === "sold") {
    pushActivity(entry, "sold", `${conversation.buyer.name} agreed to buy — deal closed by Vendio AI`);
  }
}

export type PollResult = {
  conversations: Conversation[];
  activity: ActivityEvent[];
  source: "facebook" | "simulated";
};

/**
 * One auto-reply cycle for a listing: pull new inbound buyer messages, then for
 * every thread awaiting a reply (autopilot on, not settled) generate and send
 * an AI response. All steps are recorded as activity for seller reporting.
 */
export async function runAutoReplyPoll(
  listingId: string,
  listing: GeneratedListing,
): Promise<PollResult> {
  const entry = await ensureListingThreads(listingId, listing);
  const source = getMessageSource();

  const inbound = await source.fetchNew({ listing, conversations: entry.conversations });
  for (const message of inbound) {
    ingestInbound(entry, message);
  }

  for (const conversation of entry.conversations) {
    const last = conversation.messages[conversation.messages.length - 1];
    if (
      last?.sender === "buyer" &&
      conversation.autopilot &&
      !SETTLED.includes(conversation.status)
    ) {
      await autoReplyToConversation(listing, entry, conversation);
    }
  }

  await saveListingThreads(entry);

  return { conversations: entry.conversations, activity: entry.activity, source: source.kind };
}

export async function sendSellerMessage(
  listingId: string,
  listing: GeneratedListing,
  threadId: string,
  text: string,
): Promise<PollResult> {
  const entry = await ensureListingThreads(listingId, listing);
  const conversation = entry.conversations.find((convo) => convo.id === threadId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const source = getMessageSource();
  await source.send(threadId, text);

  conversation.messages.push({
    id: newId("msg"),
    sender: "seller_user",
    content: text,
    createdAt: new Date().toISOString(),
    source: "manual",
  });
  conversation.lastMessageAt = new Date().toISOString();
  conversation.unread = 0;
  pushActivity(entry, "manual_reply", `You replied to ${conversation.buyer.name}`);

  await saveListingThreads(entry);
  return { conversations: entry.conversations, activity: entry.activity, source: source.kind };
}

export async function setConversationAutopilot(
  listingId: string,
  listing: GeneratedListing,
  threadId: string,
  autopilot: boolean,
): Promise<PollResult> {
  const entry = await ensureListingThreads(listingId, listing);
  const conversation = entry.conversations.find((convo) => convo.id === threadId);
  if (conversation) {
    conversation.autopilot = autopilot;
    pushActivity(
      entry,
      "autopilot",
      `Autopilot ${autopilot ? "enabled" : "paused"} for ${conversation.buyer.name}`,
    );
    await saveListingThreads(entry);
  }

  const source = getMessageSource();
  return { conversations: entry.conversations, activity: entry.activity, source: source.kind };
}
