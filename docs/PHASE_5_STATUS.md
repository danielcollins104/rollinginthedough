# Phase 5 Status — Enhanced User Experience

Audit of `IMPROVEMENT_PLAN.md` Phase 5 against the live code as
of 2026-06-10. Same pattern as Phases 1, 2, 3, 4.

**Status (as of last update):** Gap B (haptics), Gap D (keyboard
shortcuts), Gap E (friendly errors), Gap F (skeletons), and
Gap G (tooltips) shipped in this session. The remaining gaps
(A, C) are still in the same state described below.

---

## Headline

Phase 5 is **mostly not done**. The plan has 7 items, and the
audit's honest answer is "0 of 7 fully done, 4 partially done
(via library code that isn't actually used), 1 not started, 2
structural."

*(Update after this session: Gap B (haptics) and Gap E
(ErrorBoundary UI) are now shipped. The headline above is the
original audit state; the status block at the top of this doc
is current. The 2/7 → 4/7 shift in the headline numbers still
applies — haptics and friendly errors were both partially-done
or unimplemented; both are now full.)*

The good news: this is **the most user-facing phase in the
entire plan**. Accessibility, keyboard nav, error states,
loading skeletons, and onboarding are what a player *feels*.
The 4 Phase 5 items that are partially done are partially done
because the *library code is there* but the *app code never
calls it* — the work is "wire the existing primitives into the
game components", not "build the primitives from scratch."

**Two structural findings worth flagging:**

1. The plan's 7 items are not equally important. A user can
   play the game without a tutorial, haptics, or tooltips. They
   *cannot* play without the keyboard, error states, and
   loading skeletons. The audit doc ranks accordingly.

2. Three of the items (onboarding, error states, tooltips) are
   work that can be done incrementally — the first commit
   doesn't need to ship the whole vision, just the highest-
   leverage slice. Trying to do all 7 items in one mega-PR
   would produce shallow work on all of them.

### What this means for the improvement roadmap

The plan's title "Enhanced User Experience" suggests polish,
not features. The real gap is the missing plumbing: a screen
reader user can't play this game today (no ARIA on the slot
machine), a keyboard user can't either (no documented keyboard
shortcuts), and a user who hits any error sees a stack trace
(the ErrorBoundary shows the stack to the player). Fixing
those three things is the highest-ROI Phase 5 work.

The remaining items (haptics, tutorial, tooltips, skeletons)
are smaller wins that can be done in any order afterwards.

---

## Item-by-item status

### 1. ❌ Onboarding flow with better tutorial system

**Status:** NOT STARTED. Zero `tutorial` / `onboard` / `how-to-play`
hits in `client/src/`. There is **no first-visit detection**:
no localStorage flag for "this is the player's first time", no
welcome modal, no guided walkthrough, no interactive tooltips
pointing at the SPIN button.

There IS a `PayTable` component at `SlotMachine.tsx:1848-1912`
that shows the symbol payouts when the player clicks a
"View Paytable & Rules" button (collapsed by default). That's
"rules on demand" but it's not an onboarding flow.

**What a real onboarding would look like:**
- First visit → small modal: "Welcome! Click SPIN to play.
  Use the paytable to see payouts."
- Highlight the SPIN button for 3 seconds with a pulsing glow
- Track `localStorage.ritd_tutorial_v1_complete = true` on
  first spin so it doesn't show again
- Optional: a 3-step guided tour (Welcome → Set bet → Spin)

**Effort:** 2-4 hours for a minimal version. See Gap A.

### 2. ✅ Haptic feedback for mobile devices on wins

**Status: SHIPPED** (commit `2bcd909`). See Gap B below for the
implementation details and the 16-test suite.

### 3. ⚠️ Accessibility with proper ARIA labels

**Status:** PARTIALLY DONE (50 grep matches, but almost all
in the shadcn `ui/` library, not the actual app). Of the 50
ARIA matches, **48 are in `client/src/components/ui/*`** —
the shadcn-style library components (button, dialog, input,
select, etc.) ship with proper ARIA defaults. The 2 hits
in the actual app code are:

- `client/src/index.css:84` — a focus-ring CSS rule
  targeting `[role="button"]:not([aria-disabled="true"])`,
  pure styling
- `client/src/components/DashboardLayout.tsx:167` —
  `aria-label="Toggle navigation"` on the menu button

**What's missing (the real gaps):**
- The `<SlotMachine>` itself has **zero ARIA**. A screen
  reader user gets no idea what's on screen during a spin
  (the symbols, the win state, the bet amount).
- The SPIN button has no accessible label.
- The win display has no `aria-live` region, so screen
  readers can't announce wins.
- The coin balance has no `aria-label` (just the number).
- Modal dialogs (shop, bonus, scratch game, etc.) inherit
  ARIA from the shadcn `Dialog` primitive, but the *content*
  inside them (the actual shop prices, the scratch card
  state) is not announced.

**Effort:** 4-8 hours of careful work, but most of it is
mechanical (adding `aria-label`, `role`, `aria-live` to
existing elements). See Gap C.

### 4. ✅ Keyboard navigation support

**Status: SHIPPED for global game shortcuts** (commit `b042674`).
A new `useKeyboardShortcuts` hook at
`client/src/hooks/useKeyboardShortcuts.ts` is mounted in
`client/src/pages/Home.tsx` and dispatches:

- `Space` / `Enter` → spin the reels (suppressed when a
  button is focused, so the focused button gets the keypress)
- `M` / `m` → toggle sound
- `P` / `p` → toggle the paytable/rules panel
- `+` / `=` → increase bet (capped at 200)
- `-` / `_` → decrease bet (floored at 10)

**Honest caveats:**
- The audit also listed "keyboard shortcut to open max bet /
  autoplay toggle" — those are NOT in this commit. The
  shortcuts only cover the 5 most-used actions; max bet and
  autoplay can be added later if needed.
- Escape-to-close-modals is already handled by the shadcn
  `Dialog` primitive; the hook doesn't need to re-implement it.
- No documentation/help dialog yet listing the shortcuts to
  the user. The `?` key (or a help button) could surface
  this. Tracked as a follow-up.

### 5. ✅ Better error states and user-friendly messages

**Status: SHIPPED for the ErrorBoundary UI** (commit `d99cf81`).
See Gap E below for the implementation. **Honest caveat:** the
broader "toast on every failed trpc call" pattern is NOT shipped.
The audit's bullet about "most user-facing actions don't show a
friendly toast on failure" is still true — that's a separate
task and probably belongs in a Phase 5 follow-up doc if we want
to track it formally. The ErrorBoundary rewrite alone is a
meaningful fix (no more stack trace on screen) and the rest of
the gap can be picked up incrementally.

### 6. ✅ Loading skeletons for better perceived performance

**Status: SHIPPED for the lazy-route fallback** (commit `475e086`).
A new `PageSkeleton` component at
`client/src/components/PageSkeleton.tsx` replaces the
"Loading…" text node that App.tsx's `PageLoading` was
showing during chunk download. The skeleton matches the
app's dark theme (midnight-navy gradient, gold-tinted
pulse blocks, Playfair Display label) and shows 4
placeholder blocks in positions where real content usually
sits, so the layout doesn't jump when the chunk loads.

**Honest caveats — not in this commit:**

- **Home page first-render skeleton:** not added. Home is
  eager-loaded and `useGameState` initializes synchronously,
  so the "blank frame" is <50ms and not worth a skeleton.
- **Modal "pop in"** (CoinShop, BonusGameOverlay, etc.):
  not a skeleton problem. These are eager imports that
  mount in one frame. The right fix is a deferred render
  with a fade-in, which is a different pattern from a
  skeleton. Tracked as a follow-up gap.
- **Per-page-specific skeletons** for /pricing, /terms,
  /privacy, /checkout-success, /404: not added. The
  generic PageSkeleton is the right level of detail for
  chunks that download in <200ms on broadband.

### 7. ✅ More informative tooltips and help text

**Status: SHIPPED for the 6 game controls** (commit `9dfaffa`).
The shadcn `Tooltip` primitive is now wired into:
- Bet − / Bet + buttons
- Max Bet button
- Paylines selector (1, 5, 10, 15, 20, 25)
- Autoplay / Stop button (state-aware copy)
- Sound / Mute button (state-aware copy)
- Shop button

**Honest caveat:** the audit also listed "Shop/coin buttons
(price hints)" — that's per-package price hints *inside* the
CoinShop modal, which is a different file and different scope.
The "Open the coin shop" tooltip on the Shop button is shipped;
the in-modal price hints are a small follow-up gap.

---

## Gaps and follow-ups

In order of user-facing value (most impactful first):

### Gap A: First-visit onboarding modal (5 min play)

A tiny modal that fires once on the first visit, then never
again. The simplest version: a small "Welcome to Rolling in
the Dough" card with a "Got it" button. A more complete
version: 3-step walkthrough highlighting the SPIN button,
the paytable, and the bet controls.

**Effort:** 2-4 hours for a polished version, 30 minutes
for the minimum viable version (one welcome modal with
"Got it" button).

**Storage:** `localStorage.ritd_tutorial_v1_complete`. If
the player clears localStorage, the tutorial shows again —
that's the right behavior.

### Gap B: Haptic feedback on wins and big events

**Status: SHIPPED** (commit `2bcd909`).

A `vibrate(pattern)` helper at `client/src/lib/haptics.ts`
with feature detection (works on Android Chrome, no-op on
iOS / desktop / SSR). Five named patterns matching game
events:

- `tap` — 10ms — SPIN button press
- `small` — 30ms — scatter trigger, small win
- `medium` — 50ms — big win, scratch game win
- `large` — 3-pulse crescendo on mega win
- `jackpot` — 5-pulse celebration on jackpot

Public API: `vibrate(name | number | number[])`,
`setHapticsEnabled(boolean)`, `hapticsAvailable()`,
`HAPTIC_PATTERNS` table. The `setHapticsEnabled` toggle
mirrors the sound-system mute pattern and is wired in
code but **no UI toggle exists yet** — a future gap can
add a settings switch the same way Phase 3 Gap B wired
the sound mute.

Wired into `client/src/components/SlotMachine.tsx` at 5
call sites: SPIN press, scatter trigger, jackpot, mega win,
big win, small win, scratch game win.

Tests: `client/src/lib/haptics.test.ts` (16 tests) — all
named patterns, raw pass-through, feature detection, SSR
safety, no-op behavior, error swallowing, and the public
`HAPTIC_PATTERNS` table shape.

Effort: ~30 min estimate was correct. The haptics helper
itself is 96 lines (mostly comments); the tests are 161
lines; the SlotMachine wiring is 9 small call sites.

### Gap C: Accessibility for the slot machine

The single biggest Phase 5 work item. The slot machine has
no ARIA at all. The minimum useful set:
- `aria-label` on the SPIN button ("Spin the reels")
- `aria-label` on the bet +/− buttons ("Decrease bet",
  "Increase bet")
- `aria-label` on the payline selector
- `aria-live="polite"` on the win display (announces wins
  to screen readers)
- `aria-label` on the coin balance
- `<table>` semantics or `role="list"` for the reels grid
- `aria-busy="true"` while spinning

**Effort:** 4-8 hours. The work is mechanical but needs to
be done carefully and tested with an actual screen reader.

### Gap D: Keyboard shortcuts

**Status: SHIPPED** (commit `b042674`).

A `useKeyboardShortcuts` hook at
`client/src/hooks/useKeyboardShortcuts.ts` is mounted in
`client/src/pages/Home.tsx` and dispatches:

- `Space` / `Enter` → spin the reels
- `M` / `m` → toggle sound
- `P` / `p` → toggle the paytable
- `+` / `=` → increase bet (capped at 200, step 10)
- `-` / `_` → decrease bet (floored at 10, step 10)

**Critical correctness rules baked in:**

- All shortcuts suppressed when an editable element is
  focused (input, textarea, select, contenteditable).
  Typing "m" into a chat field must not mute the game.
- Spin (Space/Enter) suppressed when any focusable
  interactive element is focused (button, link,
  role=button, [tabindex]). The focused control gets the
  keypress.
- Modifier keys (Ctrl/Cmd/Alt) suppress all shortcuts so
  browser shortcuts like Ctrl+M (mute tab) still work.
- Auto-repeat (event.repeat) is suppressed so holding "M"
  doesn't toggle sound 30 times per second.

**Architecture:** the dispatch logic is a pure function
(`dispatchShortcut`) exported alongside the hook, so it
can be unit-tested in a node environment without jsdom or
React render. 24 tests cover letter shortcuts, Space/Enter,
bet adjustment, focus suppression, modifier suppression,
auto-repeat, preventDefault, and the return value. The
hook itself is a thin wrapper that calls
`document.activeElement` to compute focus state and binds
a single `window` keydown listener on mount.

The hook reads handlers via a ref so its `useEffect` binds
exactly once. Re-renders with new handler identities do
not re-attach the listener (would cause churn).

**Not in this commit:**
- Max-bet and autoplay keyboard shortcuts (not called out
  by the audit as required; the SPIN button + UI controls
  cover these).
- A help dialog listing the shortcuts to the user.
  Tracked as a follow-up gap.
- Escape-to-close-modal — already handled by the shadcn
  `Dialog` primitive.

Effort: ~1-2 hours estimate was correct. Single hook
file (224 lines) + test file (302 lines) + 16 lines in
Home.tsx. All 155 tests pass; tsc clean.

### Gap E: Friendlier error UI

**Status: SHIPPED** (commit `d99cf81`).

The current `ErrorBoundary` at `client/src/components/ErrorBoundary.tsx`
now shows:
- Friendly headline: "Something went wrong"
- Plain-English copy: "Reloading usually fixes it. If it keeps
  happening, copy the error details and send them to support."
- Two actions: Reload (green, primary), Copy error details
  (gold, secondary, with idle/copied/failed visual feedback
  that resets after 2s)
- Technical stack inside a collapsed `<details>` block, only
  visible to a user who clicks "Technical details"
- Copy payload includes: ISO timestamp, current URL,
  `error.message`, `error.stack`, `errorInfo.componentStack`
- `localStorage.ritd_last_error` now also stores
  `componentStack` and `userAgent` for post-reload debugging
- Clipboard write uses `navigator.clipboard.writeText` with a
  `document.execCommand("copy")` fallback for non-secure
  contexts / older browsers; both paths are wrapped in
  try/catch so a clipboard failure can never break the UI

The component is still a class because React error boundaries
must be classes (no hook equivalent in React 19). The visual
design matches the rest of the app's gold/cream-on-dark theme.

**Honest caveat:** the audit also called out "no friendly toast
on trpc call failure" — that's a broader pattern and is **not**
in this commit. Worth tracking as a follow-up gap.

Effort: ~1-2 hours estimate was correct. The rewrite is a
single-file change (`+221 / -35`). No tests added because the
component renders React in a node-environment vitest setup,
which is awkward; coverage is via tsc clean + visual review.

### Gap F: Skeletons for the home page, modals, and route loads

**Status: SHIPPED for the route-level fallback** (commit
`475e086`).

A `PageSkeleton` component at
`client/src/components/PageSkeleton.tsx` replaces the
"Loading…" text node in App.tsx's `PageLoading`:

- Dark midnight-navy gradient background matching the
  app's theme
- 4 placeholder blocks in positions where real content
  usually sits (header bar, title bar, main content, action
  button) so the layout doesn't jump on chunk load
- Gold-tinted pulse blocks (`rgba(212,175,55,0.10-0.12)`
  on the default accent, with explicit inline styles)
- Small uppercase "Loading…" caption in the corner for
  sighted users
- `role="status"` + `aria-live="polite"` so screen readers
  announce the loading state

**Honest scope of this gap:** only the route-level
fallback was shipped. The audit listed 4 places that
needed skeletons; of those, only the lazy-route
fallback is a real "loading" moment:

| Place | Shipped? | Why |
|-------|---------:|-----|
| `PageLoading` (route fallback) | YES | Real chunk download, real skeleton needed |
| Home page first-render | NO | <50ms, not worth a skeleton |
| CoinShop / BonusGameOverlay pop-in | NO | Eager imports, not a loading problem |
| Per-page specific skeletons | NO | Marginal benefit, generic is fine |

The audit's "Effort: 2-4 hours" estimate was for all 4;
the shipped piece is closer to 1 hour. The rest are
genuine follow-up gaps, not oversights.

### Gap G: Tooltips on the game controls

**Status: SHIPPED** (commit `9dfaffa`).

The shadcn `Tooltip` primitive is now wired into the 6
game-control buttons called out in the audit:

- **Bet − / Bet +** — "Decrease bet" / "Increase bet"
- **Max Bet** — "Set bet to maximum (200)"
- **Paylines (1/5/10/15/20/25)** — "Activate N payline(s)"
  (singular/plural-aware copy)
- **Autoplay / Stop** — state-aware: "Auto-spin the reels
  until you stop me" / "Stop autoplay"
- **Sound / Mute** — state-aware: "Mute sound effects" /
  "Unmute sound effects"
- **Shop** — "Open the coin shop"

All tooltips use `delayDuration={400}` (fast enough to
help, slow enough not to flash on a fast mouse pass) and
`side="top"` (the buttons sit at the bottom of the slot
machine, so the tooltips open upward into the reels area
where there's empty space).

Implementation note: `TooltipTrigger asChild` merges the
tooltip trigger behavior into the existing `<button>` element
rather than wrapping it in a new `<button>` inside a `<button>`
(which would be invalid HTML and break clicks). The visual
behavior of each button is unchanged.

**Follow-up (not in this commit):** in-modal price hints
inside the CoinShop component — per-package tooltips explaining
the coin/USD ratio, package size, etc. Different file, different
scope; tracked as a follow-up.

Effort: ~1-2 hours estimate was correct. The change is a
single-file diff (+130 / -83). All 131 tests still pass;
tsc is clean.

---

## What this means for the improvement roadmap

Phase 5 is the most user-facing phase in the plan. The
audit's honest finding is that almost all of it is not
done. The real priorities, in order:

1. **Gap C (a11y on the slot machine)** — 4-8 hours, makes
   the game accessible. Real equity / regulatory win.
2. **Gap E (friendly error UI)** — 1-2 hours, fixes a real
   UX wart (stack traces on screen). Tiny effort, real
   improvement.
3. **Gap D (keyboard shortcuts)** — 1-2 hours, power-user
   win, also required for screen-reader users.
4. **Gap F (loading skeletons)** — 2-4 hours, perceived
   perf. Builds on the Phase 4 work.
5. **Gap A (onboarding)** — 2-4 hours, helps new players
   discover features.
6. **Gap G (tooltips)** — 1-2 hours, pure wiring.
7. **Gap B (haptics)** — 30 min, mobile polish.

In cost/benefit order:

| Gap | Effort | User-facing value | Notes |
|-----|-------:|------------------:|-------|
| Gap B (haptics) | 30 min | low (mobile only) | Trivial |
| Gap E (errors) | 1-2 h | medium (fixes wart) | Real fix |
| Gap G (tooltips) | 1-2 h | medium | Pure wiring |
| Gap D (keyboard) | 1-2 h | medium-high | Power users + a11y |
| Gap F (skeletons) | 2-4 h | medium | Polish |
| Gap A (onboarding) | 2-4 h | medium (new players only) | Real value |
| Gap C (a11y) | 4-8 h | high (a11y users) | Biggest win |

**Recommended next turn:** Gap C (slot machine a11y) — 4-8
hours of careful work, the biggest single Phase 5 win.
Gap A (onboarding modal) is also still open at 2-4 hours
and easier to start a session on.

---

## See also

- `IMPROVEMENT_PLAN.md` — Phase 5 source bullets
- `PRIORITIES.md` — independent priority list that has its
  own Phase 5 items (Accessibility, Haptic Feedback,
  Enhanced Onboarding, Error Handling)
- `client/src/lib/haptics.ts` — haptics helper (Gap B,
  shipped in `2bcd909`)
- `client/src/lib/haptics.test.ts` — 16 haptics tests
- `client/src/hooks/useKeyboardShortcuts.ts` — global
  shortcut hook (Gap D, shipped in `b042674`)
- `client/src/hooks/useKeyboardShortcuts.test.ts` — 24
  shortcut tests
- `client/src/components/PageSkeleton.tsx` — route-level
  loading skeleton (Gap F, shipped in `475e086`)
- `client/src/components/ErrorBoundary.tsx` — friendly
  error UI (Gap E, shipped in `d99cf81`)
- `client/src/components/SlotMachine.tsx` — `PayTable`
  component at lines ~1848-1912 (the closest thing to a
  tutorial that exists today)
- `client/src/components/ui/skeleton.tsx` — Skeleton
  primitive
- `client/src/components/ui/tooltip.tsx` — Tooltip
  primitive
- `docs/PHASE_4_STATUS.md` — previous audit
