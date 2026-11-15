# Deployment

## Production at a glance

| What                     | Value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Site                     | https://fluentlearner.com                                                                |
| Server                   | Hostinger KVM 2 VPS, Ubuntu (`ssh root@<vps-ip>`)                                        |
| App folder               | `/var/www/fluentlearner/app` (a git checkout of `main`)                                  |
| Process manager          | **PM2**, app name **`fluentlearner`**                                                    |
| Other PM2 app on the box | `fluentlearner-sales`. **Never restart it by accident; never run `pm2 restart all`**     |
| What PM2 runs            | `client/.next/standalone/client/server.cjs`, cwd `/var/www/fluentlearner/app`, port 3000 |
| Settings                 | `/var/www/fluentlearner/app/.env` (`DATABASE_URL`, `JWT_SECRET`, `PUBLIC_SITE_URL`, …)   |
| Database                 | MySQL on the same server, `localhost`; user and database both `fluentlearner`            |
| Backups                  | `~/backups/` (database dumps `db-*.sql`, previous build `standalone-prev/`)              |

Docker is **not** installed on this server. The Docker / Compose setup at the end of this page is an alternative for a new server.

## Releasing a change

### On your computer

1. Make the change and run the checks:
   ```sh
   npm run check && npm test && npm run build
   ```
2. If the change needs a **database change**, write the numbered SQL file (see [database.md](database.md#migrations)). It must be applied on the server **before** the new code goes live (step 2 below).
3. Commit and push to `main`:
   ```sh
   git push origin main
   ```

### On the server

```sh
ssh root@<vps-ip>
cd /var/www/fluentlearner/app
git pull --ff-only origin main
```

**1. Only if this release adds a migration**, apply it now. The deploy script backs up the database, but make a manual dump first when the change is risky:

```sh
mysql -h localhost -u fluentlearner -p fluentlearner < server/database/00NN_name.sql
```

The password is in `DATABASE_URL` in `.env`, the part between `fluentlearner:` and `@`.

**2. Deploy:**

```sh
npm run deploy
```

`scripts/deploy.sh` does the whole release and stops at the first error:

| Step | What happens                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Copies the running build to `~/backups/standalone-prev` and dumps the database to `~/backups/db-<date>.sql`. The 10 newest dumps are kept |
| 2    | `npm ci` and `npm run build`. If the build fails, the site keeps running the old version                                                  |
| 3    | Prepares the standalone folder: `server.js` → `server.cjs`, copies `.next/static` and `public/` (never `public/uploads`)                  |
| 4    | `pm2 restart fluentlearner` (only that app)                                                                                               |
| 5    | Waits for `http://127.0.0.1:3000/api/health`. **If it fails, the previous build is restored and restarted automatically**                 |

It ends with `✓ Deployed <commit>` when everything worked.

**3. Check in the browser:** the home page, a course page, and sign-in at `/admin`. Then check whatever the release changed.

### If something is wrong after a deploy

```sh
cd /var/www/fluentlearner/app && npm run rollback
```

This puts back the build that was running before the last deploy, in seconds. It does **not** touch the database. If a release changed data and you need the old data, restore the dump taken just before it:

```sh
mysql -h localhost -u fluentlearner -p fluentlearner < ~/backups/db-<date>.sql
```

### Useful commands on the server

| Task                             | Command                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Is the app running?              | `pm2 ls`                                                                                                                                 |
| Recent logs                      | `pm2 logs fluentlearner --lines 50 --nostream`                                                                                           |
| Clear old log lines              | `pm2 flush fluentlearner`                                                                                                                |
| Health check                     | `curl -fsS https://fluentlearner.com/api/health` → `{"ok":true}`                                                                         |
| Which version is live?           | `git log --oneline -1`                                                                                                                   |
| Deploy without the database dump | `SKIP_DB_BACKUP=1 npm run deploy`                                                                                                        |
| Make or reset a Super Admin      | `ADMIN_EMAIL=… ADMIN_PASSWORD='…' ADMIN_ROLE=super_admin npm run seed:admin` (keep the single quotes; it resets that account's password) |

### Things to know

- **Server-side edits get in the way.** Don't edit files in `/var/www/fluentlearner/app` by hand. If `git pull` refuses because of local changes, check them with `git status` and `git diff`, then `git stash` (it can be undone) and pull again.
- **"9 vulnerabilities" from `npm ci`** come from development-only tools (tests, migrations) that never run on the live site. Check the live packages with `npm audit --omit=dev`. **Never run `npm audit fix --force`:** it makes breaking upgrades.
- **Uploads** live in `UPLOAD_DIR` (default `client/public/uploads`) and are served by the app's `/uploads/*` route, which keeps payment screenshots admin-only. They survive deploys. Back them up separately: `tar czf ~/backups/uploads-$(date +%F).tgz client/public/uploads` (or your `UPLOAD_DIR`).
- **Link previews** (WhatsApp, Facebook) are cached by those apps. After changing a course image, use Facebook's Sharing Debugger → **Scrape Again**; WhatsApp needs a fresh share.
- **Node version:** the server runs Node 24, and the project supports Node 22 or newer.

## Setting up a new server (PM2)

1. Install Node 22+, MySQL 8, PM2 (`npm i -g pm2`), and a reverse proxy with HTTPS (Nginx + Certbot, or Caddy) that forwards to `127.0.0.1:3000`.
2. `git clone` the repository into the app folder, and create `.env` with at least:
   ```sh
   NODE_ENV=production
   DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DBNAME   # letters and digits only in the password, or URL-encode it
   JWT_SECRET=<openssl rand -hex 32>
   PUBLIC_SITE_URL=https://your-domain
   ```
3. Create the database and apply every `server/database/0*.sql` in order: `for f in server/database/0*.sql; do mysql -u USER -p DBNAME < "$f"; done`.
4. Build once and start it under PM2:
   ```sh
   SKIP_DB_BACKUP=1 npm run deploy   # builds; the restart step fails the first time because the PM2 app doesn't exist yet
   pm2 start client/.next/standalone/client/server.cjs --name fluentlearner --cwd "$PWD"
   pm2 save && pm2 startup           # start again after a reboot
   ```
5. Create the first Super Admin with `npm run seed:admin` (see the table above), then sign in at `/admin`.

## Alternative: Docker Compose

For a fresh server with Docker. Not used on the current server.

`compose.production.yml` runs MySQL 8.4 (`Dockerfile.mysql`, which applies every numbered SQL file on a **new** volume), the app (`Dockerfile`, a standalone build running as `node` on port 3000, uploads on the `uploads_data` volume), and Caddy for automatic HTTPS (`Caddyfile`).

```sh
cp .env.production.example .env.production        # SITE_DOMAIN, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD
cp app.production.env.example app.production.env  # DATABASE_URL (host "db"), JWT_SECRET, PUBLIC_SITE_URL
chmod 600 .env.production app.production.env
docker compose --env-file .env.production -f compose.production.yml up -d --build
curl -fsS https://<domain>/api/health
docker compose --env-file .env.production -f compose.production.yml run --rm \
  -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_ROLE=super_admin app node server/scripts/seed-admin.mjs
```

To release: back up, `git pull`, apply any new SQL with `docker compose … exec -T db sh -c 'mysql -ufluentlearner -p"$MYSQL_PASSWORD" fluentlearner' < file.sql`, then `docker compose … up -d --build`. **Never run `docker compose down -v`:** it deletes the data volumes.
