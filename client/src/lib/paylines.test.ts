/**
 * Paylines unit tests
 * Locks in the shape and uniqueness invariants of the PAYLINE_PATHS
 * array. If a payline is added/removed/changed in paylines.ts, these
 * tests catch it before it reaches the game.
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

  it("flags the two duplicate paths the audit found (preserved for behavioral parity)", () => {
    // KNOWN DRIFT HAZARD: indices 6 and 20 are the same path
    // ([0,1,0,1,0] — "Zigzag top" and "Alternating top-middle"),
    // and indices 11 and 21 are the same path
    // ([2,1,2,1,2] — "Zigzag bottom" and "Alternating bottom-middle").
    // A 25-payline bet therefore double-counts wins on those two
    // shapes. The 3 hardcoded copies on master all had this same
    // duplication, so consolidating here preserves the current
    // (buggy) behavior. Fixing it is a separate balance change.
    // If a future commit removes the duplication, this test should
    // be updated to assert 23 unique paths (or whatever the new
    // count is) and PAYLINE_PATHS should be trimmed accordingly.
    const pathStrings = PAYLINE_PATHS.map((p) => p.join(","));
    const unique = new Set(pathStrings);
    expect(unique.size).toBe(23); // 25 entries, 23 unique
    expect(pathStrings.filter((s) => s === "0,1,0,1,0")).toHaveLength(2);
    expect(pathStrings.filter((s) => s === "2,1,2,1,2")).toHaveLength(2);
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

  it("all paylines are valid (5 elements, all rows in 0..2)", () => {
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
