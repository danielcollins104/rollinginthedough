import { useState, useCallback } from "react";
import { getPaylinePath, type SymbolId, type WinLine } from "@shared/game";
import { playSound } from "@/lib/sounds";
import { isWildSymbol, getRandomSymbolId, findNearMiss } from "@/lib/reelHelpers";

const CASCADE_MULTIPLIERS = [1, 2, 3, 4, 5];
const MAX_CASCADE_LEVEL = 5;

interface UseCascadeSystemOptions {
  reels: SymbolId[][];
  paylines?: number;
  soundEnabled: boolean;
}

export function useCascadeSystem({ reels, paylines, soundEnabled }: UseCascadeSystemOptions) {
  const [cascadeActive, setCascadeActive] = useState(false);
  const [cascadeLevel, setCascadeLevel] = useState(0);
  const [cascadeGrid, setCascadeGrid] = useState<SymbolId[][] | null>(null);
  const [cascadeWinningCells, setCascadeWinningCells] = useState<Set<string>>(new Set());
  const [cascadeAnimatingCells, setCascadeAnimatingCells] = useState<Set<string>>(new Set());
  const [showCascadeMultiplier, setShowCascadeMultiplier] = useState(false);
  const [stickyWildCells, setStickyWildCells] = useState<Set<string>>(new Set());
  const [wildLockAnimating, setWildLockAnimating] = useState(false);
  const [nearMissCells, setNearMissCells] = useState<Set<string>>(new Set());
  const [nearMissAnimating, setNearMissAnimating] = useState(false);

  const displayGrid = cascadeGrid || reels;

  const findStickyWilds = useCallback((grid: SymbolId[][], lines: WinLine[]): Set<string> => {
    const wilds = new Set<string>();
    lines.forEach(line => {
      if (line.row < 0 || line.row >= 25) return;
      const path = getPaylinePath(line.row);
      for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        const rowIdx = path[reelIdx];
        if (isWildSymbol(grid[reelIdx][rowIdx])) {
          wilds.add(`${reelIdx}-${rowIdx}`);
        }
      }
    });
    return wilds;
  }, []);

  const processCascade = useCallback((grid: SymbolId[][], winningCells: Set<string>): SymbolId[][] => {
    const newGrid: SymbolId[][] = grid.map(reel => [...reel]);
    const sortedWinners = Array.from(winningCells)
      .map(key => {
        const [reelIdx, rowIdx] = key.split('-').map(Number);
        return { reelIdx, rowIdx };
      })
      .sort((a, b) => a.rowIdx - b.rowIdx);
    const affectedReels = new Set<number>();
    sortedWinners.forEach(({ reelIdx }) => affectedReels.add(reelIdx));
    sortedWinners.forEach(({ reelIdx, rowIdx }) => {
      newGrid[reelIdx][rowIdx] = 'empty';
    });
    affectedReels.forEach(reelIdx => {
      const column = newGrid[reelIdx];
      const symbols: SymbolId[] = [];
      for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        if (column[rowIdx] !== 'empty') {
          symbols.push(column[rowIdx]);
        }
      }
      const emptyCount = 3 - symbols.length;
      const newColumn: SymbolId[] = [];
      for (let i = 0; i < emptyCount; i++) {
        newColumn.push(getRandomSymbolId());
      }
      for (const sym of symbols) {
        newColumn.push(sym);
      }
      newGrid[reelIdx] = newColumn;
    });
    return newGrid;
  }, []);

  const checkCascadeWin = useCallback((grid: SymbolId[][]): { hasWin: boolean; winLines: WinLine[]; multiplier: number } => {
    const activeLines = paylines || 1;
    const allWinLines: WinLine[] = [];

    for (let lineIdx = 0; lineIdx < activeLines && lineIdx < 25; lineIdx++) {
      const path = getPaylinePath(lineIdx);
      const cells = path.map((rowIdx, reelIdx) => ({ reelIdx, rowIdx, symId: grid[reelIdx][rowIdx] }));

      const first = cells[0];
      if (isWildSymbol(first.symId)) {
        const second = cells[1];
        if (isWildSymbol(second.symId) || cells.every(c =>
          c.symId === first.symId || isWildSymbol(c.symId))) {
          allWinLines.push({ row: lineIdx, cells: cells.map(c => ({ reelIdx: c.reelIdx, rowIdx: c.rowIdx })), symbols: cells.map(c => c.symId), amount: 0, count: cells.length });
        }
      } else if (cells.every(c => c.symId === first.symId || isWildSymbol(c.symId))) {
        allWinLines.push({ row: lineIdx, cells: cells.map(c => ({ reelIdx: c.reelIdx, rowIdx: c.rowIdx })), symbols: cells.map(c => c.symId), amount: 0, count: cells.length });
      }
    }

    const hasWin = allWinLines.length > 0;
    const multiplier = hasWin ? CASCADE_MULTIPLIERS[Math.min(cascadeLevel, MAX_CASCADE_LEVEL - 1)] : 1;
    return { hasWin, winLines: allWinLines, multiplier };
  }, [paylines, cascadeLevel]);

  const startCascade = useCallback((initialGrid: SymbolId[][], initialWins: WinLine[]) => {
    if (initialWins.length === 0) return;

    setCascadeActive(true);
    setCascadeLevel(1);
    setCascadeGrid(initialGrid);

    if (soundEnabled) playSound("cascade_1");

    const winningCells = new Set<string>();
    initialWins.forEach(line => {
      const path = getPaylinePath(line.row);
      path.forEach((rowIdx, reelIdx) => {
        winningCells.add(`${reelIdx}-${rowIdx}`);
      });
    });
    setCascadeWinningCells(winningCells);
    setCascadeAnimatingCells(winningCells);

    // Sticky wilds from first cascade
    const wilds = findStickyWilds(initialGrid, initialWins);
    if (wilds.size > 0) {
      setWildLockAnimating(true);
      setStickyWildCells(wilds);
      if (soundEnabled) playSound("wild_lock");
      setTimeout(() => setWildLockAnimating(false), 800);
    }

    // Near misses
    const misses = findNearMiss(initialGrid, initialWins);
    if (misses.length > 0) {
      setNearMissCells(new Set(misses.map(m => `${m.reelIdx}-${m.rowIdx}`)));
      setNearMissAnimating(true);
      setTimeout(() => setNearMissAnimating(false), 1000);
    }

    const animationDuration = 600;

    setTimeout(() => {
      setCascadeWinningCells(new Set());

      setTimeout(() => {
        const newGrid = processCascade(initialGrid, winningCells);
        setCascadeGrid(newGrid);

        if (cascadeLevel >= 2) {
          setShowCascadeMultiplier(true);
          setTimeout(() => setShowCascadeMultiplier(false), 1000);
        }

        setTimeout(() => {
          const result = checkCascadeWin(newGrid);

          if (result.hasWin && cascadeLevel < MAX_CASCADE_LEVEL) {
            const nextLevel = cascadeLevel + 1;
            setCascadeLevel(prev => prev + 1);
            const nextCascadeSound = `cascade_${Math.min(nextLevel, 5)}`;
            if (soundEnabled) playSound(nextCascadeSound as any);
            if ("vibrate" in navigator) {
              const cascadeVib = nextLevel >= 4 ? [80, 30, 80, 30, 120] : nextLevel >= 3 ? [60, 30, 100] : nextLevel >= 2 ? [40, 20, 60] : [30];
              window.navigator.vibrate(cascadeVib);
            }

            const newWinningCells = new Set<string>();
            result.winLines.forEach(line => {
              const path = getPaylinePath(line.row);
              path.forEach((rowIdx, reelIdx) => {
                newWinningCells.add(`${reelIdx}-${rowIdx}`);
              });
            });
            setCascadeWinningCells(newWinningCells);
            setCascadeAnimatingCells(newWinningCells);

            const newWilds = findStickyWilds(newGrid, result.winLines);
            if (newWilds.size > 0) {
              setWildLockAnimating(true);
              setStickyWildCells(prev => {
                const merged = new Set(prev);
                newWilds.forEach(w => merged.add(w));
                return merged;
              });
              if (soundEnabled) playSound("wild_lock");
              setTimeout(() => setWildLockAnimating(false), 800);
            }

            setTimeout(() => {
              setCascadeWinningCells(new Set());
              setTimeout(() => {
                const nextGrid = processCascade(newGrid, newWinningCells);
                setCascadeGrid(nextGrid);

                setTimeout(() => {
                  const nextResult = checkCascadeWin(nextGrid);
                  if (!nextResult.hasWin || cascadeLevel >= MAX_CASCADE_LEVEL) {
                    setCascadeActive(false);
                    setCascadeLevel(0);
                    setCascadeGrid(null);
                    setStickyWildCells(new Set());
                  }
                }, 400);
              }, 50);
            }, animationDuration);
          } else {
            setCascadeActive(false);
            setCascadeLevel(0);
            setCascadeGrid(null);
            setStickyWildCells(new Set());
          }
        }, 400);
      }, 200);
    }, animationDuration);
  }, [findStickyWilds, processCascade, checkCascadeWin, soundEnabled, cascadeLevel]);

  const resetVisuals = useCallback(() => {
    setStickyWildCells(new Set());
    setNearMissCells(new Set());
    setCascadeWinningCells(new Set());
    setCascadeAnimatingCells(new Set());
  }, []);

  return {
    cascadeActive,
    cascadeLevel,
    cascadeGrid,
    cascadeWinningCells,
    cascadeAnimatingCells,
    showCascadeMultiplier,
    stickyWildCells,
    wildLockAnimating,
    nearMissCells,
    nearMissAnimating,
    displayGrid,
    startCascade,
    resetVisuals,
    setNearMissCells,
    setNearMissAnimating,
  };
}
