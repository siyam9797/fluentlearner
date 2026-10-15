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

Migration `0021_marketing_role.sql` adds the Marketing role. Apply it before creating a Marketing account. Super Admin and Admin can then assign the role under **Admin → Users**. Marketing accounts can access **Admin → Settings → Marketing** and their own profile; other admin APIs remain restricted.

## Local access

After starting the development server with `npm run dev` (port 3001), use these local entry points:

| Area            | URL                              | Access                                                               |
| --------------- | -------------------------------- | -------------------------------------------------------------------- |
| Public website  | `http://localhost:3001`          | No login required                                                    |
| Course catalog  | `http://localhost:3001/courses`  | No login required                                                    |
| Enrollment form | `http://localhost:3001/enroll`   | No login required                                                    |
| v2 website      | `http://localhost:3001/home-2`   | Redesign preview (`/v2/*` pages), runs beside the current site       |
| Student portal  | `http://localhost:3001/student`  | Use the local student credentials below                              |
| Admin dashboard | `http://localhost:3001/admin`    | Use the local administrator credentials below                        |
| tRPC API        | `http://localhost:3001/api/trpc` | Application endpoint; individual procedures are called by the client |

### Local administrator

- Email: `admin@localhost.test`
- Password: `admin12345`

The development-only administrator works without running `npm run seed:admin`. Override its details in `.env` with `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, and `LOCAL_ADMIN_NAME`. This fallback is always disabled when `NODE_ENV=production`.

### Local student

Run `npm run seed:student`, then sign in at `http://localhost:3001/student` with:

- Email: `student@localhost.test`
- Password: `student12345`

Override these defaults in `.env` with `STUDENT_EMAIL`, `STUDENT_PASSWORD`, `STUDENT_NAME`, and `STUDENT_TARGET_BAND`. The command safely creates the account or updates the existing account with the same email.

### Database-backed accounts

`npm run seed:admin` creates or updates the administrator defined by `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_ROLE` in `.env`. Use `ADMIN_ROLE=super_admin` for the initial owner. Additional accounts can be created from **Admin → Users**. Database-backed accounts use the `/admin` or `/student` login screen according to their role.

## Production

### Meta ad tracking

Manage Meta tracking in **Admin → Settings → Marketing**. You can turn the browser Pixel and server Conversions API on or off independently, change the Dataset ID, replace or remove the private access token, and set or clear a test event code. The default Dataset ID is `1664861398363916`. Public pages send browser and/or server `PageView` events while enabled. A `Purchase` event is sent from the browser and/or server only after an online payment is confirmed. Browser and server copies use the same event ID so Meta can deduplicate them. The server sends the paid amount in BDT and hashed customer email and phone number for purchases.

The token can be entered in Marketing settings. `META_CAPI_ACCESS_TOKEN` in the private runtime environment (`app.production.env` for Compose) is a fallback until a token is saved or removed in Settings. `META_TEST_EVENT_CODE` is an optional fallback for testing. Clear the test code in Settings before using the production site. Never put the access token in a `NEXT_PUBLIC_` variable or commit it. Reload public pages after changing settings.

The production deployment needs a writable MySQL database, a persistent upload volume, a public HTTPS domain, and a Node.js 22 host. Set `DATABASE_URL`, a long random `JWT_SECRET`, `PUBLIC_SITE_URL` (for example `https://example.com`), `UPLOAD_DIR`, and `PUBLIC_UPLOAD_URL=/uploads` as runtime environment variables. Never deploy the local `.env` file or its demo passwords.

Apply `server/database/0000_*.sql` through the latest numbered SQL file in order to a **new** database. For an existing database, apply only migrations that have not already run. Back up the database first. The SQL migrations have been applied manually in the past; `npm run db:push` is **not** a safe production upgrade path. Create the initial Super Admin once with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_ROLE=super_admin`, and `npm run seed:admin` from a trusted environment that can reach the production database. The seed command updates the password on every run, so do not run it on each deployment. Remove the seed credentials from the running app after the account is created.

### Docker deployment

Build with `docker build -t fluentlearner .`. Run the image with the required environment variables and mount persistent storage at `/data/uploads` (the image sets `UPLOAD_DIR=/data/uploads`). For example, after providing `DATABASE_URL`, `JWT_SECRET`, and `PUBLIC_SITE_URL` through your deployment platform's secret manager:

```sh
docker run -d --name fluentlearner -p 3000:3000 \
  --env-file production.env \
  --mount type=volume,src=fluentlearner-uploads,dst=/data/uploads \
  fluentlearner
```

The `production.env` file must be kept private and contain the required runtime variables. Terminate TLS at a reverse proxy, point the domain to the service, and route all paths to port 3000. Check `GET /api/health` for database connectivity. Uploaded files are served at `/uploads/*` from the mounted volume. Back up both MySQL and the upload volume. Run one app instance unless all instances share the same upload storage; the local filesystem is unsuitable for ephemeral serverless hosting.

Without Docker, run `npm ci`, `npm run check`, `npm test`, `npm run build`, then `npm start` with the same runtime variables. `next start` runs from the project tree; the Docker image uses the smaller standalone server bundle.

### Deploy from GitHub to a VPS

`compose.production.yml` runs the app, MySQL 8.4, and Caddy on one VPS. MySQL data, uploads, and TLS certificates use Docker volumes. The MySQL image prepares the numbered Drizzle SQL files for a fresh database import. Caddy obtains and renews HTTPS certificates when the domain points to the VPS and ports 80 and 443 are reachable. The app and database are not published directly to the internet.

1. Install Docker Engine with the Compose plugin on the VPS. Point your domain's DNS A record at the VPS and allow inbound TCP ports 80 and 443.
2. Clone the repository: `git clone https://github.com/siyam9797/fluentlearner.git && cd fluentlearner`.
3. Run `cp .env.production.example .env.production` and `cp app.production.env.example app.production.env`. Replace every placeholder. Set `SITE_DOMAIN` to the bare domain and `PUBLIC_SITE_URL` to its `https://` URL. Use the same `MYSQL_PASSWORD` inside `DATABASE_URL`; hex passwords avoid URL encoding problems. Generate independent random passwords and a JWT secret with `openssl rand -hex 32`. Keep both files private with `chmod 600 .env.production app.production.env`.
4. Start the stack: `docker compose --env-file .env.production -f compose.production.yml up -d --build`. On a **new** MySQL volume, the numbered SQL files run once in order. They do not rerun on later starts.
5. Check `docker compose --env-file .env.production -f compose.production.yml ps` and `curl -fsS https://<your-domain>/api/health`. If the health check fails, inspect `docker compose --env-file .env.production -f compose.production.yml logs --tail=100 db app caddy`.
6. Seed the first Super Admin once. Export `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the VPS shell, then run `docker compose --env-file .env.production -f compose.production.yml run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_ROLE=super_admin app node server/scripts/seed-admin.mjs`. Unset both shell variables afterward. Sign in at `https://<your-domain>/admin`.

For later releases, run `git pull --ff-only origin main` on the VPS, apply any new numbered SQL migrations to MySQL after a backup, then run the same `docker compose ... up -d --build` command. Back up the MySQL database and the `uploads_data` volume separately. Do not run `docker compose down -v` on production: `-v` deletes the data volumes.

### Production access

| Access | Where | Requirement |
| --- | --- | --- |
| Public website, courses, enrollment | `https://<your-domain>/`, `/courses`, `/enroll` | No account |
| Student portal | `https://<your-domain>/student` | Database-backed student account |
| Admin dashboard | `https://<your-domain>/admin` | Database-backed Admin or Super Admin account |
| Health check | `https://<your-domain>/api/health` | No account; returns 503 if MySQL is unavailable |
| Application API | `https://<your-domain>/api/trpc` | Procedure-specific access controls |

The local `admin@localhost.test` login is disabled with `NODE_ENV=production`. There is no default production password. The Super Admin password is the one you set during the one-time seed. Production operations also need access to the DNS/TLS provider, the app host, the MySQL database, and the persistent upload volume. Payment gateways, the notification webhook, Maps, and AI grading need their own credentials only when those features are enabled.

The Google Maps key and notification webhook are optional. The application works without either integration.

### Optional integrations

| Feature                              | Environment variables                                                                                        | Without it                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| bKash online payment on `/enroll` | `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `PUBLIC_SITE_URL` | The enroll page offers WhatsApp enrollment instead |
| SSLCommerz online payment | `SSLCOMMERZ_MODE=live`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `PUBLIC_SITE_URL` (or configure the store in Admin → Settings) | Other payment methods remain available |
| AI marking of Writing & Speaking     | `ANTHROPIC_API_KEY` (pay-as-you-go key from console.anthropic.com)                                           | Attempts wait for mentor marking                   |

Use the bKash sandbox base URL (`https://tokenized.sandbox.bka.sh/v1.2.0-beta`) while developing and the live one (`https://tokenized.pay.bka.sh/v1.2.0-beta`) in production.
