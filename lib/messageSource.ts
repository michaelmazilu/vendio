import { fetchMessengerThreads, sendMessengerReply } from "@/lib/adapters/facebookMessenger";
import type { BuyerArchetype, Conversation, GeneratedListing, Marketplace } from "@/types/app";

export type InboundMessage = {
  threadId: string;
  buyerName: string;
  archetype: BuyerArchetype;
  marketplace: Marketplace;
  text: string;
  receivedAt: string;
};

export type FetchContext = {
  listing: GeneratedListing;
  conversations: Conversation[];
};

export interface MessageSource {
  readonly kind: "facebook" | "simulated";
  /** Returns new inbound buyer messages that should be ingested this poll. */
  fetchNew(context: FetchContext): Promise<InboundMessage[]>;
  /** Delivers the seller's (AI or manual) reply back to the buyer. */
  send(threadId: string, text: string): Promise<void>;
}

// --- Simulated source: scripted buyer dialogues for local dev + demos --------

type SimThread = {
  threadId: string;
  buyerName: string;
  archetype: BuyerArchetype;
  marketplace: Marketplace;
  script: ((listing: GeneratedListing) => string)[];
};

const simThreads: SimThread[] = [
  {
    threadId: "sim-sarah",
    buyerName: "Sarah M.",
    archetype: "eager",
    marketplace: "facebook",
    script: [
      (l) => `Hi! Is the ${l.title.toLowerCase()} still available? I could grab it today.`,
      () => `Perfect — what time works for you?`,
      () => `Great, see you then. Thanks!`,
    ],
  },
  {
    threadId: "sim-priya",
    buyerName: "Priya R.",
    archetype: "negotiator",
    marketplace: "facebook",
    script: [
      (l) => `Interested! Would you take $${Math.max(5, Math.round(l.price * 0.6))} cash?`,
      (l) => `Okay, I can do $${Math.round(l.price * 0.9)}. When can we meet?`,
      () => `Sounds good, see you then!`,
    ],
  },
  {
    threadId: "sim-alex",
    buyerName: "Alex K.",
    archetype: "curious",
    marketplace: "kijiji",
    script: [
      () => `Hey! What condition is it in, and is the price firm?`,
      () => `Thanks for the details. Where are you located for pickup?`,
      () => `Got it, I'll confirm shortly.`,
    ],
  },
];

function buyerMessageCount(conversation: Conversation | undefined): number {
  if (!conversation) {
    return 0;
  }
  return conversation.messages.filter((message) => message.sender === "buyer").length;
}

const simulatedMessageSource: MessageSource = {
  kind: "simulated",
  async fetchNew({ listing, conversations }) {
    const out: InboundMessage[] = [];

    for (const thread of simThreads) {
      const conversation = conversations.find((convo) => convo.id === thread.threadId);
      const buyerCount = buyerMessageCount(conversation);

      if (buyerCount >= thread.script.length) {
        continue; // script exhausted
      }

      const last = conversation?.messages[conversation.messages.length - 1];
      const buyersTurn = !conversation || (last !== undefined && last.sender !== "buyer");
      if (!buyersTurn) {
        continue; // waiting on a seller/AI reply before the buyer speaks again
      }

      out.push({
        threadId: thread.threadId,
        buyerName: thread.buyerName,
        archetype: thread.archetype,
        marketplace: thread.marketplace,
        text: thread.script[buyerCount]!(listing),
        receivedAt: new Date().toISOString(),
      });
    }

    return out;
  },
  async send() {
    // No real delivery in simulation — the orchestrator records the reply.
  },
};

// --- Facebook source: real Messenger session via Playwright ------------------

function archetypeFromText(text: string): BuyerArchetype {
  const lower = text.toLowerCase();
  if (/\$\s?\d/.test(lower) || /take|lower|deal|offer/.test(lower)) {
    return "negotiator";
  }
  if (/still available|pick.*up|today|can i (get|grab)/.test(lower)) {
    return "eager";
  }
  return "curious";
}

const facebookMessageSource: MessageSource = {
  kind: "facebook",
  async fetchNew({ conversations }) {
    const threads = await fetchMessengerThreads();
    const out: InboundMessage[] = [];

    for (const thread of threads) {
      if (!thread.fromBuyer || !thread.lastMessage) {
        continue;
      }

      const conversation = conversations.find((convo) => convo.id === thread.threadId);
      const last = conversation?.messages[conversation.messages.length - 1];
      // Skip if we've already recorded this exact buyer message.
      if (last && last.sender === "buyer" && last.content === thread.lastMessage) {
        continue;
      }

      out.push({
        threadId: thread.threadId,
        buyerName: thread.buyerName,
        archetype: archetypeFromText(thread.lastMessage),
        marketplace: "facebook",
        text: thread.lastMessage,
        receivedAt: new Date().toISOString(),
      });
    }

    return out;
  },
  async send(threadId, text) {
    await sendMessengerReply(threadId, text);
  },
};

export function getMessageSource(): MessageSource {
  return process.env.VENDIO_MESSAGE_SOURCE === "facebook"
    ? facebookMessageSource
    : simulatedMessageSource;
}
