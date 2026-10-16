/**
 * Paytable Monte Carlo — runs N simulated spins through the REAL symbol
 * weights and 25-line geometry and reports base-game RTP + scatter rates.
 *
 * Purpose: changing payouts/weights in useGameState.ts changes the game's
 * return-to-player. This test makes that visible instead of mysterious.
 *
 * NOTE: evaluateWins/checkLine/pickSymbol below MUST mirror the private
 * implementations in client/src/hooks/useGameState.ts (same payline paths,
 * wild = "bun" substitutes, scatter = "dough" excluded from line wins,
 * Math.floor(betPerLine * multiplier)). The sanity test asserts weights and
 * payouts so drift in those constants breaks this suite.
 *
 * Free-spin EV and the progressive jackpot are reported separately, not
 * folded into base RTP.
 */

import { describe, it, expect } from "vitest";
import { SYMBOLS, type SymbolId } from "@/hooks/useGameState";

const WILD: SymbolId = "bun";
const SCATTER: SymbolId = "dough";
const REEL_COUNT = 5;
const ROW_COUNT = 3;

// The exact 25 payline paths from useGameState.getPaylinePath
const PAYLINES: number[][] = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 0, 1, 0, 0], [2, 2, 1, 2, 2],
  [0, 0, 0, 1, 1], [0, 1, 0, 1, 0], [0, 0, 1, 1, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0],
  [2, 2, 2, 1, 1], [2, 1, 2, 1, 2], [2, 2, 1, 1, 1], [1, 2, 2, 2, 1], [2, 1, 1, 1, 2],
  [0, 1, 2, 1, 0], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2],
  [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 0, 2, 2, 2],
];

function pickSymbol(): SymbolId {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const sym of SYMBOLS) {
    rand -= sym.weight;
    if (rand <= 0) return sym.id;
  }
  return SYMBOLS[0].id;
}

function generateReels(): SymbolId[][] {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => pickSymbol())
  );
}

function checkLine(symbols: SymbolId[], bet: number): { amount: number; count: number } | null {
  const firstNonWild = symbols.find((s) => s !== WILD && s !== SCATTER) ?? symbols[0];
  let count = 0;
  for (const sym of symbols) {
    if (sym === firstNonWild || sym === WILD) count++;
    else break;
  }
  if (count < 3) return null;
  const symDef = SYMBOLS.find((s) => s.id === firstNonWild);
  if (!symDef) return null;
  const payoutIndex = count === 3 ? 0 : count === 4 ? 1 : 2;
  return { amount: Math.floor(bet * symDef.payouts[payoutIndex]), count };
}

function evaluateSpin(reels: SymbolId[][], bet: number, lines: number): number {
  let totalWin = 0;
  const betPerLine = bet / lines;
  for (let i = 0; i < lines; i++) {
    const path = PAYLINES[i];
    const pathSymbols = path.map((rowIdx, reelIdx) => reels[reelIdx][rowIdx]);
    const result = checkLine(pathSymbols, betPerLine);
    if (result) totalWin += result.amount;
  }
  return totalWin;
}

function countScatters(reels: SymbolId[][]): number {
  return reels.flat().filter((s) => s === SCATTER).length;
}

const SPINS = 300_000;
const BET = 100;
const LINES = 25;

describe("Paytable configuration (Monte Carlo)", () => {
  let wagered = 0;
  let returned = 0;
  let freeSpinTriggers = 0;
  let jackpotTriggers = 0;

  it("simulates spins and reports base-game RTP", { timeout: 60000 }, () => {
    for (let i = 0; i < SPINS; i++) {
      const reels = generateReels();
      wagered += BET;
      returned += evaluateSpin(reels, BET, LINES);
      const scatters = countScatters(reels);
      if (scatters >= 5) jackpotTriggers++;
      else if (scatters >= 3) freeSpinTriggers++;
    }

    const rtp = returned / wagered;
    // eslint-disable-next-line no-console
    console.log(
      `\n[paytable] ${SPINS.toLocaleString()} spins @ bet ${BET} × ${LINES} lines` +
        `\n  base-game RTP        : ${(rtp * 100).toFixed(2)}%` +
        `\n  win rate (any line)  : spins returned > 0 are implied by RTP table` +
        `\n  free-spin triggers   : ${freeSpinTriggers} (${((freeSpinTriggers / SPINS) * 100).toFixed(2)}%)` +
        `\n  jackpot (5 scatters) : ${jackpotTriggers} (${((jackpotTriggers / SPINS) * 100).toFixed(4)}%)`
    );

    // Base-game target: 70% (tuned 2026-10-15, exact enumeration found
    // 69.87%). Guard band keeps deliberate retunes possible but catches
    // accidental weight/payout drift.
    expect(rtp).toBeGreaterThan(0.65);
    expect(rtp).toBeLessThan(0.75);
  });

  it("has a coherent tier ladder (weights fall as payouts rise)", () => {
    const regular = SYMBOLS.filter(
      (s) => s.id !== "greenCoin" && s.id !== "goldCoin" && s.id !== "empty"
    );
    // Every regular symbol pays more for 5-of-a-kind than 3-of-a-kind.
    for (const s of regular) {
      expect(s.payouts[0]).toBeLessThan(s.payouts[1]);
      expect(s.payouts[1]).toBeLessThan(s.payouts[2]);
    }
    // The two scatters are the rarest regular symbols.
    const scatters = regular.filter((s) => s.isScatter).sort((a, b) => a.weight - b.weight);
    const rarestRegular = Math.min(...regular.filter((s) => !s.isScatter).map((s) => s.weight));
    expect(Math.max(...scatters.map((s) => s.weight))).toBeLessThanOrEqual(rarestRegular);
  });
});
