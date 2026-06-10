/**
 * Paylines unit tests
 * Locks in the shape and uniqueness invariants of the PAYLINE_PATHS
 * array. If a payline is added/removed/changed in paylines.ts, these
 * tests catch it before it reaches the game.
 *
 * History note: 2026-06-10, indices 20 and 21 were previously
 * duplicates of indices 6 and 11 (a balance bug — the player was
 * getting double-paid on those two paths). They were replaced with
 * two new unique shapes. The test in this file now asserts 25
 * unique paths and locks in the new replacement shapes.
 */

import { describe, it, expect } from "vitest";
import { PAYLINE_PATHS, getPaylinePath, REEL_COUNT, ROW_COUNT } from "./paylines";

describe("PAYLINE_PATHS", () => {
  it("contains exactly 25 paylines (matching the PAYLINE_OPTIONS selector)", () => {
    // The slot machine exposes a payline selector with options
    // [1, 5, 10, 15, 20, 25]. The "25" option must have 25 entries
    // available, so the player can bet on what they're promised.
    expect(PAYLINE_PATHS).toHaveLength(25);
  });

  it("all 25 paylines are unique paths (no shape is bet twice)", () => {
    // Pre-fix, indices 6 and 20 were both [0,1,0,1,0] and indices 11
    // and 21 were both [2,1,2,1,2]. A 25-payline bet therefore
    // double-counted wins on those two shapes. The fix replaced
    // indices 20 and 21 with new unique shapes ([0,1,0,1,2] and
    // [1,0,1,0,1] respectively). This test guards against any future
    // drift that re-introduces a duplicate.
    const pathStrings = PAYLINE_PATHS.map((p) => p.join(","));
    const unique = new Set(pathStrings);
    expect(unique.size).toBe(25);
  });

  it("every payline is a 5-element array of valid row indices (0, 1, or 2)", () => {
    for (let i = 0; i < PAYLINE_PATHS.length; i++) {
      const path = PAYLINE_PATHS[i];
      expect(path).toHaveLength(REEL_COUNT);
      for (const row of path) {
        expect([0, 1, 2]).toContain(row);
      }
    }
  });

  it("includes the three straight paylines (top, middle, bottom)", () => {
    const straight = PAYLINE_PATHS.filter(
      (p) => p[0] === p[1] && p[1] === p[2] && p[2] === p[3] && p[3] === p[4]
    );
    // Should be at least the three horizontal ones
    expect(straight.length).toBeGreaterThanOrEqual(3);
    expect(straight).toContainEqual([0, 0, 0, 0, 0]);
    expect(straight).toContainEqual([1, 1, 1, 1, 1]);
    expect(straight).toContainEqual([2, 2, 2, 2, 2]);
  });

  it("replacement paths (indices 20, 21) are the new shapes, not the old duplicates", () => {
    // Pre-fix:
    //   PAYLINE_PATHS[20] === [0, 1, 0, 1, 0]   (duplicate of index 6)
    //   PAYLINE_PATHS[21] === [2, 1, 2, 1, 2]   (duplicate of index 11)
    // Post-fix:
    //   PAYLINE_PATHS[20] === [0, 1, 0, 1, 2]   ("Top zigzag descent")
    //   PAYLINE_PATHS[21] === [1, 0, 1, 0, 1]   ("Middle zigzag")
    expect(PAYLINE_PATHS[20]).toEqual([0, 1, 0, 1, 2]);
    expect(PAYLINE_PATHS[21]).toEqual([1, 0, 1, 0, 1]);
  });

  it("REEL_COUNT and ROW_COUNT match the actual path geometry", () => {
    expect(REEL_COUNT).toBe(5);
    expect(ROW_COUNT).toBe(3);
  });
});

describe("getPaylinePath", () => {
  it("returns the correct path for each valid index", () => {
    for (let i = 0; i < PAYLINE_PATHS.length; i++) {
      expect(getPaylinePath(i)).toEqual(PAYLINE_PATHS[i]);
    }
  });

  it("wraps out-of-range positive indices with modulo", () => {
    expect(getPaylinePath(25)).toEqual(PAYLINE_PATHS[0]);
    expect(getPaylinePath(26)).toEqual(PAYLINE_PATHS[1]);
    expect(getPaylinePath(50)).toEqual(PAYLINE_PATHS[0]);
  });

  it("matches the historical % behavior on negative indices (no surprise fixes)", () => {
    // The original three copies of this function all used the simple
    // `n % length` form, which returns negative remainders for negative
    // inputs (a JS quirk). This test pins that behavior so a future
    // "fix" doesn't silently change caller-visible results.
    // -1 % 25 === -1, and PAYLINE_PATHS[-1] is undefined — so the
    // original behavior was "returns undefined for -1". We preserve.
    expect(getPaylinePath(-1)).toBeUndefined();
  });
});
