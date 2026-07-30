import { SYMBOLS, getPaylinePath, type SymbolId, type WinLine } from "@shared/game";

export function getSymbol(id: SymbolId) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}

export function isWildSymbol(id: SymbolId): boolean {
  const sym = getSymbol(id);
  return sym.isWild || false;
}

export function isScatterSymbol(id: SymbolId): boolean {
  const sym = getSymbol(id);
  return sym.isScatter || false;
}

export function getRandomSymbolId(): SymbolId {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
}

export function isWinningCell(reelIdx: number, rowIdx: number, winLines: WinLine[]): boolean {
  return winLines.some((line) => {
    if (line.row >= 0 && line.row < 25) {
      const path = getPaylinePath(line.row);
      return path[reelIdx] === rowIdx;
    }
    return false;
  });
}

export function findNearMiss(reels: SymbolId[][], winLines: WinLine[]): { reelIdx: number; rowIdx: number }[] {
  const nearMisses: { reelIdx: number; rowIdx: number }[] = [];

  winLines.forEach((line) => {
    if (line.row < 0 || line.row >= 25) return;
    const path = getPaylinePath(line.row);

    const paylineSymbols = reels.map((reel, reelIdx) => ({
      symId: reel[path[reelIdx]],
      reelIdx,
      rowIdx: path[reelIdx],
    }));

    const counts: Record<string, number> = {};
    paylineSymbols.forEach((cell) => {
      const id = cell.symId;
      if (!isWildSymbol(id) && !isScatterSymbol(id)) {
        counts[id] = (counts[id] || 0) + 1;
      }
    });

    const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);

    pairs.forEach(([symId, count]) => {
      if (count >= 3) return;

      paylineSymbols.forEach((cell) => {
        if (cell.symId === symId) return;
        if (isWildSymbol(cell.symId) || isScatterSymbol(cell.symId)) return;

        const cellSym = getSymbol(cell.symId);
        const targetSym = getSymbol(symId as SymbolId);

        if (
          cellSym.payouts[0] > 0 &&
          cellSym.payouts[0] <= targetSym.payouts[0] * 2 &&
          cellSym.payouts[0] >= targetSym.payouts[0] / 2
        ) {
          nearMisses.push({ reelIdx: cell.reelIdx, rowIdx: cell.rowIdx });
        }
      });
    });
  });

  const seen = new Set<string>();
  return nearMisses.filter((nm) => {
    const key = `${nm.reelIdx}-${nm.rowIdx}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
