import { generateAiReply } from "@/lib/aiReply";
import type { ConversationStatus, GeneratedListing, Message } from "@/types/app";

export const runtime = "nodejs";
export const maxDuration = 60;

type ReplyRequestBody = {
  listing?: GeneratedListing;
  location?: string;
  buyerName?: string;
  status?: ConversationStatus;
  messages?: Message[];
  latestBuyerMessage?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReplyRequestBody;

    if (
      !payload.listing ||
      !payload.buyerName ||
      !payload.latestBuyerMessage ||
      !Array.isArray(payload.messages)
    ) {
      return Response.json(
        { error: "listing, buyerName, latestBuyerMessage, and messages are required." },
        { status: 400 },
      );
    }

    const result = await generateAiReply({
      listing: payload.listing,
      location: payload.location,
      buyerName: payload.buyerName,
      status: payload.status ?? "new",
      messages: payload.messages,
      latestBuyerMessage: payload.latestBuyerMessage,
    });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate an AI reply.";
    return Response.json({ error: message }, { status: 500 });
  }
}
