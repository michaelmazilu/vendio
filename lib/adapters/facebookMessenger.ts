import { getAutomationPage, verifyFacebookSession } from "@/lib/browser";

export type MessengerThread = {
  threadId: string;
  buyerName: string;
  lastMessage: string;
  fromBuyer: boolean;
};

const messagesUrl = "https://www.facebook.com/messages/t/";

/**
 * Reads the logged-in Messenger inbox via the persistent Facebook session.
 *
 * Facebook offers no API/webhook for a personal account's Marketplace DMs, so
 * this scrapes the live Messenger DOM. Selectors are best-effort and will need
 * tuning against the real, logged-in account; on any parsing failure it returns
 * an empty list rather than throwing, so the auto-reply loop degrades safely.
 */
export async function fetchMessengerThreads(limit = 15): Promise<MessengerThread[]> {
  const session = await verifyFacebookSession();
  if (!session.connected) {
    throw new Error("Facebook is not connected. Connect Facebook before syncing messages.");
  }

  const page = await getAutomationPage("facebook");
  try {
    await page.goto(messagesUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2_500);

    const threadLinks = page.locator('a[href*="/messages/t/"][role="link"]');
    const count = Math.min(await threadLinks.count(), limit);
    const threads: MessengerThread[] = [];

    for (let i = 0; i < count; i += 1) {
      const link = threadLinks.nth(i);
      const href = (await link.getAttribute("href").catch(() => null)) ?? "";
      const threadId = href.split("/messages/t/")[1]?.replace(/\/$/, "") ?? "";
      if (!threadId) {
        continue;
      }

      const text = (await link.innerText().catch(() => "")).trim();
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      const buyerName = lines[0] ?? "Marketplace buyer";
      const lastMessage = lines.slice(1).join(" ") || lines[0] || "";

      // Messenger marks the seller's own last message with "You:". Anything else
      // is treated as an inbound buyer message.
      const fromBuyer = !/^you:/i.test(lastMessage);

      threads.push({ threadId, buyerName, lastMessage: lastMessage.replace(/^you:\s*/i, ""), fromBuyer });
    }

    return threads;
  } catch {
    return [];
  }
}

/**
 * Opens a Messenger thread and sends a reply. Best-effort DOM automation.
 */
export async function sendMessengerReply(threadId: string, text: string): Promise<void> {
  const session = await verifyFacebookSession();
  if (!session.connected) {
    throw new Error("Facebook is not connected. Connect Facebook before sending replies.");
  }

  const page = await getAutomationPage("facebook");
  await page.goto(`${messagesUrl}${threadId}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1_500);

  const composer = page
    .getByRole("textbox", { name: /message|aa|type a message/i })
    .first();
  await composer.click({ timeout: 8_000 });
  await composer.fill(text, { timeout: 8_000 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
}
