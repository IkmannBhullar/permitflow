# PermitFlow 2.0: Build Brief for Claude Code

You are the senior engineer building **PermitFlow 2.0** from an empty repository. It is a multi-tenant SaaS that helps construction companies track building permits across projects. This is a new product. Do not look for, reuse, or migrate any older PermitFlow code.

**Timebox: 3 working days.** Scope is prioritized below. A smaller app that works end to end beats a larger one with dead buttons. If time runs short, cut from the bottom of the priority list. Never fake a feature to look complete.

---

## 0. How to work (read first, follow throughout)

1. **Start in plan mode.** Before writing code, give me:
   - the architecture
   - the database schema (tables, key columns, relationships, RLS approach)
   - the folder structure
   - the day-by-day plan

   Wait for my approval, then build.

2. **Keep `PROGRESS.md` at the repo root.** After every work session and every phase, update it with:
   - what's done
   - what's in progress
   - known issues
   - the exact next step

   I'll work across several sessions, and this file is how you pick up where you left off. At the start of each session, read `PROGRESS.md` and `CLAUDE.md` first.

3. **Create `CLAUDE.md`** in Phase 0 with:
   - the project conventions
   - the commands to run
   - the folder layout
   - the rules in section 9
4. **Each phase ends with green checks:**
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - e2e, once it exists

   Don't start the next phase with failing checks. Commit at the end of each phase with a clear message, plus smaller commits within phases.

5. **Verify, don't assume.** After building a workflow, actually run it, via a Playwright test or by starting the dev server and exercising it. Report what you verified.
6. **Check in with me at the end of each day's phase.** Give me a short summary, anything you cut or changed, and anything I need to do, like creating accounts or adding env vars.
7. **Make reasonable decisions yourself.** Only stop to ask when a choice is costly to reverse.

---

## 1. Stack (use exactly this unless something is broken)

- **Next.js** (App Router, latest stable) with **TypeScript** in strict mode
- **Tailwind CSS** and **shadcn/ui**, plus `lucide-react` for icons and `next-themes` for light/dark
- **Supabase** for Postgres, Auth (email + password), and Storage
  - Use `@supabase/ssr` for cookie-based sessions
  - Use the Supabase CLI for local dev and migrations (`supabase start`, which needs Docker)
- **Zod** for all input validation, shared between forms and server actions
- **React Hook Form** for forms
- **TanStack Table** for data tables
- **Recharts** (via shadcn charts) for the dashboard
- **Vitest** for unit and integration tests, **Playwright** for e2e
- **pnpm** as the package manager
- **Vercel** for deployment, with a hosted Supabase project for production

**Data access pattern:**

- Use Server Components for reads and Server Actions for mutations.
- Every action validates input with Zod and uses the user-scoped Supabase client, so RLS applies.
- No separate API layer except where needed: CSV export routes and the cron route.
- **The service-role key is only used** in the seed script and the cron route. It is never imported into client code. Enforce this with `import "server-only"` in any module that touches it.

---

## 2. Multi-tenancy and security model

**Tenancy:**

- Every tenant-owned table has an `organization_id` column.
- Routes are scoped as `/app/[orgSlug]/...`. A user can belong to several orgs.

**Roles:** `admin`, `project_manager`, `viewer`. Stored in `organization_members`.

- `viewer`: read-only access to everything in the org.
- `project_manager`: create and edit projects, permits, tasks, documents, and comments.
- `admin`: everything a project manager can do, plus manage members, invites, and org settings, and delete or archive anything.

**Enforcement happens in the database, not the UI:**

- RLS is enabled on every tenant table.
- Policies use `SECURITY DEFINER` helper functions such as `is_org_member(org_id)` and `has_org_role(org_id, roles[])`.
- The UI also hides controls the user can't use, but RLS is the actual guard.
- Server Actions re-check the role and return friendly errors.

**Storage:**

- One private bucket, `documents`.
- Object path format: `{organization_id}/{project_id}/{document_id}/v{version}/{filename}`.
- Storage policies restrict access by the first path segment, using org membership.
- Downloads and previews use short-lived signed URLs.
- Validate file type (PDF, images, common office docs) and size (max 25 MB) on the server.

**Invites (no email infrastructure):**

- An admin creates an invite: email + role. This produces a token link the admin copies and shares.
- The invitee signs up or logs in, opens the link, and joins the org.
- Tokens expire after 7 days and are single-use.

**Further security requirements:**

- Write RLS integration tests that prove a user in Org A cannot read or write Org B's rows or files.
- Prove a viewer cannot mutate anything.
- Never expose secrets to the browser.
- Provide a complete `.env.example`.
- Return safe error messages; don't leak SQL errors to users.

---

## 3. Database schema (refine during planning)

Design SQL migrations covering at least these tables:

- **`profiles`**: id (references auth.users), full_name, avatar_url, created_at
- **`organizations`**: id, name, slug (unique), created_by, created_at
- **`organization_members`**: org_id, user_id, role (enum), created_at
  - Unique constraint on (org_id, user_id)
- **`invites`**: id, org_id, email, role, token (unique), expires_at, accepted_at, created_by
- **`projects`**: id, org_id, name, address, city, jurisdiction, project_type (residential / commercial / renovation / other), manager_id, status (active / on_hold / completed / archived), start_date, target_completion_date, created_at, updated_at
- **`permits`**: id, org_id, project_id, name, permit_type (building / electrical / plumbing / mechanical / demolition / grading / fire / signage / other), jurisdiction, application_number, status (enum), submitted_at, approved_at, expires_at, assignee_id, notes, created_at, updated_at
  - **Status enum values:** draft, submitted, under_review, corrections_required, approved, rejected, expired, closed
- **`documents`**: id, org_id, project_id, permit_id (nullable), name, current_version, uploaded_by, created_at
- **`document_versions`**: id, document_id, org_id, version, storage_path, size_bytes, mime_type, uploaded_by, created_at
- **`tasks`**: id, org_id, project_id, permit_id (nullable), title, description, assignee_id, due_date, priority (low / medium / high / urgent), status (todo / in_progress / done), is_correction (boolean), completed_at, created_by, created_at
- **`comments`**: id, org_id, entity_type (project / permit / task), entity_id, author_id, body, created_at
- **`activity_log`**: id, org_id, project_id, entity_type, entity_id, actor_id, action, metadata (jsonb), created_at
- **`notifications`**: id, org_id, user_id, type, title, body, link, read_at, created_at, dedupe_key
  - Unique constraint on dedupe_key

**Also include:**

- Foreign keys with sensible `ON DELETE` behavior
- `CHECK` constraints, for example `approved_at` is required when status is approved
- `updated_at` triggers
- Indexes on `org_id` and on common filters: status, expires_at, due_date, assignee_id, project_id
- An auto-create-profile trigger on signup

**Activity log:** written for every create, update, status change, upload, assignment, and completion. Do this in server actions, or with DB triggers if cleaner; explain the choice.

---

## 4. Features, in priority order

### P0: Must work by end of Day 2

1. **Auth:** register, log in, log out, protected routes (middleware), and an onboarding step to create your first organization.
2. **Organizations and team:**
   - Create an org.
   - Members page with roles.
   - Admin can invite (token link), change roles, and remove members.
   - Org switcher in the sidebar.
3. **Projects:**
   - Create, edit, and archive.
   - Assign a manager.
   - The project detail page shows its permits, tasks, documents, and activity timeline.
   - A progress indicator (for example, percentage of permits approved or closed).
4. **Permits:**
   - Create, edit, and change status.
   - When status becomes approved, `approved_at` is set automatically. A user can't set approved without a date.
   - Assign a team member.
   - Table with search, filtering (status, type, project, assignee, expiring within N days), sorting, and pagination.
   - Permit detail page with notes, documents, tasks, comments, and full activity history.
5. **Dashboard** (every number comes from a real query):
   - **Stat cards:** active projects, total permits, pending (submitted + under review), approved, corrections required, expiring within 30 days, overdue tasks.
   - **Charts:** permits by status, plus one more useful chart, such as permits expiring by week over the next 8 weeks.
   - **Lists:**
     - "Needs attention": corrections required, expiring soon, overdue tasks, permits stalled in review for more than 30 days
     - Recent activity
     - Upcoming deadlines
   - Every item links to the relevant record.

### P1: Day 3 morning

6. **Documents:**
   - Upload to a project or permit.
   - In-app PDF preview (signed URL in an iframe or `<object>`).
   - Download.
   - Upload a new version and see version history.
   - Org-scoped access via storage policies.
7. **Tasks:**
   - Create, assign, set due date and priority, link to a permit, and mark done.
   - A "My tasks" view.
   - Corrections tracking: tasks flagged `is_correction` linked to a permit in corrections required.
8. **Notifications (in-app only):**
   - Bell icon with unread count, a list view, mark read, and mark all read.
   - Event notifications are created inside server actions when a task is assigned to you, or a permit you're assigned to changes status.
   - Time-based notifications (permit expiring in 30, 14, or 7 days; task overdue) come from an idempotent `generateDueNotifications()` function that uses `dedupe_key` to avoid duplicates.
   - Run it daily via a Vercel Cron route protected by a `CRON_SECRET`, and expose a manual trigger for admins in dev and demo.
9. **Reports:**
   - Project permit summary.
   - Pending permits.
   - Expiring within N days.
   - Outstanding corrections.
   - Each report has a CSV export (a route handler that respects RLS) and a clean printable view (print CSS; "Print / Save as PDF" uses the browser).

### P2: Day 3 afternoon, only if P0 and P1 are solid

10. Comments on permits and tasks, if not already done with permits.
11. Mobile polish of tables (card layout on small screens).
12. Global search (command-K) across projects and permits.

**Explicitly out of scope** (don't build, and don't imply they exist in the UI):

- Email or SMS notifications
- Billing
- Government portal integrations
- Automated permit submission
- Official approval verification
- SSO
- Audit export

Somewhere visible, such as the footer or About page, state that PermitFlow tracks permits but does not submit to or verify with government agencies.

---

## 5. UI/UX

**Feel:** Linear and Vercel. Calm, dense but readable, and fast. Usability over animation.

**Layout:**

- Collapsible sidebar: Dashboard, Projects, Permits, Tasks, Documents, Reports, Team, Settings.
- Top bar with the org switcher, notifications bell, theme toggle, and user menu.

**Visual style:**

- Consistent status badges. One color mapping per permit status, defined once and reused everywhere.
- Light and dark mode.
- Consistent spacing scale and typography.

**States and feedback:**

- Every list has a helpful empty state with a primary action, such as "No permits yet. Add your first permit."
- Skeleton loaders via `loading.tsx`.
- Toast confirmations on success; inline field errors from Zod.
- Confirmation dialogs for destructive actions.
- Error boundaries (`error.tsx`) with a retry.

**Quality bar:**

- Responsive at 375px, 768px, and 1280px or wider.
- Accessible: labeled inputs, keyboard navigation, visible focus, sufficient contrast. shadcn/Radix covers most of this; don't break it.

**Marketing page:** a simple landing page at `/` explaining the product in one screen, with "Try the demo" and "Sign up" buttons.

---

## 6. Demo data

Write `supabase/seed.ts`, run with `pnpm db:seed` using the service-role key and safe to re-run. It creates:

- **One fictional org**, for example "Cascade Ridge Builders (Demo)", with 4 users across all three roles. Demo credentials go in the README.
- **6–8 projects** mixing residential new builds, commercial tenant improvements, and renovations, in fictional addresses and fictional or generic jurisdictions.
- **25–35 permits** covering every status and type. Dates are relative to "now", so the dashboard always shows realistic upcoming expirations and overdue items.
- **Tasks:** some overdue, some correction tasks.
- **Activity history and comments.**
- **A few sample PDF documents** generated as simple placeholder PDFs, with multiple versions on at least one.

Also include:

- A "Demo data — all names, addresses, and permits are fictional" banner shown in the demo org.
- A "Try the demo" button that logs in as the demo project manager.
- A `pnpm db:reset-demo` script to restore the demo org.

---

## 7. Testing (minimum bar)

**Unit tests (Vitest):**

- Zod schemas
- The status-transition rule (approved requires a date)
- Dashboard aggregation helpers
- The notification dedupe logic
- CSV formatting

**Integration tests** against local Supabase:

- RLS cross-org isolation for projects, permits, documents, tasks, and storage objects
- Viewer cannot write
- Project manager cannot manage members
- Invite acceptance flow

**E2E tests (Playwright):**

- **Golden path:** register → create org → create project → add permit → assign member → upload PDF → change status to corrections required → create correction task → dashboard numbers update → export CSV.
- Demo login loads the dashboard with data.

**CI:** add a GitHub Actions workflow running typecheck, lint, and unit tests on push. Running integration and e2e tests in CI with the Supabase CLI is a bonus if time allows.

---

## 8. Day-by-day plan (adjust in your proposal, but keep the checkpoints)

**Day 1: Foundation and core data**

- **Phase 0:**
  - Scaffold Next.js with Tailwind and shadcn.
  - Set up ESLint and Prettier and the test runners.
  - Create `CLAUDE.md`, `PROGRESS.md`, and `.env.example`.
  - Initialize Supabase locally.
- **Phase 1:**
  - Write all migrations, RLS policies, and storage policies.
  - Build auth, middleware, onboarding, and the org switcher.
  - Build the app shell: sidebar, top bar, theme, and the shared design system with status badges, empty states, and skeletons.
- **Checkpoint:**
  - Signup → create org → land in the empty dashboard works.
  - RLS isolation tests pass.

**Day 2: The MVP**

- **Phase 2:**
  - Projects CRUD and detail.
  - Permits CRUD, table, and detail.
  - Team management and invites.
  - Activity log.
  - Real dashboard with charts.
  - Seed script.
- **Checkpoint:**
  - All P0 features work end to end on seeded data.
  - The golden path e2e passes up through the steps built so far.

**Day 3: Business features, polish, ship**

- **Phase 3 (morning):** documents with versions, tasks, notifications with the cron route, reports and CSV.
- **Phase 4 (early afternoon):**
  - Full golden path e2e.
  - Responsive and accessibility pass.
  - Security review: grep for service-role usage, test every action as a viewer, check error handling.
  - Fix bugs.
- **Phase 5 (late afternoon):**
  - Write deployment instructions for a hosted Supabase project and Vercel.
  - Walk me step by step through the parts I must do: creating accounts, pasting env vars, running remote migrations, seeding prod demo data.
  - Verify the deployed demo works.
- **Checkpoint:** live URL, demo login working, all checks green.

---

## 9. Rules (copy into CLAUDE.md)

- **No fake functionality.** No button, link, or menu item without a working handler. If a feature isn't built, it isn't in the UI.
- All statistics come from database queries. No hardcoded numbers.
- **Validation and authorization:**
  - Every mutation is validated with Zod on the server.
  - Every mutation is authorized by RLS and a role check.
  - Never rely on client-side filtering for data isolation.
- **Never expose secrets.** The service-role key is used only in `server-only` modules, the seed script, and the cron route.
- Schema changes only via new migration files. Never edit an applied migration.
- **Code structure:**
  - Small, focused files with feature-based folders (`src/features/permits/...`) and a shared `src/components/ui`.
  - Shared types are generated from Supabase (`supabase gen types`).
- Don't claim something works or is production-ready without having run it or tested it.
- Update `PROGRESS.md` before ending any session.

---

## 10. Final deliverables

- **The working app**, deployed on Vercel with a hosted Supabase backend and a working public demo login.
- **`README.md` covering:**
  - what PermitFlow is and who it's for
  - screenshots
  - feature list
  - tech stack
  - local setup in ten or fewer commands
  - demo credentials
  - testing commands
  - known limitations
  - roadmap
- **`docs/ARCHITECTURE.md` covering:**
  - system diagram (Mermaid)
  - data model (ER diagram in Mermaid)
  - the tenancy and RLS design
  - the auth flow
  - file storage design
  - the notifications design
  - key decisions and the trade-offs behind them
- **`docs/DEPLOYMENT.md`:** a step-by-step production setup.
- **Supporting files:** `.env.example`, the migrations, the seed scripts, the test suites, and the CI workflow.

**Ultimate goal:** I'll demo this to construction project managers for feedback and possibly turn it into a commercial product. I'll also show it to engineering hiring managers. Optimize for a product that clearly solves the permit-tracking problem, works reliably, and has code another developer could pick up.

**Begin now with the plan-mode proposal described in section 0.**
