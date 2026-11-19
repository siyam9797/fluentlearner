# FluentLearner

FluentLearner is the website and learning platform for an IELTS coaching school in Bangladesh. One Next.js application serves:

- **Public website.** Courses, success stories, about, contact and online enrollment with bKash or SSLCommerz payment.
- **Student portal** (`/student`). IELTS Listening, Reading, Writing and Speaking tests in exam or practice mode, results, batch resources, vocabulary and typing practice.
- **Admin dashboard** (`/admin`). Courses, batches, enrollments, users and roles, the IELTS test builder and marking, website content, media, payments, Meta tracking and AI marking settings.

Stack: Next.js 16 (App Router) · React 19 · tRPC 11 · TanStack Query · Drizzle ORM · MySQL 8 · Tailwind CSS 4 · Claude (AI marking) · Vitest.

## Quick start

```sh
cp .env.example .env          # set DATABASE_URL (MySQL) and JWT_SECRET
npm install
# apply server/database/0000_*.sql … latest, in order, to an empty database
npm run seed:student          # optional: local student account
npm run dev                   # http://localhost:3001
```

| Area            | Local URL                     | Sign in                                   |
| --------------- | ----------------------------- | ----------------------------------------- |
| Public website  | http://localhost:3001         | none                                      |
| Student portal  | http://localhost:3001/student | `student@localhost.test` / `student12345` |
| Admin dashboard | http://localhost:3001/admin   | `admin@localhost.test` / `admin12345`     |

The admin login above is a development-only fallback. It needs no database row and is always disabled when `NODE_ENV=production`. See [docs/development.md](docs/development.md).

> **Never run `npm run db:push` on an existing database.** Migrations are applied by hand. See [docs/database.md](docs/database.md#migrations).

## Common commands

| Command             | What it does                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Dev server on port 3001                                                                                                               |
| `npm run check`     | Generate Next route types and type-check (`tsc`)                                                                                      |
| `npm test`          | Run the Vitest suite (`server/**/*.test.ts`)                                                                                          |
| `npm run build`     | Production build (standalone output)                                                                                                  |
| `npm start`         | Serve the production build                                                                                                            |
| `npm run format`    | Prettier                                                                                                                              |
| `npm run seed:*`    | Seed data. See [docs/development.md](docs/development.md#seed-scripts)                                                                |
| `npm run sync:live` | Copy public content from the live site into the local DB                                                                              |
| `npm run deploy`    | **On the server:** back up, build, restart `fluentlearner`, health-check, auto-rollback. See [docs/deployment.md](docs/deployment.md) |
| `npm run rollback`  | **On the server:** put the previous build back                                                                                        |

## Documentation

| Doc                                        | Covers                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [Architecture](docs/architecture.md)       | Repo layout, request flow, routing, tRPC, server-rendered data, uploads                                               |
| [Development](docs/development.md)         | Setup, environment variables, local accounts, seed scripts, tests, conventions                                        |
| [Database](docs/database.md)               | Tables, relationships, settings store, manual migrations                                                              |
| [Auth & roles](docs/auth-and-roles.md)     | Sessions, the six roles, procedure tiers, what each role can actually do                                              |
| [Public website](docs/public-website.md)   | v2 pages, editable content, menus, SEO                                                        |
| [Student portal](docs/student-portal.md)   | Dashboard sections, taking tests, results                                                                             |
| [IELTS tests](docs/ielts-tests.md)         | Test model, question types, the builder, marking and band scores, AI marking                                          |
| [Admin dashboard](docs/admin-dashboard.md) | Every admin screen and what it manages                                                                                |
| [Enrollment & payments](docs/payments.md)  | Online checkout with bKash and SSLCommerz, account creation, manual verification                                      |
| [Integrations](docs/integrations.md)       | Meta Pixel and Conversions API, Anthropic, notification webhook, Google Maps                                          |
| [API reference](docs/api.md)               | Every tRPC procedure and HTTP route, with its access level                                                            |
| [Deployment](docs/deployment.md)           | **Releasing to fluentlearner.com** (PM2 on the VPS, `npm run deploy`, rollback), new-server setup, Docker alternative |

## License

MIT
