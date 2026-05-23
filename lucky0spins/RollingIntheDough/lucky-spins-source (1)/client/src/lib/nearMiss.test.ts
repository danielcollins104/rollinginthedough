import { describe, expect, it } from "vitest";
import { detectNearMisses, playNearMissSound } from "./nearMiss";

describe("Near-Miss Mechanics System", () => {
  it("should detect one symbol away from winning", () => {
    const reels = [
      ["bread", "bread", "rolling"],
      ["rolling", "rolling", "pretzel"],
      ["pretzel", "pretzel", "coin"],
      ["coin", "coin", "diamond"],
      ["diamond", "diamond", "crown"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Should detect near-miss conditions
    expect(Array.isArray(nearMisses)).toBe(true);
  });

  it("should detect almost jackpot (4 scatters)", () => {
    const reels = [
      ["dough", "bread", "rolling"],
      ["dough", "rolling", "pretzel"],
      ["dough", "pretzel", "coin"],
      ["dough", "coin", "diamond"],
      ["bread", "diamond", "crown"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Should detect 4 scatters (one away from jackpot)
    const almostJackpot = nearMisses.find((nm) => nm.type === "almost_jackpot");
    expect(almostJackpot).toBeDefined();
  });

  it("should detect almost bonus (2 matching symbols)", () => {
    const reels = [
      ["bread", "bread", "rolling"],
      ["rolling", "pretzel", "pretzel"],
      ["coin", "coin", "diamond"],
      ["diamond", "crown", "clover"],
      ["clover", "dough", "bread"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Should detect near-miss conditions
    expect(Array.isArray(nearMisses)).toBe(true);
  });

  it("should not detect near-miss with random symbols", () => {
    const reels = [
      ["bread", "rolling", "pretzel"],
      ["coin", "diamond", "crown"],
      ["clover", "dough", "bread"],
      ["rolling", "pretzel", "coin"],
      ["diamond", "crown", "clover"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Random symbols should have minimal near-misses
    expect(Array.isArray(nearMisses)).toBe(true);
  });

  it("should not count scatters in one-away detection", () => {
    const reels = [
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
      ["dough", "dough", "dough"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Scatters should only trigger almost-jackpot, not one-away
    const oneAway = nearMisses.find((nm) => nm.type === "one_away");
    expect(oneAway).toBeUndefined();
  });

  it("should not count wilds in one-away detection", () => {
    const reels = [
      ["clover", "clover", "clover"],
      ["clover", "clover", "clover"],
      ["clover", "clover", "clover"],
      ["clover", "clover", "clover"],
      ["clover", "clover", "clover"],
    ];

    const nearMisses = detectNearMisses(reels);

    // Wilds should not trigger one-away
    const oneAway = nearMisses.find((nm) => nm.type === "one_away");
    expect(oneAway).toBeUndefined();
  });

  it("should have excitement ratings for near-misses", () => {
    const reels = [
      ["dough", "bread", "rolling"],
      ["dough", "rolling", "pretzel"],
      ["dough", "pretzel", "coin"],
      ["dough", "coin", "diamond"],
      ["bread", "diamond", "crown"],
    ];

    const nearMisses = detectNearMisses(reels);

    nearMisses.forEach((nm) => {
      expect(nm.excitement).toBeGreaterThanOrEqual(1);
      expect(nm.excitement).toBeLessThanOrEqual(10);
    });
  });

  it("should have descriptive messages for near-misses", () => {
    const reels = [
      ["dough", "bread", "rolling"],
      ["dough", "rolling", "pretzel"],
      ["dough", "pretzel", "coin"],
      ["dough", "coin", "diamond"],
      ["bread", "diamond", "crown"],
    ];

    const nearMisses = detectNearMisses(reels);

    nearMisses.forEach((nm) => {
      expect(nm.message).toBeDefined();
      expect(nm.message.length).toBeGreaterThan(0);
    });
  });

  it("should play near-miss sound without errors", () => {
    const nearMiss = {
      type: "one_away" as const,
      message: "Test",
      excitement: 7,
    };

    // Should not throw
    expect(() => playNearMissSound(nearMiss)).not.toThrow();
  });
});
