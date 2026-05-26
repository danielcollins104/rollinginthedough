/**
 * Cascading Wins System (Candy Crush style)
 * Detects matching adjacent symbols, removes them, and cascades remaining symbols
 */

import type { SymbolId } from "@/hooks/useGameState";

export interface CascadeResult {
  newReels: SymbolId[][];
  matchedCells: Array<{ reel: number; row: number }>;
  cascadeCount: number;
  totalWinAmount: number;
  hasMoreMatches: boolean;
}

/**
 * Detects all matching groups of 3+ adjacent symbols
 * Checks horizontal, vertical, and diagonal adjacency
 */
export function detectMatches(reels: SymbolId[][]): Array<{ reel: number; row: number }> {
  const matched = new Set<string>();
  const rows = reels[0].length;
  const cols = reels.length;

  // Check horizontal matches (3+ in a row)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const symbol = reels[col][row];
      if (!symbol || symbol === "dough") continue; // Skip scatter

      let matchLength = 1;
      let checkCol = col + 1;

      while (checkCol < cols && reels[checkCol][row] === symbol) {
        matchLength++;
        checkCol++;
      }

      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(`${col + i},${row}`);
        }
      }
    }
  }

  // Check vertical matches (3+ in a column)
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const symbol = reels[col][row];
      if (!symbol || symbol === "dough") continue;

      let matchLength = 1;
      let checkRow = row + 1;

      while (checkRow < rows && reels[col][checkRow] === symbol) {
        matchLength++;
        checkRow++;
      }

      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(`${col},${row + i}`);
        }
      }
    }
  }

  // Check diagonal matches (top-left to bottom-right)
  for (let col = 0; col < cols - 2; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const symbol = reels[col][row];
      if (!symbol || symbol === "dough") continue;

      let matchLength = 1;
      let checkCol = col + 1;
      let checkRow = row + 1;

      while (
        checkCol < cols &&
        checkRow < rows &&
        reels[checkCol][checkRow] === symbol
      ) {
        matchLength++;
        checkCol++;
        checkRow++;
      }

      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(`${col + i},${row + i}`);
        }
      }
    }
  }

  // Check diagonal matches (top-right to bottom-left)
  for (let col = 2; col < cols; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const symbol = reels[col][row];
      if (!symbol || symbol === "dough") continue;

      let matchLength = 1;
      let checkCol = col - 1;
      let checkRow = row + 1;

      while (
        checkCol >= 0 &&
        checkRow < rows &&
        reels[checkCol][checkRow] === symbol
      ) {
        matchLength++;
        checkCol--;
        checkRow++;
      }

      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(`${col - i},${row + i}`);
        }
      }
    }
  }

  return Array.from(matched).map((cell) => {
    const [reel, row] = cell.split(",").map(Number);
    return { reel, row };
  });
}

/**
 * Removes matched symbols and cascades remaining symbols down
 */
export function cascadeSymbols(
  reels: SymbolId[][],
  matchedCells: Array<{ reel: number; row: number }>,
  generateSymbol: () => SymbolId
): SymbolId[][] {
  const rows = reels[0].length;
  const cols = reels.length;

  // Create a copy of reels
  const newReels = reels.map((reel) => [...reel]);

  // Mark matched cells as empty
  const matchedSet = new Set(matchedCells.map((c) => `${c.reel},${c.row}`));
  for (const { reel, row } of matchedCells) {
    newReels[reel][row] = null as any;
  }

  // Cascade symbols down in each reel
  for (let col = 0; col < cols; col++) {
    const column = newReels[col];

    // Move non-null symbols down
    const symbols = column.filter((s) => s !== null && s !== undefined);
    const emptyCount = rows - symbols.length;

    // Fill empty spaces with new symbols at the top
    newReels[col] = [
      ...Array(emptyCount)
        .fill(null)
        .map(() => generateSymbol()),
      ...symbols,
    ];
  }

  return newReels;
}

/**
 * Performs a full cascade operation and returns the result
 */
export function performCascade(
  reels: SymbolId[][],
  generateSymbol: () => SymbolId,
  maxCascades: number = 10
): CascadeResult {
  let currentReels = reels.map((r) => [...r]);
  let totalMatched: Array<{ reel: number; row: number }> = [];
  let cascadeCount = 0;
  let totalWinAmount = 0;

  while (cascadeCount < maxCascades) {
    const matches = detectMatches(currentReels);

    if (matches.length === 0) {
      break;
    }

    totalMatched.push(...matches);
    cascadeCount++;

    // Calculate win from this cascade (simplified: 10 coins per matched symbol)
    totalWinAmount += matches.length * 10;

    // Cascade the symbols
    currentReels = cascadeSymbols(currentReels, matches, generateSymbol);
  }

  return {
    newReels: currentReels,
    matchedCells: totalMatched,
    cascadeCount,
    totalWinAmount,
    hasMoreMatches: cascadeCount < maxCascades && detectMatches(currentReels).length > 0,
  };
}
