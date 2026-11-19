# Development

## Requirements

- Node.js 22 (the Docker image uses `node:22-bookworm-slim`) and npm 11
- MySQL 8.x

## First-time setup

1. `cp .env.example .env`, then set `DATABASE_URL` and `JWT_SECRET`. `next.config.ts` and the seed scripts both read the root `.env`.
2. `npm install`
3. Create an empty database and apply every `server/database/NNNN_*.sql` file **in number order**:
   ```sh
   for f in server/database/0*.sql; do mysql fluentlearner < "$f"; done
   ```
   The files contain `--> statement-breakpoint` comment lines. MySQL ignores them as comments. Don't use `npm run db:push`. See [database.md](database.md#migrations).
4. Optional data:
   - `npm run seed:student` for a local student login
   - `npm run seed:demo` for at least five demo rows in every dashboard section (safe to rerun)
   - `npm run sync:live` for a copy of the live site's public content
5. `npm run dev`, then open http://localhost:3001.

The app starts without a database, but every data-driven page then shows defaults or errors.

## Local accounts

| Account           | How                                                    | Credentials                                                                                                                          |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Dev administrator | Built in, no DB row needed; **disabled in production** | `admin@localhost.test` / `admin12345` (override with `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, `LOCAL_ADMIN_NAME`)                |
| Local student     | `npm run seed:student`                                 | `student@localhost.test` / `student12345` (override with `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `STUDENT_NAME`, `STUDENT_TARGET_BAND`) |
| DB administrator  | `npm run seed:admin`                                   | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_ROLE` from `.env`                                                              |

The dev administrator acts as Super Admin. The first time it opens the student area, a real `app_users` row with the same email is created for it, so its attempts and profile can be saved.

Both seed scripts create the account, or update it (password included) when one with that email already exists.

## Environment variables

| Variable                                                                                  | Required        | Purpose                                                                                                                                    |
| ----------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                            | yes             | `mysql://user:pass@host:3306/db`                                                                                                           |
| `JWT_SECRET`                                                                              | yes in prod     | Signs session cookies. Use at least 32 characters (the Docker entrypoint enforces this). In dev a built-in fallback is used if it is unset |
| `PUBLIC_SITE_URL`                                                                         | yes in prod     | Public `https://` origin, used for payment return URLs, the sitemap, and the Meta origin check                                             |
| `UPLOAD_DIR`                                                                              | no              | Where uploads are written (default `client/public/uploads`)                                                                                |
| `PUBLIC_UPLOAD_URL`                                                                       | no              | URL prefix for uploads (default `/uploads`)                                                                                                |
| `ADMIN_*`, `STUDENT_*`, `LOCAL_ADMIN_*`                                                   | seed / dev only | See above. Remove the `ADMIN_*` values from the running app once the first account exists                                                  |
| `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET` | optional        | bKash Tokenized Checkout. Can also be saved in Admin → Settings → Online payment                                                           |
| `SSLCOMMERZ_MODE`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`                     | optional        | SSLCommerz. Can also be saved in Settings                                                                                                  |
| `META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`                                          | optional        | Fallbacks for the Meta settings. **Never** put them in a `NEXT_PUBLIC_` variable                                                           |
| `ANTHROPIC_API_KEY`                                                                       | optional        | AI marking. A key saved in Settings takes priority                                                                                         |
| `NOTIFICATION_WEBHOOK_URL`                                                                | optional        | POST `{title, content}` to this URL when a payment completes                                                                               |

Credentials saved in **Admin → Settings** live in `site_settings` and override the matching environment variables. See [integrations.md](integrations.md) and [payments.md](payments.md).

## Seed scripts

All scripts are plain Node ESM in `server/scripts/` and read `.env`.

| Command                   | Effect                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seed:admin`              | Create or update the administrator from `ADMIN_*`. **Resets the password on every run**                                                                                                                                                                                                           |
| `seed:student`            | Create or update the local student                                                                                                                                                                                                                                                                |
| `seed:courses`            | Demo courses and success stories                                                                                                                                                                                                                                                                  |
| `seed:demo`               | At least 5 records per dashboard section. Matched by stable names or transaction IDs, so it is safe to rerun                                                                                                                                                                                      |
| `seed:mocks`              | Published starter content for the student Practice and Mock Test libraries                                                                                                                                                                                                                        |
| `seed:complete-listening` | One complete, original 4-part, 40-question Listening mock                                                                                                                                                                                                                                         |
| `seed:cambridge`          | Unpublished templates for Cambridge IELTS 1–21 × Tests 1–4 × 4 modules: structure and empty answer fields only. Licensed questions, audio and keys must be added by an admin before publishing                                                                                                    |
| `seed:type-practice`      | "Practice by question type" sets for Reading, Writing and Speaking. Existing sets are left untouched                                                                                                                                                                                              |
| `seed:vocabulary`         | **Replaces all** vocabulary words with the listening vocabulary list (data in `scripts/data/`)                                                                                                                                                                                                    |
| `sync:live`               | Pulls courses, stories, batches, payment methods and site settings from `LIVE_URL` (default `https://fluentlearner.com`), downloads their `/uploads/` images, and **overwrites** those local tables. A JSON backup is written to `.local-backups/` first. Users and enrollments are never touched |

## Shipping a change

Run `npm run check && npm test && npm run build`, push to `main`, then on the server run `git pull --ff-only origin main && npm run deploy`. The full checklist, including database migrations and rollback, is in [deployment.md](deployment.md#releasing-a-change).

## Tests and checks

```sh
npm run check   # next typegen client && tsc --noEmit
npm test        # vitest run
```

Tests live in `server/*.test.ts` and run in a Node environment. Most of them call `appRouter.createCaller(ctx)` with a fake context, and some mock `./db`. The tests in `enrollment.test.ts` marked `databaseIt` run only when `DATABASE_URL` is set and are skipped otherwise.

| File                                                       | Covers                                                                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `auth.logout.test.ts`                                      | Logout clears the cookie                                                                                  |
| `changePassword.test.ts`                                   | Every role can change its own password; wrong, short or unchanged passwords and the dev login are refused |
| `courses.test.ts`, `enrollment.test.ts`                    | Public vs admin access to courses, stories, batches, payment methods, enrollments                         |
| `mockScoring.test.ts`                                      | Answer normalisation, multi-select marking, raw score → band, IELTS rounding, answer-key parser           |
| `imageOptimizer.test.ts`                                   | JPEG/PNG recompression keeps format and quality                                                           |
| `marketingRole.test.ts`, `userCreationPermissions.test.ts` | Role permission rules                                                                                     |
| `metaConversions.test.ts`                                  | Meta CAPI payloads and settings fallbacks                                                                 |
| `siteSettings.test.ts`                                     | Secrets never appear in public settings                                                                   |

## Conventions

- **Formatting:** Prettier (`.prettierrc`), run with `npm run format`.
- **Validation:** every tRPC input is a Zod schema. Shared IELTS rules go in `shared/mock.ts` so the server (marking) and the client (builder, previews) agree.
- **Comments** explain _why_. Many modules start with a block comment describing their contract, e.g. `server/payments.ts` and `server/aiGrading.ts`. Read it before changing the module.
- **IELTS screens must look like the real exam.** The student test screens and the admin builders deliberately mirror the computer-delivered IELTS layout. Keep that fidelity when changing them.
- **Secrets** (payment credentials, API keys, Meta token) are `site_settings` rows. Add any new secret key to `SECRET_SETTING_KEYS` in `server/publicSiteSettings.ts`, or it will leak through `siteSettings.getAll`.
