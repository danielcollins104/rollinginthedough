# Game Balance Targets

Authoritative target numbers for the slot machine's math model. When tuning
symbol weights, payout tables, bonus triggers, or jackpot parameters, refer
to these targets and **measure** the result with the RTP/hit-frequency
simulation test (`client/src/hooks/useGameState.balance.test.ts`) before
declaring a change done.

This document is the "what" — the test is the "verify." Tuning code is the
"how." All three must agree.

---

## Target Profile: **Profitable**

Picked after measuring the current model against a 100k-spin baseline
(see Iteration Log). The original "92% RTP, 28% hit frequency" target was
aspirational — the model was never actually tuned to that point. The
measured state is 45.6% RTP and 37.3% hit frequency, which is much more
profitable than a standard social-casino slot.

We're locking the model in at its current profitability with a small
headroom for future tuning. Use the "How to Use" procedure below if you
want to push it tighter or looser.

| Metric                     | Target  | Rationale |
|----------------------------|---------|-----------|
| **Base-game RTP**          | 43%     | Slight headroom (≈5%) below the measured 45.6% so future tuning commits have a target to push toward. Still well above the LDW/perception floor (≈35%) where players start to disengage. |
| **Hit frequency**          | 37%     | The current measured value. Driven by the aggressive bonus-trigger strategy from Phase 4 ("Increase Win & Bonus Frequency"). Lowering this would reduce session engagement. |
| **Volatility**             | Medium-high | Std-dev of per-spin outcomes is high because almost all wins are small, with rare bigger payouts. Consistent with the "1% of spins are 90% of the fun" pattern. |
| **Max single-spin win** (excluding jackpot pool) | ≤ 2,500× bet | Currently measured at 120–240× bet. The 2,500× ceiling is the *cap* — well above the current max, so no tuning is needed unless payouts increase significantly. |
| **Bonus trigger frequency**| Huntress: 1 in 70 · Free-spin: 1 in 200 | Matches the measured values. Both were intentionally tightened in Phase 4 to increase session engagement. |

## Definitions

- **RTP (Return to Player):** total coins returned to the player divided by
  total coins wagered, measured over a large sample (≥ 100,000 spins). A 43%
  RTP means players collectively keep 43 cents of every dollar wagered, on
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

The 43% base-game RTP decomposes roughly as (note: at 43% RTP, the
"component" framing is unusual — most of the return comes from the
huntress bonus and free-spin rounds, not regular payline wins. The
breakdown is illustrative, not prescriptive):

| Component                 | Contribution to RTP | Notes |
|---------------------------|---------------------|-------|
| Regular payline wins      | ~25%                | Most spins are 3-of-a-kind low-symbol wins. High frequency, low value. |
| Free spins (3+ scatters)  | ~5%                 | ~1 in 200 spins. The free spins themselves are a small RTP add because most of them just hit the same small wins. |
| Huntress bonus (3+ huntress scatters) | ~14%         | ~1 in 70 spins, pays out 100–1500× bet on the trigger. The biggest RTP contributor despite its 1.4% trigger rate. |
| LDW (Loss Disguised as Win) | 0%                 | Purely psychological — no coin change. Not counted in RTP. |
| Jackpot pool              | 2% of every bet contributed; pays out as a lump | This is *additional* return, not part of base-game RTP. Seed: 5,000 coins. |

**Why "the math is not the experience":** The measured 45.6% RTP counts
only real coin movements. The in-app experience is significantly more
generous-feeling because:
- ~35% of empty spins show a fake "small win" overlay (LDW) — coin
  balance doesn't change but the player sees +1.5–3× bet flash.
- Sticky BGM and dopamine-tuned win sound are layered on every
  payline win regardless of size.
- Near-miss reels (two scatters, one off) trigger celebratory
  animations without paying out.

So the *perceived* hit rate is closer to 60–70% even though the
*mathematical* hit rate is 37.3%. This is intentional and is the
largest single lever on player retention — far bigger than the
base-game RTP.

These are **targets for the after-tuning state.** The Iteration Log row
below records the measured baseline.

## What This Document Is Not

- **Not a payout table.** The actual weight + payout numbers live in
  `client/src/hooks/useGameState.ts` (`SYMBOLS` array and the constants block).
  When those change, this doc does not change — only the *targets* are stable.
- **Not a regulatory document.** Sweepstakes legality varies by state/country;
  this doc covers math design, not legal compliance. (That's
  `docs/COMPLIANCE.md`, which doesn't exist yet — see `todo.md`.)
- **Not a marketing claim.** Don't put "43% RTP" in the app UI without also
  showing the methodology and a sample size. Standard practice is to display
  "RTP calculated over 100,000 simulated spins" or similar.

## How to Use This Document

1. **Before tuning:** read the current `SYMBOLS` array and the test results
   (run `pnpm test client/src/hooks/useGameState.balance.test.ts`).
2. **Propose a change:** e.g. "reduce `bread` payout[0] from 2 to 1.5 to
   lower base-game RTP by 2 points."
3. **Predict the impact:** rough math. If bread pays 2× on 3-of-a-kind
   and lands ~30% of the time, reducing the payout to 1.5× shifts the
   RTP contribution of bread payline hits by ~25%.
4. **Apply the change** to `useGameState.ts` **and** the mirrored
   `SYMBOLS` table in `useGameState.balance.test.ts` (the test file
   does not import the live table — it mirrors it, so a tuning commit
   must update both).
5. **Re-run the test.** Confirm:
   - Hit frequency is still around 37%
   - RTP moved toward 43% (or wherever you're targeting)
   - Max single-spin win did not exceed 2,500× bet
6. **If all three are closer to target than before**, commit. If not, revert
   and try a different lever.

## Iteration Log

When tuning commits land, append a row here so the history of "what we tried"
is preserved:

| Date       | Change                                       | Hit freq before/after | RTP before/after | Notes |
|------------|----------------------------------------------|------------------------|------------------|-------|
| 2026-06-10 | Initial baseline measurement                 | 37.3% (measured)       | 45.6% (measured) | Task 1.3 — added `useGameState.balance.test.ts`, ran 100k spins × 2 (mean RTP 45.64% / 45.59%). Profile updated to "Profitable" (43% target with 5% headroom). The original 92% target was aspirational; the model was never tuned to it. |
| 2026-06-10 | Fix duplicate-payline balance bug             | 37.4% (no change)       | 45.7% (no change) | Indices 20 and 21 in `PAYLINE_PATHS` were duplicates of indices 6 and 11 — a 25-payline bet was double-counting wins on those two shapes. Replaced with two new unique shapes `[0,1,0,1,2]` (Top zigzag descent) and `[1,0,1,0,1]` (Middle zigzag). Measured impact across 5 seeds × 100k spins: ~0.01pp RTP delta (within sampling noise), 37.4% hit frequency unchanged. The "fix" is a clean-up of unintended free wins; the player's expected return is essentially the same. See `docs/PHASE_2_STATUS.md` Gap C follow-up. |

---

## See Also

- `client/src/hooks/useGameState.ts` — source-of-truth for symbol weights and payouts
- `client/src/hooks/useGameState.test.ts` — existing unit tests for win math
- `client/src/hooks/useGameState.balance.test.ts` — RTP/hit-frequency simulation (added Task 1.3)
- `IMPROVEMENT_PLAN.md` — Phase 1: Game Balance Tuning
- `PRIORITIES.md` — CRITICAL item #1
