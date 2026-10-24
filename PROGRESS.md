# PermitFlow 2.0: progress log

Read this first in every session, together with `CLAUDE.md`.

## Status: Day 1, Phase 0 complete; Phase 1 started

### Done

- Plan approved (architecture, schema, folders, day plan).
- Next.js 16.4 scaffold: TS strict, Tailwind v4, React Compiler, `cacheComponents` off.
- shadcn/ui (Radix, nova) and base components installed.
- ESLint (with prettier and a service-role import guard), Prettier, Vitest (unit and integration configs), Playwright.
- `supabase init` with ports moved to 553xx, and unused services (realtime, edge, analytics, S3, vector) disabled.
- `src/lib/env.ts` and `src/lib/env.server.ts` with a unit test.
- CLAUDE.md, .env.example, CI workflow (typecheck, lint, format check, unit tests).

### In progress

- First `supabase start` and the Phase 0 green checks and commit.

### Known issues

- None yet.

### Next step

- Phase 1: write the migrations (enums, tenancy and helpers, projects and permits, documents, tasks and comments, activity and notifications triggers, RLS, storage), then `pnpm db:reset && pnpm db:types`.
