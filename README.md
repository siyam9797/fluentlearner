# FluentLearner

A standalone Next.js application for the FluentLearner course and enrollment platform.

## Project structure

```text
client/
  public/             Static frontend assets
  src/app/            Next.js App Router and API adapter
  src/components/     Reusable frontend components
  src/screens/        Public and admin screens
  src/hooks/          Frontend hooks
  src/lib/            Frontend utilities and clients

server/
  _core/              Authentication, tRPC, and infrastructure
  database/           Drizzle schema and migrations
  scripts/            Database seed scripts
  db.ts               Database access layer
  routers.ts          Backend API procedures

shared/               Types and constants shared by both sides
```

## Setup

1. Copy `.env.example` to `.env` and fill in the database and JWT values.
2. Install packages with `npm install`.
3. Apply the SQL files in `server/database/` in number order (see **Database migrations** below).
4. Create the first administrator with `npm run seed:admin`.
5. Create the local student account with `npm run seed:student`.
6. Start development with `npm run dev`.

To populate every data-driven dashboard section with at least five local demo records, run `npm run seed:demo`. The command is safe to rerun and does not duplicate its demo records.

Optional content seeds:

- `npm run seed:vocabulary` — the listening vocabulary collection (replaces all vocabulary words).
- `npm run seed:type-practice` — starter "practice by question type" sets for Reading, Writing and Speaking (safe to rerun).

### Database migrations

Migrations `0009` onwards were applied by hand, so Drizzle's migration history is out of sync and **`npm run db:push` fails** on an existing database. Apply each new `server/database/NNNN_*.sql` file yourself (for example with `mysql < server/database/0014_ai_evaluation.sql`), locally and on production, and add its entry to `server/database/meta/_journal.json`.

## Local access

After starting the development server with `npm run dev`, use these local entry points:

| Area            | URL                              | Access                                                               |
| --------------- | -------------------------------- | -------------------------------------------------------------------- |
| Public website  | `http://localhost:3000`          | No login required                                                    |
| Course catalog  | `http://localhost:3000/courses`  | No login required                                                    |
| Enrollment form | `http://localhost:3000/enroll`   | No login required                                                    |
| v2 website      | `http://localhost:3000/home-2`   | Redesign preview (`/v2/*` pages), runs beside the current site       |
| Student portal  | `http://localhost:3000/student`  | Use the local student credentials below                              |
| Admin dashboard | `http://localhost:3000/admin`    | Use the local administrator credentials below                        |
| tRPC API        | `http://localhost:3000/api/trpc` | Application endpoint; individual procedures are called by the client |

### Local administrator

- Email: `admin@localhost.test`
- Password: `admin12345`

The development-only administrator works without running `npm run seed:admin`. Override its details in `.env` with `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, and `LOCAL_ADMIN_NAME`. This fallback is always disabled when `NODE_ENV=production`.

### Local student

Run `npm run seed:student`, then sign in at `http://localhost:3000/student` with:

- Email: `student@localhost.test`
- Password: `student12345`

Override these defaults in `.env` with `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `STUDENT_NAME`, and `STUDENT_TARGET_BAND`. The command safely creates the account or updates the existing account with the same email.

### Database-backed accounts

`npm run seed:admin` creates or updates the administrator defined by `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env`. Additional student accounts can be created from **Admin → Users**. Database-backed accounts use the `/admin` or `/student` login screen according to their role.

## Production

Run `npm run build` and `npm start`. The Next.js config produces a standalone server bundle. User uploads are written to `UPLOAD_DIR`; mount that directory on persistent storage in production.

The Google Maps key and notification webhook are optional. The application works without either integration.

### Optional integrations

| Feature                              | Environment variables                                                                                        | Without it                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| bKash online payment on `/v2/enroll` | `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `PUBLIC_SITE_URL` | The enroll page offers WhatsApp enrollment instead |
| AI marking of Writing & Speaking     | `ANTHROPIC_API_KEY` (pay-as-you-go key from console.anthropic.com)                                           | Attempts wait for mentor marking                   |

Use the bKash sandbox base URL (`https://tokenized.sandbox.bka.sh/v1.2.0-beta`) while developing and the live one (`https://tokenized.pay.bka.sh/v1.2.0-beta`) in production.
