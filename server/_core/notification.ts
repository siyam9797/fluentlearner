import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = { title: string; content: string };

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = payload.title.trim();
  const content = payload.content.trim();
  if (!title || !content) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title and content are required." });
  }

  // Notifications are optional in a standalone deployment.
  if (!ENV.notificationWebhookUrl) return false;

  try {
    const response = await fetch(ENV.notificationWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    return response.ok;
  } catch (error) {
    console.warn("[Notification] Webhook delivery failed:", error);
    return false;
  }
}
