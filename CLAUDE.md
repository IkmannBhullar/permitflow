# PermitFlow 2.0: notes for Claude Code

A multi-tenant SaaS for construction companies to track building permits across projects.

**At the start of every session, read `PROGRESS.md`.** It records what's done, what's in flight, and the exact next step. The original brief is `PERMITFLOW_BUILD.md`. The approved plan is summarized in `docs/ARCHITECTURE.md` (written in Phase 5); until then, the brief and PROGRESS.md are the source of truth.

@AGENTS.md

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Compiler) with strict TypeScript. `cacheComponents` is deliberately off, because every page is per-user and dynamic.
  - Middleware is `src/proxy.ts` (renamed from `middleware.ts` in Next 16).
  - Read `node_modules/next/dist/docs/` before using an unfamiliar Next API.
- **UI:** Tailwind v4, shadcn/ui (Radix, "nova" preset), `lucide-react`, `next-themes`, `sonner` toasts.
  - shadcn forms use the `Field` components with React Hook Form `Controller`. There's no `form.tsx`.
- **Backend:** Supabase (Postgres, Auth, Storage) through `@supabase/ssr`. The Supabase CLI is a dev dependency, so run it as `pnpm supabase …`.
- **Libraries:** Zod v4, React Hook Form, TanStack Table v8, Recharts (via shadcn `chart`).
- **Tests:** Vitest for unit and integration tests, Playwright for e2e. Package manager is pnpm.

## Commands

```bash
pnpm dev                 # Next dev server on :3000
pnpm db:start            # local Supabase (Docker). API :55321, DB :55322, Studio :55323, Mailpit :55324
pnpm db:reset            # drop and re-apply every migration (wipes local data)
pnpm db:types            # regenerate src/lib/supabase/database.types.ts after a migration
pnpm db:seed             # create or refresh the demo org (idempotent)
pnpm db:reset-demo       # wipe and recreate the demo org
pnpm typecheck && pnpm lint && pnpm test   # = pnpm check
pnpm test:integration    # RLS and DB tests against local Supabase
pnpm test:e2e            # Playwright (starts next dev on :3100; if `pnpm dev` is already running, use E2E_PORT=3000)
pnpm format              # Prettier (no semicolons, double quotes, 100 cols)
```

Local Supabase uses the **553xx ports**. Another project on this machine occupies the default 543xx ports.

**Phase gate:** before committing at the end of a phase, all of these must be green: typecheck, lint, test, test:integration, and test:e2e.

## Folder layout

```
supabase/migrations/      SQL migrations (append-only)
supabase/seed.ts          demo data (service-role key; run with tsx)
src/proxy.ts              session refresh and route gating
src/app/                  routes only; keep pages thin
  (marketing)/ (auth)/ onboarding/ invite/[token]/
  app/[orgSlug]/...       the tenant app; the layout guards membership
  api/cron/...            the only place the service-role client is allowed
src/features/<feature>/   queries.ts (server reads), actions.ts ("use server"), schemas.ts (Zod),
                          components/, *.test.ts next to the logic they test
src/components/ui/        shadcn primitives (generated; edit sparingly)
src/components/           shared app components (app shell, data table, empty state, …)
src/lib/                  supabase clients, env, action helpers, error mapping, dates
tests/integration/        Vitest against local Supabase (RLS, storage, invites)
tests/e2e/                Playwright
```

## Conventions

- **Reads** happen in Server Components, through `features/*/queries.ts`, using the user-scoped server client.
- **Mutations** are Server Actions in `features/*/actions.ts`. Each one:
  - parses its input with the feature's Zod schema; the same schema drives the form's `zodResolver`
  - re-checks the caller's org role for a friendly error, while RLS is the real guard
  - returns an `ActionResult` (`{ ok: true, data } | { ok: false, error, fieldErrors? }`)
  - never throws raw database errors to the client; map them through `src/lib/errors.ts`
- **Tenancy:**
  - Every tenant table has `org_id`, and routes are `/app/[orgSlug]/…`.
  - Never filter tenant data only on the client.
  - Composite foreign keys keep children in their parent's org.
- **Activity log and event notifications** are written by database triggers, not app code. Don't insert into `activity_log` or `notifications` from actions.
- **Permit status colors** are defined once, in `src/features/permits/status.ts`. Always render status with `<PermitStatusBadge>`.
- **Imports:** use the `@/` alias. Files are kebab-case and components are PascalCase.
- **Comments** explain why, not what.
- **Commits:** small commits within a phase, and one clear commit at the end of each phase.

## Rules (from the brief, section 9)

- **No fake functionality.** No button, link, or menu item without a working handler. If a feature isn't built, it isn't in the UI.
- All statistics come from database queries. No hardcoded numbers.
- **Validation and authorization:**
  - Every mutation is validated with Zod on the server.
  - Every mutation is authorized by RLS and a role check.
  - Never rely on client-side filtering for data isolation.
- **Never expose secrets.**
  - The service-role key is used only in `server-only` modules, the seed script, and the cron route.
  - ESLint blocks importing `@/lib/supabase/admin` outside `src/app/api/cron/**`.
- Schema changes only via new migration files. Never edit an applied migration.
- **Code structure:**
  - Small, focused files with feature-based folders (`src/features/permits/...`) and a shared `src/components/ui`.
  - Shared types are generated from Supabase (`pnpm db:types`).
- Don't claim something works or is production-ready without having run it or tested it.
- Update `PROGRESS.md` before ending any session.
