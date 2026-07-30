import { getDb } from "./db";
import { paymentSecurity } from "./_core/security";
import { TRPCError } from "@trpc/server";

/**
 * Comprehensive payment verification system
 */

export interface PaymentVerificationResult {
  valid: boolean;
  reason?: string;
  fraudScore: number; // 0-100, higher = more suspicious
}

export async function verifySquarePayment(
  paymentId: string,
  userId: number,
  expectedAmount: number,
  packageId: number
): Promise<PaymentVerificationResult> {
  const db = await getDb();
  if (!db) {
    return { valid: false, reason: "Database unavailable", fraudScore: 50 };
  }

  let fraudScore = 0;

  // 1. Check for duplicate payments
  const existingPayment = await db
    .select()
    .from((await import("../drizzle/schema")).coinPurchases)
    .where(
      (await import("drizzle-orm")).eq(
        (await import("../drizzle/schema")).coinPurchases.paymentId,
        paymentId
      )
    )
    .limit(1);

  if (existingPayment.length > 0) {
    fraudScore += 100; // Duplicate payment is highly suspicious
    return {
      valid: false,
      reason: "Duplicate payment detected",
      fraudScore,
    };
  }

  // 2. Verify amount matches expected
  const coinPackage = await db
    .select()
    .from((await import("../drizzle/schema")).coinPackages)
    .where(
      (await import("drizzle-orm")).eq(
        (await import("../drizzle/schema")).coinPackages.id,
        packageId
      )
    )
    .limit(1);

  if (coinPackage.length === 0) {
    fraudScore += 50;
    return {
      valid: false,
      reason: "Invalid coin package",
      fraudScore,
    };
  }

  const packagePrice = coinPackage[0].priceUsd;
  if (!paymentSecurity.verifyAmount(expectedAmount, packagePrice)) {
    fraudScore += 80; // Amount mismatch is suspicious
    return {
      valid: false,
      reason: "Payment amount mismatch",
      fraudScore,
    };
  }

  // 3. Check for velocity abuse (too many payments in short time)
  const recentPayments = await db
    .select()
    .from((await import("../drizzle/schema")).coinPurchases)
    .where(
      (await import("drizzle-orm")).and(
        (await import("drizzle-orm")).eq(
          (await import("../drizzle/schema")).coinPurchases.userId,
          userId
        ),
        (await import("drizzle-orm")).gt(
          (await import("../drizzle/schema")).coinPurchases.createdAt,
          new Date(Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
    );

  if (paymentSecurity.isVelocityAbuse(
    recentPayments.map((p: any) => p.createdAt),
    10
  )) {
    fraudScore += 60; // Multiple payments in short time
  }

  // 4. Check user account age (new accounts are higher risk)
  const user = await db
    .select()
    .from((await import("../drizzle/schema")).users)
    .where(
      (await import("drizzle-orm")).eq(
        (await import("../drizzle/schema")).users.id,
        userId
      )
    )
    .limit(1);

  if (user.length > 0) {
    const accountAge = Date.now() - user[0].createdAt.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (accountAge < oneDay) {
      fraudScore += 30; // Brand new account
    } else if (accountAge < 7 * oneDay) {
      fraudScore += 15; // Less than a week old
    }
  }

  // 5. Check for unusual patterns
  if (expectedAmount > 10000) {
    // Large purchase
    fraudScore += 10;
  }

  // 6. Verify payment status is completed (not pending/failed)
  // This would be verified with Square API in production
  // For now, we assume the payment is completed if it reached this function

  // Final decision: flag as fraud if score > 70
  const isFraudulent = fraudScore > 70;

  return {
    valid: !isFraudulent,
    reason: isFraudulent ? "Payment flagged as suspicious" : undefined,
    fraudScore,
  };
}

export async function logPaymentVerification(
  paymentId: string,
  userId: number,
  result: PaymentVerificationResult
) {
  // In production, log this to a security audit table
  console.log(`[PAYMENT_VERIFICATION] Payment: ${paymentId}, User: ${userId}, Valid: ${result.valid}, FraudScore: ${result.fraudScore}, Reason: ${result.reason}`);
}

export async function handleFraudulentPayment(
  paymentId: string,
  userId: number,
  fraudScore: number
) {
  // In production, this would:
  // 1. Flag the account for manual review
  // 2. Notify security team
  // 3. Potentially block the user
  // 4. Refund the payment

  console.log(
    `[FRAUD_ALERT] Fraudulent payment detected - Payment: ${paymentId}, User: ${userId}, Score: ${fraudScore}`
  );

  // For now, just log it
  // In production, integrate with security monitoring service
}
