# Public website

## Current site (v2)

v2 became the main site on 2026-10-10. It previously ran at `/home-2` and `/v2/*`, and those URLs now redirect permanently to the matching main paths.

| Path                 | Screen             | Notes                                                                                                                              |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | `HomeV2`           | Hero, achievements ticker, numbers, featured courses, benefits, about, success stories, steps, testimonials, CTA with open batches |
| `/courses`           | `V2Courses`        | Active courses, filterable by category                                                                                             |
| `/courses/:slugOrId` | `V2CourseDetail`   | Looks up by slug or numeric ID. Curriculum, outcomes, FAQ, instructor, video                                                       |
| `/about`             | `V2About`          | Story, mission and vision, founder                                                                                                 |
| `/success-stories`   | `V2SuccessStories` | All active stories                                                                                                                 |
| `/how-it-works`      | `V2HowItWorks`     | Stages and FAQ                                                                                                                     |
| `/contact`           | `V2Contact`        | WhatsApp, phone and email channels. The message form opens WhatsApp with the message pre-filled and does not store anything        |
| `/enroll`            | `V2Enroll`         | Online checkout. See [payments.md](payments.md)                                                                                    |

Sections live in `client/src/components/home-v2/` (`Hv*.tsx`) and share `primitives.tsx`, `font.ts` and `hooks.ts`. All internal URLs come from `routes.ts` (`V2.home`, `V2.course(slug)`, `V2.enroll(courseId)` …). `toV2Href()` rewrites old `/home-2` and `/v2/...` links saved in menus.

Courses, stories and settings are rendered on the server and passed in through `PublicDataContext` (see [architecture.md](architecture.md#server-rendered-public-data)), with live tRPC queries as a fallback.

## Editable content

Every text, image, list and toggle on the v2 pages is a **field** defined in `client/src/components/home-v2/content.ts` (`V2_FIELDS`). The same definitions drive two things:

1. the pages, through `useV2Content()` (`t(key)`, lists, menus, toggles), and
2. the **Admin → Website → Pages** forms, which are generated from the field list and grouped by page and section (Header, Footer, Contact details, Social media, Statistics, Home → Hero, …, Enroll → Payment step, Search & sharing).

A value is resolved in this order:

1. the `site_settings` row with the field's `v2_*` key,
2. if there is no row or it is `null`: the field's `legacyKey` value (shared with the v1 settings), and then
3. the field's `default`.

An empty string `""` means "deliberately blank".

Text may contain tokens that are filled in at render time: `{scorers}`, `{successRate}`, `{avgBand}`, `{years}`, `{founder}`. In headings that show round photos, `[img]` marks each photo position.

**To add an editable field,** add it to the right section in `V2_FIELDS` with a `key`, `type` and `default`, then read it with `useV2Content()` in the component. The admin form picks it up automatically.

### Menus

**Admin → Website → Menus** is a WordPress-style editor (`AdminMenus.tsx`, `AdminMenuEditor.tsx`). You can create any number of named menus and assign one to each location (`header`, `footer`). Items are stored flat, and `depth: 1` nests an item under the nearest depth-0 item above it. Menus saved in the older `v2_menu_header` and `v2_menu_footer` keys are carried over.

### Other content sources

| Content                                  | Managed in                                                        |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Courses                                  | Admin → Courses                                                   |
| Success stories (ticker, grid, featured) | Admin → Success Stories                                           |
| Open batches in the CTA                  | Admin → Batches (`isOpen`, `isActive`)                            |
| Instructors on course pages              | Admin → Instructors (stored as JSON in the `instructors` setting) |
| Logo, favicon, page title, tagline       | Admin → Settings → Branding                                       |
| Fallback stats and brand constants       | `client/src/lib/siteConstants.ts`                                 |

## Old site (v1)

The previous site, once kept at `/old`, has been removed. `/old` and `/old/*` permanently redirect to the matching live page (`next.config.ts`).

## SEO

- `SEOHead` sets per-page title, description and Open Graph tags. Defaults come from the **Search & sharing** fields (`og-default.jpg` and `og-square.jpg` in `public/`).
- **Course pages** set their title and share tags on the server (`generateMetadata` in `app/[[...path]]/page.tsx`), because link-preview crawlers read only the first HTML response. The share image is the course's **featured image**, resized by `server/courseShare.ts` to a 1200 × 630 JPEG under 280 KB (WhatsApp skips larger images) and served at `/og/course/<slug or id>?v=<last update>`. Changing the featured image changes the URL, so previews refresh. Only images stored on this site are read; anything else falls back to `og-default.jpg`.
- `sitemap.ts` lists the public pages and every active course (`/courses/<slug or id>`), revalidated hourly.
- `robots.ts` disallows `/admin`, `/student` and `/api/`.
- The root `<title>` and favicon come from Branding settings and revalidate every 60 seconds.

## Tracking

Public pages fire a Meta `PageView` from the browser (Pixel), the server (Conversions API), or both. See [integrations.md](integrations.md#meta-pixel-and-conversions-api).
