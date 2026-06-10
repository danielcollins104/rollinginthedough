# Phase 5 Status — Enhanced User Experience

Audit of `IMPROVEMENT_PLAN.md` Phase 5 against the live code as
of 2026-06-10. Same pattern as Phases 1, 2, 3, 4.

---

## Headline

Phase 5 is **mostly not done**. The plan has 7 items, and the
audit's honest answer is "0 of 7 fully done, 4 partially done
(via library code that isn't actually used), 1 not started, 2
structural."

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

### 2. ❌ Haptic feedback for mobile devices on wins

**Status:** NOT STARTED. Zero `navigator.vibrate` /
`triggerHaptic` / `HapticFeedback` hits in `client/src/`.
iOS Safari does NOT support `navigator.vibrate` at all
(only Android Chrome does), and on iOS the equivalent is
`UIImpactFeedbackGenerator` from a native module (not
available in web). For a PWA that runs in mobile browsers,
the realistic implementation is `navigator.vibrate?.(...)`
with feature detection.

**Where to wire it:** big wins (`win_explosion` / `mega_win` /
`jackpot` sounds), scatter triggers (`free_spin`), and the
SPIN button press.

**Effort:** 30 minutes — one helper, three call sites.
See Gap B.

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

### 4. ⚠️ Keyboard navigation support

**Status:** PARTIALLY DONE. The shadcn primitives handle
keyboard nav for form inputs (tab/enter, escape to close
dialogs — see `ui/dialog.tsx:96-130` for the escape
handler). But the *game itself* has no documented keyboard
shortcuts:

- **No way to spin with the keyboard** (a screen reader
  user, a power user, or a player on a laptop with no
  trackpad would have to reach for the mouse).
- **No keyboard shortcut to open the paytable**.
- **No keyboard shortcut for max bet / autoplay toggle**.
- **The bet +/− buttons** are real `<button>` elements, so
  they're tab-focusable by default — that's good, but
  undocumented.

A reasonable minimal set of keyboard shortcuts:
- **Space / Enter** when the SPIN button is focused → spin
- **M** → toggle sound
- **P** → open/close paytable
- **+ / −** → adjust bet
- **Escape** → close any open modal (already works via shadcn)

**Effort:** 1-2 hours for a minimal version. See Gap D.

### 5. ⚠️ Better error states and user-friendly messages

**Status:** PARTIALLY DONE. The codebase has an `ErrorBoundary`
at `client/src/components/ErrorBoundary.tsx` that wraps
`<App>` in `App.tsx`. When a component throws, the boundary
catches it and shows a "Reload Page" button. **Good.**

But the current error UI has problems:
- It **dumps the raw `error.stack` to the player** in a
  pre/code block. Stack traces are useful for developers
  but alarming and meaningless to players. The CSS class
  is `text-muted-foreground` but it's still a stack trace
  on screen.
- There's no "what happened, what to do" copy. Just
  "An unexpected error occurred."
- No way to copy the error or report it (helpful for
  the user, but also for the team — the audit found no
  existing "send error report" mechanism beyond
  `localStorage.setItem("ritd_last_error", ...)`).
- No try/catch wrapping in API calls: trpc calls have
  default error handling, but most user-facing actions
  (spin, claim daily bonus, etc.) don't show a friendly
  toast on failure.

**Effort:** 1-2 hours to fix the ErrorBoundary UI, plus
the broader error-handling pattern is a separate task.
See Gap E.

### 6. ❌ Loading skeletons for better perceived performance

**Status:** PARTIALLY DONE. There's a `Skeleton` UI primitive
at `client/src/components/ui/skeleton.tsx` and a
`DashboardLayoutSkeleton` for the dashboard. But the *primary
user flow* — the slot machine and the home page — shows
nothing while loading:

- The `PageLoading` fallback I added in Phase 4 Gap A (the
  route-level Suspense) is a "Loading…" text node, not a
  skeleton.
- The Home page has no initial-load skeleton. On a slow
  network, the user sees an empty dark page.
- The SlotMachine, while it does have its own "spinning"
  state (the reels are physically spinning), has no
  initial-mount skeleton (the moment between "page loads"
  and "first reels appear" is blank).
- The CoinShop, BonusGameOverlay, and other modal-triggered
  components have no load skeleton (they pop in suddenly).

**Effort:** 2-4 hours. Each component gets its own skeleton
matching its real layout. See Gap F.

### 7. ❌ More informative tooltips and help text

**Status:** PARTIALLY DONE (library code exists, app doesn't
use it). The shadcn `Tooltip` primitive is at
`client/src/components/ui/tooltip.tsx` and is exported, but
**zero app components use it.** Grep for `Tooltip` in
`client/src/components/*.tsx` returns only shadcn-internal
references (sidebar's collapse tooltip, the ui library
itself).

The app could benefit from tooltips on:
- The bet +/− buttons ("Decrease bet" / "Increase bet")
- The paylines selector ("Choose how many paylines to bet on")
- The max bet button ("Set bet to maximum")
- The autoplay button ("Auto-spin until you stop me")
- The mute button ("Mute sound" / "Unmute sound")
- The shop/coin buttons (price hints)

**Effort:** 1-2 hours. Pure wiring. See Gap G.

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

A `vibrate(pattern)` helper with feature detection (works
on Android Chrome, no-op on iOS). Wire to:
- Big win (50ms)
- Mega win ([50, 50, 50])
- Jackpot ([100, 50, 100, 50, 200])
- Scatter trigger (30ms)
- SPIN button press (10ms) — optional, may annoy

**Effort:** 30 minutes.

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

- Space / Enter when SPIN is focused → spin
- M → toggle sound
- P → toggle paytable
- + / − → adjust bet
- Escape → close modals (already works via shadcn)

Implement as a single `useKeyboardShortcuts()` hook that
listens on `window` and dispatches via callbacks. Important:
the shortcuts must not fire when an input is focused (typing
"M" into a text field shouldn't mute the game).

**Effort:** 1-2 hours.

### Gap E: Friendlier error UI

The current `ErrorBoundary` shows a raw stack trace. Fix:
- Replace the stack trace with friendly copy
  ("Something went wrong on our end. Reloading usually
  fixes it.")
- Add a "Copy error details" button (for support)
- Keep the stack trace in a `<details>` block, collapsed
  by default, for developers
- Wire the existing `localStorage.ritd_last_error` to the
  copy button (it already stores the last error)

**Effort:** 1-2 hours.

### Gap F: Skeletons for the home page, modals, and route loads

A `HomePageSkeleton` that matches the real Home page layout
(slot machine frame, coin balance, header). A
`SlotMachineSkeleton` (reel grid + spin button placeholder).
A `ModalSkeleton` for the modals. The `PageLoading` for
lazy routes can either be upgraded to a skeleton or kept
as the simple "Loading…" — both work.

**Effort:** 2-4 hours. Mostly visual matching work.

### Gap G: Tooltips on the game controls

Pure wiring of the existing `Tooltip` primitive:
- Bet +/− buttons
- Max bet button
- Autoplay button
- Mute button
- Paylines selector
- Shop buttons

Each tooltip is 2 lines of JSX. The visual polish (delay
duration, fade animation) is already handled by the
shadcn primitive.

**Effort:** 1-2 hours.

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

**Recommended next turn:** Gap E (friendly error UI) + Gap
B (haptics) in the same commit. Both are small, both
genuine fixes, together they round out the "user error
path" and the "physical feedback" path. After those, the
next big win is Gap D (keyboard shortcuts) or Gap F
(skeletons), depending on what the user feels is more
visible.

---

## See also

- `IMPROVEMENT_PLAN.md` — Phase 5 source bullets
- `PRIORITIES.md` — independent priority list that has its
  own Phase 5 items (Accessibility, Haptic Feedback,
  Enhanced Onboarding, Error Handling)
- `client/src/components/ErrorBoundary.tsx` — current
  error UI (Gap E)
- `client/src/components/SlotMachine.tsx:1848-1912` —
  `PayTable` component (the closest thing to a tutorial
  that exists today)
- `client/src/components/ui/skeleton.tsx` — Skeleton
  primitive
- `client/src/components/ui/tooltip.tsx` — Tooltip
  primitive
- `docs/PHASE_4_STATUS.md` — previous audit
