# Architecture

## Overview

FluentLearner is a single Next.js 16 application. The UI is a React 19 client app. All business logic runs on the server through **tRPC** procedures backed by **MySQL** via **Drizzle ORM**. Next.js serves the pages, the tRPC endpoint, and a few plain HTTP routes (health, payment callbacks, uploads, Meta page views).

```text
Browser ──► Next.js (client/src/app)
              ├── [[...path]]/page.tsx   catch-all page → ClientApp → App.tsx router
              ├── api/trpc/[trpc]        tRPC fetch adapter → server/routers.ts
              ├── api/health             DB connectivity check
              ├── api/payments/*         bKash / SSLCommerz return + IPN
              ├── api/meta/pageview      server-side Meta PageView
              ├── uploads/[...path]      serves files from UPLOAD_DIR
              ├── sitemap.ts, robots.ts
              └── layout.tsx             <html>, metadata from Branding settings
                          │
                          ▼
              server/ (tRPC routers, db access, integrations) ──► MySQL
                                                              ──► UPLOAD_DIR (disk)
                                                              ──► bKash, SSLCommerz, Meta, Anthropic
```

## Repository layout

```text
client/                         Next.js project root (next dev client)
  next.config.ts                standalone output, image allow-list, redirects; loads ../.env
  public/                       static assets (logos, OG images, practice SVGs)
  src/
    app/                        App Router: catch-all page, API routes, sitemap, robots
    App.tsx                     the client-side router (pathname → screen)
    ClientApp.tsx               tRPC + React Query providers, auth redirect, Meta PageView
    screens/                    one file per page (Admin*, Student*, V2*, legacy v1 pages)
    components/
      home-v2/                  current public site: sections, content model, routes
      student/                  StudentShell, Recorder (speaking), typing passages
      ui/                       shadcn/Radix primitives
      Admin*.tsx                admin layout, pickers, editors, tables
    contexts/                   PublicDataContext (server-loaded data), ThemeContext
    hooks/                      useAuth, useSiteSettings, useInstructors, ...
    lib/                        trpc client, router shim, rich HTML, listening layout, image helpers
server/
  _core/                        tRPC init and procedure tiers, context, session (JWT), password, env, webhook
  routers.ts                    appRouter: auth, courses, stories, batches, enrollments, payments, settings
  mockRouters.ts                mockTests, students, users, learningResources, student routers
  db.ts                         data access for the core tables
  mockDb.ts                     data access and marking for IELTS tests, users, resources, vocabulary
  payments.ts, bkash.ts, sslcommerz.ts   online checkout
  aiGrading.ts                  Claude marking of Writing and Speaking
  metaConversions.ts, metaSettings.ts   Meta Pixel and CAPI
  storage.ts, media.ts, imageOptimizer.ts   uploads on local disk
  publicSiteSettings.ts         site settings with secrets stripped
  database/                     schema.ts, numbered SQL migrations, drizzle meta
  scripts/                      seed and sync scripts (plain Node ESM)
  *.test.ts                     Vitest tests
shared/                         code used by both sides
  roles.ts                      roles and permission helpers
  mock.ts                       IELTS rules: question types, marking, band tables, answer-key parser
  meta.ts, const.ts, _core/errors.ts
```

### Path aliases

Defined in `tsconfig.json` and `vitest.config.ts`:

| Alias       | Points to      |
| ----------- | -------------- |
| `@/*`       | `client/src/*` |
| `@shared/*` | `shared/*`     |
| `@server/*` | `server/*`     |

## Routing

The whole UI is **one catch-all route**, `client/src/app/[[...path]]/page.tsx`. Routing to screens happens on the client in `client/src/App.tsx`, which matches `usePathname()` against a list of paths. Every screen except the home page is loaded with `next/dynamic`, so public visitors never download the admin or student bundles.

`client/src/lib/router.tsx` provides `useLocation`, `useRoute(pattern)`, `useSearch` and `Link`, a small wouter-style API over `next/navigation`. Next's `params` don't carry `:name` segments in a catch-all, so `useRoute` reads them from the path.

**To add a page:** create the screen in `client/src/screens/`, add a `dynamic()` import and a pathname branch in `App.tsx`, and add it to `sitemap.ts` if it is public. Admin screens are wrapped in `<AdminLayout>` automatically.

### Route map

| Path                                                                                                 | Screen                                                                           |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/` `/courses` `/courses/:slugOrId` `/about` `/success-stories` `/how-it-works` `/contact` `/enroll` | Current public site (v2): `HomeV2`, `V2*`                                        |
| `/student`, `/student/{practice,mocks,results,batch,resources,typing,profile,settings}`              | `StudentDashboard` (login screen when signed out)                                |
| `/student/attempts/:id`                                                                              | `StudentAttempt`: exam screen, then result                                       |
| `/admin/ielts/preview/:testId`                                                                       | Full-screen student view of a test, for admins                                   |
| `/admin/**`                                                                                          | Admin screens inside `AdminLayout`. See [admin-dashboard.md](admin-dashboard.md) |

Redirects in `next.config.ts` keep old links working: `/home-2`, `/v2/*` → `/`, `/old`, `/old/*` → the matching live page, `/admin/mock-tests/*` → `/admin/ielts/*`, `/admin/mock-results*` → `/admin/ielts/...`, `/admin/site-settings` → `/admin/website`.

## Server-rendered public data

On public paths (anything not under `/admin` or `/student`), `page.tsx` runs on the server and loads active courses, public site settings, success stories, featured stories and the public Meta config. It passes them into `ClientApp` as initial data, which `PublicDataContext` exposes. Public pages therefore render with real content on the first paint, without waiting for tRPC. Every loader is wrapped in `.catch(() => null)`, so the site still renders, using built-in defaults, when the database is unreachable.

`layout.tsx` sets the page `<title>` and favicon from the `page_title` and `favicon` settings, and revalidates every 60 seconds.

## tRPC

- **Server:** `server/routers.ts` exports `appRouter`, which merges the routers from `mockRouters.ts`. `client/src/app/api/trpc/[trpc]/route.ts` mounts it with the fetch adapter at `/api/trpc` (GET and POST). Errors are logged as `[tRPC] <path>: <message>`.
- **Transformer:** `superjson`, so `Date` values survive the round trip.
- **Context** (`server/_core/context.ts`): resolves the user from the session cookie and exposes `setCookie` and `clearCookie` helpers.
- **Client** (`client/src/lib/trpc.ts`, `ClientApp.tsx`): `createTRPCReact<AppRouter>` with `httpBatchLink`. If any query or mutation fails with the "Please login (10001)" error, the browser is sent to `/student` or `/admin`, depending on the current area.
- **Procedure tiers** (`server/_core/trpc.ts`): `publicProcedure`, `protectedProcedure`, `adminProcedure`, `marketingProcedure`, `superAdminProcedure`, `studentProcedure`. See [auth-and-roles.md](auth-and-roles.md).

Inputs are validated with Zod 4. The full procedure list is in [api.md](api.md).

## Uploads and media

Uploaded files are written to local disk under `UPLOAD_DIR` (default `client/public/uploads`; `/data/uploads` in Docker) and served by `client/src/app/uploads/[...path]/route.ts` at `PUBLIC_UPLOAD_URL` (default `/uploads`).

- **Writes** go through `server/storage.ts`. `storagePut` and `storagePutNamed` sanitise the key, refuse path traversal, and keep readable file names.
- **Images** are recompressed with `sharp` (`server/imageOptimizer.ts`). The original format and any animation are kept. Files under 1 KB or over 25 MB, high-bit-depth images, and any result that would be larger than the original are stored unchanged.
- **Folders:** `images/`, `branding/`, `resources/`, `mock-audio/`, `speaking/` (student recordings), `avatars/`, `payment-screenshots/`, plus `videos/` and `documents/` for the media library.
- **Access:** `payment-screenshots/*` is served only to admin-dashboard roles. Everything else is public to anyone who has the URL.
- **Next image optimizer:** only `/uploads/images/**`, `/uploads/branding/**` and root files may pass through it (`next.config.ts` `images.localPatterns`, kept in sync with `OPTIMIZABLE` in `client/src/lib/image.ts`). The optimizer caches responses regardless of who requested them, so private files must never go through it.
- **Media library** (`server/media.ts`): lists files on disk, marks which ones are referenced by database rows, and deletes unused files.

Uploads arrive as base64 strings in tRPC mutations. Size limits are enforced server-side: images 10 MB, test audio 60 MB, speaking recordings 15 MB.

Uploads live on the local filesystem, so the app needs **persistent storage** and should run as **one instance**, unless every instance shares the same upload volume.

## Styling

Tailwind CSS 4 (`client/src/index.css`, `@tailwindcss/postcss`) with shadcn/Radix components in `components/ui`. The admin area applies a runtime theme (colours and dark mode) from **Settings → Appearance**, saved per browser in `localStorage`, by setting CSS variables on `<body class="admin-theme">`. The v2 public site uses its own font and primitives in `components/home-v2`.
