import type {
  BuyerPersona,
  Conversation,
  GeneratedListing,
  Marketplace,
  Message,
  Meetup,
} from "@/types/app";

/**
 * Single hardcoded "Sarah Kim" buyer thread seeded on every newly-posted
 * listing so the inbox demo works without a real Facebook / Kijiji login.
 *
 * What it shows end-to-end:
 *  1. Buyer asks if the item is still available
 *  2. Vendio AI replies, confirms availability
 *  3. Buyer lowballs
 *  4. Vendio AI holds the price politely
 *  5. Buyer accepts and asks to meet
 *  6. Vendio AI reads availability from Calendly and offers 3 real slots
 *  7. Buyer picks one
 *  8. Vendio AI confirms a meetup card (location + time + payment)
 *
 * Note: Calendly is used only to READ availability. The meetup is confirmed
 * in chat — Vendio does not write back to Calendly.
 */

const sarah: BuyerPersona = {
  name: "Sarah Kim",
  initials: "SK",
  avatarColor: "#6366f1",
  archetype: "negotiator",
};

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function buildMessages(listing: GeneratedListing): Message[] {
  const askingPrice = listing.price;
  const lowball = Math.max(20, Math.round(askingPrice * 0.78 / 5) * 5);
  const itemNoun = listing.detectedItem?.toLowerCase().trim() || "item";

  return [
    {
      id: "demo-msg-1",
      sender: "buyer",
      content: `Hi! Is this still available?`,
      createdAt: isoMinutesAgo(28),
    },
    {
      id: "demo-msg-2",
      sender: "seller_ai",
      content: `Hi Sarah — yes, it's still available! Happy to answer anything about it. Located in ${listing.location}, asking $${askingPrice}.`,
      createdAt: isoMinutesAgo(27),
    },
    {
      id: "demo-msg-3",
      sender: "buyer",
      content: `Cool. Would you take $${lowball}? Cash, today.`,
      createdAt: isoMinutesAgo(20),
    },
    {
      id: "demo-msg-4",
      sender: "seller_ai",
      content: `Appreciate the offer! I'd rather keep it at $${askingPrice} — it's already a fair price for the condition, and I've got other people interested. I can do a quick handoff this week if that helps.`,
      createdAt: isoMinutesAgo(19),
    },
    {
      id: "demo-msg-5",
      sender: "buyer",
      content: `Alright, $${askingPrice} works. When could we meet?`,
      createdAt: isoMinutesAgo(12),
    },
    {
      id: "demo-msg-6",
      sender: "seller_ai",
      content:
        "Great! I just checked my Calendly and have three open windows this week:\n" +
        "  • Wed 5:30 PM\n" +
        "  • Thu 6:00 PM\n" +
        "  • Sat 11:00 AM\n" +
        "Any of those work for you?",
      createdAt: isoMinutesAgo(11),
    },
    {
      id: "demo-msg-7",
      sender: "buyer",
      content: `Thursday at 6 is perfect.`,
      createdAt: isoMinutesAgo(4),
    },
    {
      id: "demo-msg-8",
      sender: "seller_ai",
      content: `Confirmed for Thursday at 6:00 PM — I'll meet you at Aroma Espresso Bar, 595 Bay St (right by St. George station). I'll bring the ${itemNoun}; cash or e-transfer both work. See you then!`,
      createdAt: isoMinutesAgo(3),
    },
  ];
}

function buildMeetup(): Meetup {
  return {
    location: "Aroma Espresso Bar, 595 Bay St",
    time: "Thursday at 6:00 PM",
    payment: "cash",
  };
}

export function buildDemoConversation(
  listing: GeneratedListing,
  marketplace: Marketplace,
): Conversation {
  const messages = buildMessages(listing);
  return {
    id: "demo-convo-sarah",
    buyer: sarah,
    marketplace,
    messages,
    status: "meetup_scheduled",
    unread: 0,
    autopilot: true,
    lastMessageAt: messages[messages.length - 1]!.createdAt,
    meetup: buildMeetup(),
    negotiationFloor: Math.round(listing.price * 0.8),
  };
}
