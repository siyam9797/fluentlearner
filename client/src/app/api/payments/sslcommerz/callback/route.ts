/**
 * SSLCommerz sends the customer back here after checkout (a form POST) with
 * ?status=success|fail|cancel, and calls ?status=ipn server-to-server when a payment completes.
 * The form carries tran_id and, for a successful payment, val_id — which is checked with SSLCommerz.
 */
import { COOKIE_NAME } from "@shared/const";
import { sessionService } from "@server/_core/session";
import {
  NEW_PASSWORD_COOKIE,
  completeSslcommerzPayment,
  isValidPaymentId,
  requestOrigin,
} from "@server/payments";

export const dynamic = "force-dynamic";

const SESSION_MS = 1000 * 60 * 60 * 24 * 365;

function redirect(target: URL, cookies: string[] = []) {
  const headers = new Headers({ Location: target.toString() });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

async function fields(request: Request, url: URL) {
  const values = new Map(url.searchParams);
  if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    form?.forEach((value, key) => {
      if (typeof value === "string") values.set(key, value);
    });
  }
  return values;
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const data = await fields(request, url);
  const step = url.searchParams.get("status") ?? "fail";
  const tranId = data.get("tran_id") ?? null;
  const valId = data.get("val_id") ?? null;

  // Server-to-server notification: complete the payment even if the student closed the tab.
  if (step === "ipn") {
    const paid = ["VALID", "VALIDATED"].includes(data.get("status") ?? "");
    if (isValidPaymentId(tranId) && paid)
      await completeSslcommerzPayment(tranId, "success", valId).catch(error =>
        console.error("[SSLCommerz] IPN failed:", error)
      );
    return new Response("OK");
  }

  const target = new URL("/v2/enroll", requestOrigin(request));
  if (!isValidPaymentId(tranId)) {
    target.searchParams.set("payment", "failure");
    return redirect(target);
  }

  try {
    const result = await completeSslcommerzPayment(
      tranId,
      step === "success" ? "success" : step === "cancel" ? "cancel" : "failure",
      valId
    );
    if (!result.ok) {
      target.searchParams.set(
        "payment",
        result.reason === "cancel" ? "cancel" : "failure"
      );
      if (result.courseId)
        target.searchParams.set("courseId", String(result.courseId));
      return redirect(target);
    }
    target.searchParams.set("payment", "success");
    target.searchParams.set("paymentID", tranId);
    // A brand-new student is signed straight in, and their generated password is handed to the
    // confirmation screen in a short-lived HttpOnly cookie (never in the URL).
    if (result.loginUserId) {
      const token = await sessionService.createAppSessionToken(
        result.loginUserId,
        SESSION_MS
      );
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      const cookies = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MS / 1000}${secure}`,
      ];
      if (result.password)
        cookies.push(
          `${NEW_PASSWORD_COOKIE}=${encodeURIComponent(result.password)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secure}`
        );
      return redirect(target, cookies);
    }
    return redirect(target);
  } catch (error) {
    console.error("[SSLCommerz] Callback failed:", error);
    target.searchParams.set("payment", "failure");
    return redirect(target);
  }
}

export const GET = handle;
export const POST = handle;
