import type {
  BuyerArchetype,
  BuyerPersona,
  Conversation,
  GeneratedListing,
  Marketplace,
  Message,
} from "@/types/app";

type SeedConversation = {
  buyer: BuyerPersona;
  marketplace: Marketplace;
  message: string;
};

const pool: { persona: Omit<BuyerPersona, "archetype">; archetype: BuyerArchetype }[] = [
  {
    persona: { name: "Sarah M.", initials: "SM", avatarColor: "bg-rose-100 text-rose-700" },
    archetype: "eager",
  },
  {
    persona: { name: "Mike T.", initials: "MT", avatarColor: "bg-amber-100 text-amber-800" },
    archetype: "lowballer",
  },
  {
    persona: { name: "Alex K.", initials: "AK", avatarColor: "bg-sky-100 text-sky-700" },
    archetype: "curious",
  },
  {
    persona: { name: "Priya R.", initials: "PR", avatarColor: "bg-emerald-100 text-emerald-700" },
    archetype: "negotiator",
  },
  {
    persona: { name: "Jordan L.", initials: "JL", avatarColor: "bg-violet-100 text-violet-700" },
    archetype: "eager",
  },
  {
    persona: { name: "Dani C.", initials: "DC", avatarColor: "bg-cyan-100 text-cyan-700" },
    archetype: "curious",
  },
];

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function pickInitialMessage(
  archetype: BuyerArchetype,
  listing: GeneratedListing,
): string {
  const itemName = listing.title.toLowerCase();
  const lowOffer = Math.max(5, Math.round(listing.price * 0.6));
  const midOffer = Math.max(10, Math.round(listing.price * 0.85));

  switch (archetype) {
    case "eager":
      return `Hey! Is the ${itemName} still available? I can pick it up today if it is.`;
    case "lowballer":
      return `Hi, would you take $${lowOffer} for it? Cash today.`;
    case "negotiator":
      return `Interested in the ${itemName} — would you consider $${midOffer}? I can pick up anytime this week.`;
    case "curious":
    default:
      return `Hi! Looks great. Could you share a bit more about the condition and where you're located? Also is the price firm?`;
  }
}

export function generateMockConversations(
  listing: GeneratedListing,
  marketplaces: Marketplace[],
): Conversation[] {
  const count = Math.min(3, marketplaces.length === 0 ? 3 : 3);
  const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  const conversations: Conversation[] = selected.map((entry, index) => {
    const persona: BuyerPersona = { ...entry.persona, archetype: entry.archetype };
    const marketplace = marketplaces[index % Math.max(marketplaces.length, 1)] ?? "facebook";
    const initial = pickInitialMessage(entry.archetype, listing);
    const createdAt = nowMinus(2 + index * 4);

    const seedMessage: Message = {
      id: `${persona.name}-init-${createdAt}`,
      sender: "buyer",
      content: initial,
      createdAt,
    };

    return {
      id: `convo-${persona.name.replace(/\W+/g, "")}-${Date.now()}-${index}`,
      buyer: persona,
      marketplace,
      messages: [seedMessage],
      status: "new",
      unread: 1,
      autopilot: true,
      lastMessageAt: createdAt,
    };
  });

  return conversations;
}

export function mockStats(): { views: number; saves: number } {
  return {
    views: 28 + Math.floor(Math.random() * 90),
    saves: 3 + Math.floor(Math.random() * 12),
  };
}

export type { SeedConversation };
