# Implementation Plan — Vegas Sticky-Coin Slot Update

## Goal
Transform the existing `rollinginthedough` slot into a Vegas-style video slot with a green/gold coin theme and a sticky Hold-&-Win-style bonus, plus all known engagement mechanics (LDW, near-misses, haptics, variable rewards, debug overlay).

## Research summary
- Hold-&-Win mechanics: special symbols lock in place, 3 respins, each new symbol resets counter, fills grid for grand jackpot.
- LDWs: small payout that is still less than bet, presented as a win, keeps players spinning.
- Near-misses: almost-wins trigger dopamine; show near-miss animations/sound on losing spins.
- Variable ratio reinforcement: unpredictability drives retention.
- Haptics: Vibration API on spin, wins, and near-misses can increase immersion (must be optional).

## Feature set
1. New symbol set: green coin, gold coin, Vegas 7, BAR, diamond, bell, horseshoe, cherry, wild, scatter.
2. Sticky Hold-&-Win bonus:
   - 6+ coin symbols (green or gold) trigger the bonus.
   - Triggering coins lock; player gets 3 respins.
   - Each new coin locks and resets respins to 3.
   - Green coins have a fixed value; gold coins have a higher value and may be jackpot coins.
   - Filling all 15 positions awards a Grand Jackpot.
3. Wilds, scatters, free spins keep existing behavior.
4. LDW logic: if losing spin, chance to award a small win (return some of the bet) with fanfare but net loss.
5. Near-miss feedback: when exactly 2 of 5 reels would win on a payline, show near-miss highlight and sound.
6. Haptics wrapper: use `navigator.vibrate` where supported, toggle in settings.
7. Debug overlay: a small on-screen window with runtime stats (spin count, RTP, win rate, last error) and copy-to-clipboard.
8. Visual Vegas polish: green/gold palette, coin particles, sticky coin glow, hold-&-win overlay with respin counter.
9. Verification: run `pnpm check`, `pnpm test`, and manually verify the game in browser.

## File plan
1. `client/src/hooks/useGameState.ts` — add new symbols, sticky bonus state, hold-&-win evaluation, LDW, near-miss, stats.
2. `client/src/lib/haptics.ts` — optional Vibration API wrapper.
3. `client/src/components/DebugOverlay.tsx` — debug stats window.
4. `client/src/components/SlotMachine.tsx` and child components — render sticky coins, hold-&-win overlay, green/gold theme.
5. `client/src/components/GoldCoin.tsx`, `client/src/components/GreenCoin.tsx` — coin symbol components (or update SymbolIcon).
6. `IMPLEMENTATION_PLAN.md` — this file.

## Data structures
- `CoinSymbolId = 'greenCoin' | 'goldCoin' | 'miniCoin' | 'minorCoin'` etc.
- `StickyBonusState = { active: boolean; locked: CoinSymbolId[][]; values: number[][]; respinsLeft: number; }`
- `DebugStats = { spins: number; wins: number; totalBet: number; totalWon: number; ldws: number; nearMisses: number; lastError: string | null }`

## Acceptance criteria
- [ ] `pnpm check` passes.
- [ ] `pnpm test` passes.
- [ ] Game launches and slot renders.
- [ ] Green/gold coins appear on reels.
- [ ] Hold-&-Win bonus triggers with 6+ coins.
- [ ] Sticky coins lock and respins work.
- [ ] LDW fires on some losses with fanfare.
- [ ] Near-miss effect fires on close calls.
- [ ] Debug overlay visible with stats and copy button.

## Step-by-step execution
### Phase 1 — Foundation
- Add new symbols to `useGameState.ts`.
- Add sticky bonus state and helper functions.
- Add debug stats state.

### Phase 2 — Core Mechanics
- Implement coin bonus trigger and respin logic in `spin`.
- Implement LDW and near-miss tracking.
- Update win evaluation to treat new symbols.

### Phase 3 — UI & FX
- Create/extend coin symbol components.
- Add hold-&-win overlay.
- Add haptics wrapper.
- Add debug overlay.

### Phase 4 — Verification
- Run type checks and tests.
- Visually verify in browser.
- Commit and deploy to Render.
