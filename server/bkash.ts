/**
 * bKash Tokenized Checkout client.
 * Docs: https://developer.bka.sh — grant token → create payment → customer pays on bKash → execute payment.
 *
 * Configure with BKASH_BASE_URL, BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY and BKASH_APP_SECRET.
 * Sandbox base URL: https://tokenized.sandbox.bka.sh/v1.2.0-beta
 * Live base URL:    https://tokenized.pay.bka.sh/v1.2.0-beta
 */

const config = () => ({
  baseUrl: (process.env.BKASH_BASE_URL ?? "").replace(/\/+$/, ""),
  username: process.env.BKASH_USERNAME ?? "",
  password: process.env.BKASH_PASSWORD ?? "",
  appKey: process.env.BKASH_APP_KEY ?? "",
  appSecret: process.env.BKASH_APP_SECRET ?? "",
});

export function isBkashConfigured() {
  const c = config();
  return Boolean(
    c.baseUrl && c.username && c.password && c.appKey && c.appSecret
  );
}

export class BkashError extends Error {}

// bKash tokens last an hour; reuse one instead of granting a new token for every call.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function call<T>(
  path: string,
  body: unknown,
  headers: Record<string, string>
): Promise<T> {
  const response = await fetch(`${config().baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    statusMessage?: string;
    errorMessage?: string;
  };
  if (!response.ok)
    throw new BkashError(
      data.errorMessage ||
        data.statusMessage ||
        `bKash request failed (${response.status})`
    );
  return data;
}

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now())
    return cachedToken.value;
  const c = config();
  const data = await call<{
    id_token?: string;
    expires_in?: number;
    statusMessage?: string;
  }>(
    "/tokenized/checkout/token/grant",
    { app_key: c.appKey, app_secret: c.appSecret },
    { username: c.username, password: c.password }
  );
  if (!data.id_token)
    throw new BkashError(data.statusMessage || "Could not connect to bKash.");
  cachedToken = {
    value: data.id_token,
    expiresAt:
      Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000,
  };
  return data.id_token;
}

async function authed<T>(path: string, body: unknown): Promise<T> {
  return call<T>(path, body, {
    Authorization: await token(),
    "X-APP-Key": config().appKey,
  });
}

export type BkashPayment = {
  paymentID: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  customerMsisdn?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
};

/** Starts a payment; send the customer to the returned bkashURL. */
export async function createBkashPayment(input: {
  amount: string;
  invoice: string;
  payerReference: string;
  callbackURL: string;
}) {
  const data = await authed<BkashPayment & { bkashURL?: string }>(
    "/tokenized/checkout/create",
    {
      mode: "0011",
      payerReference: input.payerReference,
      callbackURL: input.callbackURL,
      amount: input.amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: input.invoice,
    }
  );
  if (data.statusCode !== "0000" || !data.bkashURL || !data.paymentID)
    throw new BkashError(
      data.statusMessage || "bKash could not start the payment."
    );
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

/** Completes a payment after the customer returns with status=success. */
export async function executeBkashPayment(paymentID: string) {
  return authed<BkashPayment>("/tokenized/checkout/execute", { paymentID });
}

/** Looks up a payment — used when execute fails or times out, to see whether it actually went through. */
export async function queryBkashPayment(paymentID: string) {
  return authed<BkashPayment>("/tokenized/checkout/payment/status", {
    paymentID,
  });
}
