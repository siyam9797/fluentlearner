import { AI_API_KEY_SETTING } from "./aiGrading";
import { BKASH_SECRET_KEYS } from "./bkash";
import { getAllSiteSettings } from "./db";
import { SSLCOMMERZ_SECRET_KEYS } from "./sslcommerz";
import { META_PROTECTED_SETTING_KEYS } from "./metaSettings";

/** Payment and AI credentials must never be included in public page data. */
export const SECRET_SETTING_KEYS = new Set([
  AI_API_KEY_SETTING,
  ...BKASH_SECRET_KEYS,
  ...SSLCOMMERZ_SECRET_KEYS,
  ...META_PROTECTED_SETTING_KEYS,
]);

export async function getPublicSiteSettings() {
  const settings = await getAllSiteSettings();
  const map: Record<string, string | null> = {};
  for (const setting of settings) {
    if (!SECRET_SETTING_KEYS.has(setting.settingKey)) {
      map[setting.settingKey] = setting.settingValue;
    }
  }
  return map;
}
