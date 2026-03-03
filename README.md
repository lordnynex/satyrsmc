# Badger Budget

Monorepo: API (tRPC), public website, and admin app.

## Structure

- **packages/api** – tRPC server (Bun). Database, services, `website` router (public), `admin` router (protected). Serves tRPC at `/trpc`, static at `/` (app-public) and `/admin` (app-admin).
- **packages/app-public** – Public React app. Base path `/`. Uses `trpc.website.*` only. `src/pages/` for pages, `src/components/` for UI.
- **packages/app-admin** – Admin React app. Base path `/admin`. Uses full tRPC client. `src/pages/` for page components, `src/components/` for shared UI.

## Install

```bash
bun install
```

## Build

Build both frontends (required before running the server):

```bash
bun run build
```

Or build individually: `bun run build:public`, `bun run build:admin`.

## Run

```bash
bun run dev
```

Starts the API server on http://localhost:3000. Serves the public site at `/`, admin at `/admin`, and tRPC at `/trpc`.

Production:

```bash
bun run start
```

## Migrations

Migrations live in `packages/api/src/db/migrations/` and run automatically on API server startup. To run them manually:

```bash
bun run migrate
```

## Scripts

- `dev` – build then run API server
- `start` – run API server (production)
- `build` – build app-public and app-admin
- `migrate` – run DB migrations (from packages/api)
- `backfill-member-photos` – see scripts/
- `deduplicate-contact-addresses` – see scripts/
