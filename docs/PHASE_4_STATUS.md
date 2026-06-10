# Phase 4 Status — Performance Optimization

Audit of `IMPROVEMENT_PLAN.md` Phase 4 against the live code and a
production build, as of 2026-06-10. Same pattern as the Phase 1,
Phase 2, and Phase 3 audits.

---

## Headline

Phase 4 is **mostly not done**. The plan's six bullets are real,
the measurements show real wins, and the work is mostly
uncontroversial. The one surprising finding is that the codebase
has **two sizeable dead-code files** (`ComponentShowcase.tsx` and
`DebugPanel.tsx`) that are 1,580 lines of repo clutter — Vite
already tree-shakes them, but they pollute `git grep` and
`codebase-inspection` results, and they read like shipped
features when they aren't.

The current production bundle is **797.34 kB JS / 215.97 kB
gzipped** in a single chunk, with Vite's own warning
"Some chunks are larger than 500 kB after minification.
Consider: Using dynamic import() to code-split the application".
That's the plan, written in build output.

### Measured build (2026-06-10, `npm run build`)

```
dist/public/index.html                 368.14 kB │ gzip: 105.74 kB
dist/public/assets/index-5cUH3RXV.css  167.68 kB │ gzip:  25.41 kB
dist/public/assets/index-D0dYpdUr.js   797.34 kB │ gzip: 215.97 kB

(!) Some chunks are larger than 500 kB after minification.
1804 modules transformed.
```

The HTML being 368 kB unminified is a real production bug — see Gap E.

---

## Item-by-item status

### 1. ❌ Code splitting for route-based splitting

**Status:** NOT DONE. All 6 routed pages are statically imported
in `client/src/App.tsx`:

```tsx
import Home from "./pages/Home";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
```

Then `<Switch><Route path="/" component={Home} /> ...</Switch>` —
classic wouter setup with zero code splitting. Every page is in
the initial bundle. The bundle has 1,804 modules transformed and
ships as one 797 kB JS chunk.

**The fix is mechanical:** replace the 6 static imports with
`React.lazy(() => import(...))` calls, wrap the `<Router>` in
`<Suspense fallback={...}>`. The wouter docs cover this. The
user-facing impact is real: a player hitting `/` for the first
time shouldn't have to download PrivacyPolicy.tsx (280 lines of
legal text) or ComponentShowcase.tsx (1,437 lines of dev-only
component showcase).

**Action:** small, clean, one commit. See Gap A.

### 2. ❌ Lazy loading for non-critical components

**Status:** NOT DONE. `client/src/components/` has 24 components
(11,885 total lines). The biggest:

| Component | Lines | Notes |
|-----------|------:|-------|
| `SlotMachine.tsx` | 1,912 | Core game, must be in initial bundle |
| `ReferralScreen.tsx` | 663 | Modal/overlay, deferred load is fine |
| `BonusWheel.tsx` | 634 | Only shown on bonus trigger |
| `BonusGameOverlay.tsx` | 619 | Only shown on bonus trigger |
| `CoinShop.tsx` | 607 | Only shown when user clicks "shop" |
| `GameHeader.tsx` | 442 | Core, in initial bundle |
| `BigWinOverlay.tsx` | 381 | Only shown on big wins |
| `PurchaseConfirmModal.tsx` | 344 | Only shown on shop checkout |
| `AIChatBox.tsx` | 335 | Only shown if user opens chat |

The bonus-game and shop-flow components are the obvious targets.
None of them is currently lazy-loaded.

**Honest scope caveat:** lazy-loading `BonusGameOverlay` and
`BonusWheel` would help the *first-paint* metric but probably
*not* the ongoing gameplay FPS, because once the user triggers a
bonus, the bundle has already loaded (since the module is in
the initial chunk). The right architecture is a route-level
boundary for the legal pages, plus lazy-loading the bonus flow
behind a state-based boundary in `Home.tsx`. See Gap A for the
route-level plan; component-level lazy loading is Gap B.

### 3. ❌ Bundle size optimization by removing unused dependencies

**Status:** PARTIALLY DONE. `package.json` has 72 dependencies
(total). Many are used; some aren't. The candidates worth
auditing (this turn did not run `npm ls` or bundle-visualization
tooling, so this is a hypothesis from grep, not measurement):

- `client/src/components/ui/` has 50 shadcn-style components.
  Most are used, but a few (`chart.tsx`, `command.tsx`,
  `calendar.tsx`, `carousel.tsx`, `drawer.tsx`, `input-group.tsx`)
  are heavy pulls (`recharts`, `react-day-picker`, `cmdk`,
  `embla-carousel-react`, `vaul`, `input-otp`). They may or may
  not be imported by any component.

- `client/src/_core/audioEngine.ts` is **never imported** (verified
  by grep across the entire repo). It's ~335 lines but only
  contributes to the build if imported — and it isn't, so
  Rollup tree-shakes it. The cost is repo clutter, not bundle
  size.

- `client/src/lib/soundsPsychology.ts` and `client/src/lib/soundManager.ts`
  are both partially used (only 2 of 9 psychology exports, ~half
  of soundManager). Same story: tree-shaken, just clutter.

**The real win here isn't a single dependency removal; it's
shaving the dependency list to what's actually used.** A
`depcheck` run would surface it. Not done this turn.

**Action:** depends on bundle analyzer output. The big-ticket
deps to check are `recharts`, `react-day-picker`, `cmdk`,
`embla-carousel-react`, `vaul` (each ~30-60 kB gzipped). The
expected win if 3-4 of these are unused: 100-200 kB gzipped.

### 4. ❌ React.memo for expensive components

**Status:** NOT DONE. **Zero `React.memo` usage anywhere in
`client/src/`.** Verified by grep — 0 matches for
`React.memo|memo(` across the whole client tree.

Components that would benefit:
- `SlotMachine.tsx` is 1,912 lines and is the root of the game
  tree. It re-renders on every state change (coins, bet, spin
  count, sound, level, xp, etc.). It would benefit from memoization
  *internally* for the static subtrees (the reel frame, the
  payline selector, the bottom utility row), not from wrapping
  SlotMachine itself in memo (the parent re-renders all the
  time).
- `PaylineHighlight.tsx` re-renders on every spin animation
  frame. With 25 possible paylines, only the winning ones
  should be rendered/highlighted, but the current code maps
  over `winLines` and creates new elements on every render.
  Worth memoizing the highlight components so the animation
  engine doesn't trash the JS heap.
- `WinParticles.tsx`, `CoinParticles.tsx`, `ConfettiEffect.tsx`
  are 3 separate rAF-driven particle systems that all run
  simultaneously on a jackpot (already flagged as Gap D in
  `docs/PHASE_2_STATUS.md`).

**Action:** real, but requires measurement to know which
re-renders are expensive. The right first step is to add
`why-did-you-render` to the dev build (1 line in `main.tsx`)
and let it tell us which components are thrashing. Without
that, memo is a guess.

### 5. ✅ Image asset optimization

**Status:** N/A. `client/public/` is **40 K total** — no PNG,
JPG, WebP, or other raster assets. The app uses inline SVG
(icons), CSS gradients, and Unicode emoji for all visual
elements. This is intentional (per the huntress/cash retheme
on `improvements/phase-1`) and is the right call for a
slot-machine app where most of the "imagery" is geometric
shapes, particles, and payline highlights.

**No action.**

### 6. ❌ Performance monitoring and reporting

**Status:** PARTIALLY DONE. The codebase has a Vite dev-time
debug collector (`vitePluginManusDebugCollector` in
`vite.config.ts`) that writes browser logs to `.manus-logs/`.
It's dev-only (the plugin returns early for `process.env.NODE_ENV
=== "production"`). That's a "monitoring" tool but it's a
debugging tool, not a production perf monitor.

There is **no production-side monitoring**:
- No web-vitals reporter (no `web-vitals` import)
- No performance observer (no `PerformanceObserver` usage)
- No Sentry / DataDog / RUM SDK
- No "report to backend" pattern for FPS, LCP, CLS, INP

For a slot-machine app where the game's feel (animation
smoothness, sound latency) is the product, the absence of
production monitoring is the biggest miss. You can't fix what
you don't measure.

**Action:** medium-sized. `npm install web-vitals` (1.7 kB
gzipped) and a 20-line `reportWebVitals` helper that POSTs to
`/api/metrics` would be the start. See Gap C.

---

## Dead code worth deleting

The grep uncovered two files that are in the repo but not
imported anywhere:

| File | Lines | Notes |
|------|------:|-------|
| `client/src/pages/ComponentShowcase.tsx` | 1,437 | Demos all the UI components. Was probably a development aid that the team moved past. Vite already tree-shakes it from the build, but the file pollutes the repo. |
| `client/src/components/DebugPanel.tsx` | 143 | Dev panel showing "game statistics and analytics for testing". Also never wired up. Same story. |

**Net: 1,580 lines of dead code.** Deleting them shrinks `git
grep` and `codebase-inspection` results, removes two
misleading file names, and has zero runtime impact. Trivial,
clean commit. See Gap D.

---

## Gaps and follow-ups

### Gap A: Route-level code splitting

**Status: SHIPPED** (commit `5118782`-ish, see the route-level
chunks in the bundle output below). The fix is in
`client/src/App.tsx` — 5 of the 6 routed pages are now
`React.lazy()`-loaded, the Router is wrapped in `<Suspense>`,
and there's a small `PageLoading` fallback that matches the
dark "Art Deco Opulence" theme.

The expected-vs-measured comparison is interesting:
**Home stays in the initial bundle** (not lazy-loaded). Home
imports SlotMachine (1,912 lines), CoinShop (607 lines),
BonusGameOverlay (619 lines), and most of the game's heavy
components. Lazy-loading Home would force a Suspense
fallback for the landing page on every cold load *and*
would not save meaningful bytes (its imports are the
bulk of the game's runtime). The audit doc's prediction
was "1-2 of the 6 page chunks no longer included" — the
real answer turned out to be 5 of 6 (everything except
Home), because the other 5 pages are small and pull in
fewer components.

Post-fix bundle (measured, 2026-06-10):

```
dist/public/index.html                            1.31 kB │ gzip:   0.66 kB
dist/public/assets/index-5cUH3RXV.css           167.68 kB │ gzip:  25.41 kB
dist/public/assets/NotFound-Cwx5DXXU.js           2.61 kB │ gzip:   0.98 kB
dist/public/assets/CheckoutSuccess-B_SCAkEb.js    4.31 kB │ gzip:   1.61 kB
dist/public/assets/Pricing-bn5reB8f.js            8.53 kB │ gzip:   2.57 kB
dist/public/assets/TermsOfService-Bm0cow9P.js    14.52 kB │ gzip:   3.35 kB
dist/public/assets/PrivacyPolicy-CG-lss5g.js     19.95 kB │ gzip:   3.93 kB
dist/public/assets/index-Dk-o36ld.js            749.84 kB │ gzip: 207.07 kB
```

Compared to pre-fix:

| Metric | Pre-fix | Post-fix | Delta |
|--------|--------:|---------:|------:|
| Initial JS | 797.34 kB | 749.84 kB | **-47.50 kB** (-6.0%) |
| Initial JS (gzip) | 215.97 kB | 207.07 kB | **-8.90 kB** (-4.1%) |
| Lazy chunks total | (in main) | 49.92 kB | extracted |
| Lazy chunks total (gzip) | (in main) | 12.44 kB | extracted |

A user landing on `/` now downloads 8.90 kB less gzipped
JS to parse before first paint. A user clicking "Privacy
Policy" downloads an additional 3.93 kB on demand. The
largest single lazy chunk is PrivacyPolicy (19.95 kB / 3.93
gzip), the smallest is NotFound (2.61 kB / 0.98 gzip).

The wouter `<Route component={...}>` pattern works
correctly with `React.lazy` — wouter calls
`h(component, {params})` and treats lazy components
like any other component. No special integration needed.

Verified: 109/109 tests passing, tsc clean, all 5 lazy
chunks have distinct content (verified by grep for page
names in chunk files).

### Gap B: Lazy-load bonus and shop components

**The fix:** the bonus and shop components are conditional
state-driven UI inside `Home.tsx`. Wrap them in lazy imports
and only resolve when the relevant state is set. Pattern:

```tsx
const BonusGameOverlay = useMemo(
  () => lazy(() => import("@/components/BonusGameOverlay")),
  []
);
const CoinShop = useMemo(
  () => lazy(() => import("@/components/CoinShop")),
  []
);
```

**Risk:** higher than Gap A. `useMemo(lazy(...))` is a real
footgun (the inner `import()` re-runs on every render if the
deps change). The correct pattern uses `useState` + a
`useEffect`, or a top-level module-level variable. Worth doing
carefully.

**Expected impact:** moderate. Bonus/shop components are large
but only relevant to specific user flows. A first-time visitor
who just plays 5 spins never needs to download
`BonusGameOverlay.tsx` (619 lines) or `CoinShop.tsx` (607 lines).
On the other hand, a player who lands on the homepage and
immediately clicks the shop button sees a 50-200 ms delay while
the chunk loads. That's a real UX trade-off.

**Effort:** 1-2 hours, one or two commits. Worth doing
**after** measuring whether the bundle size or the UX delay is
the bigger problem.

### Gap C: Production-side performance monitoring

**The fix:** add `web-vitals` (1.7 kB gzipped) and a small
`reportWebVitals` helper that batches and POSTs to a new
`/api/metrics` endpoint. Get the LCP, CLS, INP, and TTFB
values into a backend table. The minimum viable version:

```ts
import { onLCP, onCLS, onINP, onTTFB } from "web-vitals";

export function reportWebVitals() {
  const send = (metric: { name: string; value: number; id: string }) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: location.pathname,
      ts: Date.now(),
    });
    navigator.sendBeacon("/api/metrics", body);
  };
  onLCP(send);
  onCLS(send);
  onINP(send);
  onTTFB(send);
}
```

Then a backend route that just stores the rows. No aggregation,
no dashboard, no real-time alerts — just *recording the data*
so the team can ask "what was the LCP for /home on mobile in
the last 7 days" and get an answer.

**Expected impact:** indirect but real. You can't optimize what
you don't measure, and the current codebase has zero
production-side perf data.

**Effort:** 1-2 hours for the client + server route. No
dashboard work (that's a separate task). One commit each
side, plus a docs entry.

### Gap D: Delete dead code (1,580 lines)

**Status: SHIPPED.** Both files deleted in commit (this turn's
fix). Verified before deletion: zero importers across the entire
repo (grep on `ComponentShowcase` and `DebugPanel` matched only
the audit doc itself, the self-export, and... nothing else).
After deletion: build output is byte-identical to pre-delete
(750 kB main chunk, same lazy chunks, no new entries) — confirms
Vite was already tree-shaking both files. Tests still 109/109,
tsc clean.

| File | Lines (pre) | Status |
|------|------------:|--------|
| `client/src/pages/ComponentShowcase.tsx` | 1,437 | deleted |
| `client/src/components/DebugPanel.tsx` | 143 | deleted |
| **Total** | **1,580** | **deleted** |

Net: `client/src/pages/` shrank from 2,840 to 1,403 lines
(-50.6%). `client/src/components/` shrank from 11,885 to
11,742 lines (-1.2%). Repo is noticeably easier to navigate
and `codebase-inspection` results are cleaner.

**The right answer was always "no, these files were never
useful in their current location."** Vite tree-shook them
from any build, so they never affected runtime. They only
existed in the repo as clutter.

### Gap E: 368 kB index.html is a real production bug

The build output shows `index.html  368.14 kB`. The source
`client/index.html` is 1.3 kB. The 367 kB delta is a
**synchronous, parser-blocking `<script id="manus-runtime">`**
injected by the `vitePluginManusRuntime` plugin (loaded
unconditionally in `vite.config.ts:9`).

The injected script is 274 KB of inline JavaScript containing
the Manus platform's live-edit / DOM-selector dev tool —
React 19 internals (`createPortal`, `flushSync`, all the
event systems), `@medv/finder`, `modern-screenshot`,
`clsx`, `nanoid`, and the entire edit-history / undo-redo
implementation. It's the equivalent of a "click to edit
anything on the page" tool that the Manus platform uses
for previews.

The bug: this script ships in **production** because
`vitePluginManusRuntime()` is added to the plugins array
unconditionally, with no `process.env.NODE_ENV` guard.
The user's own custom `vitePluginManusDebugCollector`
function (defined in `vite.config.ts`) does have such a
guard, but the imported `vitePluginManusRuntime` doesn't.

The user-visible impact: a first-time visitor to
`/` receives a 368 kB HTML document (105 kB gzipped) and
the browser blocks on parsing and executing 274 kB of
synchronous JavaScript before any of the actual app
renders. This single fix is the highest-ROI Phase 4
change. Vite is shipping the dev tool to end users.

**Fix:** wrap the plugin registration in a dev-only
guard. In `vite.config.ts:9`, replace

```ts
const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
```

with

```ts
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  ...(process.env.NODE_ENV !== "production"
    ? [vitePluginManusRuntime()]
    : []),
  vitePluginManusDebugCollector(),
];
```

This is a 4-line change. The expected post-fix bundle:

| Asset | Before | After | Delta |
|-------|-------:|------:|------:|
| `index.html` | 368.14 kB | ~1.5 kB | -366 kB (-99.6%) |
| `index.html` (gzipped) | 105.74 kB | ~0.7 kB | -105 kB |
| Critical-path JS | 274 kB inline + 797 kB external | 797 kB external | 0 |
| Time to first byte → first paint | blocked on inline script | not blocked | significant |

The dev tool keeps working in `vite dev` (NODE_ENV=development
by default). It just doesn't ship to production anymore.

**Risk:** low. The Manus platform's live-edit feature only
makes sense in dev/preview. If the production deploy ever
needs the live-edit functionality for some other purpose,
the fix is to revert one line. Worth confirming with the
Manus platform docs that production builds are expected
without the runtime — but the existing dev-only guard on
`vitePluginManusDebugCollector` is the pattern this codebase
already uses, so this is consistent with the team's intent.

**Effort:** 5 minutes, one commit. **This is the single
biggest Phase 4 win available.** See commit (this turn's fix).

---

## What this means for the improvement roadmap

Phase 4 is the most user-facing lever remaining. The plan was
honest about it (it's a Week 4 deliverable in the original
schedule) and the live code confirms it's almost entirely
unaddressed.

In order of cost/benefit:

1. **Gap E (fix vitePluginManusRuntime guard)** — DONE.
   -366 kB on initial HTML, unblocks first paint.
2. **Gap A (route-level code splitting)** — DONE. -47.5 kB
   on initial JS (-8.9 kB gzip), 5 lazy chunks extracted.
3. **Gap D (delete dead code)** — DONE. 1,580 lines
   removed from the repo. Build output unchanged (Vite was
   already tree-shaking).
4. **Gap C (web-vitals monitoring)** — 1-2 hours, unlocks
   future perf work. **Do fourth.**
5. **Gap B (lazy bonus/shop components)** — 1-2 hours,
   bigger bundle win but UX trade-off. **Do fifth, after
   the first four.**

The unaddressed Phase 4 items after that: React.memo
(Item 4) and dep audit (Item 3) — both real, both
measurement-driven. The dep audit in particular is the kind
of thing where the answer depends on the bundle analyzer
output, so it should come after a measurement-driven
commit (Gap C gives us the data to make informed decisions).

---

## See also

- `IMPROVEMENT_PLAN.md` — Phase 4 source bullets
- `vite.config.ts` — Vite config (no code-splitting config)
- `client/src/App.tsx` — static page imports (Gap A)
- `client/src/main.tsx` — entry point (clean)
- `client/src/pages/ComponentShowcase.tsx` — 1,437 lines,
  unused (Gap D)
- `client/src/components/DebugPanel.tsx` — 143 lines,
  unused (Gap D)
- `client/src/_core/audioEngine.ts` — 335 lines, unused
  (carried over from Phase 3 audit; not a Phase 4 issue but
  worth deleting in the same commit as Gap D)
- `docs/PHASE_2_STATUS.md` — Gap D (particle systems perf)
  still open
- `docs/PHASE_3_STATUS.md` — Gap A (consolidate 4 sound
  modules) still open
