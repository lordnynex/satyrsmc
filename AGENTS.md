# AGENTS.md — AI Agent Instructions for satyrsmc

Read and follow all conventions in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Overview

Satyrs Motorcycle Club management system and public website — a Bun monorepo with four packages.

## Architecture

- **Monorepo**: Bun workspaces (`packages/api`, `packages/app-admin`, `packages/app-public`, `packages/shared`)
- **API**: Bun.serve() + tRPC 11 — serves both SPAs and the API on port 3000
- **App-Admin**: React 19 + TanStack Query + tRPC — admin panel for club management and website CMS (served at `/admin`)
- **App-Public**: React 19 + tRPC — public website (served at `/`)
- **Shared**: Zod DTO schemas and derived TypeScript types shared across all packages
- **Database**: Postgres via TypeORM + pg (Neon serverless in production, PGlite for tests)
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
- **Shared types** in `@satyrsmc/shared/client` and `@satyrsmc/shared/dto/*` are the cross-package contract
- **Zod in routers** — all mutation inputs need Zod schemas, no `.passthrough()`; shared DTO Zod schemas live in `@satyrsmc/shared/dto/*`
- **Import from canonical paths** — `@satyrsmc/shared/client` for frontend types/constants, or `@satyrsmc/shared/dto/admin/*` for DTOs
- **Frontend hooks get types automatically** from `createTRPCReact<AppRouter>()` — don't re-annotate

See the "End-to-End Type Safety" section in [CONTRIBUTING.md](CONTRIBUTING.md) for the full pattern and examples.

## Shared Types

The `@satyrsmc/shared` package contains hand-written TypeScript interfaces, Zod DTO schemas, and derived types. Zod schemas live in `packages/shared/src/dto/` and are used both for tRPC input validation and for defining DTO shapes with inferred TypeScript types. Enum string literals are defined as `const` arrays in `packages/shared/src/lib/enums.ts` and re-used in Zod schemas via `z.enum()`.

**Exports** (from `packages/shared/package.json`):
```
@satyrsmc/shared/client           — trpc, createTrpcClient, TrpcClientProvider, useTrpcClient; RouterOutputs/RouterInputs; Contact, Member, Event, MeetingSummary, CommitteeSummary, Document, Budget, Scenario, QrCode, etc.; MEMBER_POSITIONS, Inputs, LineItem, ScenarioMetrics; unwrap, getErrorMessage
@satyrsmc/shared/client/admin-api — buildApi, useApi, ApiProvider, *ApiClient (admin-only)
@satyrsmc/shared/dto/*            — DTO schemas and inferred types (admin/event, admin/contact, website, …)
@satyrsmc/shared/lib/constants    — ALL_MEMBERS_ID constant
```

**Rules:**
1. Check `@satyrsmc/shared` first for existing types before defining new ones
2. When adding a new domain, create the shared type FIRST, then the entity, service, router, and frontend
3. Never duplicate types that already exist in shared — import and extend them
4. **String literal types use `const` array + derived type pattern** in `packages/shared/src/lib/enums.ts`:
   ```typescript
   export const COMMITTEE_STATUSES = ["active", "closed"] as const;
   export type CommitteeStatus = (typeof COMMITTEE_STATUSES)[number];
   ```
   - In DTO Zod schemas, derive from the const: `z.enum(COMMITTEE_STATUSES)`
   - Never hardcode the same strings in a `z.enum()` call
   - Never define a local type alias in a service, router, or component that duplicates a shared type

5. **TypeORM entities must import shared types** for constrained string columns (status, type, category fields). Use `import type` syntax.

6. **DTOs and enums must stay in sync.** When adding a new string union:
   - Define the const array + type in `packages/shared/src/lib/enums.ts`
   - Import and use `z.enum(CONST_ARRAY)` in the corresponding DTO file
   - Never define the same set of strings in both places independently

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
    shared/                 # Zod DTO schemas, derived types, and utilities
      src/
        dto/                # DTO schemas and inferred types (admin/, website/)
        client/             # tRPC client, React providers, re-exports
        lib/                # Constants, enums, and utilities
  Makefile                  # Build + deploy targets
```

## Database

**Current:** Postgres via TypeORM's `postgres` driver. Uses Neon serverless in production, PGlite for tests. Connection configured via `DATABASE_URL` env var (or in-memory PGlite when `USE_PGLITE=1` for local dev). Migrations auto-run on startup.

**Adding a schema change:**
1. Create a `MigrationInterface` class in `packages/api/src/db/migrations/`
2. Register it in `dataSource.ts` migrations array
3. If new table: create entity, register in `dataSource.ts` entities array
4. Create matching shared DTO in `packages/shared/src/dto/admin/`
5. Run `bun run migrate`

See [CONTRIBUTING.md](CONTRIBUTING.md) for migration code examples.

## Content Ownership

| Content | Source | Notes |
|---|---|---|
| Members, contacts, events, budgets, meetings | Postgres via TypeORM | Full CRUD in app-admin |
| Website pages, blog posts, menus, settings | Postgres via TypeORM | CMS in app-admin, served to app-public via `website` tRPC router |
| Static events, gallery | Files in app-public `src/content/` | Some content not yet migrated to database |

## Local Development

```bash
bun run dev        # Primary — builds frontends + starts API with HMR (requires DATABASE_URL)
bun run dev:pglite # In-memory PGlite, no Postgres; optionally seeds from data/badger.db at startup
```

The API serves app-public at `/` and app-admin at `/admin`. Images are stored as BYTEA in Postgres and served via `sharp` for resizing.
