import { clearFacebookSession } from "@/lib/browser";

export const runtime = "nodejs";

export async function POST() {
  await clearFacebookSession();
  return Response.json({
    message:
      "Facebook disconnected in Vendio. To fully sign out, log out in the automation browser as well.",
  });
}
