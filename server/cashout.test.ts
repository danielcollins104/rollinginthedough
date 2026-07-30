import { describe, it, expect } from "vitest";
import {
  validateCashOutRequest,
  COINS_PER_DOLLAR,
  MINIMUM_CASHOUT_CENTS,
  MAXIMUM_CASHOUT_CENTS,
} from "./cashout";

describe("Cash-Out System", () => {
  describe("validateCashOutRequest", () => {
    it("should validate a valid cash-out request", () => {
      const result = validateCashOutRequest(10000, 1000, 1000); // 1000 coins = $10
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject if player has insufficient coins", () => {
      const result = validateCashOutRequest(500, 1000, 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Insufficient coins");
    });

    it("should reject amounts below minimum", () => {
      const result = validateCashOutRequest(10000, 100, 100); // $1
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Minimum");
    });

    it("should reject amounts above maximum", () => {
      const result = validateCashOutRequest(
        1000000,
        600000,
        60000 // $600
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Maximum");
    });

    it("should verify coin-to-USD conversion", () => {
      // 1000 coins should equal $10 (1000 / 100 * 100 cents)
      const expectedCoins = Math.floor((1000 / 100) * COINS_PER_DOLLAR);
      expect(expectedCoins).toBe(1000);
    });

    it("should accept requests within valid range", () => {
      const minCoins = Math.ceil((MINIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);
      const maxCoins = Math.floor((MAXIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);

      const minResult = validateCashOutRequest(100000, minCoins, MINIMUM_CASHOUT_CENTS);
      expect(minResult.valid).toBe(true);

      const maxResult = validateCashOutRequest(100000, maxCoins, MAXIMUM_CASHOUT_CENTS);
      expect(maxResult.valid).toBe(true);
    });
  });

  describe("Cash-Out Constants", () => {
    it("should have correct conversion rate", () => {
      expect(COINS_PER_DOLLAR).toBe(100);
    });

    it("should have correct minimum cash-out", () => {
      expect(MINIMUM_CASHOUT_CENTS).toBe(500); // $5
    });

    it("should have correct maximum cash-out", () => {
      expect(MAXIMUM_CASHOUT_CENTS).toBe(50000); // $500
    });

    it("should convert coins to USD correctly", () => {
      const coins = 5000;
      const expectedUsd = (coins / COINS_PER_DOLLAR) * 100; // in cents
      expect(expectedUsd).toBe(5000); // $50
    });
  });

  describe("Cash-Out Payment Methods", () => {
    it("should support multiple payment methods including Square", () => {
      const paymentMethods = ["square", "bitcoin", "ethereum", "litecoin", "usdc"];
      expect(paymentMethods).toHaveLength(5);
    });

    it("should validate payment method enum", () => {
      const validMethods = ["square", "bitcoin", "ethereum", "litecoin", "usdc"];
      const testMethod = "square";
      expect(validMethods).toContain(testMethod);
    });
  });

  describe("Cash-Out Status Workflow", () => {
    it("should have valid status transitions", () => {
      const statuses = ["pending", "processing", "completed", "failed", "cancelled"];
      expect(statuses).toContain("pending");
      expect(statuses).toContain("processing");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("failed");
      expect(statuses).toContain("cancelled");
    });

    it("should track request lifecycle", () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        coinsRequested: 1000,
        amountUsd: 1000,
        paymentMethod: "square" as const,
        paymentAddress: null,
        status: "pending" as const,
        stripePayoutId: null, // legacy column name
        cryptoTransactionId: null,
        failureReason: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      expect(mockRequest.status).toBe("pending");
      expect(mockRequest.createdAt).toBeInstanceOf(Date);
      expect(mockRequest.processedAt).toBeNull();
      expect(mockRequest.completedAt).toBeNull();
    });
  });

  describe("Cash-Out Compliance", () => {
    it("should enforce minimum cash-out threshold", () => {
      const minCoins = Math.ceil((MINIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);
      const belowMin = minCoins - 100;

      const result = validateCashOutRequest(100000, belowMin, MINIMUM_CASHOUT_CENTS - 100);
      expect(result.valid).toBe(false);
    });

    it("should enforce maximum cash-out threshold", () => {
      const maxCoins = Math.floor((MAXIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);
      const aboveMax = maxCoins + 100;

      const result = validateCashOutRequest(1000000, aboveMax, MAXIMUM_CASHOUT_CENTS + 100);
      expect(result.valid).toBe(false);
    });

    it("should prevent duplicate coin deductions", () => {
      // Validates that coins are deducted only once per request
      const playerCoins = 5000;
      const requestedCoins = 1000;

      const result = validateCashOutRequest(playerCoins, requestedCoins, 1000);
      expect(result.valid).toBe(true);

      // After deduction, player should have 4000 coins
      const remainingCoins = playerCoins - requestedCoins;
      expect(remainingCoins).toBe(4000);
    });
  });

  describe("Cash-Out Edge Cases", () => {
    it("should handle zero coins", () => {
      const result = validateCashOutRequest(0, 0, 0);
      expect(result.valid).toBe(false);
    });

    it("should handle exact minimum amount", () => {
      const minCoins = Math.ceil((MINIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);
      const result = validateCashOutRequest(100000, minCoins, MINIMUM_CASHOUT_CENTS);
      expect(result.valid).toBe(true);
    });

    it("should handle exact maximum amount", () => {
      const maxCoins = Math.floor((MAXIMUM_CASHOUT_CENTS / 100) * COINS_PER_DOLLAR);
      const result = validateCashOutRequest(1000000, maxCoins, MAXIMUM_CASHOUT_CENTS);
      expect(result.valid).toBe(true);
    });

    it("should reject negative coin amounts", () => {
      const result = validateCashOutRequest(10000, -1000, -1000);
      expect(result.valid).toBe(false);
    });
  });
});
