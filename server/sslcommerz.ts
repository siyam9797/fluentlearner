/**
 * SSLCommerz hosted checkout: one gateway for Nagad, Rocket, cards and internet banking.
 * Docs: https://developer.sslcommerz.com — create a session → customer pays on SSLCommerz →
 * SSLCommerz POSTs back to our success/fail/cancel URL → we confirm with the validation API.
 *
 * Configured in Admin → Settings → Online payment (site_settings, see SSLCOMMERZ_SETTINGS). Until those
 * are saved, it falls back to SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD and SSLCOMMERZ_MODE.
 */
import { getSiteSettingByKey } from "./db";

export const SSLCOMMERZ_BASE_URLS = {
  sandbox: "https://sandbox.sslcommerz.com",
  live: "https://securepay.sslcommerz.com",
} as const;
export type SslcommerzMode = keyof typeof SSLCOMMERZ_BASE_URLS;

/** site_settings keys. The credentials are secret: never returned by the settings endpoints. */
export const SSLCOMMERZ_SETTINGS = {
  enabled: "sslcommerz_enabled",
  mode: "sslcommerz_mode",
  storeId: "sslcommerz_store_id",
  storePassword: "sslcommerz_store_password",
} as const;
export const SSLCOMMERZ_SECRET_KEYS: string[] =
  Object.values(SSLCOMMERZ_SETTINGS);

export type SslcommerzConfig = {
  baseUrl: string;
  storeId: string;
  storePassword: string;
};

export class SslcommerzError extends Error {}

const setting = async (key: string) =>
  (await getSiteSettingByKey(key))?.settingValue?.trim() ?? "";

/** Credentials saved in Settings, or null if none are saved there. */
export async function savedSslcommerzSettings() {
  const [enabled, mode, storeId, storePassword] = await Promise.all([
    setting(SSLCOMMERZ_SETTINGS.enabled),
    setting(SSLCOMMERZ_SETTINGS.mode),
    setting(SSLCOMMERZ_SETTINGS.storeId),
    setting(SSLCOMMERZ_SETTINGS.storePassword),
  ]);
  if (!storeId) return null;
  return {
    enabled: enabled !== "false",
    mode: (mode === "live" ? "live" : "sandbox") as SslcommerzMode,
    storeId,
    storePassword,
  };
}

const envConfig = () => ({
  mode: (process.env.SSLCOMMERZ_MODE === "live"
    ? "live"
    : "sandbox") as SslcommerzMode,
  storeId: process.env.SSLCOMMERZ_STORE_ID ?? "",
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
});

/** The credentials in use (Settings first, then the environment), or null when it's off. */
async function config(): Promise<SslcommerzConfig | null> {
  const saved = await savedSslcommerzSettings();
  const c = saved ? (saved.enabled ? saved : null) : envConfig();
  return c && c.storeId && c.storePassword
    ? {
        baseUrl: SSLCOMMERZ_BASE_URLS[c.mode],
        storeId: c.storeId,
        storePassword: c.storePassword,
      }
    : null;
}

export async function isSslcommerzConfigured() {
  return (await config()) !== null;
}

/** Where the active credentials come from, for the Settings page. */
export async function sslcommerzSource() {
  if (await savedSslcommerzSettings()) return "settings" as const;
  return envConfig().storeId ? ("environment" as const) : null;
}

type SessionResponse = {
  status?: string;
  failedreason?: string;
  GatewayPageURL?: string;
  sessionkey?: string;
};

async function initSession(
  c: SslcommerzConfig,
  fields: Record<string, string>
): Promise<SessionResponse> {
  const response = await fetch(`${c.baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      store_id: c.storeId,
      store_passwd: c.storePassword,
      ...fields,
    }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as SessionResponse;
  if (!response.ok && !data.failedreason)
    throw new SslcommerzError(`SSLCommerz request failed (${response.status})`);
  return data;
}

/** Starts a checkout; send the customer to the returned gatewayURL. */
export async function createSslcommerzSession(input: {
  tranId: string;
  amount: string;
  /** e.g. https://site/api/payments/sslcommerz/callback — ?status=success|fail|cancel is added. */
  callbackBase: string;
  customer: { name: string; email: string; phone: string };
  product: string;
}) {
  const c = await config();
  if (!c)
    throw new SslcommerzError(
      "Online payment isn't set up. Add the SSLCommerz store in Settings → Online payment."
    );
  const back = (status: string) => `${input.callbackBase}?status=${status}`;
  const data = await initSession(c, {
    total_amount: input.amount,
    currency: "BDT",
    tran_id: input.tranId,
    success_url: back("success"),
    fail_url: back("fail"),
    cancel_url: back("cancel"),
    ipn_url: back("ipn"),
    cus_name: input.customer.name,
    cus_email: input.customer.email,
    cus_phone: input.customer.phone,
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
    product_name: input.product.slice(0, 250) || "Course",
    product_category: "Education",
    product_profile: "non-physical-goods",
  });
  if (data.status !== "SUCCESS" || !data.GatewayPageURL)
    throw new SslcommerzError(
      data.failedreason || "SSLCommerz could not start the payment."
    );
  return { gatewayURL: data.GatewayPageURL };
}

/** Checks a store ID and password by opening (and abandoning) a tiny test session. */
export async function checkSslcommerzCredentials(c: SslcommerzConfig) {
  const data = await initSession(c, {
    total_amount: "10",
    currency: "BDT",
    tran_id: `FLCHECK${Date.now().toString(36)}`,
    success_url: "https://example.com/success",
    fail_url: "https://example.com/fail",
    cancel_url: "https://example.com/cancel",
    cus_name: "Credential check",
    cus_email: "check@example.com",
    cus_phone: "01700000000",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
    product_name: "Credential check",
    product_category: "Education",
    product_profile: "non-physical-goods",
  });
  if (data.status !== "SUCCESS")
    throw new SslcommerzError(
      data.failedreason || "SSLCommerz did not accept these credentials."
    );
}

export type SslcommerzValidation = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency_type?: string;
  currency_amount?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_issuer?: string;
};

/** Confirms a payment with SSLCommerz (never trust the browser's POST alone). */
export async function validateSslcommerzPayment(valId: string) {
  const c = await config();
  if (!c) throw new SslcommerzError("SSLCommerz isn't set up.");
  const url = new URL(`${c.baseUrl}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({
    val_id: valId,
    store_id: c.storeId,
    store_passwd: c.storePassword,
    format: "json",
  }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new SslcommerzError(
      `SSLCommerz validation failed (${response.status})`
    );
  return (await response.json()) as SslcommerzValidation;
}
