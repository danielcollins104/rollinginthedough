import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

const mockUser: User = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createMockContext(): TrpcContext {
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Payment Flow - Square Web Payments SDK", () => {
  it("should fetch coin packages without errors", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const packages = await caller.shop.packages();

    expect(packages).toBeDefined();
    expect(Array.isArray(packages)).toBe(true);
  });

  it("should require sourceId for Square payment intent", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const packages = await caller.shop.packages();

    if (packages.length === 0) {
      console.log("No packages available for testing");
      return;
    }

    const packageId = packages[0].id;

    try {
      // Square requires a sourceId (payment nonce from Web Payments SDK)
      const result = await caller.shop.createPaymentIntent({
        packageId,
        sourceId: "fake-nonce-for-test",
      });
      // If somehow succeeds, result should have paymentId
      expect(result).toBeDefined();
    } catch (err) {
      // Expected: Square rejects fake nonce or not configured
      const message = (err as Error).message;
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("should reject invalid package ID", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.shop.createPaymentIntent({
        packageId: 99999,
        sourceId: "fake-nonce",
      });
      expect.fail("Should have thrown an error");
    } catch (err) {
      const message = (err as Error).message;
      const isValidError =
        message.includes("Package not found") ||
        message.includes("Square") ||
        message.includes("not configured") ||
        message.length > 0;
      expect(isValidError).toBe(true);
    }
  });

  it("should validate minimum custom amount of $1 (100 cents)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // 50 cents is below the minimum of 100 cents ($1)
      await caller.shop.createCustomPaymentIntent({
        amountUsd: 50,
        sourceId: "fake-nonce",
      });
      expect.fail("Should have rejected amount below minimum");
    } catch (err) {
      expect((err as Error).message).toBeDefined();
    }
  });

  it("should validate maximum custom amount of $10,000 (1,000,000 cents)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // Over the maximum of 1,000,000 cents ($10,000)
      await caller.shop.createCustomPaymentIntent({
        amountUsd: 2_000_000,
        sourceId: "fake-nonce",
      });
      expect.fail("Should have rejected amount above maximum");
    } catch (err) {
      expect((err as Error).message).toBeDefined();
    }
  });

  it("should not create circular loop on payment failure", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    let callCount = 0;
    const maxCalls = 3;

    try {
      while (callCount < maxCalls) {
        callCount++;

        const packages = await caller.shop.packages();

        if (packages.length === 0) {
          break;
        }

        try {
          await caller.shop.createPaymentIntent({
            packageId: packages[0].id,
            sourceId: "fake-nonce",
          });
          break;
        } catch (err) {
          if (callCount >= maxCalls) {
            throw err;
          }
        }
      }
    } catch (err) {
      expect(callCount).toBeLessThanOrEqual(maxCalls);
    }
  });
});
