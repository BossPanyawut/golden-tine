# Deploying Golden Tine to production

Stack: Vercel (app + cron) + Neon (Postgres) + Cloudflare R2 (storage, Phase 3)
+ Upstash Redis (rate-limit, Phase 2). This covers the Phase 0 milestone —
login working in production. R2/Upstash aren't needed until later phases.

## 1. Push the code

```bash
git push -u origin main
```

## 2. Create the Neon Postgres project

1. [neon.tech](https://neon.tech) → New Project → pick a region close to you.
2. Copy the **direct** (unpooled) connection string — the `postgres` client is
   configured with `prepare: false`, so either the pooled or direct string
   works, but direct is simpler for a single-user app and is what you'll use
   for the one-off migrate/seed commands below either way.

## 3. Import the project into Vercel

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → select
   `BossPanyawut/golden-tine`. Framework preset (Next.js) is auto-detected.
2. Before deploying, add these Environment Variables (Production + Preview):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string from step 2 |
   | `AUTH_SECRET` | output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
   | `ALLOW_PUBLIC_SIGNUP` | `false` |
   | `ADMIN_EMAIL` | your email — becomes the bootstrap login |
   | `ADMIN_PASSWORD` | a real strong password (only used once, for seeding) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional, skip for now — see step 6 |

## 4. Apply the schema to the production database

Run from your machine, pointed at the Neon URL (not your local Docker one):

```bash
DATABASE_URL="<neon connection string>" pnpm db:migrate
```

## 5. Seed the bootstrap admin account

```bash
DATABASE_URL="<neon connection string>" \
ADMIN_EMAIL="<your email>" \
ADMIN_PASSWORD="<your password>" \
pnpm db:seed
```

This is the only account that can log in — `ALLOW_PUBLIC_SIGNUP=false` keeps
`/register` closed in production.

## 6. Deploy

Trigger the deploy in Vercel (it usually auto-deploys right after import).
Watch the build log for the same clean output you saw locally: proxy +
routes listed, no errors.

## 7. Smoke test

- Visit `https://<your-domain>/login`
- Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Confirm the dashboard loads, sidebar nav works, and logging out returns you
  to `/login`

## 8. Optional: Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   Create OAuth client → Authorized redirect URI:
   `https://<your-domain>/api/auth/callback/google`
2. Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to Vercel env vars →
   redeploy. The provider only appears on the login page once both are set.

## Later phases

Cloudflare R2 (file storage) and Upstash Redis (rate limiting) env vars are
already stubbed in `.env.example` — wire those up when Phase 2/3 actually
need them, no need to provision them now.
