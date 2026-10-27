# PermitFlow 2.0: progress log

Read this first in every session, together with `CLAUDE.md`.

## Status: Day 2 complete (Phases 0–2). Next: Day 3, Phase 3.

### Done

**Phase 0**

- Next.js 16.4 scaffold: TS strict, Tailwind v4, React Compiler, `cacheComponents` off.
- shadcn/ui (Radix, nova), ESLint (with prettier and a service-role import guard), Prettier, Vitest, Playwright.
- Supabase CLI as a dev dependency; local ports moved to 553xx.
- CLAUDE.md, .env.example, CI workflow. Node pinned to 24 (`.nvmrc`), because supabase-js needs native WebSocket.

**Phase 1**

- 7 migrations covering:
  - enums
  - tenancy: profiles, orgs, members, invites, RLS helpers, and the `create_organization`, `get_invite`, and `accept_invite` RPCs
  - projects and permits
  - documents, versions, tasks, and comments
  - activity log and notification triggers
  - RLS policies with column grants and the row-ownership trigger
  - the private `documents` storage bucket and its policies
- Supabase server, browser, and admin clients; the session proxy (`src/proxy.ts`); `orgAction` and `getOrgContext`; safe error mapping.
- Auth: signup, login, logout, the `/auth/confirm` route, onboarding (create org), and the invite page with accept.
- App shell: collapsible sidebar, org switcher, top bar, theme toggle, user menu, demo banner, footer disclaimer.
- Shared UI: PageHeader, EmptyState, skeletons, `RouteError`, `not-found`, and `PermitStatusBadge` with status color tokens in `globals.css`.
- Basic landing page at `/`. "Try the demo" comes with the seed in Phase 2.
- Tests:
  - 22 unit
  - 71 integration (RLS isolation for tables and storage, viewer read-only, PM can't manage members, invites, triggers, cascades)
  - 3 e2e (signup → org → dashboard, logout and login, validation, 404 for a foreign org)

**Phase 2** (one commit per step, all pushed)

- Projects: create/edit dialog, admin archive/restore (archived = read-only), list with active/archived views and permit progress, detail page with details, progress, permits, tasks, and activity.
- Permits:
  - add/edit dialogs
  - status dialog (approving requires a date, pre-filled with today; enforced by Zod, `buildStatusPatch`, and the DB CHECK)
  - URL-driven table with search, filters (status incl. "pending", type, project, assignee/unassigned, expiring ≤ N days), sorting, and pagination
  - detail page with notes, tasks, comments, and history; admin delete
- Tasks: create/edit, assignee, due date, priority, link to a permit, correction flag (requires a permit), complete/reopen, overdue highlighting, admin delete. Shown on project and permit pages.
- Team: role changes, remove/leave, last-admin guard, invite links (shown once, hashed, 7-day, single use), pending invites with revoke. Settings: rename org and URL.
- Dashboard: 7 stat cards linking to filtered views, permits-by-status chart (clickable), expiring-by-week chart, needs attention, upcoming deadlines, recent activity. Aggregation is pure and unit tested.
- Demo:
  - `supabase/seed.ts` (`pnpm db:seed`, `pnpm db:reset-demo`) creates Cascade Ridge Builders (Demo) with 4 users, 7 projects, 29 permits, 19 tasks, 4 PDFs (one with 3 versions), comments, and backdated activity
  - "Try the demo" on the landing and login pages
- Migration `20261026000100`: comment activity stores the commented record's name.
- Tests: 64 unit, 71 integration, 11 e2e (including the golden path up to "dashboard numbers update", and the demo login).

### In progress

- Nothing mid-flight.

### Known issues

- In this sandbox, Docker's `desktop` credential helper hangs on image pulls. Workaround:
  `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock DOCKER_CONFIG=<dir with {"auths":{}}> pnpm db:start`.
  On a normal terminal, plain `pnpm db:start` should work.
- Next 16 refuses to run two dev servers in one folder. If `pnpm dev` is running, run e2e with `E2E_PORT=3000 pnpm test:e2e`.
- The desktop app's browser pane can't start servers from ~/Desktop (macOS privacy). Start `pnpm dev` from a terminal and open the URL instead.
- Sidebar nav lists only built pages: Dashboard, Projects, Permits, Team, Settings. Tasks, Documents, and Reports get added in Phase 3.
- The dashboard loads all of an org's permits in one query. PostgREST's default max-rows (1000) caps this; fine for SMB scale, and documented for ARCHITECTURE.
- 'Today' is the UTC calendar day everywhere (expiry, overdue). A user in a US evening sees tomorrow's date sooner.
- 12 orphaned files in the local storage bucket from early integration runs (the cleanup bug is now fixed). Local only and harmless.
- The demo PM can edit demo data. `pnpm db:reset-demo` restores it; a scheduled reset is planned for deployment.

### Next step

- Phase 3 (Day 3 morning), in this order:
  1. documents: upload via signed URL, versions, PDF preview, download; add to project and permit pages
  2. tasks page: My tasks and corrections view
  3. notifications: bell, list, mark read, `generateDueNotifications` with dedupe, cron route, admin "Run now"
  4. reports: 4 reports, CSV routes, print view
  5. extend the golden path with PDF upload and CSV export
- Deployment is waiting on the user running `npx vercel login` and `pnpm supabase login`.
