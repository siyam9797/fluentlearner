# Deployment

## Requirements

- Node.js 22 host, or Docker
- A writable MySQL 8 database
- **Persistent storage for uploads.** Files live on the local filesystem, so ephemeral or serverless hosting is unsuitable. Run **one app instance**, unless all instances share the same upload volume
- A public HTTPS domain, with TLS terminated at a reverse proxy

### Runtime environment

| Variable                          | Notes                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Required                                                                   |
| `JWT_SECRET`                      | Required. At least 32 random characters (`openssl rand -hex 32`)           |
| `PUBLIC_SITE_URL`                 | Required. Must start with `https://` (the Docker entrypoint enforces this) |
| `UPLOAD_DIR`, `PUBLIC_UPLOAD_URL` | The Docker image sets `/data/uploads` and `/uploads`                       |
| Integrations                      | Optional. See [integrations.md](integrations.md)                           |

Never deploy the local `.env` or its demo passwords. The dev administrator login is disabled automatically when `NODE_ENV=production`. There is no default production password.

## Docker image

`Dockerfile` is a two-stage build on `node:22-bookworm-slim`. It runs `npm ci && npm run build`, then copies only the Next standalone server (`client/.next/standalone`), static assets, `client/public`, and `seed-admin.mjs` with `dotenv`. It runs as the `node` user on port 3000. `docker-entrypoint.sh` checks the required variables, then runs `node client/server.js`.

```sh
docker build -t fluentlearner .
docker run -d --name fluentlearner -p 3000:3000 \
  --env-file production.env \
  --mount type=volume,src=fluentlearner-uploads,dst=/data/uploads \
  fluentlearner
```

Keep `production.env` private. Route all paths from your proxy to port 3000.

**Without Docker:** run `npm ci && npm run check && npm test && npm run build && npm start` with the same variables. `next start` runs from the project tree.

## VPS with Docker Compose (recommended)

`compose.production.yml` runs three services:

| Service | Image                          | Notes                                                                                                                                        |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `db`    | `Dockerfile.mysql` (MySQL 8.4) | Copies `server/database/*.sql` into `docker-entrypoint-initdb.d`, so on a **new** volume every migration runs once, in order. Health-checked |
| `app`   | `Dockerfile`                   | `env_file: app.production.env`. Starts after `db` is healthy. Uploads go to the `uploads_data` volume                                        |
| `caddy` | `caddy:2`                      | Ports 80 and 443. Automatic HTTPS for `SITE_DOMAIN` (`Caddyfile`: gzip/zstd, `reverse_proxy app:3000`)                                       |

Volumes: `mysql_data`, `uploads_data`, `caddy_data`, `caddy_config`. The app and the database are not exposed to the internet directly.

### First deploy

1. Install Docker Engine with the Compose plugin. Point the domain's DNS A record at the VPS, and open TCP 80 and 443.
2. `git clone https://github.com/siyam9797/fluentlearner.git && cd fluentlearner`
3. Create the two private env files and replace every placeholder:
   ```sh
   cp .env.production.example .env.production       # SITE_DOMAIN, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD
   cp app.production.env.example app.production.env # DATABASE_URL (same MYSQL_PASSWORD, host "db"), JWT_SECRET, PUBLIC_SITE_URL
   chmod 600 .env.production app.production.env
   ```
   Hex passwords avoid URL-encoding problems in `DATABASE_URL`.
4. Start the stack:
   ```sh
   docker compose --env-file .env.production -f compose.production.yml up -d --build
   ```
5. Check it:
   ```sh
   docker compose --env-file .env.production -f compose.production.yml ps
   curl -fsS https://<your-domain>/api/health
   docker compose --env-file .env.production -f compose.production.yml logs --tail=100 db app caddy
   ```
6. Seed the first Super Admin **once**:
   ```sh
   export ADMIN_EMAIL=… ADMIN_PASSWORD=…
   docker compose --env-file .env.production -f compose.production.yml run --rm \
     -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_ROLE=super_admin app node server/scripts/seed-admin.mjs
   unset ADMIN_EMAIL ADMIN_PASSWORD
   ```
   `seed-admin` resets the password every time it runs, so don't run it on each deploy. Then sign in at `https://<your-domain>/admin` and create the other accounts under **Admin → Users**.

### Releases

1. **Back up** MySQL and the `uploads_data` volume.
2. `git pull --ff-only origin main`
3. Apply any **new** numbered SQL migrations by hand, e.g.
   ```sh
   docker compose --env-file .env.production -f compose.production.yml exec -T db \
     sh -c 'mysql -ufluentlearner -p"$MYSQL_PASSWORD" fluentlearner' < server/database/00NN_name.sql
   ```
   The init scripts run only on an empty volume, and `npm run db:push` is **not** a safe upgrade path (see [database.md](database.md#migrations)).
4. `docker compose --env-file .env.production -f compose.production.yml up -d --build`

**Never run `docker compose down -v` on production.** `-v` deletes the data volumes.

## After deploying

| Check          | Where                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Health         | `GET /api/health` returns 200, or 503 if MySQL is unavailable                                                   |
| Public site    | `/`, `/courses`, `/enroll`                                                                                      |
| Student portal | `/student` with a database-backed student account                                                               |
| Admin          | `/admin` with a database-backed dashboard-role account                                                          |
| Payments       | Switch the gateways to **live** in Admin → Settings → Online payment. `PUBLIC_SITE_URL` must be the real domain |
| Meta           | Clear the **test event code** in Admin → Settings → Marketing before real traffic                               |

## Backups

Back up **both** the MySQL database and the uploads volume, separately. Uploads hold course images, test audio, student recordings, payment screenshots and resources, and none of them are in the database.
