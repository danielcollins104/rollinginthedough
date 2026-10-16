import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
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
import {
  getOrCreateReferralCode,
  getUserReferralCode,
  getUserIdByReferralCode,
  processReferralSignup,
  getReferralStats,
  getUserReferrals,
  claimReferralRewards,
} from "./referral";
import { checkAndAwardReferralMilestones } from "./referral";
import { achievementsRouter } from "./routers/achievements";

// Square environment configuration — auto-detect sandbox from the app ID
// (sandbox IDs are prefixed "sandbox-"/"sandboxx-"), overridable explicitly.
// Using sandbox credentials against the Production API was the silent 401
// that made every checkout fail.
const squareEnv = (process.env.SQUARE_ENVIRONMENT || "").toLowerCase();
const isSquareSandbox =
  squareEnv === "sandbox" ||
  (squareEnv !== "production" && /^sandboxx?-/i.test(ENV.squareAppId));
const squareClient = ENV.squareAccessToken
  ? new SquareClient({
      token: ENV.squareAccessToken,
      environment: isSquareSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    })
  : null;
if (squareClient) {
  console.log(`[Payments] Square configured (${isSquareSandbox ? "SANDBOX" : "PRODUCTION"})`);
}

const SQUARE_LOCATION_ID = ENV.squareLocationId || "L2N0S3FA7EX8B";

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
        referralCode: z.string().optional(), // optional referral code from new user
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

        // Process referral if code was provided
        if (input.referralCode) {
          await processReferralSignup(user.id, input.referralCode.trim().toUpperCase());
        }

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

        // Fail fast without a database: we cannot record or later fulfill a
        // purchase, so do not create a real payment link we can't track.
        const db0 = await getDb();
        if (!db0) {
          throw new Error("Store temporarily unavailable");
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
        // Attach the Square order ID so fulfillment can confirm payment server-side.
        if (response.paymentLink.orderId) {
          await db0
            .update(coinPurchases)
            .set({ paymentId: response.paymentLink.orderId })
            .where(eq(coinPurchases.id, purchase.id));
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

        // Fail fast without a database (see createCheckout).
        const db0 = await getDb();
        if (!db0) {
          throw new Error("Store temporarily unavailable");
        }

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
        if (response.paymentLink.orderId) {
          await db0
            .update(coinPurchases)
            .set({ paymentId: response.paymentLink.orderId })
            .where(eq(coinPurchases.id, purchase.id));
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

        // Confirm with Square that the order was actually PAID before
        // crediting coins. The redirect alone proves nothing — previously
        // anyone could visit /checkout-success?purchaseId=N and get free
        // coins. The Square order ID is attached at checkout creation.
        if (!squareClient) {
          throw new Error("Square payment system not configured");
        }
        if (!purchase.paymentId || purchase.paymentId.startsWith("checkout-")) {
          throw new Error("Payment is still processing — please try again in a moment");
        }
        let orderState: string | undefined;
        try {
          const orderResp = await squareClient.orders.get({ orderId: purchase.paymentId });
          orderState = orderResp.order?.state;
        } catch (e) {
          console.error("[Payments] Square order lookup failed:", e);
          throw new Error("Could not verify payment with Square");
        }
        if (orderState === "CANCELED") {
          await updateCoinPurchaseStatus(purchase.paymentId, "failed");
          throw new Error("Payment was canceled");
        }
        if (orderState !== "COMPLETED") {
          throw new Error("Payment is still processing — please try again in a moment");
        }

        // Mark as completed and credit coins
        await updateCoinPurchaseStatus(purchase.paymentId, "completed", purchase.coinsAdded);

        // Award referrer 10% of purchase as coins (if referee has a referrer)
        await checkAndAwardReferralMilestones(ctx.user.id, "purchase", purchase.coinsAdded);

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

        // Record the purchase so fulfillment can credit coins exactly once
        // when Coinbase reports the charge as paid.
        const db = await getDb();
        if (db) {
          await createCoinPurchase({
            userId: ctx.user.id,
            packageId: 0,
            paymentId: charge.chargeId,
            coinsAdded: input.coins,
            amountUsd: input.priceUsd,
            status: "pending",
          });
        }

        return charge;
      }),

    // Get cryptocurrency charge status — and fulfill paid charges.
    // (There is no Coinbase webhook route mounted; this poll is the
    // fulfillment path, previously it only *read* status and never paid out.)
    getCryptoChargeStatus: protectedProcedure
      .input(z.object({
        chargeId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const status = await getCryptoChargeStatus(input.chargeId);
        const paid = status && ["completed", "resolved"].includes(status.status?.toLowerCase?.() ?? "");
        if (paid && status) {
          const db = await getDb();
          if (db) {
            const rows = await db
              .select()
              .from(coinPurchases)
              .where(eq(coinPurchases.paymentId, input.chargeId))
              .limit(1);
            const purchase = rows[0];
            if (purchase && purchase.userId === ctx.user.id && purchase.status !== "completed") {
              await updateCoinPurchaseStatus(purchase.paymentId, "completed", purchase.coinsAdded);
            }
          }
        }
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

        // Check referral milestones for coin earnings
        // This is a simplified trigger - game logic should call checkAndAwardReferralMilestones directly for precise tracking
        if (input.totalSpins !== undefined || input.totalWins !== undefined) {
          // Get current stats to check coin threshold
          const stats = await getOrCreatePlayerStats(ctx.user.id);
          if (stats) {
            await checkAndAwardReferralMilestones(ctx.user.id, "coins_earned");
          }
        }

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

  referral: router({
    // Get current user's referral code
    getCode: protectedProcedure.query(async ({ ctx }) => {
      const code = await getOrCreateReferralCode(ctx.user.id);
      return { code };
    }),

    // Claim a referral code during sign-up
    claim: protectedProcedure
      .input(z.object({
        referralCode: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const code = input.referralCode.trim().toUpperCase();
        const result = await processReferralSignup(ctx.user.id, code);
        if (!result.success) {
          throw new Error(result.error || "Failed to process referral");
        }
        return { success: true };
      }),

    // Get referral stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getReferralStats(ctx.user.id);
    }),

    // List user's referrals
    getReferrals: protectedProcedure.query(async ({ ctx }) => {
      return getUserReferrals(ctx.user.id);
    }),

    // Claim pending referral rewards
    claimRewards: protectedProcedure.mutation(async ({ ctx }) => {
      const totalClaimed = await claimReferralRewards(ctx.user.id);
      return { totalClaimed };
    }),
  }),

  achievements: achievementsRouter,
});

export type AppRouter = typeof appRouter;