import {
  runAutoReplyPoll,
  sendSellerMessage,
  setConversationAutopilot,
} from "@/lib/autoReplyEngine";
import { verifyFacebookSession } from "@/lib/browser";
import { getMessageSource } from "@/lib/messageSource";
import type { GeneratedListing } from "@/types/app";

export const runtime = "nodejs";
export const maxDuration = 120;

type AutoReplyBody = {
  action?: "poll" | "send" | "autopilot";
  listingId?: unknown;
  listing?: GeneratedListing;
  threadId?: unknown;
  text?: unknown;
  autopilot?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AutoReplyBody;

    if (typeof body.listingId !== "string" || !body.listing) {
      return Response.json({ error: "listingId and listing are required." }, { status: 400 });
    }

    // The real Facebook source needs a live session; the simulated source does not.
    if (getMessageSource().kind === "facebook") {
      const session = await verifyFacebookSession();
      if (!session.connected) {
        return Response.json(
          { error: "Facebook is not connected. Connect Facebook to sync buyer messages." },
          { status: 401 },
        );
      }
    }

    const action = body.action ?? "poll";

    if (action === "send") {
      if (typeof body.threadId !== "string" || typeof body.text !== "string" || !body.text.trim()) {
        return Response.json({ error: "threadId and text are required to send." }, { status: 400 });
      }
      const result = await sendSellerMessage(
        body.listingId,
        body.listing,
        body.threadId,
        body.text.trim(),
      );
      return Response.json(result);
    }

    if (action === "autopilot") {
      if (typeof body.threadId !== "string" || typeof body.autopilot !== "boolean") {
        return Response.json(
          { error: "threadId and autopilot flag are required." },
          { status: 400 },
        );
      }
      const result = await setConversationAutopilot(
        body.listingId,
        body.listing,
        body.threadId,
        body.autopilot,
      );
      return Response.json(result);
    }

    const result = await runAutoReplyPoll(body.listingId, body.listing);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Auto-reply request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
