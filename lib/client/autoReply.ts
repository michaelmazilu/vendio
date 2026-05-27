import type { ActivityEvent, Conversation, GeneratedListing } from "@/types/app";

export type AutoReplyResponse = {
  conversations: Conversation[];
  activity: ActivityEvent[];
  source: "facebook" | "simulated";
};

async function post(body: Record<string, unknown>): Promise<AutoReplyResponse> {
  const response = await fetch("/api/auto-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as AutoReplyResponse & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Auto-reply request failed.");
  }
  return payload;
}

export function pollAutoReply(listingId: string, listing: GeneratedListing) {
  return post({ action: "poll", listingId, listing });
}

export function sendSellerReply(
  listingId: string,
  listing: GeneratedListing,
  threadId: string,
  text: string,
) {
  return post({ action: "send", listingId, listing, threadId, text });
}

export function setAutopilotRemote(
  listingId: string,
  listing: GeneratedListing,
  threadId: string,
  autopilot: boolean,
) {
  return post({ action: "autopilot", listingId, listing, threadId, autopilot });
}
