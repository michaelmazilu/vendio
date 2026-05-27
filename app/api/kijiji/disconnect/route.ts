import { clearKijijiSession } from "@/lib/browser";

export const runtime = "nodejs";

export async function POST() {
  await clearKijijiSession();
  return Response.json({
    message:
      "Kijiji disconnected in Vendio. To fully sign out, log out on kijiji.ca in the automation browser as well.",
  });
}
