# AGENTS.md — AI Agent Instructions for satyrsmc

Read and follow all conventions in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Overview

Satyrs Motorcycle Club management system and public website — a Node.js/pnpm monorepo with four packages.

## Architecture

- **Monorepo**: pnpm workspaces (`packages/api`, `packages/app-members`, `packages/app-public`, `packages/shared`)
- **API**: Express + tRPC 11 — deployed as a Netlify Function; serves tRPC at `/trpc` and REST at `/api`
- **App-Members**: React 19 + TanStack Query + tRPC — member portal and admin panel (deployed to `members.satyrsmc.org`)
- **App-Public**: React 19 + tRPC — public website (deployed to `satyrsmc.org`)
- **Shared**: Zod DTO schemas and derived TypeScript types shared across all packages
- **Database**: Postgres via TypeORM + pg (Neon serverless in production, PGlite for tests)
- **Build**: Vite for both SPAs (app-public, app-members); tsup/esbuild for API Netlify Function bundle

## Key Commands

```bash
# Root
pnpm test             # Run tests across all packages
pnpm build            # Build both SPAs for production (pnpm -r build)
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages

# Package-level — dev servers (run each in its own terminal)
pnpm --filter @satyrsmc/api dev              # API dev server (tsx watch, port 4000)
pnpm --filter @satyrsmc/app-public dev       # app-public Vite dev server (port 3000)
pnpm --filter @satyrsmc/app-members dev      # app-members Vite dev server (port 3001)

# Package-level — other
pnpm --filter @satyrsmc/api migrate          # Run TypeORM migrations
pnpm --filter @satyrsmc/api seed             # Seed sample users (password: Password1!)
pnpm --filter @satyrsmc/api build:function   # Bundle API as Netlify Function
pnpm --filter @satyrsmc/api test             # Run API tests
pnpm --filter @satyrsmc/app-public build     # Build app-public
pnpm --filter @satyrsmc/app-members build    # Build app-members
```

## Critical Rules

1. **Node.js + pnpm only** — never use Bun, Deno, npm, or yarn. Use `pnpm` for package management, `tsx` for running scripts, `vitest` for tests, `Vite` for frontend builds, `tsup` for the API Netlify Function bundle, and `Express` for the HTTP server. See [CONTRIBUTING.md](CONTRIBUTING.md) for full conventions.

2. **No suppression comments** — never use `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` (including inline JSX `{/* eslint-disable-next-line */}` variants). Fix root causes. Only add a suppression comment if the user explicitly approves it.

3. **No `any`** — use proper types or `unknown` with type narrowing.

4. **Type-only imports** — use `import type { Foo }` for types. `verbatimModuleSyntax` is enabled.

5. **No `dangerouslySetInnerHTML`** — use the `SafeHtml` component with DOMPurify.

6. **No unsafe type casts** — never use `as never`, `as any`, or `as Record<string, unknown>` to bypass tRPC's inferred types.

7. **Test coverage required** — every new feature, service, migration, router, and component must include corresponding unit and/or integration tests. Use PGlite for backend integration tests and `vitest` for all tests. **All tests must pass before merging — no exceptions.** Run `pnpm test` from the repo root to run the full suite. Do not pass the buck on pre-existing failures: fix them. Do not merge code with failing tests, regardless of whether you introduced the failure.

   **bcrypt in tests** — test fixtures that set up password hashes must use cost `4` (not `12`). The services use `BCRYPT_COST` which is auto-lowered to `4` when `NODE_ENV=test`. High bcrypt costs cause timeouts in the full suite due to parallelism.

8. **Zero lint warnings and type errors** — run `pnpm typecheck` and `pnpm exec eslint .` before committing. All TypeScript errors and ESLint warnings must be fixed — including pre-existing ones in files you didn't touch. CI fails on any warning or error. Do not leave them for later.

## Type Safety Chain

Types flow from database to frontend. Every link must be explicitly typed:

```
TypeORM Entity → Service (returns @satyrsmc/shared type) → tRPC Router → AppRouter → createTRPCReact<AppRouter>() → Frontend
```

- **Services MUST annotate return types** with the shared interface (e.g., `entityToContact(e: ContactEntity): Contact`)
- **Shared types** in `@satyrsmc/shared/client` and `@satyrsmc/shared/dto/*` are the cross-package contract
- **Zod for tRPC input/output validation** — all mutation inputs need Zod schemas, no `.passthrough()`
- **Import from canonical paths** — `@satyrsmc/shared/client` for frontend types/constants, or `@satyrsmc/shared/dto/admin/*` for DTOs
- **Frontend hooks get types automatically** from `createTRPCReact<AppRouter>()` — don't re-annotate

See the "End-to-End Type Safety" section in [CONTRIBUTING.md](CONTRIBUTING.md) for the full pattern and examples.

## Shared Types

The `@satyrsmc/shared` package contains Zod DTO schemas, derived TypeScript types, and shared domain enums. Types are inferred from Zod schemas via `z.infer<>`.

**Exports** (from `packages/shared/package.json`):

```
@satyrsmc/shared/client           — tRPC client, React providers, type aliases, domain enums, constants, helpers
@satyrsmc/shared/client/admin-api — buildApi, useApi, ApiProvider, *ApiClient (admin-only)
@satyrsmc/shared/dto/*            — Zod DTO schemas and inferred types (admin/event, admin/contact, website, …)
@satyrsmc/shared/lib/enums        — Domain string enums (const arrays + derived types) — server-safe
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
    api/                    # Express + tRPC + TypeORM
      src/
        index.ts            # Local dev entry — app.listen(:4000)
        server.ts           # Express app factory (createExpressApp)
        netlify-handler.ts  # Netlify Function entry (serverless-http wrapper)
        db/
          dataSource.ts     # TypeORM config (entities + migrations)
          migrations/       # MigrationInterface classes
        entities/           # @Entity classes (~50)
        services/           # Service classes (one per domain)
        trpc/
          root.ts           # appRouter = { website, admin, members, auth }
          routers/          # tRPC procedure definitions
      tsup.config.ts        # Production bundle config → netlify/functions/api.mjs
      netlify.toml          # Netlify Function redirects
    app-members/            # Member portal + admin panel SPA
      src/
        App.tsx             # Routes
        entry.tsx           # Bootstrap
        trpc.ts             # createTRPCReact<AppRouter>()
        data/api/           # ApiClient classes
        queries/            # React Query hooks
      vite.config.ts        # Vite config
      netlify.toml          # SPA fallback redirect
    app-public/             # Public website SPA
      src/
        App.tsx             # Routes
        trpc.ts             # createTRPCReact<AppRouter>()
      vite.config.ts        # Vite config
      netlify.toml          # SPA fallback redirect
    shared/                 # Zod DTO schemas, derived types, and utilities
      src/
        dto/                # DTO schemas and inferred types (admin/, website/)
        client/             # tRPC client, React providers, re-exports
        lib/                # Constants, enums, and utilities
```

## Database

**Current:** Postgres via TypeORM's `postgres` driver. Uses Neon serverless in production, PGlite for tests. Connection configured via `DATABASE_URL` env var. Docker Postgres is the default for local development. Tests always use PGlite (hardcoded in `src/test/setup.ts` — no env var needed). Migrations auto-run on startup.

**Adding a schema change:**

1. Create a `MigrationInterface` class in `packages/api/src/db/migrations/`
2. Register it in `dataSource.ts` migrations array
3. If new table: create entity, register in `dataSource.ts` entities array
4. Create matching shared DTO in `packages/shared/src/dto/admin/`
5. Run `pnpm --filter @satyrsmc/api migrate`

See [CONTRIBUTING.md](CONTRIBUTING.md) for migration code examples.

## Content Ownership

| Content                                      | Source                             | Notes                                                              |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Members, contacts, events, budgets, meetings | Postgres via TypeORM               | Full CRUD in app-members                                           |
| Website pages, blog posts, menus, settings   | Postgres via TypeORM               | CMS in app-members, served to app-public via `website` tRPC router |
| Static events, gallery                       | Files in app-public `src/content/` | Some content not yet migrated to database                          |

## Local Development

```bash
pnpm --filter @satyrsmc/api dev              # API (tsx watch, port 4000) — requires DATABASE_URL
pnpm --filter @satyrsmc/app-public dev       # app-public Vite dev server (port 3000)
pnpm --filter @satyrsmc/app-members dev      # app-members Vite dev server (port 3001)
```

Run each in its own terminal. Vite dev servers proxy `/trpc` and `/api` requests to the API at `localhost:4000`. Images are stored as BYTEA in Postgres and served via `sharp` for resizing.

**Note:** The API does not serve the frontend SPAs. Each app is deployed independently to Netlify: the API as a Netlify Function, app-public and app-members as separate static sites.

## Netlify Deployment (GitHub Actions)

Deployments are done via `.github/workflows/deploy-staging.yml` using the Netlify CLI. The monorepo requires specific flags — **do not simplify or remove them**.

### API deploy command (critical)

```bash
netlify deploy \
  --dir $GITHUB_WORKSPACE/packages/api/netlify/publish \
  --functions $GITHUB_WORKSPACE/packages/api/netlify/functions \
  --prod --no-build \
  --cwd packages/api
```

- `--dir` and `--functions` must be **absolute paths** (`$GITHUB_WORKSPACE/...`) — relative paths get doubled by the Netlify CLI in a monorepo context
- `--cwd packages/api` is required so the CLI detects the correct Netlify site context from `packages/api/netlify.toml`; without it the CLI errors on multiple detected projects
- Do **not** use `--filter @satyrsmc/api` on the deploy step — it shifts the working directory and breaks the functions path resolution

### API publish dir

`packages/api/netlify/publish` must be created before deploy and must contain a `_redirects` file:

```
/trpc/*  /.netlify/functions/api/trpc/:splat  200
/api/*   /.netlify/functions/api/api/:splat   200
```

This is generated in CI by the "Prepare API publish dir" step. The `netlify.toml` redirects are **not** used for CLI deploys — only `_redirects` is.

### tsup externals

`packages/api/tsup.config.ts` externalizes the following packages:

- `pg`, `sharp` — native addons that cannot be bundled
- `pino-pretty` — dev-only pretty printer; loaded via dynamic `import()` in `logger.ts` and gracefully skipped in production (falls back to JSON stdout). Must be external to prevent esbuild from splitting the bundle into multiple chunks.
- `typeorm-pglite` — test-only PGlite driver; loaded via dynamic `import()` in `dataSource.ts` only when `USE_PGLITE=1`. Must be external for the same reason.

Everything else is **bundled into `api.mjs`**. Do not add packages to the external list unless they either have native `.node` bindings or use dynamic `import()` that would force esbuild to create chunk files.

`noExternal` is used to force packages into the bundle that tsup/esbuild would otherwise skip:

- `@satyrsmc/shared` — workspace package; must be inlined since it's not installed in the Netlify Function environment.
- `reflect-metadata` — side-effect-only import required by TypeORM decorators. Despite not being in the `external` list, esbuild can fail to inline it due to its `exports` map. Explicitly listed in `noExternal` to guarantee it's bundled.
- `serverless-http` — same `exports` map issue; esbuild leaves it unbundled without explicit `noExternal`.

### UI deploys

The UI packages (`app-public`, `app-members`) deploy with relative `--dir` paths and `--filter` — this is fine because they have no `--functions` flag. Only the API deploy requires absolute paths.
