import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMetaPurchase } from "./metaConversions";
import { getSiteSettingsByGroup } from "./db";
import { getMetaSettings, getPublicMetaConfig } from "./metaSettings";

vi.mock("./db", () => ({
  getSiteSettingsByGroup: vi.fn().mockResolvedValue([]),
}));

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

afterEach(() => {
  vi.mocked(getSiteSettingsByGroup).mockResolvedValue([]);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Meta confirmed purchase event", () => {
  it("does not send when the private token is absent", async () => {
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await sendMetaPurchase({
      enrollmentId: 12,
      email: "student@example.com",
      mobile: "01712345678",
      amount: "8500",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a deduplicated, hashed BDT purchase with the test code", async () => {
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "test-token");
    vi.stubEnv("META_TEST_EVENT_CODE", "TEST123");
    vi.stubEnv("PUBLIC_SITE_URL", "https://example.com");
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    await sendMetaPurchase({
      enrollmentId: 12,
      email: " Student@Example.com ",
      mobile: "01712-345678",
      amount: "8500",
    });

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe(
      "https://graph.facebook.com/v26.0/1664861398363916/events"
    );
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      access_token: "test-token",
      test_event_code: "TEST123",
      data: [
        {
          event_name: "Purchase",
          event_id: "fluentlearner-purchase-12",
          action_source: "website",
          event_source_url: "https://example.com/enroll",
          user_data: {
            em: [sha256("student@example.com")],
            ph: [sha256("8801712345678")],
          },
          custom_data: { currency: "BDT", value: 8500 },
        },
      ],
    });
  });

  it("stops sending when Conversions API is switched off in Settings", async () => {
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "test-token");
    vi.mocked(getSiteSettingsByGroup).mockResolvedValue([
      { settingKey: "meta_capi_enabled", settingValue: "false" },
    ] as Awaited<ReturnType<typeof getSiteSettingsByGroup>>);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await sendMetaPurchase({
      enrollmentId: 12,
      email: "student@example.com",
      mobile: "01712345678",
      amount: "8500",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses saved settings while returning only public Pixel configuration", async () => {
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "environment-token");
    vi.mocked(getSiteSettingsByGroup).mockResolvedValue([
      { settingKey: "meta_pixel_enabled", settingValue: "false" },
      { settingKey: "meta_dataset_id", settingValue: "1234567890" },
      { settingKey: "meta_capi_access_token", settingValue: "saved-token" },
    ] as Awaited<ReturnType<typeof getSiteSettingsByGroup>>);
    expect(await getPublicMetaConfig()).toEqual({
      enabled: false,
      datasetId: "1234567890",
    });
    expect((await getMetaSettings()).accessToken).toBe("saved-token");
  });
});
