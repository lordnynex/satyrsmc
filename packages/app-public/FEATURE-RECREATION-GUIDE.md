# Feature Recreation Guide — satyrsmc.org (thyrsus branch)

This document is a comprehensive guide for an AI agent to recreate the features implemented between `main` and `thyrsus` in this monorepo. It covers high-level architecture, reasoning behind decisions, and low-level implementation specifics.

---

## High-Level Context

The project transforms a simple React SPA into a full-stack application with:
- **Monorepo** (Bun workspaces): `apps/client`, `apps/server`, `packages/shared`
- **Database-first architecture**: Neon Postgres + Drizzle ORM, with auto-generated Zod schemas
- **CMS integration**: Contentful for editorial content
- **Authentication**: JWT in httpOnly cookies, full registration/login/reset flow
- **Repository pattern**: Clean separation of DB access from tRPC routers
- **Comprehensive testing**: MSW mocks (client), unit tests with mocked repos + PGlite integration tests (server)
- **Deployment**: Dual Netlify sites (client static, server as Functions)

The work spans ~15 commits, 258 files, +23,900 lines across 11 phases.

---

## Phase 1-2: Monorepo + Database Pipeline

### Why
Single-package project needed proper separation of concerns. Database-first approach ensures Zod schemas and TypeScript types are always in sync with the DB.

### What
- Convert to Bun workspaces monorepo with three packages
- Docker Compose for local Postgres (port 5433 to avoid conflicts)
- Drizzle ORM with database-first workflow: `schema.sql` (bootstrap) → `db:pull` → `db:zod` → generated schemas in `packages/shared/generated/`
- `generate-zod.ts` script copies Drizzle schema into shared package, then generates Zod schemas

### Key Details
- `schema.sql` is bootstrap ONLY (Docker first start). All incremental changes use Drizzle migrations.
- IDs: CUID2 (`@paralleldrive/cuid2`), TEXT columns, generated in app code
- Initial tables: `contact_info`, `members`, `officer_terms`, `events`
- Initial enums: `member_type`, `member_status`, `officer_position`, `event_category`, `event_status`
- Shared package sets `noEmit: true`, `composite: false` — consumed as source, never emits dist
- `tsconfig.base.json` at root with strict mode, `noUncheckedIndexedAccess`, `consistent-type-imports`
- Schema philosophy: NEVER manually write Zod schemas unless absolutely necessary. Prefer generated schemas, derive with `.pick()/.omit()/.extend()`, only hand-write for non-DB entities.

---

## Phase 3: Client Testing Infrastructure

### Why
Need reliable testing before migrating pages to API-driven data. Coverage enforcement prevents regressions.

### What
- Vitest + React Testing Library + MSW (Mock Service Worker)
- 90% coverage thresholds (statements, branches, functions, lines)
- Pre-push git hook runs `bun run test:coverage` — blocks push on failure
- `test-utils.tsx` with `renderWithProviders()` helper wrapping all providers
- MSW browser worker for dev mode (mocks API when no server running)

### Key Details
- `vitest.config.ts` is separate from `vite.config.ts` — aliases must be duplicated
- `@/` path alias configured in tsconfig.json, vite.config.ts, AND vitest.config.ts
- MSW `enableMocking()` checks `VITE_API_URL` and `PROD` env before starting worker
- `bun run dev` = MSW mocks (no server needed), `bun run local` = real server

---

## Phase 4: Server + tRPC

### Why
Need a type-safe API layer. tRPC provides end-to-end type safety from server to client without code generation.

### What
- Express 5 + tRPC 11 server
- Context-based tRPC setup using `createTRPCContext<AppRouter>()`
- Split Express app: `app.ts` (no listener, for serverless) + `index.ts` (listener, for local dev)
- Netlify Function wrapper via `serverless-http` in `netlify/functions/api.mts`
- Dual database driver: static `drizzle-orm/node-postgres` (local/tests), dynamic `require()` for `@neondatabase/serverless` when `NETLIFY=true`

### tRPC Context Pattern
```ts
// Per-request context
{
  db: Database,
  repos: Repositories,        // Factory-created from db
  contentful: ContentfulClient, // Lazy singleton
  email: EmailService,         // Lazy singleton
  user: AuthUser | null,       // Extracted from JWT cookie
  res: Response                // Express Response for cookie manipulation
}
```

### Middleware Chain
- `protectedProcedure` — requires valid JWT, narrows `ctx.user` to non-null
- `adminProcedure` — requires userType "admin" or "webmaster"
- `webmasterProcedure` — requires userType "webmaster" only
- `memberProcedure` — requires `isMember` flag OR admin/webmaster override

### Key Details
- `httpLink` (NOT `httpBatchLink`) — msw-trpc v2 doesn't support batch
- Lazy singletons for Contentful/email to avoid env var errors in tests
- CI migration script (`migrate-ci.ts`) runs Drizzle migrations via Neon HTTP before deploy
- Server `tsconfig` needs `"include": ["src", "drizzle", "netlify"]` and `"rootDir": "."`

---

## Phase 5: Client-side tRPC Integration

### Why
Wire up the client to consume the type-safe API instead of static data.

### What
- `@trpc/tanstack-react-query` with context-based client (NOT singleton)
- `ApiProvider` wraps `QueryClientProvider` + `TRPCProvider`
- MSW-tRPC v2 for test mocking
- Client imports `AppRouter` type via workspace dep

### Key Details
- `ApiProvider` uses `useState(() => ...)` for stable client instances (no re-creation on re-render)
- tRPC client configured with `credentials: "include"` for cookie auth
- `msw-trpc` has its OWN `httpLink` export — do NOT use `@trpc/client`'s `httpLink` in `createTRPCMsw` config
- MSW handler arrays need explicit `RequestHandler[]` type annotation (avoids TS2742 portability errors)
- Default QueryClient: 60s staleTime, retry: 1

---

## Phase 6-7: Domain Routers + Page Migration

### Why
Migrate all client pages from static data to tRPC queries. Shared fixtures ensure test data consistency.

### What
- Shared fixtures in `packages/shared/src/fixtures/` (members, events, users)
- MSW handlers use shared fixtures
- All 37+ client pages refactored to consume tRPC queries
- Server routers: members, events, content, auth, admin

### Key Details
- Fixture data uses typed interfaces (NOT `as const` — causes readonly tuple issues with Drizzle insert)
- Each page has loading states (Skeleton components) and error states (Alert component)

---

## Phase 8: shadcn/ui Component Library

### Why
Consistent, accessible UI components with Tailwind 4 integration.

### What
- Components in `apps/client/src/components/ui/` — local source files, not a package
- Dependencies: `class-variance-authority` (cva), `clsx`, `tailwind-merge`, `@radix-ui/react-slot`
- `cn()` utility at `apps/client/src/lib/utils.ts`
- Components use React 19 `ref` as prop (NOT `forwardRef`)

### Components (14)
alert, badge, breadcrumb, button, card, dialog, input, label, skeleton, sortable-table-head, table, textarea

### Tailwind 4 Details
- No `postcss.config.js` or `tailwind.config.js` — use `@tailwindcss/vite` plugin
- Theme tokens in `@theme` block in `tailwind.css`
- Custom utilities use `@utility` blocks in `components.css`
- shadcn CSS variables in `:root` block → mapped via `@theme inline` block
- `@custom-variant dark (&:is(.dark *))` for dark mode

---

## Phase 9: Contentful CMS Integration

### Why
Editorial content (timeline, about page, hero banners) managed by non-technical users via CMS.

### What
- Contentful SDK v11 in server, `@contentful/rich-text-react-renderer` in client
- Content types: `milestone`, `page`, `heroBanner`, `homeCard`, `homePage`
- `content` tRPC router serves CMS data
- Hand-written Zod schemas in `packages/shared/src/content.ts` (exception to schema philosophy — Contentful has no Drizzle equivalent)

### Key Details
- `z.custom<Document>()` for rich text Zod schema (NOT `z.literal("document")`)
- `RichText.tsx` component for rendering rich text
- `SafeHtml.tsx` component wraps `DOMPurify` — never use `dangerouslySetInnerHTML` directly
- Contentful migration script: `01-create-content-models.cjs`
- MSW mock data uses `BLOCKS.DOCUMENT` / `BLOCKS.PARAGRAPH` enums, not string literals

---

## Phase 10: Deployment + Production Hardening

### Why
Move from GitHub Pages to Netlify for server-side functions and proper SPA routing.

### What
- Two Netlify sites: client (static) + server (Functions)
- GitHub Actions: `ci.yml` (lint/typecheck/test per app), `deploy-client.yml`, `deploy-server.yml`
- SPA routing: `[[redirects]]` in `netlify.toml` (replaces 404.html hack)
- Pre-commit hook: lint-staged (ESLint fix + Prettier)
- Pre-push hook: test coverage enforcement
- `.nvmrc` for Node v20

### Key Details
- Staging: PR deploy previews use Neon staging branch + Contentful `dev` environment
- Migrations automated in CI: staging first (PR), then production (merge to `main`)
- `serverless-http` wraps Express app for Netlify Functions

---

## Phase 11a: Authentication System

### Why
Full user management with role-based access control, secure registration flow, and brute-force protection.

### Database Changes (Migration 0001-0003)
- Added `users` table: `id`, `contactId` FK, `username`, `passwordHash`, `userType` (enum), `userStatus` (enum), `lastLogin`, `failedLoginAttempts`, `lockedUntil`, `resetToken`, `resetTokenExpiresAt`, `passwordChangedAt`, `iceName`, `icePhone`, `adminNote`
- Added `registrations` table: `id`, `email`, `firstName`, `lastName`, `tokenHash`, `expiresAt`
- Added enums: `user_type` (user/admin/webmaster), `user_status` (active/locked/rejected/suspended/inactive/deactivated)
- Added `avatar_url` to `contact_info`

### Auth Architecture
- **JWT**: `jose` library, HS256 symmetric signing
- **Cookies**: httpOnly, secure in prod, sameSite strict (prod) / lax (dev)
  - `satyrs_access`: 15min expiry, path `/trpc`
  - `satyrs_refresh`: 7 day expiry, path `/trpc/auth.refresh`
- **Passwords**: `bcryptjs` cost 12
- **Tokens**: Raw tokens in emails, SHA-256 hashes stored in DB

### Registration Flow
1. `register` — verify reCAPTCHA → check duplicate email (generic response) → create registration record with hashed token + 14-day expiry → send email with raw token link
2. `validateToken` — hash input token, look up registration → return validity + name/email
3. `signup` — validate token → check username uniqueness → hash password → create `contact_info` + `users` (status: "locked") → delete registration → notify admin

### Login Flow
1. `login` — verify reCAPTCHA → find user by username (case-insensitive via `lower()`) → check lockout → check status is "active" → verify password → on failure: increment attempts (lock at 5 for 15min) → on success: reset attempts, update lastLogin, check isMember → sign tokens, set cookies → return user profile
2. `me` — read user profile from JWT, re-check isMember linkage
3. `refresh` — verify refresh cookie → check user still active → re-check isMember → sign new tokens (rotation)
4. `logout` — clear cookies

### Password Reset Flow
1. `forgotPassword` — generic response (prevents enumeration) → generate SHA-256 token hash, 1hr expiry → update user's resetToken fields → send email
2. `resetPassword` — validate hashed token + expiry → update password, clear reset token, clear lockout

### Auth Schemas (`packages/shared/src/auth.ts`)
- `passwordSchema`: 8-128 chars, requires uppercase + lowercase + number + special character (4 separate regex checks)
- `usernameSchema`: 3-30 chars, starts with letter, alphanumeric with dots/hyphens, no consecutive specials
- `signupInputSchema`: includes token, username, password, confirm, birthday (18+ validation), ICE fields
- All confirmation fields validated via `.refine()`
- Enum reuse: `z.enum(userType.enumValues)` from generated schemas

### Client Auth
- `AuthContext.tsx`: React 19 patterns (`use()` not `useContext()`, `<Context value={...}>` not `<Provider>`)
- `useAuth()` hook provides: `user`, `isAuthenticated`, `isAdmin`, `isMember`, `isLoading`, `login()`, `logout()`, `refresh()`
- Route guards: `ProtectedRoute`, `AdminRoute`, `MemberRoute`
- Auth pages: Login, Register, Signup, ForgotPassword, ResetPassword

### Services
- `EmailService` interface + `ConsoleEmailService` stub (logs to console)
- `RecaptchaService` for server-side reCAPTCHA v2 verification

### Environment Variables
- `JWT_SECRET` (min 32 chars), `RECAPTCHA_SECRET_KEY`, `APP_URL`, `ADMIN_EMAIL`

---

## Phase 11b: Repository Pattern + PGlite Tests

### Why
Routers were doing too much — mixing auth, validation, and raw Drizzle queries. Repository pattern separates concerns and enables proper unit testing with mocks plus real DB integration tests without Docker.

### Repository Architecture
Each repository class:
- Takes `Database` in constructor
- Has explicit return type interfaces (e.g., `MemberListItem`, `UserLoginInfo`) — NOT Drizzle-generated types
- Uses limited field selection (no `SELECT *`)
- No business logic — pure data access

### Repository Classes (5)
1. **MemberRepository** — `findAllActive()`, `findById()`, `findCurrentOfficers()`, `listPaginated()`, `isMember()`, `findByUsername()`, `findRoster()`, `findContactForMember()`
2. **UserRepository** (most complex, 16 methods) — CRUD, auth helpers (lockout, reset tokens), paginated listing with dynamic filters/ordering
3. **ContactRepository** — `create()`, `findById()`, `findByEmail()`
4. **EventRepository** — `findAll()`, `findUpcoming()`, `findPast()`
5. **RegistrationRepository** — `create()`, `findByEmail()`, `findByToken()`, `listPaginated()`, `reject()`

### Factory Pattern
```ts
export function createRepositories(db: Database) {
  return {
    members: new MemberRepository(db),
    users: new UserRepository(db),
    contacts: new ContactRepository(db),
    events: new EventRepository(db),
    registrations: new RegistrationRepository(db),
  };
}
export type Repositories = ReturnType<typeof createRepositories>;
```
Injected via `ctx.repos` in tRPC context.

### Thin Router Pattern
Routers now contain ONLY: input validation + auth middleware + delegation to `ctx.repos.*`. No Drizzle imports in routers.

### Testing Strategy
- **Unit tests**: Mock repos via `createMockRepos()`, test router logic/auth with `createTestCaller(user?)`
- **Integration tests**: PGlite (`@electric-sql/pglite`) — in-memory Postgres, no Docker
  - `createTestDb()` runs `schema.sql` + 4 migrations (stripping `--> statement-breakpoint` markers)
  - `drizzle-orm/pglite` driver cast as `Database` via `as unknown as Database`
  - 129 total tests: 65 unit + 64 integration

### Pagination Pattern (in repositories)
```ts
const [countResult, data] = await Promise.all([countQuery, dataQuery]);
return { items: data, total: countResult[0]?.count ?? 0, page, pageSize };
```
Dynamic WHERE via `sql.join(conditions, sql` AND `)`, dynamic ORDER BY via helper method.

---

## Phase 11c-d: Roster + Birthday

### Roster
- New `members.roster` procedure (member-only access)
- `MemberRepository.findRoster()` joins users, contacts, officer_terms
- `RosterPage.tsx`: sortable table with name, position, joined year, phone

### Birthday
- Migration 0004: added `birthday` DATE column to `contact_info`
- Updated signup flow with age 18+ validation (actual age calculation accounting for month/day)
- Regenerated Zod schemas

---

## Admin Features

### Admin Router (`apps/server/src/router/admin.ts`)
All require `adminProcedure`:
- `members.list` — paginated members with filters/sorting
- `registrations.list` — paginated registration queue
- `registrations.approve` — approve registration (creates user)
- `registrations.reject` — reject registration
- `users.list` — paginated users with filters/sorting
- `users.updateStatus`, `users.updateType`, `users.updateAdminNote`

### Admin Pages
- `AdminDashboardPage.tsx` — landing page
- `AdminMembersPage.tsx` — member management table
- `AdminUsersPage.tsx` — user management table
- `AdminRegistrationsPage.tsx` — registration approval queue

---

## Contact Page + Forms

- `react-hook-form` + `@hookform/resolvers` + `zodResolver(contactFormSchema)`
- `react-google-recaptcha` for reCAPTCHA v2
- Netlify Forms: hidden HTML form in `public/netlify-forms.html` for SPA detection
- Contact form schema hand-written in `packages/shared/src/contact.ts`

---

## Critical Patterns & Conventions

1. **No suppression comments**: No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`. Fix root causes.
2. **`SafeHtml` component**: All HTML rendering goes through DOMPurify wrapper. Never `dangerouslySetInnerHTML`.
3. **React 19**: `use()` not `useContext()`, `<Context>` not `<Context.Provider>`, `ref` as prop not `forwardRef`
4. **React Router 7**: Import from `react-router` NOT `react-router-dom`
5. **Enum reuse**: NEVER spell out enum values in Zod — use `z.enum(enumName.enumValues)` from generated schemas
6. **`console.info`** (not `console.log`) for server startup/seed messages
7. **`c.charAt(0)`** not `c[0]` (fails with `noUncheckedIndexedAccess`)
8. **ESLint 10 flat config**: Use `@eslint-react/eslint-plugin` (NOT `eslint-plugin-react`)
9. **Tailwind 4**: No config files, CSS-based theming with `@theme` blocks
10. **Type-only imports**: Always `import type { Foo }` for types

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 0000_dapper_sinister_six | Initial migration marker |
| 0001_chief_famine | Auth tables (users, registrations), enums, avatar_url |
| 0002_previous_garia | Remove password hash from registrations |
| 0003_curly_ghost_rider | ICE fields on users |
| 0004_motionless_warpath | Birthday on contact_info |
