import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { SquareClient, SquareEnvironment } from "square";
import { getCoinPackages, getOrCreatePlayerStats, createCoinPurchase, getOrCreateDailyStreak, updateDailyStreak, unlockAchievement, getPlayerAchievements, updateCoinPurchaseStatus, getDb, updateUserSession } from "./db";
import { coinPurchases, playerStats } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createCryptoCharge, getCryptoChargeStatus } from "./crypto";
import { createCashOutRequest, getUserCashOutRequests, updateCashOutStatus, cancelCashOutRequest, getUserCashOutStats, COINS_PER_DOLLAR } from "./cashout";
import { randomUUID } from "crypto";
import { verifySquarePayment, logPaymentVerification } from "./paymentVerification";
import { validateSpinRequest, validateGameResult, validateCashoutRequest, detectCheatPattern } from "./antiCheatValidation";
import { registerUser, loginUser, verifySession } from "./auth";
import { sessionSecurity } from "./_core/security";

// Square production environment configuration
const squareClient = ENV.squareAccessToken
  ? new SquareClient({
      token: ENV.squareAccessToken,
      environment: SquareEnvironment.Production, // Production environment
    })
  : null;

const SQUARE_LOCATION_ID = ENV.squareLocationId || "L2N0S3FA7EX8B"; // Production location ID

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginUser(input.email, input.password);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.sessionToken, {
          ...cookieOptions,
          maxAge: 30 * 60 * 1000,
        });
        return { success: true, user: result.user };
      }),
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await registerUser(input.email, input.password, input.name);
        if (!user) throw new Error("Failed to create user");
        const sessionToken = sessionSecurity.generateToken();
        const sessionExpiresAt = sessionSecurity.getExpirationTime();
        await updateUserSession(user.id, sessionToken, sessionExpiresAt);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 30 * 60 * 1000,
        });
        return { success: true, user };
      }),
  }),

  // Game and shop routers
  shop: router({
    // Get available coin packages
    packages: publicProcedure.query(async () => {
      return getCoinPackages();
    }),

    // Create a Square Checkout session for a coin package
    // Returns a checkout URL that redirects to Square's hosted payment page
    createCheckout: protectedProcedure
      .input(z.object({
        packageId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify user session is valid
        try {
          await verifySession(ctx.user.sessionToken || "");
        } catch (error) {
          throw new Error("Session invalid or expired");
        }
        if (!squareClient) {
          throw new Error("Square payment system not configured");
        }

        const packages = await getCoinPackages();
        const pkg = packages.find(p => p.id === input.packageId);

        if (!pkg) {
          throw new Error("Package not found");
        }

        const idempotencyKey = randomUUID();
        const coinsToAdd = pkg.coins + pkg.bonus;

        // Verify payment amount before creating purchase
        const verification = await verifySquarePayment(
          `checkout-${idempotencyKey}`,
          ctx.user.id,
          pkg.priceUsd,
          pkg.id
        );

        if (!verification.valid) {
          logPaymentVerification(`checkout-${idempotencyKey}`, ctx.user.id, verification);
          throw new Error(verification.reason || "Payment verification failed");
        }

        // Record the purchase with pending status
        const purchase = await createCoinPurchase({
          userId: ctx.user.id,
          packageId: pkg.id,
          paymentId: `checkout-${idempotencyKey}`,
          coinsAdded: coinsToAdd,
          amountUsd: pkg.priceUsd,
          status: "pending",
        });

        logPaymentVerification(`checkout-${idempotencyKey}`, ctx.user.id, verification);

        // Create Square Checkout session
        const response = await squareClient.checkout.paymentLinks.create({
          idempotencyKey,
          description: `Rolling in the Dough - ${pkg.displayName}`,
          quickPay: {
            name: `${pkg.displayName} (${coinsToAdd} coins)`,
            priceMoney: {
              amount: BigInt(pkg.priceUsd),
              currency: "USD",
            },
            locationId: SQUARE_LOCATION_ID,
          },
          checkoutOptions: {
            redirectUrl: `${process.env.APP_URL || "http://localhost:3000"}/checkout-success?purchaseId=${purchase?.id}`,
          },
        });

        if (!response.paymentLink?.url) {
          throw new Error("Failed to create checkout link");
        }
        if (!purchase) {
          throw new Error("Failed to create purchase record");
        }
        return {
          checkoutUrl: response.paymentLink.url,
          purchaseId: purchase.id,
        };
      }),

    // Create a Square Checkout session for a custom amount
    createCustomCheckout: protectedProcedure
      .input(z.object({
        amountUsd: z.number().min(100).max(1000000), // $1 to $10,000 in cents
      }))
      .mutation(async ({ input, ctx }) => {
        if (!squareClient) {
          throw new Error("Square payment system not configured");
        }

        // Calculate coins: 100 coins per $1
        const coinsToAdd = Math.floor((input.amountUsd / 100) * 100);
        const idempotencyKey = randomUUID();

        // Record the purchase with pending status
        const purchase = await createCoinPurchase({
          userId: ctx.user.id,
          packageId: 0,
          paymentId: `checkout-${idempotencyKey}`,
          coinsAdded: coinsToAdd,
          amountUsd: input.amountUsd,
          status: "pending",
        });

        // Create Square Checkout session
        const response = await squareClient.checkout.paymentLinks.create({
          idempotencyKey,
          description: `Rolling in the Dough - Custom Amount`,
          quickPay: {
            name: `Custom - ${coinsToAdd} coins`,
            priceMoney: {
              amount: BigInt(input.amountUsd),
              currency: "USD",
            },
            locationId: SQUARE_LOCATION_ID,
          },
          checkoutOptions: {
            redirectUrl: `${process.env.APP_URL || "http://localhost:3000"}/checkout-success?purchaseId=${purchase?.id}`,
          },
        });

        if (!response.paymentLink?.url) {
          throw new Error("Failed to create checkout link");
        }
        if (!purchase) {
          throw new Error("Failed to create purchase record");
        }
        return {
          checkoutUrl: response.paymentLink.url,
          purchaseId: purchase.id,
        };
      }),

    // Verify payment and credit coins after Square redirects back
    verifyCheckoutSuccess: protectedProcedure
      .input(z.object({
        purchaseId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get the purchase record
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const purchases = await db.select().from(coinPurchases).where(eq(coinPurchases.id, input.purchaseId));
        const purchase = purchases[0];

        if (!purchase) {
          throw new Error("Purchase not found");
        }

        if (purchase.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // If already completed, just return success
        if (purchase.status === "completed") {
          return {
            success: true,
            coinsAdded: purchase.coinsAdded,
          };
        }

        // Mark as completed and credit coins
        await updateCoinPurchaseStatus(purchase.paymentId, "completed", purchase.coinsAdded);

        return {
          success: true,
          coinsAdded: purchase.coinsAdded,
        };
      }),

    // Get HTTPS redirect URL for non-HTTPS domains (like custom domains)
    // This allows users on custom domains to complete payment on the HTTPS manus.space URL
    getHttpsRedirectUrl: publicProcedure
      .input(z.object({
        packageId: z.number().optional(),
        amountUsd: z.number().optional(),
      }))
      .query(({ input }) => {
        // Construct the HTTPS manus.space URL with payment parameters
        const baseUrl = process.env.APP_URL || "http://localhost:3000";
        const params = new URLSearchParams();
        
        if (input.packageId) {
          params.append("packageId", input.packageId.toString());
        } else if (input.amountUsd) {
          params.append("amountUsd", input.amountUsd.toString());
        }
        
        return {
          url: `${baseUrl}?payment=${params.toString()}`,
        };
      }),

    // Create a cryptocurrency charge for coin purchase
    createCryptoCharge: protectedProcedure
      .input(z.object({
        packageName: z.string(),
        priceUsd: z.number(),
        coins: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const charge = await createCryptoCharge({
          packageId: 0,
          coins: input.coins,
          priceUsd: input.priceUsd,
          userId: ctx.user.id,
          displayName: input.packageName,
        });

        if (!charge) {
          throw new Error("Failed to create cryptocurrency charge");
        }

        return charge;
      }),

    // Get cryptocurrency charge status
    getCryptoChargeStatus: protectedProcedure
      .input(z.object({
        chargeId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const status = await getCryptoChargeStatus(input.chargeId);
        return status;
      }),
  }),

  game: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreatePlayerStats(ctx.user.id);
    }),

    updateStats: protectedProcedure
      .input(z.object({
        goldCoins: z.number().optional(),
        greenCoins: z.number().optional(),
        level: z.number().optional(),
        xp: z.number().optional(),
        totalWins: z.number().optional(),
        totalSpins: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db
          .update(playerStats)
          .set({
            goldCoins: input.goldCoins,
            greenCoins: input.greenCoins,
            level: input.level,
            xp: input.xp,
            totalWins: input.totalWins,
            totalSpins: input.totalSpins,
          })
          .where(eq(playerStats.userId, ctx.user.id));

        return { success: true };
      }),

    claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
      const streak = await getOrCreateDailyStreak(ctx.user.id);
      if (!streak) throw new Error("Failed to get daily streak");
      if (streak.lastLoginDate) {
        const lastLogin = new Date(streak.lastLoginDate);
        const now = new Date();
        const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastLogin < 1) throw new Error("Daily bonus already claimed");
      }
      const newStreak = await updateDailyStreak(ctx.user.id);
      return newStreak;
    }),

    unlockAchievement: protectedProcedure
      .input(z.object({ achievementId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return unlockAchievement(ctx.user.id, input.achievementId);
      }),

    getAchievements: protectedProcedure.query(async ({ ctx }) => {
      return getPlayerAchievements(ctx.user.id);
    }),
  }),

  cashout: router({
    createRequest: protectedProcedure
      .input(z.object({
        greenCoins: z.number().min(1000),
        paymentMethod: z.enum(["square", "bitcoin", "ethereum", "litecoin", "usdc"]),
      }))
      .output(z.object({
        success: z.boolean(),
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createCashOutRequest(
          ctx.user.id,
          input.greenCoins,
          Math.floor(input.greenCoins / 100),
          input.paymentMethod
        );
        return {
          success: !!result,
          message: result ? "Cashout request created" : "Failed to create cashout request",
        };
      }),

    getRequests: protectedProcedure.query(async ({ ctx }) => {
      return getUserCashOutRequests(ctx.user.id);
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getUserCashOutStats(ctx.user.id);
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]),
      }))
      .mutation(async ({ input, ctx }) => {
        return updateCashOutStatus(input.requestId, input.status);
      }),

    cancel: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return cancelCashOutRequest(input.requestId);
      }),
  }),
});

export type AppRouter = typeof appRouter;