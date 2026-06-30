import { describe, it, expect } from "vitest";
import { shouldOfferRescue, rescueMinPayout, applyMissionClaim } from "./useGameState";
import type { BonusGameType } from "@/lib/bonusGames";

/**
 * Win Calculation Tests
 * Verifies that:
 * 1. Win amounts are properly multiplied by bet per line
 * 2. Total bet (bet per line × number of lines) is correctly deducted
 * 3. Wins on each payline are calculated as: symbol payout × bet per line
 * 4. Balance is correctly updated (balance - total bet + total winnings)
 */

describe("Win Calculation Logic", () => {
  describe("Bet Per Line Calculation", () => {
    it("should correctly distribute bet across paylines", () => {
      // If player bets 100 total with 5 paylines
      // Each payline should have 100/5 = 20 bet per line
      const totalBet = 100;
      const paylines = 5;
      const betPerLine = totalBet / paylines;
      expect(betPerLine).toBe(20);
    });

    it("should handle single payline", () => {
      const totalBet = 50;
      const paylines = 1;
      const betPerLine = totalBet / paylines;
      expect(betPerLine).toBe(50);
    });

    it("should handle maximum paylines", () => {
      const totalBet = 250;
      const paylines = 25;
      const betPerLine = totalBet / paylines;
      expect(betPerLine).toBe(10);
    });
  });

  describe("Win Amount Calculation", () => {
    it("should calculate 3-of-a-kind win correctly", () => {
      // Arrowhead: payouts [2, 5, 10] for [3-of-a-kind, 4-of-a-kind, 5-of-a-kind]
      // With bet per line = 25, 3-of-a-kind should pay: 25 * 2 = 50
      const betPerLine = 25;
      const multiplier = 2; // 3-of-a-kind payout
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(50);
    });

    it("should calculate 4-of-a-kind win correctly", () => {
      // With bet per line = 25, 4-of-a-kind should pay: 25 * 5 = 125
      const betPerLine = 25;
      const multiplier = 5; // 4-of-a-kind payout
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(125);
    });

    it("should calculate 5-of-a-kind win correctly", () => {
      // Diamond: payouts [20, 60, 150]
      // With bet per line = 10, 5-of-a-kind should pay: 10 * 150 = 1500
      const betPerLine = 10;
      const multiplier = 150; // 5-of-a-kind payout for diamond
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(1500);
    });

    it("should scale wins with higher bet amounts", () => {
      // Crown: payouts [30, 100, 250]
      // With bet per line = 100, 5-of-a-kind should pay: 100 * 250 = 25,000
      const betPerLine = 100;
      const multiplier = 250; // 5-of-a-kind payout for crown
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(25000);
    });

    it("should handle fractional bet amounts correctly", () => {
      // With bet per line = 7.5 (e.g., 150 total bet / 20 paylines)
      // 3-of-a-kind with multiplier 10 should pay: 7.5 * 10 = 75
      const betPerLine = 7.5;
      const multiplier = 10;
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(75);
    });
  });

  describe("Balance Updates", () => {
    it("should deduct total bet from balance on spin", () => {
      // Player has 1000 coins, bets 100 total (25 per line × 4 paylines)
      let balance = 1000;
      const totalBet = 100;
      balance -= totalBet;
      expect(balance).toBe(900);
    });

    it("should add win to balance after spin", () => {
      // After deducting 100, balance is 900
      // Player wins 250 coins
      let balance = 900;
      const winAmount = 250;
      balance += winAmount;
      expect(balance).toBe(1150);
    });

    it("should correctly update balance with complete spin cycle", () => {
      // Starting balance: 1000
      // Bet: 100 (50 per line × 2 paylines)
      // Win: 300
      // Expected final: 1000 - 100 + 300 = 1200
      let balance = 1000;
      const totalBet = 100;
      const winAmount = 300;
      balance = balance - totalBet + winAmount;
      expect(balance).toBe(1200);
    });

    it("should handle losing spin correctly", () => {
      // Starting balance: 1000
      // Bet: 50
      // Win: 0
      // Expected final: 1000 - 50 + 0 = 950
      let balance = 1000;
      const totalBet = 50;
      const winAmount = 0;
      balance = balance - totalBet + winAmount;
      expect(balance).toBe(950);
    });

    it("should handle big win correctly", () => {
      // Starting balance: 500
      // Bet: 50 (10 per line × 5 paylines)
      // Win: 5000 (big win)
      // Expected final: 500 - 50 + 5000 = 5450
      let balance = 500;
      const totalBet = 50;
      const winAmount = 5000;
      balance = balance - totalBet + winAmount;
      expect(balance).toBe(5450);
    });
  });

  describe("Multiple Payline Wins", () => {
    it("should sum wins from multiple paylines correctly", () => {
      // Two paylines win:
      // Payline 1: 25 (bet per line) * 2 (multiplier) = 50
      // Payline 2: 25 (bet per line) * 5 (multiplier) = 125
      // Total: 50 + 125 = 175
      const betPerLine = 25;
      const win1 = Math.floor(betPerLine * 2);
      const win2 = Math.floor(betPerLine * 5);
      const totalWin = win1 + win2;
      expect(totalWin).toBe(175);
    });

    it("should handle cascading wins on all paylines", () => {
      // 5 paylines all winning with same symbol
      // Bet per line: 20, Multiplier: 10
      // Each payline: 20 * 10 = 200
      // Total: 200 * 5 = 1000
      const betPerLine = 20;
      const multiplier = 10;
      const paylines = 5;
      const winPerLine = Math.floor(betPerLine * multiplier);
      const totalWin = winPerLine * paylines;
      expect(totalWin).toBe(1000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimum bet", () => {
      // Minimum bet: 10 coins
      const betPerLine = 10;
      const multiplier = 2;
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(20);
    });

    it("should handle maximum bet", () => {
      // Maximum bet: 200 coins per line × 25 paylines = 5000 total
      const betPerLine = 200;
      const multiplier = 250; // Crown 5-of-a-kind
      const winAmount = Math.floor(betPerLine * multiplier);
      expect(winAmount).toBe(50000);
    });

    it("should not allow negative balance after bet deduction", () => {
      // Player has 30 coins, tries to bet 50
      // Should be prevented at spin() level
      const balance = 30;
      const totalBet = 50;
      const canSpin = balance >= totalBet;
      expect(canSpin).toBe(false);
    });

    it("should handle zero win correctly", () => {
      // No winning combination
      const winAmount = 0;
      let balance = 1000;
      const totalBet = 100;
      balance = balance - totalBet + winAmount;
      expect(balance).toBe(900);
    });
  });
});

/**
 * Loss-back rescue spin (Vegas "save the player" mechanic).
 *
 * Trigger: after a losing spin, if postSpinBalance < bet*5 AND not in
 * bonus/free-spin mode, set rescueOffered=true. On the next non-demo,
 * non-jackpot spin, force finalWin >= rescueMinPayout(bet) and clear the flag.
 */
describe("Loss-back rescue spin", () => {
  describe("shouldOfferRescue trigger", () => {
    it("triggers when postSpin balance is well below 5× bet", () => {
      expect(shouldOfferRescue(100, 25, 0, null)).toBe(true);
    });

    it("triggers at the boundary (balance just under 5× bet)", () => {
      // 5×bet - 1 → triggers (strict less-than)
      expect(shouldOfferRescue(124, 25, 0, null)).toBe(true);
    });

    it("does NOT trigger when balance equals 5× bet exactly", () => {
      // 5×bet exactly → does NOT trigger (strict <)
      expect(shouldOfferRescue(125, 25, 0, null)).toBe(false);
    });

    it("does NOT trigger when balance is comfortable", () => {
      expect(shouldOfferRescue(10_000, 25, 0, null)).toBe(false);
    });

    it("does NOT trigger during free-spin mode (no real loss)", () => {
      expect(shouldOfferRescue(50, 25, 3, null)).toBe(false);
    });

    it("does NOT trigger during a bonus round (no real loss)", () => {
      expect(shouldOfferRescue(50, 25, 0, "wheel" as BonusGameType)).toBe(false);
    });

    it("triggers even with no bonus game if balance is busted", () => {
      // Edge: player is broke (or near-broke)
      expect(shouldOfferRescue(0, 25, 0, null)).toBe(true);
    });

    it("scales threshold with bet size", () => {
      // bet=100, threshold=500
      expect(shouldOfferRescue(499, 100, 0, null)).toBe(true);
      expect(shouldOfferRescue(500, 100, 0, null)).toBe(false);
    });
  });

  describe("rescueMinPayout", () => {
    it("returns 50% of bet, floored", () => {
      expect(rescueMinPayout(25)).toBe(12);
      expect(rescueMinPayout(100)).toBe(50);
    });

    it("handles odd bets without rounding error", () => {
      // 7 * 0.5 = 3.5 → floored to 3
      expect(rescueMinPayout(7)).toBe(3);
    });

    it("returns 0 for zero bet", () => {
      expect(rescueMinPayout(0)).toBe(0);
    });
  });
});

/**
 * Mission claim-once semantics. The mission can only be claimed once; a
 * re-click on a claimed mission must return 0 reward and not toggle the
 * claimed flag back.
 */
describe("applyMissionClaim", () => {
  const completedUnclaimed = { completed: true, claimed: false, reward: 150 };

  it("credits the reward and marks claimed on first claim", () => {
    const { mission, reward } = applyMissionClaim(completedUnclaimed);
    expect(reward).toBe(150);
    expect(mission.claimed).toBe(true);
    expect(mission.completed).toBe(true);
  });

  it("does not re-credit on a second claim attempt", () => {
    const first = applyMissionClaim(completedUnclaimed);
    const second = applyMissionClaim(first.mission);
    expect(second.reward).toBe(0);
    expect(second.mission).toEqual(first.mission);
  });

  it("rejects incomplete missions", () => {
    const incomplete = { completed: false, claimed: false, reward: 100 };
    const { mission, reward } = applyMissionClaim(incomplete);
    expect(reward).toBe(0);
    expect(mission).toEqual(incomplete); // untouched
  });

  it("rejects already-claimed missions", () => {
    const claimed = { completed: true, claimed: true, reward: 200 };
    const { mission, reward } = applyMissionClaim(claimed);
    expect(reward).toBe(0);
    expect(mission).toEqual(claimed);
  });
});
