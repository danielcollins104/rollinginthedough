# AGENTS.md — Rolling in the Dough (SlotGame)

Social casino slot machine web app (package name `lucky-spins`). Dual currency (Gold/Green Coins), Hold & Win bonus, Square + Coinbase Commerce payments.

Stack: React 19 + Vite 7 + Tailwind 4 (`client/`), Express 4 + tRPC 11 (`server/`), PostgreSQL via Drizzle (`drizzle/`), TypeScript 5.9 strict, pnpm 10, Vitest.

Project-specific notes only. Generic workspace assistant conventions (memory files, heartbeats, group-chat rules) live in `../AGENTS.md`.

## Commands

- `pnpm install` — pnpm is `packageManager`-pinned; install applies `patches/wouter@3.7.1.patch` and builds bcrypt/esbuild (see `onlyBuiltDependencies`).
- `pnpm dev` — `tsx watch server/_core/index.ts`. Express serves the API **and** Vite middleware on one port (default 3000, auto-bumps up to +20 if busy). There is no separate client dev server.
- `pnpm check` — `tsc --noEmit`, currently clean. Note: tsconfig excludes `**/*.test.ts`, so test files are not typechecked here.
- `pnpm test` — `vitest run`: 120 tests, ~5s, environment `node`. Needs **no** DB or env vars; tests degrade gracefully without them.
- `pnpm test <path>` — run one file, e.g. `pnpm test server/cashout.test.ts`.
- `pnpm verify` — `check` + `test`. Run before calling work done; there is no CI and no pre-commit hooks.
- `pnpm db:push` — `drizzle-kit generate && migrate`. Regenerates files in `drizzle/` **and** applies them to the real `DATABASE_URL`. Schema flow: edit `drizzle/schema.ts`, then run this.
- `pnpm format` — Prettier write.
- `pnpm build` / `pnpm start` — Vite build to `dist/public/` + esbuild server bundle to `dist/index.js`.

## Architecture

- Single package (not a monorepo), three zones: `client/` (Vite root), `server/`, `shared/`. Aliases `@/* → client/src` and `@shared/* → shared` are defined in `vite.config.ts`, `vitest.config.ts`, and `tsconfig.json` — keep them in sync.
- Server entrypoint: `server/_core/index.ts`. Middleware order is deliberate: `/health` first (must never be rate-limited), security middleware, OAuth routes, tRPC at `/api/trpc`, Vite/static last, then the 4-arg error handler and 404 fallback.
- The tRPC API is almost entirely **one file**: `server/routers.ts` (~500 lines: game, shop, cashout, auth, referral). `server/routers/` only contains `achievements.ts` — the README implies more.
- Game engine is **client-side**: `client/src/lib/gameLogic.ts` + `client/src/hooks/useGameState.ts` (paylines, Hold & Win, cascading, near-miss; base RTP ~70% — guarded by `paytable.sim.test.ts`, run before touching weights/payouts). The server only validates/records results (`server/antiCheatValidation.ts`). Payout/math changes go in `client/src/lib` + its tests.
- All DB access goes through helpers in `server/db.ts`. `getDb()` is lazy and returns `null` when `DATABASE_URL` is missing, so dev server and tests start without Postgres (DB ops no-op with warnings).
- Auth: bcrypt credentials + JWT cookie session (`server/auth.ts`), plus a Supabase OAuth callback in `server/_core/oauth.ts`. Supabase is **not** the data layer — `client/src/lib/supabase.ts` has no importers.
- UI: shadcn-style components in `client/src/components/ui` (`components.json`, new-york style; `cn()` in `client/src/lib/utils.ts`).

## Testing

- Tests are colocated: `server/*.test.ts` and `client/src/**/*.test.ts` (only these are picked up by `vitest.config.ts`).
- Server tests build a tRPC caller with a mocked `TrpcContext` — copy the pattern from `server/shop.test.ts`. Payment tests assume Square/Coinbase are unconfigured and expect "not configured" results; Square runs in `Production` mode whenever `SQUARE_ACCESS_TOKEN` is set.
- Client game-logic tests are pure-function tests of `lib/` and `hooks/`.

## Gotchas (hard-earned — read before changing related code)

- **CSRF is intentionally OFF** in `applySecurityMiddleware`: the client never sends `X-CSRF-Token`, so enabling it 403s every mutation (SECURITY_AUDIT.md finding #2). Implement the client round-trip before enabling.
- Middleware/CSP changes break things easily: Google Fonts must stay in `styleSrc`/`fontSrc`, COEP stays disabled, and `trust proxy 1` is required or express-rate-limit v8 throws behind Render/NGINX. Read `SECURITY_AUDIT.md` before touching `server/_core/securityMiddleware.ts`.
- **wouter is patched** (`patches/wouter@3.7.1.patch`) to expose route paths on `window.__WOUTER_ROUTES__` for preview tooling. Bumping wouter means porting or dropping that patch; a pnpm override also pins `tailwindcss>nanoid@3.3.7`.
- Drizzle is PostgreSQL now; `drizzle/_mysql_old_backup/` and `server/seed-packages.mjs` are legacy MySQL. If the shop shows no coin packages, seed with `node server/seed-packages.pg.mjs` (needs `DATABASE_URL`).
- **Dockerfile is stale**: it COPYs from `lucky-spins-source/lucky-spins-source/`, a nested archive layout that does not exist here — `docker build` from repo root fails until paths are rewritten. `render.yaml` deploys use `npm install && npm run build`, so pnpm patches/overrides silently don't apply there.
- `.env` already exists with working local values (`DATABASE_URL=postgresql://localhost/lucky_spins`); `.env.example` is the template. Don't overwrite or commit `.env`.

## Docs map

- `README.md` — features and stack.
- `SECURITY_AUDIT.md` — live security decisions; read before touching security middleware, cookies, or payments.
- `IMPLEMENTATION_PLAN.md` / `todo.md` / `docs/IMPROVEMENT_GUIDE.md` — roadmap and history.
- The repo root contains many agent-persona/meta files (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `memory/`, `.manus/`) — they are not product docs; ignore them for app work.
