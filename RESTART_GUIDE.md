# Rolling in the Dough — Restart Guide

How to get this project running on a fresh computer.

**Status at backup:** Working dev build. Runs on `http://localhost:3000`, connected to
Supabase (project `jybwtekawwhvzxxkpxsa`), 11 DB tables created, 5 coin packages seeded,
signup/auth verified.

---

## What's in this backup

This archive (`rollinginthedough-backup-*.tar.gz`) contains the full project source EXCEPT
`node_modules` (which is huge and gets rebuilt by `pnpm install`).

It **includes `.env`** with your live secrets, so keep this archive private (it's fine in
your personal Google Drive — just don't share the file).

---

## Prerequisites on the new computer

1. **Node.js** v20+ (built/tested on v24). Get it from https://nodejs.org
2. **pnpm** v10 (package manager this project uses):
   ```bash
   npm install -g pnpm@10.4.1
   ```
3. **git** (optional, only if you want to pull updates from GitHub instead of this archive)

---

## Restart steps

### Option A — From this backup archive (fastest)

```bash
# 1. Extract the archive wherever you want the project
tar -xzf rollinginthedough-backup-*.tar.gz
cd rollinginthedough

# 2. Install dependencies (rebuilds node_modules, ~1-2 min)
pnpm install

# 3. Approve native build scripts (bcrypt, esbuild, tailwind)
#    package.json already lists these under pnpm.onlyBuiltDependencies,
#    but if the binaries are missing, force it:
pnpm rebuild bcrypt esbuild @tailwindcss/oxide

# 4. Make sure the database tables exist (safe to re-run; no-op if already there)
pnpm db:push

# 5. (Optional) Seed coin packages if the shop is empty
node server/seed-packages.pg.mjs

# 6. Start the dev server
pnpm dev
```

Then open **http://localhost:3000**

### Option B — Fresh clone from GitHub

```bash
gh repo clone danielcollins104/rollinginthedough
cd rollinginthedough
# .env is NOT in GitHub (secrets excluded). Copy your .env from this backup into the folder.
cp /path/to/backup/.env .env
pnpm install
pnpm db:push
pnpm dev
```

---

## The .env (your secrets — what each is)

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection (transaction pooler, port 6543) |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Public/anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key — NEVER expose publicly |
| `JWT_SECRET` | Session signing secret |

**Supabase project:** `jybwtekawwhvzxxkpxsa` (dashboard: https://supabase.com/dashboard)

---

## ⚠️ SECURITY TODO (do before launch)

The DB password and service_role key were exposed during setup. **Before this app goes
public or touches real users, rotate them:**

1. Supabase → Settings → Database → **Reset database password**
2. Supabase → Settings → API Keys → Legacy → roll **service_role** key
3. Update `.env` with the new values, then `pnpm dev` to restart.

---

## Tech stack reference

- **Frontend:** React 19 + Vite + Wouter + Radix UI + Tailwind
- **Backend:** Express + tRPC (`server/_core/index.ts`)
- **DB:** Drizzle ORM → Supabase Postgres
- **Auth:** bcrypt + JWT sessions + CSRF protection
- **Payments:** Square + Coinbase Commerce (sandbox)
- **Scripts:** `pnpm dev` (run) · `pnpm db:push` (migrate) · `pnpm test` (vitest) · `pnpm build` (prod)
