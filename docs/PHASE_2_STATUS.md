# Phase 2 Status — Enhanced Visual Feedback

Audit of `IMPROVEMENT_PLAN.md` Phase 2 against the live code as of
2026-06-10. Like the Phase 1 baseline exercise, the planning doc was
aspirational and the actual state is much further along than the bullets
suggest. Most of the listed work is already done; the real follow-ups
are small, surgical cleanups rather than new features.

---

## Headline

**5 of 6 Phase 2 items are fully implemented and wired in.** The 6th
(coin particle effects) is *also* implemented, with overlap between
three components that share visual responsibility. The real gaps are
a **geometric bug** in the win-line highlight system and a
**3-way duplication** of the 25 payline paths, not missing features.

---

## Item-by-item status

### 1. ✅ Enhance win animations with more dramatic particle effects

**Status:** DONE — exceeds "more dramatic" baseline.

**Files:**
- `client/src/components/WinParticles.tsx` — physics-based particle
  system (vx/vy/gravity/life), 30–50 particles per trigger, three
  particle types (coin/confetti/star), triggered by win tier.
- `client/src/components/CoinParticles.tsx` — simpler coin rain,
  12–28px particles with random rotation, used as a standalone rain
  overlay.
- `client/src/components/ConfettiEffect.tsx` — 50/100/150-piece
  configurable confetti with three shapes (circle/square/strip), used
  for purchase success and special events. Also exports a
  `CoinFlyAnimation` (coins flying outward from a point, useful for
  the "add to balance" feedback).
- `client/src/components/BigWinOverlay.tsx` — the "BIG WIN / MEGA WIN
  / JACKPOT" full-screen overlay. 12 starburst rays rotating
  independently, 30 confetti pieces, a 4-phase progressive coin
  counter (fast→medium→slow→final), and gradient text with
  multi-layer text-shadow glow.

**Wiring:** `SlotMachine.tsx:728-735` fires all of these in
sequence: `showWin`, `winFlash`, `showCoinShower`,
`particleTrigger` (used by `<WinParticles>`), and
`showBigWin` (used by `<BigWinOverlay>`).

### 2. ✅ Add screen shake effects for big wins and jackpots

**Status:** DONE — three-tier system with proper keyframes.

**Files / lines:**
- `SlotMachine.tsx:349` — `shakeIntensity` state with union
  `'none' | 'light' | 'medium' | 'heavy'`.
- `SlotMachine.tsx:738-748` — tier-mapping by win type:
  JACKPOT / MEGA_WIN → heavy, BIG_WIN → medium, SMALL_WIN → light,
  HUNTRESS_BONUS → medium, default → light.
- `SlotMachine.tsx:1613-1616` — CSS class binding.
- `SlotMachine.tsx:1574-1612` — three keyframe definitions
  (`screenShakeLight` / `Medium` / `Heavy`). Heavy includes
  `rotate(-1deg) / rotate(1deg)` on top of the translate, which is
  noticeably more dramatic than just position shake.
- `SlotMachine.tsx:830` — applied to the root container.

### 3. ✅ Enhance jackpot celebration with more elaborate animations

**Status:** DONE — two overlay paths, one for the full-screen
jackpot, one for the in-game "BIG WIN" tier system.

**Files:**
- `client/src/components/JackpotOverlay.tsx` — full-screen
  celebration with a webp background image, dark vignette overlay,
  Art Deco top/bottom ornaments, gradient "JACKPOT!" text with
  shimmer animation, animated star, count-up amount, and 20
  floating emoji coins falling continuously on infinite loop.
- `client/src/components/BigWinOverlay.tsx` — the BIG_WIN /
  MEGA_WIN / JACKPOT overlay (already mentioned in item 1). Plays
  automatically 600ms after the spin result, auto-closes after
  3-6 seconds depending on tier, dismissable on tap.

### 4. ⚠️ Add glow effects to winning symbols and paylines

**Status:** MOSTLY DONE — but two components render at the same
time for every win, and one of them is geometrically wrong on
non-straight paylines. See "Gaps" below.

**Files:**
- `client/src/components/WinLineHighlight.tsx` — 8-color line
  palette, gradient stroke, double drop-shadow glow, pulsing
  animation. **Renders first, at line 1017 of SlotMachine.tsx.**
- `client/src/components/PaylineHighlight.tsx` — also live
  (imported at `SlotMachine.tsx:22`, rendered at line 1020-1022).
  Draws an SVG path that follows the actual payline geometry
  (zigzags, V-shapes, etc.) using the same `getPaylinePath`
  helper that the game logic uses. One instance per winning
  payline.

### 5. ⚠️ Implement more sophisticated coin particle effects

**Status:** DONE with overlap. Three different components all do
coin-rain-style effects:

- `CoinParticles.tsx` — basic coin rain, 20 particles default
- `WinParticles.tsx` — physics coin/confetti/star, 30–50 by tier
- `JackpotOverlay.tsx:124-136` — 20 floating coins on infinite
  loop, rendered inside the jackpot overlay

When a jackpot fires, all three stack on top of each other. The
visual effect is dense, but a profiler would show three separate
rAF loops driving overlapping animations. The cleanup is to
consolidate to a single particle system, but it's not a
correctness issue.

### 6. ✅ Add celebration animations for bonus game triggers

**Status:** DONE — multi-phase slam with audio.

**Files:**
- `client/src/components/BonusEntrance.tsx` — 4-phase animation
  (`flash` → `slam` → `hold` → `exit`), triggers
  `playBonusAlert()` sound on mount, has icon, gradient text
  banner with bouncy `cubic-bezier(0.175, 0.885, 0.32, 1.275)`
  easing, glow burst, and 12 sparkle particles.
- `client/src/components/BonusGameOverlay.tsx:286-292` and
  `client/src/components/BonusWheel.tsx:283` — both consume
  `BonusEntrance` as their entry animation. `BonusGameOverlay`
  also adds a 25-coin shower (`coinShower` state) when bonus
  rewards land, and a flying-numbers effect
  (`flyingNumbers` state) for the payout moment.

---

## Gaps and follow-ups

### Gap A: `WinLineHighlight.tsx` draws straight lines on zigzag paylines

Both `WinLineHighlight.tsx` and `PaylineHighlight.tsx` are wired
into `SlotMachine.tsx` and render simultaneously for every win
(lines 1017 and 1020-1022). They aren't alternatives — they
stack. And they disagree about geometry:

- `PaylineHighlight.tsx` correctly draws an SVG path that follows
  the actual payline geometry, using the same `getPaylinePath()`
  helper the game logic uses. A win on a zigzag payline shows a
  zigzag line.
- `WinLineHighlight.tsx` (the `row >= 0` branch) draws a straight
  horizontal line at the *centroid row* — `line.row / rowCount *
  100 + (100 / rowCount / 2)`. A win on a zigzag payline shows a
  straight horizontal line that doesn't follow the payline. It
  *looks* correct on the three straight paylines (0, 1, 2) and
  visually wrong on the 22 zigzag paylines.

**Action:** decide which one to keep. `PaylineHighlight.tsx` is
geometrically correct, but renders an SVG per payline (5 circles
+ a path each). `WinLineHighlight.tsx` is simpler and uses CSS
gradients, but is wrong on non-straight paylines. The cleanest
fix is to *delete `WinLineHighlight.tsx`* and let
`PaylineHighlight.tsx` be the only renderer, then re-introduce
the 8-color palette and drop-shadow glow on top of the SVG path.

### Gap B: `WinLineHighlight.tsx` has unreachable diagonal branches

While consolidating, also remove the `row === -1` and
`row === -2` branches in `WinLineHighlight.tsx` (lines 53-103).
The game-state `WinLine.row` is always a non-negative payline
index (0–24), set at `useGameState.ts:241` as `row: i`. The
diagonal branches therefore can never execute and are leftover
code from an earlier design.

### Gap C: 25 payline paths are hardcoded in three places

`useGameState.ts:189-224`, `SlotMachine.tsx:74-` (its own private
`getPaylinePath` function), and `PaylineHighlight.tsx:16-22` all
carry their own copy of the 25 payline paths. If one is updated
and the others are not, the visual highlight drifts from the
actual win detection.

**Action:** move the paths to a single `getPaylinePaths()`
exported helper (e.g. in a new `client/src/lib/paylines.ts` or
inside `useGameState.ts` itself) and import from all three sites.
This is a one-commit refactor, no behavior change.

### Gap D: Particle system overlap on jackpot

`WinParticles.tsx` (30–50 particles) +
`JackpotOverlay.tsx` (20 falling coins) +
`BigWinOverlay.tsx` (30 confetti + 12 rays)
all run simultaneously during a jackpot. Visually dense; on
low-end mobile this is the most expensive frame in the app.

**Action:** profile on a low-end device first. If it lags,
consolidate to a single canvas-based particle system behind a
feature flag. Not urgent — works fine on modern hardware.

---

## What this means for the improvement roadmap

Phase 2 is effectively complete. The remaining visual feedback
items from `PRIORITIES.md` and `IMPROVEMENT_PLAN.md` are
operationally separate:

- **Sound variety** (Phase 3) — separate workstream, partially
  done in `lib/soundsPsychology.ts`, needs a dedicated audit.
- **Performance / bundle size** (Phase 4) — independent of
  visuals; biggest user-facing lever.
- **Haptics / accessibility / onboarding** (Phase 5) —
  independent.

**Recommended next turn:** pick Gap A (fix
`WinLineHighlight.tsx` drawing straight lines on zigzag paylines,
or delete it and rely on `PaylineHighlight.tsx`) as a one-commit
cleanup. Low risk, genuinely useful, and proves the
audit-driven workflow we've been running. Then move to a
Phase 4 task (performance / bundle size) — that's where the
next user-visible win is.

**Status as of 2026-06-10:** Gap A and Gap C both closed. Gap B
closed as a side effect of Gap A (unreachable branches removed
with `WinLineHighlight.tsx`). Gap D (particle perf) deferred.
The duplicate-payline-paths bug called out under Gap C has also
been fixed — the player is no longer double-paid on indices 6+20
and 11+21. The 25-payline promise is preserved by replacing the
two duplicates with new unique shapes. See `docs/GAME_BALANCE.md`
iteration log for measured impact (~0.01pp RTP delta, within
sampling noise).

---

## See also

- `IMPROVEMENT_PLAN.md` — Phase 2 source bullets
- `client/src/components/SlotMachine.tsx` — the wiring layer that
  fires all of the above
- `docs/GAME_BALANCE.md` — same audit-and-honest-doc pattern, used
  for Phase 1
