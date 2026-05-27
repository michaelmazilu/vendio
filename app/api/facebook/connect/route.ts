import { openFacebookMarketplace } from "@/lib/browser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await openFacebookMarketplace();
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open the Facebook browser session.";
    return Response.json({ error: message }, { status: 500 });
  }
}
