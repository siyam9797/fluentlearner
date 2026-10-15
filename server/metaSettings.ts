import { getSiteSettingsByGroup } from "./db";
import { META_DATASET_ID } from "@shared/meta";

export const META_SETTING_KEYS = {
  enabled: "meta_pixel_enabled",
  datasetId: "meta_dataset_id",
  capiEnabled: "meta_capi_enabled",
  accessToken: "meta_capi_access_token",
  testEventCode: "meta_test_event_code",
} as const;

export const META_PROTECTED_SETTING_KEYS = Object.values(META_SETTING_KEYS);

export async function getMetaSettings() {
  const rows = await getSiteSettingsByGroup("marketing");
  const saved = new Map(rows.map(row => [row.settingKey, row.settingValue]));
  const get = (key: string) => saved.get(key)?.trim();
  const datasetId = get(META_SETTING_KEYS.datasetId) || META_DATASET_ID;
  const savedToken = get(META_SETTING_KEYS.accessToken);
  const savedTestCode = get(META_SETTING_KEYS.testEventCode);
  return {
    enabled: get(META_SETTING_KEYS.enabled) !== "false",
    datasetId,
    capiEnabled: get(META_SETTING_KEYS.capiEnabled) !== "false",
    accessToken: saved.has(META_SETTING_KEYS.accessToken)
      ? savedToken || ""
      : process.env.META_CAPI_ACCESS_TOKEN?.trim() || "",
    tokenSource: saved.has(META_SETTING_KEYS.accessToken)
      ? savedToken
        ? "settings"
        : null
      : process.env.META_CAPI_ACCESS_TOKEN?.trim()
        ? "environment"
        : null,
    testEventCode: saved.has(META_SETTING_KEYS.testEventCode)
      ? savedTestCode || ""
      : process.env.META_TEST_EVENT_CODE?.trim() || "",
  };
}

export async function getPublicMetaConfig() {
  const settings = await getMetaSettings();
  return {
    enabled: settings.enabled,
    capiEnabled: settings.capiEnabled && !!settings.accessToken,
    datasetId: settings.datasetId,
  };
}
