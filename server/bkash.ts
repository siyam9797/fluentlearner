/**
 * bKash Tokenized Checkout client.
 * Docs: https://developer.bka.sh — grant token → create payment → customer pays on bKash → execute payment.
 *
 * Configured in Admin → Settings → Online payment (site_settings, see BKASH_SETTINGS). Until those are
 * saved, it falls back to BKASH_BASE_URL, BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY and BKASH_APP_SECRET.
 */
import { getSiteSettingByKey } from "./db";

export const BKASH_BASE_URLS = {
  sandbox: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
  live: "https://tokenized.pay.bka.sh/v1.2.0-beta",
} as const;
export type BkashMode = keyof typeof BKASH_BASE_URLS;

/** site_settings keys. The credentials are secret: never returned by the settings endpoints. */
export const BKASH_SETTINGS = {
  enabled: "bkash_enabled",
  mode: "bkash_mode",
  username: "bkash_username",
  password: "bkash_password",
  appKey: "bkash_app_key",
  appSecret: "bkash_app_secret",
} as const;
export const BKASH_SECRET_KEYS: string[] = Object.values(BKASH_SETTINGS);

export type BkashConfig = {
  baseUrl: string;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
};

const setting = async (key: string) =>
  (await getSiteSettingByKey(key))?.settingValue?.trim() ?? "";

/** Credentials saved in Settings, or null if none are saved there. */
export async function savedBkashSettings() {
  const [enabled, mode, username, password, appKey, appSecret] =
    await Promise.all([
      setting(BKASH_SETTINGS.enabled),
      setting(BKASH_SETTINGS.mode),
      setting(BKASH_SETTINGS.username),
      setting(BKASH_SETTINGS.password),
      setting(BKASH_SETTINGS.appKey),
      setting(BKASH_SETTINGS.appSecret),
    ]);
  if (!username && !appKey) return null;
  return {
    enabled: enabled !== "false",
    mode: (mode === "live" ? "live" : "sandbox") as BkashMode,
    username,
    password,
    appKey,
    appSecret,
  };
}

const envConfig = (): BkashConfig => ({
  baseUrl: (process.env.BKASH_BASE_URL ?? "").replace(/\/+$/, ""),
  username: process.env.BKASH_USERNAME ?? "",
  password: process.env.BKASH_PASSWORD ?? "",
  appKey: process.env.BKASH_APP_KEY ?? "",
  appSecret: process.env.BKASH_APP_SECRET ?? "",
});

/** The credentials in use (Settings first, then the environment), or null when online payment is off. */
async function config(): Promise<BkashConfig | null> {
  const saved = await savedBkashSettings();
  const c = saved
    ? saved.enabled
      ? { baseUrl: BKASH_BASE_URLS[saved.mode], ...saved }
      : null
    : envConfig();
  return c && c.baseUrl && c.username && c.password && c.appKey && c.appSecret
    ? c
    : null;
}

export async function isBkashConfigured() {
  return (await config()) !== null;
}

/** Where the active credentials come from, for the Settings page. */
export async function bkashSource() {
  const saved = await savedBkashSettings();
  if (saved) return "settings" as const;
  const env = envConfig();
  return env.baseUrl && env.username && env.appKey
    ? ("environment" as const)
    : null;
}

export class BkashError extends Error {}

// bKash tokens last an hour; reuse one (for the same credentials) instead of granting a new token for every call.
let cachedToken: { value: string; expiresAt: number; for: string } | null =
  null;
const credentialsId = (c: BkashConfig) =>
  [c.baseUrl, c.username, c.appKey].join("|");

async function activeConfig() {
  const c = await config();
  if (!c)
    throw new BkashError(
      "Online payment isn't set up. Add the bKash credentials in Settings → Online payment."
    );
  return c;
}

async function call<T>(
  c: BkashConfig,
  path: string,
  body: unknown,
  headers: Record<string, string>
): Promise<T> {
  const response = await fetch(`${c.baseUrl}${path}`, {
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

async function grantToken(c: BkashConfig) {
  const data = await call<{
    id_token?: string;
    expires_in?: number;
    statusMessage?: string;
  }>(
    c,
    "/tokenized/checkout/token/grant",
    { app_key: c.appKey, app_secret: c.appSecret },
    { username: c.username, password: c.password }
  );
  if (!data.id_token)
    throw new BkashError(data.statusMessage || "Could not connect to bKash.");
  return data;
}

async function token(c: BkashConfig): Promise<string> {
  if (
    cachedToken &&
    cachedToken.for === credentialsId(c) &&
    cachedToken.expiresAt > Date.now()
  )
    return cachedToken.value;
  const data = await grantToken(c);
  cachedToken = {
    value: data.id_token!,
    for: credentialsId(c),
    expiresAt:
      Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000,
  };
  return data.id_token!;
}

/** Checks credentials by asking bKash for a token; throws BkashError if they're rejected. */
export async function checkBkashCredentials(c: BkashConfig) {
  await grantToken(c);
}

async function authed<T>(path: string, body: unknown): Promise<T> {
  const c = await activeConfig();
  return call<T>(c, path, body, {
    Authorization: await token(c),
    "X-APP-Key": c.appKey,
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
