# Feature Planning Guide — satyrsmc

This document is a planning reference for future feature development. It covers what's been built, what's planned, and the implementation approach for each phase.

For coding conventions, type safety rules, and development workflow, see [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md).

---

## Current State

### What's Built

**API (`@satyrsmc/api`)**
- Bun.serve() + tRPC 11 server on port 3000
- TypeORM entities (~50) with SQLite via sql.js (`data/badger.db`)
- 20+ TypeORM migrations
- Services for all domains (contacts, members, events, budgets, meetings, committees, mailing, QR codes, documents, website CMS)
- Website tRPC router: `getEventsFeed`, `getMembersFeed`, `getBlogPublished`, `getBlogBySlug`, `getPages`, `getPageBySlug`, `getMenus`, `getSettings`, `submitContact`, `submitContactMember`
- Admin tRPC routers (15+): full CRUD for all domains
- Photo/asset serving via sharp (BLOBs in SQLite)

**Admin App (`@satyrsmc/app-admin`)**
- Full club management SPA: members, contacts, events, meetings, budgets, committees, mailing lists, QR codes, documents, incidents
- Website CMS: pages, blog posts, menus, contact submissions, settings, event feeds, member profiles, galleries
- shadcn/ui components (button, card, dialog, input, label, select, textarea, tabs, sheet, calendar, date-picker, dropdown-menu, collapsible, popover)
- TipTap rich text editor for documents/blog
- Storybook with 38+ stories
- ApexCharts for budget visualizations

**Public App (`@satyrsmc/app-public`)**
- 7 pages: Home, About, Events, Badger, Gallery, Members, Member Profile
- tRPC client wired up (`createTRPCReact<AppRouter>()`) but **no pages consume tRPC yet** — all use static data files
- Static data: `content/events.ts`, `data/members.json`, `data/timeline.json`
- react-photo-album + lightbox for gallery
- react-markdown for content rendering

**Shared (`@satyrsmc/shared`)**
- Hand-written TypeScript interfaces for all domains
- No Zod schemas yet (Zod only used in tRPC router input validation)
- `lib/constants` and `lib/pst` utilities

### What's NOT Built

- Authentication (no JWT, no login, no user/registration entities)
- Neon Postgres (database is SQLite only)
- Member-authenticated routes (roster, profile editing, meeting minutes)
- Public pages consuming tRPC (all static)
- Contact page with form/reCAPTCHA
- Blog pages in public app
- Dynamic CMS pages in public app
- Auth protection on admin routes (all procedures are bare `t.procedure`)
- Testing infrastructure (only 7 utility tests exist)
- CI/CD pipelines
- ESLint/Prettier configuration
- Email service

---

## Architecture

### Two Apps, Three Concerns

```
app-public (satyrsmc.org):
  /                  — Public/marketing (unauthenticated)
  /about, /events, /gallery, /blog, /contact

app-admin (members.satyrsmc.org, to be renamed):
  /                  — Members area (authenticated)
  /roster, /profile, /events, /meetings
  /admin/            — Club management (admin auth)
  /admin/events, /admin/contacts, /admin/budgets, ...
```

- **`app-public`** is the public marketing site — fully unauthenticated, no member routes
- **`app-admin`** (likely to be renamed, e.g. `app-members`) hosts both the authenticated **members section** at `/` and the **admin section** at `/admin`. Served from `members.satyrsmc.org`.
- **Why members live in app-admin**: Members are the most frequently accessed section for logged-in users. Placing the members area at the root of `members.satyrsmc.org` gives it a clean URL and keeps all authenticated concerns in a single app, separate from the public marketing site.
- **Shared auth**: Same JWT cookies work across both apps — the API validates the same tokens regardless of which frontend made the request.

### Dual Database (Transition Period)

```
API Server
  ├── SQLite DataSource (sqljs)     — existing admin data (contacts, events, budgets, etc.)
  │   └── data/badger.db
  └── Postgres DataSource (Neon)    — new data (users, registrations, auth tokens)
      └── DATABASE_URL
```

- **SQLite stays intact** — all existing entities, migrations, and data remain untouched
- **Postgres is added alongside** for new features (auth, members, etc.)
- Services know which DataSource to use
- tRPC context provides access to both
- **Eventually** (separate future effort): migrate SQLite admin data into Postgres and retire the dual-DB setup

---

## Feature Phases

### Phase 1: Add Neon Postgres

**Goal:** Stand up Postgres alongside SQLite so new features have a proper relational database.

**Database Setup:**
- Add `postgresDataSource.ts` alongside existing `dataSource.ts`
- TypeORM DataSource config: `type: "postgres"`, Neon connection string via `DATABASE_URL`
- New entities for Postgres go in a separate directory or are tagged to the Postgres DataSource
- Migrations for Postgres are separate from SQLite migrations

**Neon Configuration:**
- Production: `main` branch
- Staging: `staging` branch (for PR previews)
- Environment variables: `DATABASE_URL`, `DATABASE_URL_STAGING`

**Local Development:**
- Docker Compose for local Postgres (runs parallel to the SQLite file)
- Same `bun run dev` workflow — API initializes both DataSources on startup

**tRPC Context Update:**
```typescript
// context.ts — provides both data sources
{
  sqliteApi: createApi(sqliteDb, sqliteDs),   // existing admin services
  api: createApi(postgresDb, postgresDs),      // new services (auth, members, etc.)
  session: null,                                // populated by auth middleware later
}
```

---

### Phase 2: Authentication System

**Goal:** JWT-based auth with registration flow, shared across both frontend apps.

**Database (Postgres):**
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

**Frontend (app-admin, at `members.satyrsmc.org`):**
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

### Phase 3: Members Section (in app-admin)

**Goal:** Authenticated member area within `app-admin` (to be renamed), served at `members.satyrsmc.org/`. The members section lives at the root; the existing admin features move under `/admin`.

**Why app-admin, not app-public:**
- Keeps all authenticated concerns in one app — members and admin share auth context, route guards, and tRPC client setup
- The public site (`app-public`) stays purely unauthenticated with no auth dependencies
- `app-admin` already has the auth infrastructure (tRPC client, query hooks, UI components) needed for member routes

**App Restructure:**
- `app-admin` is renamed (e.g. `app-members` or `app-internal`) and deployed to `members.satyrsmc.org`
- Existing admin routes move from `/` to `/admin/*`
- Members section takes over the root `/`

**Routes (in app-admin, at root, auth-gated):**
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
- The members section in `app-admin` provides richer data for authenticated users via `memberProcedure` routes
- Admin features remain behind `adminProcedure` at `/admin/*`

---

### Phase 4: Migrate Public Pages to tRPC

**Goal:** Replace static data with live API data on all public pages.

**Pages to migrate:**

| Page | Static Source | tRPC Endpoint |
|---|---|---|
| Home | `content/events.ts` | `website.getEventsFeed` |
| About | `data/timeline.json` | `website.getPages` (about page) |
| Events | `content/events.ts` | `website.getEventsFeed` |
| Members | `data/members.json` | `website.getMembersFeed` |
| Member Profile | `data/members.json` | `website.getMembersFeed` (by ID) |
| Gallery | `content/gallery.ts` | TBD (may stay static or move to CMS) |
| Badger | hardcoded HTML | `website.getPageBySlug("badger")` |

**For each page:**
1. Replace static import with `trpc.website.*` hook
2. Wrap in Suspense boundary
3. Add loading skeleton (requires shadcn `Skeleton` component)
4. Add error state (requires shadcn `Alert` component)
5. Handle empty state

**Cleanup:**
- Remove `src/content/events.ts`, `src/data/members.json`, `src/data/timeline.json` once all pages are migrated

---

### Phase 5: Contact Page

**Goal:** Public contact form with validation and spam protection.

**Frontend (app-public):**
- New `/contact` route and `ContactPage.tsx`
- `react-hook-form` + `@hookform/resolvers` + `zodResolver`
- Contact form Zod schema in `@satyrsmc/shared` (shared with server validation)
- reCAPTCHA v2 widget (`react-google-recaptcha`)
- Success/error states

**Backend:**
- `website.submitContact` already exists and saves to `contact_submissions` table
- Add reCAPTCHA server-side verification before accepting submission
- Admin views submissions in app-admin (`WebsiteContactSubmissionsPanel` already built)

**Environment:**
- `VITE_RECAPTCHA_SITE_KEY` (client)
- `RECAPTCHA_SECRET_KEY` (server — same as auth)

---

### Phase 6: Blog & Dynamic Pages

**Goal:** CMS-driven content pages in the public app.

**Blog:**
- `/blog` — listing page consuming `trpc.website.getBlogPublished`
- `/blog/:slug` — detail page consuming `trpc.website.getBlogBySlug`
- Blog content authored in app-admin via TipTap editor (already built)
- Render HTML content via `SafeHtml` component (DOMPurify)

**Dynamic Pages:**
- `/:slug` — catch-all for CMS pages consuming `trpc.website.getPageBySlug`
- Pages created/edited in app-admin website CMS (already built)

---

### Phase 7: Admin Auth & User Management

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

### Phase 8: Testing Infrastructure

**Goal:** Comprehensive test coverage with enforcement.

**Setup:**
- `bun:test` for all tests (per Bun-first convention)
- Test utilities: `createTestContext()` for tRPC router testing, service mocking helpers

**Coverage:**
- 90% thresholds for statements, branches, functions, lines
- Pre-push git hook blocks push on failure

**Test Layers:**
1. **Unit tests**: Mock services, test router logic and auth middleware
2. **Integration tests**: Real Postgres database (local Docker or in-memory via `@electric-sql/pglite`) for service-level testing
3. **Component tests**: React Testing Library for key UI components

**Test Data:**
- Shared fixtures in `@satyrsmc/shared` using typed interfaces
- Fixtures match shared type contracts

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
- [ ] TypeORM entity + migration created (in the correct DataSource — SQLite or Postgres)
- [ ] Entity and migration registered in the appropriate `dataSource.ts`
- [ ] Service created with explicit shared type return annotations
- [ ] tRPC router with Zod input schemas, delegating to service
- [ ] Frontend consuming via `trpc.*` hooks (types flow automatically)
- [ ] Loading, error, and empty states handled in UI
- [ ] No suppression comments, no `any`, no unsafe casts
- [ ] Type-only imports for types
- [ ] Tests written (when testing infrastructure exists)
