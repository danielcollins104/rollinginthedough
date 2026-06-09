# Game Balance Targets

Authoritative target numbers for the slot machine's math model. When tuning
symbol weights, payout tables, bonus triggers, or jackpot parameters, refer
to these targets and **measure** the result with the RTP/hit-frequency
simulation test (`client/src/hooks/useGameState.balance.test.ts`) before
declaring a change done.

This document is the "what" — the test is the "verify." Tuning code is the
"how." All three must agree.

---

## Target Profile: **Standard**

Picked from the industry reference table for a social-casino / sweepstakes slot:

| Metric                     | Target  | Rationale |
|----------------------------|---------|-----------|
| **Base-game RTP**          | 92%     | Sweet spot for sweepstakes — engaging without being so generous it crushes coin economy. |
| **Hit frequency**          | 28%     | Roughly 1 in 3.6 spins produces any win. Feels "active" without being noisy. |
| **Volatility**             | Medium  | Mix of small frequent wins + occasional larger wins. Max-win is reachable but rare. |
| **Max single-spin win** (excluding jackpot pool) | 2,500× bet | Set by the top 5-of-a-kind line payout × max bet (200) × max paylines (25) = 5,000,000 coins worst case. The "2,500×" target is the *expected* ceiling for a regular hit. |
| **Bonus trigger frequency**| 1 in 150 spins | Feels rare enough to be exciting, common enough to not feel rigged. |

## Definitions

- **RTP (Return to Player):** total coins returned to the player divided by
  total coins wagered, measured over a large sample (≥ 100,000 spins). A 92%
  RTP means players collectively keep 92 cents of every dollar wagered, on
  average.
- **Hit frequency:** the fraction of spins that produce *any* win on *any*
  active payline. A spin that hits 3+ bread on one line and 4+ croissant on
  another counts once. Scatters, free-spin triggers, and jackpot hits all
  count.
- **Volatility:** the standard deviation of per-spin outcomes, normalized by
  the mean bet. Higher = swingier bankroll. Medium ≈ 8–12.
- **Max single-spin win:** the largest non-jackpot payout achievable in a
  single spin, expressed as a multiplier of the bet. Excludes progressive
  jackpot pool (which is bonus RTP on top of the base game).

## Component Targets

The 92% base-game RTP decomposes roughly as:

| Component                 | Contribution to RTP | Notes |
|---------------------------|---------------------|-------|
| Regular payline wins      | ~70%                | The meat. Driven by symbol weights × payout multipliers. |
| Free spins (3+ scatters)  | ~12%                | 10 free spins per trigger, each spin is a "free" win for the player (RTP counts as the value of those wins). |
| Huntress bonus (3+ huntress scatters) | ~8%         | Bonus game payout on top of base spin. |
| LDW (Loss Disguised as Win) | 0%                 | Purely psychological — no coin change. Not counted in RTP. |
| Jackpot pool              | 2% of every bet contributed; pays out as a lump | This is *additional* return, not part of base-game RTP. Seed: 5,000 coins. |

These are **targets for the after-tuning state.** Current values are unknown —
Task 1.3 (the measurement test) will tell us where we actually are.

## What This Document Is Not

- **Not a payout table.** The actual weight + payout numbers live in
  `client/src/hooks/useGameState.ts` (`SYMBOLS` array and the constants block).
  When those change, this doc does not change — only the *targets* are stable.
- **Not a regulatory document.** Sweepstakes legality varies by state/country;
  this doc covers math design, not legal compliance. (That's
  `docs/COMPLIANCE.md`, which doesn't exist yet — see `todo.md`.)
- **Not a marketing claim.** Don't put "92% RTP" in the app UI without also
  showing the methodology and a sample size. Standard practice is to display
  "RTP calculated over 100,000 simulated spins" or similar.

## How to Use This Document

1. **Before tuning:** read the current `SYMBOLS` array and the test results
   (run `pnpm test client/src/hooks/useGameState.balance.test.ts`).
2. **Propose a change:** e.g. "increase `bread` weight from 30 to 35 to
   raise hit frequency."
3. **Predict the impact:** rough math. If bread currently lands ~16% of the
   time and pays 2× on 3-of-a-kind, and you raise its weight to 35, you can
   estimate the new hit rate and RTP change.
4. **Apply the change** to `useGameState.ts`.
5. **Re-run the test.** Confirm:
   - Hit frequency moved toward 28%
   - RTP moved toward 92%
   - Max single-spin win did not exceed 2,500× bet
6. **If all three are closer to target than before**, commit. If not, revert
   and try a different lever.

## Iteration Log

When tuning commits land, append a row here so the history of "what we tried"
is preserved:

| Date       | Change                                       | Hit freq before/after | RTP before/after | Notes |
|------------|----------------------------------------------|------------------------|------------------|-------|
| (pending)  | Initial baseline measurement                 | TBD                    | TBD              | Task 1.3 — write the simulation test first |

---

## See Also

- `client/src/hooks/useGameState.ts` — source-of-truth for symbol weights and payouts
- `client/src/hooks/useGameState.test.ts` — existing unit tests for win math
- `client/src/hooks/useGameState.balance.test.ts` — (pending) RTP/hit-frequency simulation
- `IMPROVEMENT_PLAN.md` — Phase 1: Game Balance Tuning
- `PRIORITIES.md` — CRITICAL item #1
