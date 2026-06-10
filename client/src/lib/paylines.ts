/**
 * Payline path definitions and accessors.
 *
 * Single source of truth for the 25 slot machine paylines. Previously
 * this array was hardcoded in three places (useGameState.ts,
 * SlotMachine.tsx, PaylineHighlight.tsx) with the drift hazard
 * that an edit to one would silently desync from the others. Now
 * imported from here by all three.
 *
 * Each payline is a 5-element array of row indices (0=top, 1=middle,
 * 2=bottom), one row per reel. Index 0 of the array is reel 0 (leftmost).
 *
 * The same array drives:
 *   - Win detection in useGameState.ts (evaluateWins / checkLine)
 *   - Win highlight SVG geometry in PaylineHighlight.tsx
 *   - Near-miss detection in SlotMachine.tsx
 *
 * If you change a payline shape, all three behaviors update together
 * and the test in paylines.test.ts will catch any shape regression.
 */

export const REEL_COUNT = 5;
export const ROW_COUNT = 3;

/** The 25 payline paths across 5 reels × 3 rows. */
export const PAYLINE_PATHS: readonly number[][] = [
  // Rows (5 paylines)
  [0, 0, 0, 0, 0], // 0  Top row
  [1, 1, 1, 1, 1], // 1  Middle row
  [2, 2, 2, 2, 2], // 2  Bottom row
  [0, 0, 1, 0, 0], // 3  Top with dip
  [2, 2, 1, 2, 2], // 4  Bottom with dip

  // Upper diagonals (5 paylines)
  [0, 0, 0, 1, 1], // 5  Top-left to middle-right
  [0, 1, 0, 1, 0], // 6  Zigzag top
  [0, 0, 1, 1, 1], // 7  Top to bottom-right
  [1, 0, 0, 0, 1], // 8  V-shape top
  [0, 1, 1, 1, 0], // 9  Wave top

  // Lower diagonals (5 paylines)
  [2, 2, 2, 1, 1], // 10 Bottom-left to middle-right
  [2, 1, 2, 1, 2], // 11 Zigzag bottom
  [2, 2, 1, 1, 1], // 12 Bottom to top-right
  [1, 2, 2, 2, 1], // 13 V-shape bottom
  [2, 1, 1, 1, 2], // 14 Wave bottom

  // Mixed diagonals (5 paylines)
  [0, 1, 2, 1, 0], // 15 Diamond
  [1, 0, 1, 2, 1], // 16 Mountain
  [1, 2, 1, 0, 1], // 17 Valley
  [0, 2, 0, 2, 0], // 18 Checkerboard
  [2, 0, 2, 0, 2], // 19 Checkerboard reverse

  // Additional mixed paths (5 paylines)
  // NOTE: indices 20 and 21 used to duplicate the shapes at indices 6
  // and 11 respectively (a balance bug — the player was getting
  // double-paid on those two paths). Replaced with two new unique
  // shapes picked for visual variety AND statistical neutrality:
  // measured impact on RTP across 5 seeds × 100k spins was within
  // sampling noise (~0.01pp). See GAME_BALANCE.md iteration log.
  [0, 1, 0, 1, 2], // 20 Top zigzag descent
  [1, 0, 1, 0, 1], // 21 Middle zigzag
  [1, 0, 2, 0, 1], // 22 Complex wave
  [1, 2, 0, 2, 1], // 23 Reverse complex wave
  [0, 0, 2, 2, 2], // 24 Staircase down
];

/**
 * Get the row path for a payline index. Wraps with `%` so out-of-range
 * indices deterministically return a valid path. This matches the
 * behavior of the three previous copies of this function exactly, so
 * no caller needs to be defensive about its input. (Negative inputs
 * are not expected from any caller — the game state only ever sets
 * WinLine.row to a non-negative payline index 0–24 — but the
 * behavior is preserved regardless.)
 */
export function getPaylinePath(paylineIndex: number): number[] {
  return PAYLINE_PATHS[paylineIndex % PAYLINE_PATHS.length];
}
