import { describe, expect, it } from "vitest";
import {
  shouldTriggerBonus,
  playCoinFlip,
  playLuckySpin,
  playTreasureHunt,
  playBonusGame,
  BONUS_GAMES,
} from "./bonusGames";

describe("Bonus Games System", () => {
  it("should trigger treasure hunt with 5 scatters", () => {
    const bonus = shouldTriggerBonus(0, 5);
    expect(bonus).toBe("treasure_hunt");
  });

  it("should trigger a bonus game with 4+ matches", () => {
    const bonus = shouldTriggerBonus(4, 0);
    expect(bonus).toMatch(/coin_flip|lucky_spin/);
  });

  it("should trigger bonus with 3 matches (new threshold)", () => {
    const bonus = shouldTriggerBonus(3, 0);
    expect(bonus).toMatch(/coin_flip|lucky_spin/);
  });

  it("should not trigger bonus with less than 3 matches", () => {
    const bonus = shouldTriggerBonus(2, 0);
    expect(bonus).toBeNull();
  });

  it("should play coin flip game", () => {
    const result = playCoinFlip();

    expect(result.gameType).toBe("coin_flip");
    expect(typeof result.won).toBe("boolean");
    expect(result.reward).toBeGreaterThan(0);
    expect(result.multiplier).toBeGreaterThanOrEqual(1);
    expect(result.message).toBeDefined();
  });

  it("should always win lucky spin game", () => {
    const result = playLuckySpin();

    expect(result.gameType).toBe("lucky_spin");
    expect(result.won).toBe(true);
    expect(result.reward).toBeGreaterThan(0);
    expect(result.multiplier).toBeGreaterThanOrEqual(1);
    expect(result.multiplier).toBeLessThanOrEqual(5);
  });

  it("should play treasure hunt game", () => {
    const result = playTreasureHunt();

    expect(result.gameType).toBe("treasure_hunt");
    expect(typeof result.won).toBe("boolean");
    expect(result.reward).toBeGreaterThan(0);
    expect(result.multiplier).toBeGreaterThanOrEqual(3);
  });

  it("should play bonus game by type", () => {
    const coinFlipResult = playBonusGame("coin_flip");
    expect(coinFlipResult.gameType).toBe("coin_flip");

    const luckySpinResult = playBonusGame("lucky_spin");
    expect(luckySpinResult.gameType).toBe("lucky_spin");

    const treasureHuntResult = playBonusGame("treasure_hunt");
    expect(treasureHuntResult.gameType).toBe("treasure_hunt");
  });

  it("should have defined bonus game metadata", () => {
    expect(BONUS_GAMES.coin_flip).toBeDefined();
    expect(BONUS_GAMES.lucky_spin).toBeDefined();
    expect(BONUS_GAMES.treasure_hunt).toBeDefined();

    Object.values(BONUS_GAMES).forEach((game) => {
      expect(game.name).toBeDefined();
      expect(game.description).toBeDefined();
      expect(game.baseReward).toBeGreaterThan(0);
      expect(game.maxMultiplier).toBeGreaterThan(1);
    });
  });

  it("coin flip should have 1-3x multiplier", () => {
    for (let i = 0; i < 20; i++) {
      const result = playCoinFlip();
      expect(result.multiplier).toBeGreaterThanOrEqual(1);
      expect(result.multiplier).toBeLessThanOrEqual(3);
    }
  });

  it("lucky spin should have 1-5x multiplier", () => {
    for (let i = 0; i < 20; i++) {
      const result = playLuckySpin();
      expect(result.multiplier).toBeGreaterThanOrEqual(1);
      expect(result.multiplier).toBeLessThanOrEqual(5);
    }
  });

  it("treasure hunt should have 3-10x multiplier", () => {
    for (let i = 0; i < 20; i++) {
      const result = playTreasureHunt();
      expect(result.multiplier).toBeGreaterThanOrEqual(3);
      expect(result.multiplier).toBeLessThanOrEqual(10);
    }
  });
});
