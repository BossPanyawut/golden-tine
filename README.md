# Golden Tine — Life OS

Personal life command center: tasks & projects, habits, finance, a second-brain
vault, gamification, personal CRM, weekly review, focus timer, and a
someday/bucket list — all summarized on one daily dashboard. Spec:
[requirement-goldentine.md](./requirement-goldentine.md).

Built as a phased MVP — see the build plan for the full roadmap. **Phase 0
(auth + app shell) is done**; Phases 1–3 layer in the actual modules.

## Stack

Next.js 16 (App Router, TS) · Tailwind v4 + shadcn/ui · Drizzle ORM + Postgres
· Auth.js v5 (Credentials + Google OAuth) · Vitest + Playwright · Vercel + Neon
(target production hosting).

## Local development

Prerequisites: Node 22+, pnpm, Docker.

```bash
cp .env.example .env.local        # fill in DATABASE_URL, AUTH_SECRET, etc.
docker compose up -d postgres     # local Postgres
pnpm install
pnpm db:migrate                   # apply schema
pnpm db:seed                      # creates the bootstrap admin from ADMIN_EMAIL/ADMIN_PASSWORD
pnpm dev
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`. Keep
`ALLOW_PUBLIC_SIGNUP=false` unless you specifically want the `/register` page
open — the bootstrap admin account created by `pnpm db:seed` is the intended
way to get your first login.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / production build / production server |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` / `pnpm test:e2e` | Vitest unit tests / Playwright e2e |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` | Drizzle migration workflow |
| `pnpm db:seed` | Create the bootstrap admin account from env vars |

## Architecture notes

- `src/proxy.ts` — optimistic, cookie-only auth redirect (Next.js 16 renamed
  `middleware.ts` → `proxy.ts`). Not the real security boundary.
- `src/server/auth/dal.ts` — `requireSession()` is the real auth check; every
  Server Component/Action/Route Handler that needs auth calls this, not the
  proxy.
- `src/server/db/schema.ts` — Drizzle schema, including the Auth.js adapter
  tables (`user`, `account`, `session`, `verificationToken`).
- `src/server/services` (added from Phase 1 onward) — business logic (EXP,
  streaks, HP) lives here, not in Server Actions directly.
