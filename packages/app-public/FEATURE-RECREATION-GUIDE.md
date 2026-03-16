# Feature Planning Guide — satyrsmc

This document is a planning reference for future feature development. It covers what's been built, what's planned, and the implementation approach for each phase.

For coding conventions, type safety rules, and development workflow, see [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md).

---

## Current State

### What's Built

**API (`@satyrsmc/api`)**

- Bun.serve() + tRPC 11 server on port 3000
- TypeORM entities (~50) with Postgres via TypeORM + pg (Neon serverless in production, PGlite for tests)
- 20+ TypeORM migrations
- Services for all domains (contacts, members, events, budgets, meetings, committees, mailing, QR codes, documents, website CMS)
- RecaptchaService: server-side reCAPTCHA v2 verification (fails closed in production, gracefully bypassed in dev/test)
- Website tRPC router: `getEventsFeed`, `getMembersFeed`, `getBlogPublished`, `getBlogBySlug`, `getPages`, `getPageBySlug`, `getMenus`, `getSettings`, `submitContact`, `submitContactMember`
- `submitContact` and `submitContactMember` verify reCAPTCHA token before persisting
- Admin tRPC routers (15+): full CRUD for all domains
- Photo/asset serving via sharp (BYTEA in Postgres)

**Admin App (`@satyrsmc/app-members`)**

- Full club management SPA: members, contacts, events, meetings, budgets, committees, mailing lists, QR codes, documents, incidents
- Website CMS: pages, blog posts, menus, contact submissions, settings, event feeds, member profiles, galleries
- shadcn/ui components (button, card, dialog, input, label, select, textarea, tabs, sheet, calendar, date-picker, dropdown-menu, collapsible, popover)
- TipTap rich text editor for documents/blog
- Storybook with 38+ stories
- ApexCharts for budget visualizations

**Public App (`@satyrsmc/app-public`)** — unauthenticated marketing site only

- 6 public pages: Home, About, Events, Badger, Gallery, Contact
- tRPC client wired up (`createTRPCReact<AppRouter>()`) — Contact page consumes tRPC; other pages still use static data files
- Contact page: `react-hook-form` + `zodResolver` + `react-google-recaptcha` widget, submits via `trpc.website.submitContact`
- Contact member modal: same form stack, submits via `trpc.website.submitContactMember`
- Static data: `content/events.ts`, `data/members.json`, `data/timeline.json`
- react-photo-album + lightbox for gallery
- react-markdown for content rendering
- Members section now lives in `app-members` with auth-protected routes (Phase 3 complete)
- 28 component/page tests (Happy DOM + Testing Library + mock tRPC link)

**Shared (`@satyrsmc/shared`)**

- Hand-written TypeScript interfaces for all domains — holdover from the original REST client DTOs
- No Zod schemas yet (Zod only used in tRPC router input validation)
- `lib/constants` and `lib/pst` utilities
- **Future**: Once the stack stabilizes, shared will become a tRPC client package exporting a pure tRPC client and its types. Ripping out the current shared types will be significant since they're wound through many React components.

### What's NOT Built

- Public pages consuming tRPC (Home, About, Events, Members, Gallery, Badger still use static data)
- Blog pages in public app
- Dynamic CMS pages in public app
- CI/CD pipelines
- Member section page content (roster, profile, events pages are scaffolded but have no real content yet)
- Email delivery (ConsoleEmailService stub logs in dev — no SMTP/SES integration)
- ~~reCAPTCHA on registration form~~ — DONE (LoginPage and RegisterPage in app-members now use react-hook-form + reCAPTCHA widget, matching the contact form pattern)

### What's Built (Auth & User System)

- JWT authentication (jose HS256) with httpOnly cookie transport (access + refresh tokens)
- User, Registration entities with migrations; users table linked to contacts and optionally members
- AuthService: register, signup, login, logout, refresh, forgot/reset password with account lockout
- UsersService: admin CRUD for user management, invitation flow, registration approval
- tRPC middleware: protectedProcedure, adminProcedure, memberProcedure
- Auth pages: login, register, signup, forgot-password, reset-password (login + register use react-hook-form + reCAPTCHA)
- AuthContext + useAuth hook, ProtectedRoute/AdminRoute/MemberRoute guards
- Admin user management UI at /admin/users (list, detail, status/type changes, invitations)
- Members section scaffolding: dashboard, roster, profile, events (at root /)
- Admin routes restructured under /admin/\*
- MembersService reads/writes through Contact sub-tables (contact_id FK)
- Database seed script with sample users (bun run seed)
- Comprehensive test coverage (500+ API tests, PGlite integration tests; 35 app-members + 28 app-public component tests)

---

## Architecture

### Two Apps, Three Concerns

```
app-public (satyrsmc.org):
  /                  — Public/marketing (unauthenticated)
  /about, /events, /gallery, /blog, /contact

app-members (members.satyrsmc.org, to be renamed):
  /                  — Members area (authenticated)
  /roster, /profile, /events, /meetings
  /admin/            — Club management (admin auth)
  /admin/events, /admin/contacts, /admin/budgets, ...
```

- **`app-public`** is the public marketing site — fully unauthenticated, no member routes
- **`app-members`** (likely to be renamed, e.g. `app-members`) hosts both the authenticated **members section** at `/` and the **admin section** at `/admin`. Served from `members.satyrsmc.org`.
- **Why members live in app-members**: Members are the most frequently accessed section for logged-in users. Placing the members area at the root of `members.satyrsmc.org` gives it a clean URL and keeps all authenticated concerns in a single app, separate from the public marketing site.
- **Shared auth**: Same JWT cookies work across both apps — the API validates the same tokens regardless of which frontend made the request.

### Database

```
API Server
  └── Postgres DataSource (TypeORM + pg)
      └── DATABASE_URL (Neon serverless in production)
```

- **Single Postgres database** — all entities, migrations, and data live in one Postgres DataSource
- Connection configured via `DATABASE_URL` environment variable
- Photos stored as BYTEA in Postgres, served via sharp for resizing
- Production: Neon serverless Postgres; Tests: PGlite embedded Postgres; Local dev: docker-compose.yml with Postgres 17
- **ORM migration**: Evaluate switching from TypeORM to Prisma for database-first workflow (introspect → generate typed client + Zod schemas) as a future consideration.

### Database Philosophy

TypeORM entity-first is the current approach (decorators define schema, hand-written SQL migrations). The long-term preference is **database-first** (SQL migrations → introspect → auto-generate types/Zod schemas), which Prisma handles well. TypeORM remains the current ORM.

**Testing approach**: Backend tests use PGlite (embedded Postgres) to unit-test SQL operations and migrations directly, without Docker or end-to-end tests.

---

## Feature Phases

### Phase 1: Postgres Migration (COMPLETE)

**Goal:** Migrate from SQLite to Postgres as the single database.

**What was done:**

- Replaced SQLite (sql.js / `data/badger.db`) with Postgres via TypeORM + pg
- Single `dataSource.ts` with `type: "postgres"`, connection via `DATABASE_URL`
- All entities and migrations consolidated into one Postgres DataSource
- Neon serverless Postgres for production
- PGlite for integration tests
- docker-compose.yml with Postgres 17 for local development
- Photos stored as BYTEA in Postgres

---

### Phase 2: Authentication System (COMPLETE)

**Goal:** JWT-based auth with registration flow, shared across both frontend apps.

**Database:**

- `users` table: id, contactId FK, username, passwordHash, userType (enum), userStatus (enum), lastLogin, failedLoginAttempts, lockedUntil, resetTokenHash, resetTokenExpiresAt, passwordChangedAt, iceName, icePhone, adminNote
- `registrations` table: id, email, firstName, lastName, tokenHash, expiresAt
- Enums: `user_type` (user/admin/webmaster), `user_status` (active/locked/rejected/suspended/inactive/deactivated)

**Shared Types (`@satyrsmc/shared/types/auth`):**

- User, Registration, AuthUser interfaces
- Zod schemas for password, username, signup, login (Zod becomes a dependency of shared)

**Server (`@satyrsmc/api`):**

Auth service with:

- `register` — verify reCAPTCHA → check duplicate email (generic response) → create registration with hashed token + 14-day expiry → send email
- `validateToken` — hash input, look up registration → return validity
- `signup` — validate token → check username uniqueness → hash password → create user (status: "locked") → delete registration → notify admin
- `login` — verify reCAPTCHA → find user (case-insensitive) → check lockout/status → verify password → on failure: increment attempts (lock at 5 for 15min) → on success: reset attempts, sign tokens, set cookies
- `me` — read user profile from JWT
- `refresh` — verify refresh cookie → check user active → sign new tokens (rotation)
- `logout` — clear cookies
- `forgotPassword` — generic response → generate token hash → send email
- `resetPassword` — validate token + expiry → update password, clear token/lockout

tRPC middleware in `trpc.ts`:

```typescript
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "webmaster"].includes(ctx.session.userType))
    throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const memberProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.isMember && !["admin", "webmaster"].includes(ctx.session.userType))
    throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
```

**Supporting Services:**

- `EmailService` interface + `ConsoleEmailService` stub (logs to console in dev)
- `RecaptchaService` for server-side reCAPTCHA v2 verification

**JWT & Cookies:**

- `jose` library, HS256 symmetric signing
- `satyrs_access`: httpOnly, 15min expiry, path `/trpc`
- `satyrs_refresh`: httpOnly, 7 days, path `/trpc/auth.refresh`
- `secure: true` + `sameSite: "strict"` in production, `"lax"` in dev
- Passwords: `bcryptjs` cost 12
- Tokens: SHA-256 hashes stored in DB, raw tokens in emails

**Frontend (app-members, at `members.satyrsmc.org`):**

- `AuthContext` using React 19 `use()` pattern
- `useAuth()` hook: `user`, `isAuthenticated`, `isAdmin`, `isMember`, `isLoading`, `login()`, `logout()`, `refresh()`
- Route guards: `ProtectedRoute`, `AdminRoute`, `MemberRoute`
- Auth pages at root level: `/login`, `/register`, `/signup`, `/forgot-password`, `/reset-password`
- `app-public` has no auth — it links to `members.satyrsmc.org/login` for member login

**Auth Schemas (in `@satyrsmc/shared`):**

- `passwordSchema`: 8-128 chars, requires uppercase + lowercase + number + special character (4 separate regex checks)
- `usernameSchema`: 3-30 chars, starts with letter, alphanumeric with dots/hyphens, no consecutive specials
- `signupInputSchema`: token, username, password, confirm, birthday (18+ validation), ICE fields
- `loginInputSchema`: username, password, reCAPTCHA token

**Environment Variables:**

- `JWT_SECRET` (min 32 chars)
- `RECAPTCHA_SECRET_KEY`
- `APP_URL` (for email links)
- `ADMIN_EMAIL` (for admin notifications)

---

### Phase 3: Members Section (in app-members) (COMPLETE — scaffolded)

**Goal:** Authenticated member area within `app-members` (to be renamed), served at `members.satyrsmc.org/`. The members section lives at the root; the existing admin features move under `/admin`.

**Why app-members, not app-public:**

- Keeps all authenticated concerns in one app — members and admin share auth context, route guards, and tRPC client setup
- The public site (`app-public`) stays purely unauthenticated with no auth dependencies
- `app-members` already has the auth infrastructure (tRPC client, query hooks, UI components) needed for member routes

**App Restructure:**

- `app-members` is renamed (e.g. `app-members` or `app-internal`) and deployed to `members.satyrsmc.org`
- Existing admin routes move from `/` to `/admin/*`
- Members section takes over the root `/`

**Routes (in app-members, at root, auth-gated):**

- `/` — members landing / dashboard
- `/roster` — sortable member roster (name, position, joined year, phone)
- `/profile` — edit own profile
- `/events` — event details with attendance
- `/meetings` — meeting minutes access

**Routes (existing admin, moved under `/admin`):**

- `/admin/` — admin dashboard
- `/admin/contacts`, `/admin/events`, `/admin/budgets`, etc. — all existing admin routes

**tRPC Routes (memberProcedure):**

- `members.roster` — full roster with contact info
- `members.profile` — get/update own profile
- `members.events` — events with attendee details
- `members.meetings` — meeting summaries and minutes

**Data Flow:**

- Members with `show_on_website = true` feed into the public Members page on `app-public` via `website.getMembersFeed`
- The members section in `app-members` provides richer data for authenticated users via `memberProcedure` routes
- Admin features remain behind `adminProcedure` at `/admin/*`

---

### Phase 4: Migrate Public Pages to tRPC

**Goal:** Replace static data with live API data on all public pages.

**Pages to migrate:**

| Page    | Static Source        | tRPC Endpoint                                                  |
| ------- | -------------------- | -------------------------------------------------------------- |
| Home    | `content/events.ts`  | `website.getEventsFeed`                                        |
| About   | `data/timeline.json` | `website.getPages` (about page)                                |
| Events  | `content/events.ts`  | `website.getEventsFeed`                                        |
| Members | `data/members.json`  | `website.getMembersFeed` (list only, no profile click-through) |
| Gallery | `content/gallery.ts` | TBD (may stay static or move to CMS)                           |
| Badger  | hardcoded HTML       | `website.getPageBySlug("badger")`                              |

Note: Member Profile pages move to the authenticated members app (Phase 3). The public Members page shows the list but does not link to individual profiles.

**For each page:**

1. Replace static import with `trpc.website.*` hook
2. Wrap in Suspense boundary
3. Add loading skeleton (requires shadcn `Skeleton` component)
4. Add error state (requires shadcn `Alert` component)
5. Handle empty state

**Cleanup:**

- Remove `src/content/events.ts`, `src/data/members.json`, `src/data/timeline.json` once all pages are migrated

---

### Phase 5: Contact Page (COMPLETE)

**Goal:** Public contact form with validation and spam protection.

**What was done:**

**Frontend (app-public):**

- `/contact` route with `ContactPage.tsx` — `react-hook-form` + `zodResolver(SubmitContactInputSchema)` + per-field Zod validation errors
- `ContactMemberModal.tsx` — same form stack for contacting individual members
- reCAPTCHA v2 widget (`react-google-recaptcha`) on both forms, with dark theme
- Site key injected via `__BUILD_RECAPTCHA_SITE_KEY__` build variable; gracefully skipped when unset
- Success/error states, form reset on reCAPTCHA error

**Backend:**

- `RecaptchaService` (`packages/api/src/services/RecaptchaService.ts`) verifies tokens via Google's API
  - Fails closed in production when `RECAPTCHA_SECRET_KEY` is unset
  - Gracefully bypasses in dev/test (returns `true`)
  - Handles network errors and non-2xx responses (returns `false`)
- `submitContact` and `submitContactMember` tRPC mutations verify reCAPTCHA before persisting
- Zod schemas (`SubmitContactInputSchema`, `SubmitContactMemberInputSchema`) include `recaptcha_token` with validation messages

**Testing:**

- 28 app-public component/page tests added (Hero, MissionStatement, UpcomingEvents, ContactMemberModal, ContactPage, AboutPage, BadgerPage, MembersPage)
- reCAPTCHA failure path test for the website router
- Test infrastructure: build-time globals defined in `setup.ts`, mock tRPC link for handler-driven tests

**Environment:**

- `RECAPTCHA_SITE_KEY` (build-time, via `__BUILD_RECAPTCHA_SITE_KEY__`)
- `RECAPTCHA_SECRET_KEY` (server — same as auth)

---

### Phase 6: Blog & Dynamic Pages

**Goal:** CMS-driven content pages in the public app.

**Blog:**

- `/blog` — listing page consuming `trpc.website.getBlogPublished`
- `/blog/:slug` — detail page consuming `trpc.website.getBlogBySlug`
- Blog content authored in app-members via TipTap editor (already built)
- Render HTML content via `SafeHtml` component (DOMPurify)

**Dynamic Pages:**

- `/:slug` — catch-all for CMS pages consuming `trpc.website.getPageBySlug`
- Pages created/edited in app-members website CMS (already built)

---

### Phase 7: Admin Auth & User Management (COMPLETE)

**Goal:** Protect admin routes and add user management. Since members and admin now share one app, auth context is set up once and covers both sections.

**Auth Protection:**

- Replace all bare `t.procedure` in admin routers with `adminProcedure`
- App-wide auth context (already needed for members section) handles login redirect
- `/admin/*` routes use `AdminRoute` guard requiring admin/webmaster role
- `/` member routes use `MemberRoute` guard requiring member or admin role

**New Admin Features (at `/admin/*`):**

- User management page: list users, update status/type, add admin notes
- Registration approval queue: list pending registrations, approve/reject
- tRPC routes: `admin.users.list`, `admin.users.updateStatus`, `admin.users.updateType`, `admin.registrations.list`, `admin.registrations.approve`, `admin.registrations.reject`

---

### Phase 8: Testing Infrastructure (PARTIALLY COMPLETE)

**Goal:** Comprehensive test coverage with enforcement.

**What's built:**

- `bun:test` for all tests (per Bun-first convention)
- API: 500+ tests with PGlite integration tests, tRPC test harness (`createTrpcTestHarness`), service test helpers
- app-members: 35 component tests (SafeHtml, auth pages, user management, utilities)
- app-public: 28 component/page tests (Hero, MissionStatement, UpcomingEvents, ContactMemberModal, ContactPage, AboutPage, BadgerPage, MembersPage)
- Test utilities per frontend app: `renderWithProviders` (QueryClient + tRPC + MemoryRouter), `createMockTrpcLink` (handler-driven mock)
- Happy DOM for frontend DOM simulation (preloaded via `bunfig.toml`)
- Test fixtures in `packages/api/src/test/fixtures.ts`

**What's NOT built:**

- 90% coverage thresholds enforcement
- Pre-push git hook blocking on coverage failure
- Coverage reporting in CI

---

### Phase 9: CI/CD & Linting

**Goal:** Automated quality checks and deployment.

**Linting:**

- ESLint flat config with `@eslint-react/eslint-plugin`
- Prettier: double quotes, semicolons, trailing commas, 100 char width
- Pre-commit hook: lint-staged (ESLint fix + Prettier on `*.{ts,tsx}`)

**CI (per PR):**

- Parallel jobs per package: lint, typecheck, format check, tests
- Coverage enforcement
- Deploy previews (Postgres uses Neon staging branch)

**Deploy (on merge to `main`):**

- Build + deploy static sites
- Run Postgres migrations against production Neon branch
- Deploy API (Docker image or direct)

---

## Implementation Checklist

When implementing any feature phase, ensure:

- [ ] Shared types defined in `@satyrsmc/shared/types/` FIRST
- [ ] TypeORM entity + migration created
- [ ] Entity and migration registered in `dataSource.ts`
- [ ] Service created with explicit shared type return annotations
- [ ] tRPC router with Zod input schemas, delegating to service
- [ ] Frontend consuming via `trpc.*` hooks (types flow automatically)
- [ ] Loading, error, and empty states handled in UI
- [ ] No suppression comments, no `any`, no unsafe casts
- [ ] Type-only imports for types
- [ ] Tests written (when testing infrastructure exists)
