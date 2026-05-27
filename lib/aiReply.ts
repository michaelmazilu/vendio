import type {
  AiReplyIntent,
  AiReplyResult,
  ConversationStatus,
  GeneratedListing,
  Meetup,
  Message,
} from "@/types/app";

export type AiReplyInput = {
  listing: GeneratedListing;
  location?: string;
  buyerName: string;
  status: ConversationStatus;
  messages: Message[];
  latestBuyerMessage: string;
};

const intents: AiReplyIntent[] = [
  "answer_question",
  "confirm_availability",
  "negotiate",
  "propose_meetup",
  "confirm_meetup",
  "close_sale",
  "decline",
];

const SYSTEM_PROMPT = `You are Vendio, replying to marketplace buyers as if you ARE the private seller. You sound like a real person texting — relaxed, friendly, and to the point. The buyer must never suspect you are an AI.

Voice:
- 1-2 short sentences. Match the buyer's energy; never stiff, robotic, or salesy.
- Always move the deal forward: answer what they actually asked, then give one concrete next step.
- Use the buyer's first name occasionally, not every message.

Negotiation:
- Hold the listing price. Accept any offer at or above 85% of it and go straight to scheduling a pickup.
- For offers between 70% and 85%, counter politely toward the middle with a specific number.
- Politely decline below 70% and state a firm floor.

Meetups:
- Steer toward a safe, public, local meetup. When proposing or confirming, give a specific place (a named coffee shop or transit station near the seller's location), a specific time (e.g. "tomorrow at 6pm"), and confirm cash or e-transfer.

Hard rules:
- Never invent details about the item beyond what's in the listing.
- Never reveal you are an AI. No emojis, no hashtags, no corporate phrasing, no ALL CAPS.

Respond as the seller. Output strict JSON only.`;

function extractText(response: unknown): string | null {
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
      if (part && typeof part === "object") {
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string") {
          return text;
        }
      }
    }
  }
  return null;
}

function clean(text: string, maxLen = 600): string {
  return text.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

function fallbackMeetup(location?: string): Meetup {
  const place = location?.split(",")[0]?.trim() || "downtown Toronto";
  return {
    location: `Tim Hortons in ${place}`,
    time: "Tomorrow at 6:00 PM",
    payment: "cash",
  };
}

function fallbackReply(input: AiReplyInput): AiReplyResult {
  const { listing, latestBuyerMessage, buyerName } = input;
  const lower = latestBuyerMessage.toLowerCase();
  const firstName = buyerName.split(/\s+/)[0] ?? buyerName;

  const offerMatch = latestBuyerMessage.match(/\$?\s?(\d{2,4})/);
  const offer = offerMatch ? Number(offerMatch[1]) : null;

  if (offer !== null) {
    const ratio = offer / listing.price;
    if (ratio >= 0.85) {
      const meetup = fallbackMeetup(undefined);
      return {
        reply: `Sounds fair, ${firstName} — $${offer} works. Could you meet ${meetup.time.toLowerCase()} at ${meetup.location}? Cash on pickup is easiest.`,
        intent: "propose_meetup",
        meetup,
        source: "fallback",
      };
    }
    if (ratio < 0.7) {
      return {
        reply: `Thanks for the offer, ${firstName}, but I can't go that low. The lowest I could do is $${Math.round(listing.price * 0.9)}. Let me know if that works.`,
        intent: "negotiate",
        source: "fallback",
      };
    }
    return {
      reply: `Appreciate the offer, ${firstName}. I could meet you in the middle at $${Math.round((offer + listing.price) / 2)} — happy to arrange a pickup if that works.`,
      intent: "negotiate",
      source: "fallback",
    };
  }

  if (
    lower.includes("still available") ||
    lower.includes("pick it up") ||
    lower.includes("can i get")
  ) {
    const meetup = fallbackMeetup(undefined);
    return {
      reply: `Hey ${firstName}, yes it's still available! I'm based downtown — could meet ${meetup.time.toLowerCase()} at ${meetup.location}. Cash or e-transfer both work.`,
      intent: "propose_meetup",
      meetup,
      source: "fallback",
    };
  }

  if (lower.includes("condition") || lower.includes("how old") || lower.includes("more")) {
    return {
      reply: `Hi ${firstName}, it's in ${listing.condition.toLowerCase()} condition and works exactly as expected. Happy to send more photos if helpful. Want to set up a pickup this week?`,
      intent: "answer_question",
      source: "fallback",
    };
  }

  return {
    reply: `Thanks for reaching out, ${firstName}! The ${listing.title.toLowerCase()} is still available at $${listing.price}. When would be a good time for you to pick it up?`,
    intent: "confirm_availability",
    source: "fallback",
  };
}

export async function generateAiReply(input: AiReplyInput): Promise<AiReplyResult> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackReply(input);
  }

  try {
    const transcript = input.messages
      .map((message) => {
        if (message.sender === "buyer") {
          return `BUYER (${input.buyerName}): ${message.content}`;
        }
        if (message.sender === "seller_ai") {
          return `SELLER (you): ${message.content}`;
        }
        return `SELLER (you, human override): ${message.content}`;
      })
      .join("\n");

    const userPrompt = `Listing context:
- Title: ${input.listing.title}
- Price: $${input.listing.price} CAD
- Condition: ${input.listing.condition}
- Category: ${input.listing.category}
- Location: ${input.location ?? "Toronto, ON"}
- Description: ${input.listing.description}

Conversation so far:
${transcript}

The buyer just sent: "${input.latestBuyerMessage}"

Write the seller's next reply. If proposing or confirming a meetup, include meetup details (location, time, payment).`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REPLY_MODEL ?? "gpt-4.1-mini",
        temperature: 0.8,
        max_output_tokens: 300,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "marketplace_reply",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["reply", "intent", "meetup"],
              properties: {
                reply: { type: "string" },
                intent: { type: "string", enum: intents },
                meetup: {
                  type: ["object", "null"],
                  additionalProperties: false,
                  required: ["location", "time", "payment"],
                  properties: {
                    location: { type: "string" },
                    time: { type: "string" },
                    payment: { type: "string", enum: ["cash", "etransfer"] },
                  },
                },
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
    const text = extractText(body);
    if (!text) {
      throw new Error("OpenAI response missing JSON text");
    }

    const parsed = JSON.parse(text) as {
      reply?: unknown;
      intent?: unknown;
      meetup?: unknown;
    };

    const reply = typeof parsed.reply === "string" ? clean(parsed.reply) : "";
    if (!reply) {
      throw new Error("Reply was empty");
    }

    const intent = (
      typeof parsed.intent === "string" && intents.includes(parsed.intent as AiReplyIntent)
        ? (parsed.intent as AiReplyIntent)
        : "answer_question"
    );

    let meetup: Meetup | undefined;
    if (parsed.meetup && typeof parsed.meetup === "object") {
      const m = parsed.meetup as { location?: unknown; time?: unknown; payment?: unknown };
      if (typeof m.location === "string" && typeof m.time === "string") {
        const payment =
          m.payment === "etransfer" || m.payment === "cash" ? (m.payment as Meetup["payment"]) : "cash";
        meetup = {
          location: clean(m.location, 120),
          time: clean(m.time, 80),
          payment,
        };
      }
    }

    return { reply, intent, meetup, source: "openai" };
  } catch (error) {
    console.warn("Falling back to deterministic AI reply:", error);
    return fallbackReply(input);
  }
}
