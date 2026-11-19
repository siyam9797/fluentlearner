# Integrations

All integrations are optional. The app works without any of them.

| Integration                    | Configure in                                                      | Env fallback                                     | Without it                                                                              |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| bKash, SSLCommerz              | Admin → Settings → Online payment                                 | `BKASH_*`, `SSLCOMMERZ_*`                        | Enroll page offers WhatsApp. See [payments.md](payments.md)                             |
| Meta Pixel and Conversions API | Admin → Settings → Marketing                                      | `META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` | No tracking                                                                             |
| Claude AI marking              | Admin → Settings → AI marking (Super Admin)                       | `ANTHROPIC_API_KEY`                              | Writing and Speaking wait for a mentor. See [ielts-tests.md](ielts-tests.md#ai-marking) |
| Owner notifications            | –                                                                 | `NOTIFICATION_WEBHOOK_URL`                       | No notification                                                                         |
| WhatsApp                       | Website → Settings (contact number) and per-course enroll message | –                                                | –                                                                                       |

## Meta Pixel and Conversions API

Code: `server/metaSettings.ts`, `server/metaConversions.ts`, `client/src/components/MetaPageView.tsx`, `client/src/app/api/meta/pageview/route.ts`, `shared/meta.ts`.

**Settings** (`site_settings` group `marketing`, editable by Marketing, Admin and Super Admin):

| Setting                | Key                      | Default                                                                    |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Browser Pixel on/off   | `meta_pixel_enabled`     | on                                                                         |
| Conversions API on/off | `meta_capi_enabled`      | on (only active with a token)                                              |
| Dataset ID             | `meta_dataset_id`        | `1664861398363916`                                                         |
| Access token (secret)  | `meta_capi_access_token` | env `META_CAPI_ACCESS_TOKEN` until a token is saved or removed in Settings |
| Test event code        | `meta_test_event_code`   | env `META_TEST_EVENT_CODE`. **Clear it before running real traffic**       |

**Events:**

- **PageView:** fired on public pages only, never on `/admin` or `/student`. The browser Pixel fires `fbq('track','PageView')`, and the page also POSTs to `/api/meta/pageview`, which forwards to CAPI with the IP, user agent, `_fbp` and `_fbc`. That endpoint accepts same-origin requests only (`Sec-Fetch-Site`, or an `Origin` matching the host or `PUBLIC_SITE_URL`) and bodies of at most 1 KB.
- **Purchase:** fired only after an online payment is confirmed. The server sends it from `confirmCheckout`, and the browser sends it from the enroll confirmation screen. Both use the event ID `fluentlearner-purchase-<enrollmentId>`, so Meta deduplicates them. The event carries the value in BDT and SHA-256-hashed email and phone.

CAPI calls go to `https://graph.facebook.com/v26.0/<dataset>/events` with a 4-second timeout. Failures are logged without Meta's response body.

The token must stay server-side. Never put it in a `NEXT_PUBLIC_` variable. After changing settings, reload the public pages.

## Anthropic (Claude)

`server/aiGrading.ts` uses `@anthropic-ai/sdk` with model `claude-opus-5` and Zod-structured output. The key resolution order is the Settings key (`anthropic_api_key`), then `ANTHROPIC_API_KEY`. The client is rebuilt whenever the key changes. A new key is validated with `models.list` before it is saved. Full behaviour is described in [ielts-tests.md](ielts-tests.md#ai-marking).

## Notification webhook

`server/_core/notification.ts`. When `NOTIFICATION_WEBHOOK_URL` is set, `notifyOwner` POSTs JSON `{ "title": "...", "content": "..." }` to it. This happens when an online payment completes. A failed delivery is logged and otherwise ignored. Any endpoint that accepts JSON will work, such as a Slack or Discord relay, Zapier or Make.
