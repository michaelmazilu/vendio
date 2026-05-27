import { loginToKijiji } from "@/lib/browser";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  try {
    const result = await loginToKijiji();

    if (!result.loggedIn) {
      return Response.json({ error: result.message }, { status: 408 });
    }

    return Response.json({ message: result.message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open the Kijiji browser session.";
    return Response.json({ error: message }, { status: 500 });
  }
}
