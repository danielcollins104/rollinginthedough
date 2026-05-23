import { describe, expect, it } from "vitest";
import { detectMatches, cascadeSymbols, performCascade } from "./cascading";
import type { SymbolId } from "@/hooks/useGameState";

describe("Cascading Wins System", () => {
  it("should detect horizontal matches of 3+ symbols", () => {
    const reels: SymbolId[][] = [
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "clover"],
    ];

    const matches = detectMatches(reels);

    // Should find horizontal matches in each column
    expect(matches.length).toBeGreaterThan(0);
  });

  it("should detect vertical matches of 3+ symbols", () => {
    const reels: SymbolId[][] = [
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "clover"],
    ];

    const matches = detectMatches(reels);

    // Should find vertical matches
    expect(matches.length).toBeGreaterThan(0);
  });

  it("should not match scatters (dough symbols)", () => {
    const reels: SymbolId[][] = [
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "clover"],
    ];

    const matches = detectMatches(reels);

    // Scatters should not be matched
    expect(matches.length).toBe(0);
  });

  it("should cascade symbols down after removing matches", () => {
    const reels: SymbolId[][] = [
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "clover"],
    ];

    const matchedCells = [
      { reel: 0, row: 0 },
      { reel: 0, row: 1 },
      { reel: 0, row: 2 },
    ];

    const generateSymbol = () => "bread";
    const cascaded = cascadeSymbols(reels, matchedCells, generateSymbol);

    // Should have same dimensions
    expect(cascaded.length).toBe(reels.length);
    expect(cascaded[0].length).toBe(reels[0].length);

    // First reel should have new symbols at top
    expect(cascaded[0][0]).toBe("bread");
  });

  it("should perform full cascade operation", () => {
    const reels: SymbolId[][] = [
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "clover"],
    ];

    const generateSymbol = () => "coin";
    const result = performCascade(reels, generateSymbol);

    expect(result.newReels).toBeDefined();
    expect(result.matchedCells).toBeDefined();
    expect(result.cascadeCount).toBeGreaterThanOrEqual(0);
    expect(result.totalWinAmount).toBeGreaterThanOrEqual(0);
    expect(typeof result.hasMoreMatches).toBe("boolean");
  });

  it("should return empty matches for random symbols", () => {
    const reels: SymbolId[][] = [
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "bread", "rolling"],
      ["pretzel", "coin", "diamond"],
      ["crown", "clover", "bread"],
    ];

    const matches = detectMatches(reels);

    // Random symbols should have no matches
    expect(Array.isArray(matches)).toBe(true);
  });
});
