# AGENTS.md — AI Agent Instructions for satyrsmc

Read and follow all conventions in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Overview

Satyrs Motorcycle Club management system and public website — a Bun monorepo with four packages.

## Architecture

- **Monorepo**: Bun workspaces (`packages/api`, `packages/app-admin`, `packages/app-public`, `packages/shared`)
- **API**: Bun.serve() + tRPC 11 — serves both SPAs and the API on port 3000
- **App-Admin**: React 19 + TanStack Query + tRPC — admin panel for club management and website CMS (served at `/admin`)
- **App-Public**: React 19 + tRPC — public website (served at `/`)
- **Shared**: Hand-written TypeScript interfaces shared across all packages
- **Database**: SQLite via TypeORM + sql.js (file: `data/badger.db`). Postgres migration planned.
- **Build**: `Bun.build()` for both SPAs (no Vite, no webpack)

## Key Commands

```bash
# Root
bun run dev              # Build frontends + start API with HMR
bun run build            # Build both SPAs
bun run start            # Start API (production)
bun run start:api-only   # Start API without static serving
bun run test             # Run API tests
bun run migrate          # Run TypeORM migrations
bun run storybook        # Storybook on :6006

# Build & Deploy
make build-static        # Build unified static site into dist/
make docker-api          # Build API Docker image
make docker-api-run      # Run API container on :3000
```

## Critical Rules

1. **Bun only** — never use Node.js, npm, Vite, Express, or dotenv. See [CONTRIBUTING.md](CONTRIBUTING.md) for full Bun conventions.

2. **No suppression comments** — never use `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`. Fix root causes.

3. **No `any`** — use proper types or `unknown` with type narrowing.

4. **Type-only imports** — use `import type { Foo }` for types. `verbatimModuleSyntax` is enabled.

5. **No `dangerouslySetInnerHTML`** — use the `SafeHtml` component with DOMPurify.

6. **No unsafe type casts** — never use `as never`, `as any`, or `as Record<string, unknown>` to bypass tRPC's inferred types.

## Type Safety Chain

Types flow from database to frontend. Every link must be explicitly typed:

```
TypeORM Entity → Service (returns @satyrsmc/shared type) → tRPC Router → AppRouter → createTRPCReact<AppRouter>() → Frontend
```

- **Services MUST annotate return types** with the shared interface (e.g., `entityToContact(e: ContactEntity): Contact`)
- **Shared types** in `@satyrsmc/shared/types/*` are the cross-package contract
- **Zod for tRPC inputs only** — all mutation inputs need Zod schemas, no `.passthrough()`
- **Import from canonical paths** — `@satyrsmc/shared/types/contact`, not via barrel re-exports from unrelated modules
- **Frontend hooks get types automatically** from `createTRPCReact<AppRouter>()` — don't re-annotate

See the "End-to-End Type Safety" section in [CONTRIBUTING.md](CONTRIBUTING.md) for the full pattern and examples.

## Shared Types

The `@satyrsmc/shared` package contains hand-written TypeScript interfaces. There are no auto-generated Zod schemas. Zod is used only for tRPC input validation in routers.

**Exports** (from `packages/shared/package.json`):
```
@satyrsmc/shared/types/contact    — Contact, ContactEmail, ContactPhone, ...
@satyrsmc/shared/types/member     — Member, MemberPosition, ...
@satyrsmc/shared/types/event      — Event, EventType, EventAttendee, Incident, ...
@satyrsmc/shared/types/meeting    — MeetingSummary, MeetingMotion, ...
@satyrsmc/shared/types/committee  — CommitteeSummary, CommitteeMember, ...
@satyrsmc/shared/types/document   — Document, DocumentVersion
@satyrsmc/shared/types/website    — SitePageResponse, SiteSettingsResponse, BlogPostResponse
@satyrsmc/shared/types/budget     — Budget-related types (re-exports)
@satyrsmc/shared/types/scenario   — Scenario types
@satyrsmc/shared/types/qrCode     — QrCode types
@satyrsmc/shared/lib/constants    — ALL_MEMBERS_ID constant
```

**Rules:**
1. Check `@satyrsmc/shared` first for existing types before defining new ones
2. When adding a new domain, create the shared type FIRST, then the entity, service, router, and frontend
3. Never duplicate types that already exist in shared — import and extend them

## File Structure

```
satyrsmc/
  packages/
    api/                    # Bun.serve + tRPC + TypeORM
      src/
        index.ts            # Server entry (:3000)
        server.ts           # Route handler
        db/
          dataSource.ts     # TypeORM config (entities + migrations)
          migrations/       # MigrationInterface classes
        entities/           # @Entity classes (~50)
        services/           # Service classes (one per domain)
        trpc/
          root.ts           # appRouter = { website, admin }
          routers/          # tRPC procedure definitions
      Dockerfile
    app-admin/              # Admin SPA
      src/
        App.tsx             # Routes
        entry.tsx           # Bootstrap
        trpc.ts             # createTRPCReact<AppRouter>()
        data/api/           # ApiClient classes
        queries/            # React Query hooks
      build.ts              # Bun.build() script
    app-public/             # Public website SPA
      src/
        App.tsx             # Routes
        trpc.ts             # createTRPCReact<AppRouter>()
      build.ts              # Bun.build() script
    shared/                 # TypeScript interfaces
      types/                # Per-domain type files
      lib/                  # Constants + utilities
  data/
    badger.db               # SQLite database
  Makefile                  # Build + deploy targets
```

## Database

**Current:** SQLite file (`data/badger.db`) via TypeORM's `sqljs` driver. Migrations auto-run on startup.

**Adding a schema change:**
1. Create a `MigrationInterface` class in `packages/api/src/db/migrations/`
2. Register it in `dataSource.ts` migrations array
3. If new table: create entity, register in `dataSource.ts` entities array
4. Create matching shared type in `packages/shared/types/`
5. Run `bun run migrate`

See [CONTRIBUTING.md](CONTRIBUTING.md) for migration code examples.

## Content Ownership

| Content | Source | Notes |
|---|---|---|
| Members, contacts, events, budgets, meetings | SQLite via TypeORM | Full CRUD in app-admin |
| Website pages, blog posts, menus, settings | SQLite via TypeORM | CMS in app-admin, served to app-public via `website` tRPC router |
| Static events, gallery | Files in app-public `src/content/` | Some content not yet migrated to database |

## Local Development

```bash
bun run dev    # Primary — builds frontends + starts API with HMR
```

The API serves app-public at `/` and app-admin at `/admin`. Images are stored as BLOBs in SQLite and served via `sharp` for resizing.
