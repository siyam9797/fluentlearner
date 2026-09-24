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
3. Apply database migrations with `npm run db:push`.
4. Create the first administrator with `npm run seed:admin`.
5. Start development with `npm run dev`.

To populate every data-driven dashboard section with at least five local demo records, run `npm run seed:demo`. The command is safe to rerun and does not duplicate its demo records.

## Local administrator login

In development, open `http://localhost:3000/admin` and use:

- Email: `admin@localhost.test`
- Password: `admin12345`

You can override these with `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, and `LOCAL_ADMIN_NAME`. This fallback is always disabled when `NODE_ENV=production`; production uses the database-backed administrator created by `npm run seed:admin`.

## Production

Run `npm run build` and `npm start`. The Next.js config produces a standalone server bundle. User uploads are written to `UPLOAD_DIR`; mount that directory on persistent storage in production.

The Google Maps key and notification webhook are optional. The application works without either integration.
