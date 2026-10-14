import { createHash } from "node:crypto";
import { purchaseEventId } from "@shared/meta";
import { getMetaSettings } from "./metaSettings";

type Purchase = {
  enrollmentId: number;
  email: string | null;
  mobile: string;
  amount: string;
};

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Send only confirmed payments; failures must never change the payment result. */
export async function sendMetaPurchase(purchase: Purchase) {
  const settings = await getMetaSettings().catch(() => null);
  if (!settings?.capiEnabled || !settings.accessToken) return;

  const email = purchase.email?.trim().toLowerCase();
  const digits = purchase.mobile.replace(/\D/g, "");
  const phone = digits.startsWith("0") ? `88${digits}` : digits;
  const origin = process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: purchaseEventId(purchase.enrollmentId),
        action_source: "website",
        ...(origin && { event_source_url: `${origin}/enroll` }),
        user_data: {
          ...(email && { em: [hash(email)] }),
          ...(phone && { ph: [hash(phone)] }),
        },
        custom_data: {
          currency: "BDT",
          value: Number(purchase.amount),
        },
      },
    ],
    access_token: settings.accessToken,
    ...(settings.testEventCode && {
      test_event_code: settings.testEventCode,
    }),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v26.0/${settings.datasetId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!response.ok) {
      // Do not log Meta's response; it could contain account information.
      console.warn(`[Meta CAPI] Purchase event failed (${response.status}).`);
    }
  } catch {
    console.warn("[Meta CAPI] Purchase event could not be delivered.");
  }
}
