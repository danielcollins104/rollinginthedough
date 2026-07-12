/**
 * Pure game-logic helpers for the Vegas Hold-&-Win slot update.
 */

import { SymbolId, WinLine } from "@/hooks/useGameState";

// ─── Payline path lookup copied here to keep this module decoupled from useGameState internals
function getPaylinePath(paylineIndex: number): number[] {
  const paylines: number[][] = [
    [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 0, 1, 0, 0], [2, 2, 1, 2, 2],
    [0, 0, 0, 1, 1], [0, 1, 0, 1, 0], [0, 0, 1, 1, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0],
    [2, 2, 2, 1, 1], [2, 1, 2, 1, 2], [2, 2, 1, 1, 1], [1, 2, 2, 2, 1], [2, 1, 1, 1, 2],
    [0, 1, 2, 1, 0], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2],
    [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 0, 2, 2, 2],
  ];
  return paylines[paylineIndex % paylines.length];
}

export function isCoinSymbol(id: SymbolId): boolean {
  return id === "greenCoin" || id === "goldCoin";
}

export interface CoinCell {
  reelIdx: number;
  rowIdx: number;
  type: "greenCoin" | "goldCoin";
}

export function findCoinCells(reels: SymbolId[][]): CoinCell[] {
  const cells: CoinCell[] = [];
  for (let reelIdx = 0; reelIdx < reels.length; reelIdx++) {
    for (let rowIdx = 0; rowIdx < reels[reelIdx].length; rowIdx++) {
      const sym = reels[reelIdx][rowIdx];
      if (sym === "greenCoin" || sym === "goldCoin") {
        cells.push({ reelIdx, rowIdx, type: sym });
      }
    }
  }
  return cells;
}

export function countCoins(reels: SymbolId[][]): number {
  return findCoinCells(reels).length;
}

export interface StickyBonusResult {
  triggered: boolean;
  cells: CoinCell[];
  value: number;
}

export function detectCoinBonus(
  reels: SymbolId[][],
  triggerCount: number,
  valueGreen: number,
  valueGold: number
): StickyBonusResult {
  const cells = findCoinCells(reels);
  if (cells.length < triggerCount) return { triggered: false, cells: [], value: 0 };
  const value = cells.reduce((sum, c) => sum + (c.type === "greenCoin" ? valueGreen : valueGold), 0);
  return { triggered: true, cells, value };
}

export interface LdwResult {
  isLdw: boolean;
  fakeWin: number;
}

/**
 * Loss Disguised as Win: on a genuine losing spin, sometimes award a small
 * amount that is less than the bet but presented as a "bonus" win.
 */
export function computeLdw(bet: number, chance = 0.35): LdwResult {
  if (Math.random() >= chance) return { isLdw: false, fakeWin: 0 };
  const fakeWin = Math.max(1, Math.floor(bet * (0.2 + Math.random() * 0.5)));
  return { isLdw: true, fakeWin };
}

export interface NearMissResult {
  hasNearMiss: boolean;
  cells: { reelIdx: number; rowIdx: number }[];
}

export function detectNearMisses(reels: SymbolId[][], paylines: number, threshold = 0): NearMissResult {
  const cells: { reelIdx: number; rowIdx: number }[] = [];
  const seen = new Set<string>();
  let bestMatchCount = 0;
  for (let lineIdx = 0; lineIdx < paylines; lineIdx++) {
    const path = getPaylinePath(lineIdx);
    const symbols = path.map((rowIdx, reelIdx) => ({ rowIdx, sym: reels[reelIdx][rowIdx], reelIdx }));
    const first = symbols[0].sym;
    let matchCount = 1;
    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i].sym === first || symbols[i].sym === "bun") matchCount++;
      else break;
    }
    if (matchCount > bestMatchCount) bestMatchCount = matchCount;
    if (matchCount >= 4 + threshold) {
      symbols.forEach(({ reelIdx, rowIdx }) => {
        const key = `${reelIdx}-${rowIdx}`;
        if (!seen.has(key)) {
          seen.add(key);
          cells.push({ reelIdx, rowIdx });
        }
      });
    }
  }
  return { hasNearMiss: bestMatchCount >= 4 + threshold, cells };
}

export interface CoinBonusRound {
  reels: SymbolId[][];
  newCoins: CoinCell[];
  lockedCoins: CoinCell[];
}

export interface CoinBonusResult {
  initialValue: number;
  totalWin: number;
  grandJackpot: boolean;
  locked: CoinCell[];
  rounds: CoinBonusRound[];
}

function bonusPickSymbol(): SymbolId {
  // Bonus reels contain blanks, green coins, and gold coins.
  const r = Math.random();
  if (r < 0.65) return "empty";
  if (r < 0.9) return "greenCoin";
  return "goldCoin";
}

const COIN_GRAND_JACKPOT_MULTIPLIER = 100;

export function runCoinBonus(
  initialReels: SymbolId[][],
  triggerCount: number,
  valueGreen: number,
  valueGold: number,
  respinStart: number
): CoinBonusResult {
  const allLocked: CoinCell[] = findCoinCells(initialReels).map((c) => ({ ...c }));
  let totalWin = allLocked.reduce((sum, c) => sum + (c.type === "greenCoin" ? valueGreen : valueGold), 0);
  const rounds: CoinBonusRound[] = [];

  let respinsLeft = respinStart;
  let currentGrid: SymbolId[][] = initialReels.map((reel) => [...reel]);

  while (respinsLeft > 0) {
    // Spin only unlocked positions
    const newGrid = currentGrid.map((reel, ri) =>
      reel.map((sym, ci) => {
        if (isCoinSymbol(sym)) return sym;
        // 30% chance to land a coin on an empty cell during bonus
        if (Math.random() < 0.3) return Math.random() < 0.7 ? "greenCoin" : "goldCoin";
        return "empty";
      })
    );

    const newCoins = findCoinCells(newGrid).filter(
      (c) => !allLocked.some((l) => l.reelIdx === c.reelIdx && l.rowIdx === c.rowIdx)
    );

    if (newCoins.length > 0) {
      newCoins.forEach((c) => allLocked.push({ ...c }));
      totalWin += newCoins.reduce((sum, c) => sum + (c.type === "greenCoin" ? valueGreen : valueGold), 0);
      respinsLeft = respinStart;
    }

    rounds.push({ reels: newGrid.map((r) => [...r]), newCoins, lockedCoins: allLocked.map((c) => ({ ...c })) });
    currentGrid = newGrid;
    respinsLeft--;

    if (allLocked.length >= 15) break;
  }

  const grandJackpot = allLocked.length >= 15;
  if (grandJackpot) {
    totalWin = Math.max(totalWin, valueGreen * COIN_GRAND_JACKPOT_MULTIPLIER);
  }

  return {
    initialValue: allLocked.reduce((sum, c) => sum + (c.type === "greenCoin" ? valueGreen : valueGold), 0),
    totalWin,
    grandJackpot,
    locked: allLocked,
    rounds,
  };
}
