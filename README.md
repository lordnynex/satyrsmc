# Satyrs MC

Monorepo: API (Express + tRPC), public website, and member portal/admin app.

## Structure

- **packages/api** — Express + tRPC server. Database, services, `website` router (public), `admin` + `members` routers (protected). Deployed as a Netlify Function.
- **packages/app-public** — Public React app. Base path `/`. Uses `trpc.website.*` only.
- **packages/app-members** — Member portal and admin React app. Deployed to `members.satyrsmc.org`. Uses full tRPC client.
- **packages/shared** — Zod DTO schemas, derived TypeScript types, and domain enums shared across all packages.

## Install

```bash
pnpm install
```

## Build

Build both frontends for production:

```bash
pnpm build
```

Build the API Netlify Function:

```bash
pnpm --filter @satyrsmc/api build:function
```

## Run (Local Development)

Start each service in a separate terminal:

```bash
pnpm --filter @satyrsmc/api dev         # API on http://localhost:4000
pnpm --filter @satyrsmc/app-public dev  # app-public on http://localhost:3000
pnpm --filter @satyrsmc/app-members dev # app-members on http://localhost:3001
```

The API requires a running Postgres instance (`DATABASE_URL` in `.env`). Vite dev servers proxy `/trpc` and `/api` to the API automatically.

## Migrations

Migrations live in `packages/api/src/db/migrations/` and run automatically on API server startup. To run them manually:

```bash
pnpm --filter @satyrsmc/api migrate
```

## Scripts

- `pnpm --filter @satyrsmc/api dev` — start API dev server (port 4000)
- `pnpm --filter @satyrsmc/app-public dev` — start app-public Vite dev server (port 3000)
- `pnpm --filter @satyrsmc/app-members dev` — start app-members Vite dev server (port 3001)
- `pnpm build` — build app-public and app-members
- `pnpm test` — run all tests
- `pnpm typecheck` — type-check all packages
- `pnpm lint` — lint all packages
- `pnpm --filter @satyrsmc/api migrate` — run DB migrations
- `pnpm --filter @satyrsmc/api seed` — seed sample users for manual testing
- `pnpm --filter @satyrsmc/api build:function` — bundle API as Netlify Function
