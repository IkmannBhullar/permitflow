# PermitFlow 2.0: progress log

Read this first in every session, together with `CLAUDE.md`.

## Status: Phases 0–4 complete (P0, P1, and the ⌘K search from P2). Next: Phase 5 (docs and deploy).

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

**Phase 3** (one commit per step, all pushed)

- Documents:
  - two-step upload: `prepareUpload` issues a signed upload URL; the browser uploads straight to Storage; `finalizeUpload` re-reads the real size and type
  - versions, version history, inline PDF/image preview (5-minute signed URL), 60-second signed downloads, admin delete that removes the files
  - a Documents page, plus sections on the project and permit pages
- Permit history includes linked tasks and documents. Card titles are `h2`.
- Tasks page: My tasks, Overdue (linked from the dashboard), Corrections (permits waiting on corrections, flagged when none has an open correction task), All open.
- Notifications:
  - bell with unread count, Notifications page, mark read and mark all read
  - `computeDueNotifications` (pure): 30/14/7-day expiry and overdue-task reminders with dedupe keys
  - `generateDueNotifications`, run by `/api/cron/due-notifications` (Bearer `CRON_SECRET`) daily via `vercel.json`, plus an admin "Check due dates now" button
- Reports: project summary, pending, expiring (7–90 days), outstanding corrections. Each has a CSV route (RLS, formula-injection safe, BOM) and print / save-as-PDF styles.
- E2E runs against a production build (`pnpm build && pnpm start` on :3100), and the demo is reset before every run (global setup).
- Local Supabase no longer starts Studio or Mailpit, to save CPU on this machine.
- Tests: 94 unit, 76 integration, 18 e2e. The golden path covers the brief's full flow: register → org → project → permit → assign → upload PDF → corrections → correction task → dashboard numbers → CSV export.

**Phase 4** (one commit per step, all pushed)

- Responsive:
  - fixed page overflow at 768 and 1280 (`min-w-0` on the content column)
  - table columns hide by the table's own width (container queries)
  - charts no longer animate
  - e2e: 14 pages × 3 breakpoints, no sideways scroll and no clipped tables
- Accessibility:
  - axe WCAG 2.1 AA scan of 19 pages and dialogs in light and dark mode: zero violations
  - fixed contrast (avatar initials, destructive red, ⌘K badge, search result details)
  - accessible names now include visible text
  - skip link
  - keyboard-only e2e
- Security:
  - service role only in the cron route and seed; no secrets in client bundles; no raw errors returned
  - `orgAction` authorizes before validating
  - unit test calls every Server Action as a viewer and as a PM
  - more viewer RLS tests
  - security headers (CSP frame-ancestors, XFO, nosniff, referrer, permissions, HSTS)
  - signed-out, export, and open-redirect e2e tests
  - production dependency audit is clean
- P2 ⌘K search: projects and permits by name, address, application #, or jurisdiction. Quick navigation when empty. The highlight resets to the first result on each query.
- Tests: 97 unit, 77 integration, 28 e2e.

### In progress

- Nothing mid-flight.

### Known issues

- In this sandbox, Docker's `desktop` credential helper hangs on image pulls. Workaround:
  `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock DOCKER_CONFIG=<dir with {"auths":{}}> pnpm db:start`.
  On a normal terminal, plain `pnpm db:start` should work.
- `pnpm test:e2e` builds and starts production on :3100, so it can run alongside `pnpm dev` on :3000. `E2E_PORT=3000` reuses the dev server instead (slower; dev compiles on first visit).
- The desktop app's browser pane can't start servers from ~/Desktop (macOS privacy). Start `pnpm dev` from a terminal and open the URL instead.
- The dashboard loads all of an org's permits in one query. PostgREST's default max-rows (1000) caps this; fine for SMB scale, and documented for ARCHITECTURE.
- 'Today' is the UTC calendar day everywhere (expiry, overdue). A user in a US evening sees tomorrow's date sooner.
- 12 orphaned files in the local storage bucket from early integration runs (the cleanup bug is now fixed). Local only and harmless.
- The demo PM can edit demo data. `pnpm db:reset-demo` restores it; a scheduled reset is planned for deployment.
- The landing page is static, so whether "Try the demo" shows is decided at build time from `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`. Redeploy after changing them.
- Headless Chromium shows the "Open the PDF" fallback instead of an inline PDF; real browsers render it inline.
- If an upload is abandoned between `prepareUpload` and `finalizeUpload`, the stored file stays orphaned (only admins can delete files). Rare and harmless; a cleanup job is possible later.
- This machine's Docker VM (3.8 GB) also runs other projects' databases, so heavy load slows tests. Production-build e2e avoids most of it.
- No app-level rate limiting on Server Actions; Supabase Auth rate-limits login and signup. Acceptable for a demo, worth adding before charging customers.
- CSP covers framing, base, and form targets only. A full `script-src` policy needs nonces for Next's inline runtime and next-themes.
- A demo visitor could change the demo PM's password or email through the Supabase Auth API with their session. The planned daily demo reset restores it.
- P2 not done: comments on tasks, and card layout for tables on phones (tables already adapt by hiding columns).

### Next step

- Phase 5:
  1. `README.md` (what, who, screenshots, features, stack, setup in ≤10 commands, demo credentials, tests, limitations, roadmap)
  2. `docs/ARCHITECTURE.md` (Mermaid system and ER diagrams, tenancy/RLS, auth, storage, notifications, decisions)
  3. `docs/DEPLOYMENT.md`
  4. daily demo reset
  5. deploy: hosted Supabase (`supabase link` and `db push`), Vercel env vars, prod seed, verify the live demo
- Deployment is waiting on the user running `npx vercel login` and `pnpm supabase login`.
