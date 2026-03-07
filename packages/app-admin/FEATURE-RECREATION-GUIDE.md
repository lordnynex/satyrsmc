# Feature Recreation Guide — app-admin

This document is a comprehensive guide for an AI agent to recreate the features in the `app-admin` package. It covers high-level architecture, reasoning behind decisions, and low-level implementation specifics.

---

## High-Level Context

The project is a full-stack monorepo (Bun workspaces) for managing a motorcycle club's operations:

- **`packages/api`** — Backend: tRPC routers + TypeORM entities + SQLite (SQL.js) database
- **`packages/app-admin`** — Internal SPA: React 19 + React Router 7 + tRPC client + Tailwind 4
- **`packages/app-public`** — Public website (separate app)
- **`packages/shared`** — Shared types, constants, and utilities

### Stack Summary

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Database | SQLite via SQL.js (file: `data/badger.db`) |
| ORM | TypeORM 0.3 with decorator-based entities |
| API | tRPC 11 (RC) with Express |
| Frontend | React 19, React Router 7, TanStack Query 5 |
| Styling | Tailwind CSS 4 (CSS-based config, no `tailwind.config.js`) |
| UI Components | Custom Radix-based library in `src/components/ui/` |

### App Structure

The app is organized with **members as the primary view** and **admin features nested under `/admin`**:

```
/                           → Members (primary landing)
/members/:id                → Member detail/edit
/admin/contacts             → Contact management
/admin/contacts/:id         → Contact detail
/admin/events               → Event management
/admin/events/:id           → Event detail
/admin/meetings             → Meeting management
/admin/meetings/:id         → Meeting detail
/admin/committees           → Committee management
/admin/committees/:id       → Committee detail
/admin/budgeting/*          → Budgeting (scenarios, actuals, etc.)
/admin/website/*            → Website CMS (pages, blog, galleries, menus, settings)
/admin/mailing-lists        → Mailing list management
/admin/qr-codes             → QR code management
```

Members live at the root because they are the most frequently accessed section. All other administrative features are grouped under `/admin`.

---

## Database Architecture

### Schema Definition: Entities, Not SQL Files

There is no `.sql` schema file or `.prisma` file. The schema is defined through **TypeORM entity classes** with decorators. Each entity maps a TypeScript class to a database table:

```ts
// packages/api/src/entities/Member.ts
@Entity("members")
export class Member {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "phone_number", type: "text", nullable: true })
  phoneNumber!: string | null;
}
```

Key conventions:
- **IDs**: Text UUIDs generated in app code via `uuid()` helper
- **Booleans**: Stored as `integer` (0/1) in SQLite, converted in the service layer
- **Photos**: Stored as `blob` columns directly in the database
- **Timestamps**: Stored as `text` (ISO strings)
- **Column naming**: snake_case in DB, camelCase on entities via `name` option

### Migrations

All schema changes use hand-written SQL in TypeORM migration classes at `packages/api/src/db/migrations/`. Migrations run automatically on startup (`migrationsRun: true`).

```ts
export class AddCommittees1740000013000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        chairperson_member_id TEXT,
        FOREIGN KEY (chairperson_member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> { /* rollback */ }
}
```

There are 25 migrations registered in `packages/api/src/db/dataSource.ts`. The DataSource uses a singleton pattern with lazy initialization.

### Entities (48 total)

Organized in `packages/api/src/entities/`. Major domains:
- **Members**: `Member`
- **Contacts**: `Contact`, `ContactEmail`, `ContactPhone`, `ContactAddress`, `ContactNote`, `ContactEmergencyContact`, `ContactPhoto`, `Tag`, `ContactTag`
- **Events**: `Event`, `EventPhoto`, `EventAttendee`, `EventAsset`, `EventVolunteer`, `EventAssignment`, `EventAssignmentMember`, `RideScheduleItem`, `EventPlanningMilestone`, `EventMilestoneMember`, `EventPackingCategory`, `EventPackingItem`, `EventRideMemberAttendee`
- **Meetings**: `Meeting`, `MeetingMotion`, `MeetingActionItem`, `OldBusinessItem`, `MeetingTemplate`
- **Committees**: `Committee`, `CommitteeMember`, `CommitteeMeeting`
- **Budgeting**: `Budget`, `LineItem`, `Scenario`
- **Documents**: `Document`, `DocumentVersion`
- **Mailing**: `MailingList`, `MailingListMember`, `MailingBatch`, `MailingBatchRecipient`
- **Website**: `SitePage`, `SiteSettings`, `SiteMenuItem`, `BlogPost`
- **Other**: `QrCode`, `ContactSubmission`, `ContactMemberSubmission`, `Incident`

---

## API Architecture (packages/api)

### Service Layer

Business logic lives in service classes at `packages/api/src/services/`. Each service takes `DbLike` and `DataSource` in its constructor and exposes domain methods.

Example — `MembersService`:
- `list()` — All members excluding the system ALL_MEMBERS_ID sentinel
- `get(id)` — Single member by ID
- `create(body)` — Create with photo optimization + thumbnail generation
- `update(id, body)` — Partial update with field-level diffing
- `delete(id)` — Hard delete
- `getPhoto(id, size)` — Returns photo buffer at thumbnail/medium/full size
- `listForWebsite()` — Public-facing subset (name, position, photo only, filtered by `show_on_website`)

Key patterns:
- Raw queries via `db.run()` for writes (INSERT/UPDATE/DELETE)
- TypeORM QueryBuilder with `getRawMany()`/`getRawOne()` for reads (avoids loading blob columns)
- Photo processing via `ImageService` (Sharp): optimize on upload, generate thumbnails
- `memberRowToApi()` utility converts `has_photo` flag to URL paths (`/api/members/:id/photo/thumbnail`)

### tRPC Routers

Root router at `packages/api/src/trpc/root.ts` splits into:
- `website` — Public routes for `app-public`
- `admin` — Protected routes for `app-admin`

Admin routers live at `packages/api/src/trpc/routers/admin/` with sub-routers per domain (members, contacts, events, meetings, etc.).

---

## Frontend Architecture (packages/app-admin)

### Entry Point + Providers

`src/entry.tsx` sets up the provider stack:
1. `QueryClientProvider` (TanStack Query)
2. `TRPCProvider` (tRPC React Query integration)
3. `BrowserRouter` (React Router)
4. `AppStateProvider` (global app state for budgeting)

### Routing

`src/App.tsx` defines all routes using React Router 7 with nested layouts. Members are the primary view at `/`; all other admin features live under `/admin`.

Layout components (`Header`, `Main`, `ContactsLayout`, `EventsLayout`, etc.) provide shared navigation and structure per domain.

### Data Flow

```
Component → useQuery hook → tRPC client → API service → TypeORM → SQLite
```

1. **Query hooks** in `src/queries/` wrap tRPC calls with TanStack Query
2. **API clients** in `src/data/api/` provide typed method wrappers
3. **Query keys** centralized in `src/queries/keys.ts` for cache management

### UI Component Library

Custom components in `src/components/ui/` built on Radix UI primitives:
- Uses `class-variance-authority` (cva) for variant styling
- `cn()` utility merges Tailwind classes via `clsx` + `tailwind-merge`
- React 19 patterns: `ref` as prop (no `forwardRef`)

---

## Members Section (root: `/`)

Members is the primary section of the app, living at the root path. It manages club member profiles, officer positions, and related data.

### Why at the Root

Members are the most frequently accessed data in the app. Club officers and administrators interact with member records daily — looking up contact info, checking positions, tracking birthdays/anniversaries. Placing it at `/` eliminates an unnecessary click.

### Routes

```
/                → MembersPanel (list with officers, members, birthdays, anniversaries)
/members/:id     → MemberDetailPage (full detail with edit capability)
```

### Components (`src/components/members/`)

| Component | Purpose |
|-----------|---------|
| `MembersPanel` | List view with officers section, regular members, birthday/anniversary sections |
| `MemberDetailPage` | Full member detail with edit capability |
| `AddMemberDialog` | Dialog form for creating new members |
| `EditMemberDialog` | Dialog form for editing existing members |
| `MemberCard` | Card display of member info |
| `MemberChip` | Compact member reference (avatar + name) |
| `MemberChipPopover` | Popover with member details on hover/click |
| `MemberSelectCombobox` | Searchable dropdown for selecting a member (used across the app) |
| `MemberProfileCard` | Profile display with photo, position, contact info |
| `MemberEmergencyContactCard` | Emergency contact display |
| `MembersExportDropdown` | Export member data |
| `UpcomingBirthdaysSection` | Birthday calendar section |
| `UpcomingAnniversariesSection` | Anniversary calendar section |
| `memberUtils.ts` | Utility functions |

### Member Data Model

Entity (`packages/api/src/entities/Member.ts`):
```ts
@Entity("members")
export class Member {
  id: string              // TEXT PRIMARY KEY (UUID)
  name: string            // TEXT NOT NULL
  phoneNumber: string     // TEXT, nullable (DB: phone_number)
  email: string           // TEXT, nullable
  address: string         // TEXT, nullable
  birthday: string        // TEXT, nullable (ISO date)
  memberSince: string     // TEXT, nullable (YYYY-MM format)
  isBaby: number          // INTEGER, default 0 (boolean as 0/1)
  position: string        // TEXT, nullable (validated against VALID_POSITIONS)
  emergencyContactName    // TEXT, nullable
  emergencyContactPhone   // TEXT, nullable
  photo: Buffer           // BLOB, nullable (full-size optimized image)
  photoThumbnail: Buffer  // BLOB, nullable (auto-generated thumbnail)
  createdAt: string       // TEXT, nullable (ISO datetime)
  showOnWebsite: number   // INTEGER, default 0 (boolean as 0/1)
}
```

Shared type (`packages/shared/types/member.ts`):
```ts
export const MEMBER_POSITIONS = [
  "President", "Vice President", "Road Captain", "Treasurer",
  "Recording Secretary", "Correspondence Secretary", "Member",
] as const;

export interface Member {
  id: string;
  name: string;
  phone_number: string | null;
  email: string | null;
  // ... snake_case API response shape
  photo_url: string | null;        // URL path, not raw blob
  photo_thumbnail_url: string | null;
}
```

### Photo Handling

Photos flow through several layers:
1. **Upload**: Base64 string from client → `parsePhotoToBlob()` → `ImageService.optimize()` (Sharp) → stored as BLOB
2. **Thumbnail**: Auto-generated via `ImageService.createThumbnail()` on create/update
3. **Serving**: `getPhoto(id, size)` returns buffer; API route serves as image response
4. **Client display**: Uses URL paths like `/api/members/:id/photo/thumbnail`

### Member Features

- **Officers vs Members**: `MembersPanel` splits the list — members with a position (other than "Member") display in the officers section
- **Positions**: Validated against `VALID_POSITIONS` set on the server; invalid positions silently become null
- **Baby flag**: For tracking spouse/children entries (non-voting members)
- **Website visibility**: `show_on_website` controls whether the member appears on the public site
- **Export**: Dropdown with export format options
- **Birthdays/Anniversaries**: Dedicated sections showing upcoming dates

### Cross-Domain References

Members are referenced throughout the app via `MemberChip`, `MemberChipPopover`, and `MemberSelectCombobox`:
- Event assignments and volunteers
- Meeting attendees and action item owners
- Committee memberships
- Mailing list members
- Budget responsibility

---

## Admin Section (`/admin`)

All non-member administrative features are grouped under `/admin`.

### Contacts (`/admin/contacts`)
- Full contact management (people + organizations)
- Contact details: emails, phones, addresses, notes, photos, tags
- Emergency contacts, hellenic/deceased flags, OK-to-email/SMS preferences
- Contact submissions from the public website

### Events (`/admin/events`)
- Event types: Badger, Anniversary, Pioneer Run, Rides, general
- Event planning: milestones, packing lists, assignments, volunteers
- Ride-specific: schedule items, ride member attendees, assets
- Event photos and attendee tracking
- Incident reporting

### Meetings (`/admin/meetings`)
- Meeting creation with agenda/minutes editing (rich text)
- Motions with mover/seconder tracking and vote results
- Action items with assignees and status
- Old business tracking across meetings
- Meeting templates for recurring meeting structures
- Print view and email view for distribution
- Roberts Rules and Bylaws reference pages

### Committees (`/admin/committees`)
- Committee CRUD with chairperson assignment
- Committee member management (junction table)
- Committee-specific meetings (separate from general meetings)

### Budgeting (`/admin/budgeting`)
- Budget projections with line items
- Multiple scenarios for what-if analysis
- Actual spend tracking
- Global app state managed via `AppStateProvider`

### Website CMS (`/admin/website`)
- Page management (SitePage entity)
- Blog post authoring (BlogPost entity)
- Photo galleries
- Navigation menu management (SiteMenuItem entity)
- Site settings (SiteSettings entity)

### Other Admin Features
- **Mailing Lists** (`/admin/mailing-lists`): List management, batch email creation
- **QR Codes** (`/admin/qr-codes`): QR code generation and management
- **Documents**: Document storage with versioning

---

## Shared Package (packages/shared)

Consumed as source (no build step). Contains:
- `types/` — Domain interfaces (Member, Contact, Event, Meeting, Committee, etc.)
- `lib/constants.ts` — Shared constants (e.g., `ALL_MEMBERS_ID`)
- `lib/pst.ts` — Pacific time utilities

---

## Build System

`app-admin` uses a custom Bun-based build (`build.ts`) with the `bun-plugin-tailwind` plugin. No Vite.

- `bun run build` — Production build
- `bun run dev` — Dev build + dev server (`BUILD_DEV=1`)

---

## Critical Patterns & Conventions

1. **TypeORM entities define the schema** — no separate SQL or Prisma schema files
2. **Migrations are hand-written SQL** — not auto-generated from entity diffs
3. **Service layer converts types** — entities use camelCase + integers for booleans; API responses use snake_case + real booleans
4. **Photos stored as BLOBs** — optimized with Sharp, served via dedicated photo endpoints
5. **React 19 patterns**: `use()` not `useContext()`, `ref` as prop not `forwardRef`
6. **React Router 7**: Import from `react-router-dom`
7. **Tailwind 4**: CSS-based theming with `@theme` blocks, no config files
8. **tRPC 11 RC**: Type-safe API with React Query integration
9. **IDs**: Text UUIDs, generated server-side
10. **`synchronize: false`**: Entity changes require explicit migrations, TypeORM never auto-syncs

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 1700000000000 | Initial schema (events, members, contacts, budgets, etc.) |
| 1739750400000 | Add member photo thumbnail column |
| 1739900000000 | Remove audit log table |
| 1740000000000 | Add mailing list delivery type |
| 1740000001000 | Add contact notes table |
| 1740000002000 | Add contact photos table |
| 1740000003000 | Add QR codes table |
| 1740000004000 | Add contact hellenic/deceased flags |
| 1740000005000 | Add contact emergency contacts table |
| 1740000006000 | Add contact OK-to-SMS field |
| 1740000007000 | Add event type field |
| 1740000007500 | Add event photos table |
| 1740000008000 | Add ride fields, attendees, assets |
| 1740000009000 | Add event ride member attendees |
| 1740000010000 | Add meetings, motions, action items |
| 1740000011000 | Add documents table |
| 1740000012000 | Add motion mover/seconder |
| 1740000013000 | Add committees |
| 1740000014000 | Add meeting times and video URL |
| 1740000015000 | Add website tables (pages, settings) |
| 1740000016000 | Add show_on_website flag |
| 1740000017000 | Add site menu items |
| 1740000018000 | Add blog posts |
| 1740000019000 | Add contact submissions |
| 1740000020000 | Add incidents |
