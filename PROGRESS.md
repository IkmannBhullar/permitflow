# PermitFlow 2.0: progress log

Read this first in every session, together with `CLAUDE.md`.

## Status: Day 1 complete (Phases 0 and 1). Next: Day 2, Phase 2.

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

### In progress

- Nothing mid-flight.

### Known issues

- In this sandbox, Docker's `desktop` credential helper hangs on image pulls. Workaround:
  `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock DOCKER_CONFIG=<dir with {"auths":{}}> pnpm db:start`.
  On a normal terminal, plain `pnpm db:start` should work.
- Next 16 refuses to run two dev servers in one folder. If `pnpm dev` is running, run e2e with `E2E_PORT=3000 pnpm test:e2e`.
- The desktop app's browser pane can't start servers from ~/Desktop (macOS privacy). Start `pnpm dev` from a terminal and open the URL instead.
- Sidebar nav lists only built pages (Dashboard for now). Items are added as each feature lands.

### Next step

- Phase 2, in this order:
  1. projects CRUD and detail
  2. permits CRUD, table, status dialog, and detail with comments and activity
  3. basic tasks
  4. team management and invites UI
  5. the real dashboard
  6. the seed script, demo login, and `db:reset-demo`
  7. extend the golden-path e2e
