/** bKash sends the customer back here after checkout: ?paymentID=…&status=success|failure|cancel */
import { COOKIE_NAME } from "@shared/const";
import { sessionService } from "@server/_core/session";
import {
  NEW_PASSWORD_COOKIE,
  completeBkashPayment,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentID = url.searchParams.get("paymentID");
  const status = url.searchParams.get("status") ?? "failure";
  const target = new URL("/v2/enroll", requestOrigin(request));

  if (!isValidPaymentId(paymentID)) {
    target.searchParams.set("payment", "failure");
    return redirect(target);
  }

  try {
    const result = await completeBkashPayment(paymentID, status);
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
    target.searchParams.set("paymentID", paymentID);
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
    console.error("[bKash] Callback failed:", error);
    target.searchParams.set("payment", "failure");
    return redirect(target);
  }
}
