import { antiCheat } from "./_core/security";
import { TRPCError } from "@trpc/server";

/**
 * Anti-cheat validation for game operations
 */

export interface GameSpinValidation {
  valid: boolean;
  errors: string[];
}

export interface GameResultValidation {
  valid: boolean;
  errors: string[];
  adjustedWinAmount?: number;
}

/**
 * Validate spin request before processing
 */
export function validateSpinRequest(
  userId: number,
  bet: number,
  paylines: number,
  userBalance: number,
  maxBetPerLine: number = 1000
): GameSpinValidation {
  const errors: string[] = [];

  // Validate bet per line
  if (bet <= 0) {
    errors.push("Bet must be greater than 0");
  }

  if (bet > maxBetPerLine) {
    errors.push(`Bet per line cannot exceed ${maxBetPerLine}`);
  }

  // Validate paylines
  if (![1, 5, 10, 15, 20, 25].includes(paylines)) {
    errors.push("Invalid number of paylines");
  }

  // Calculate total bet
  const totalBet = bet * paylines;

  // Validate user has sufficient balance
  if (totalBet > userBalance) {
    errors.push("Insufficient balance for this bet");
  }

  // Validate bet is not suspiciously high compared to balance
  if (totalBet > userBalance * 0.5) {
    errors.push("Bet is too high relative to your balance");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate game result before crediting coins
 */
export function validateGameResult(
  userId: number,
  bet: number,
  paylines: number,
  winAmount: number,
  maxMultiplier: number = 10000
): GameResultValidation {
  const errors: string[] = [];
  let adjustedWinAmount = winAmount;

  // Validate win amount is non-negative
  if (winAmount < 0) {
    errors.push("Win amount cannot be negative");
    adjustedWinAmount = 0;
  }

  // Validate win amount is reasonable
  const betPerLine = bet / paylines;
  if (!antiCheat.validateWinAmount(winAmount, betPerLine, maxMultiplier)) {
    errors.push(`Win amount exceeds maximum allowed (${betPerLine * maxMultiplier})`);
    adjustedWinAmount = Math.min(winAmount, betPerLine * maxMultiplier);
  }

  // Detect suspicious patterns
  if (winAmount > betPerLine * 1000) {
    // Very high multiplier win - flag for review but allow
    console.log(
      `[ANTI_CHEAT] Unusual high win detected - User: ${userId}, Bet: ${bet}, Win: ${winAmount}, Multiplier: ${winAmount / betPerLine}x`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    adjustedWinAmount,
  };
}

/**
 * Detect suspicious balance changes
 */
export function detectSuspiciousBalanceChange(
  userId: number,
  previousBalance: number,
  newBalance: number,
  expectedChange: number
): boolean {
  const isSuspicious = antiCheat.detectSuspiciousBalance(
    previousBalance,
    newBalance,
    expectedChange
  );

  if (isSuspicious) {
    console.log(
      `[ANTI_CHEAT] Suspicious balance change detected - User: ${userId}, Previous: ${previousBalance}, New: ${newBalance}, Expected: ${expectedChange}`
    );
  }

  return isSuspicious;
}

/**
 * Validate cashout request
 */
export function validateCashoutRequest(
  userId: number,
  greenCoinsToWithdraw: number,
  totalGreenCoins: number,
  minimumCashout: number = 100,
  maximumCashout: number = 100000
): GameSpinValidation {
  const errors: string[] = [];

  // Validate amount
  if (greenCoinsToWithdraw < minimumCashout) {
    errors.push(`Minimum cashout is ${minimumCashout} coins`);
  }

  if (greenCoinsToWithdraw > maximumCashout) {
    errors.push(`Maximum cashout is ${maximumCashout} coins`);
  }

  // Validate user has sufficient balance
  if (greenCoinsToWithdraw > totalGreenCoins) {
    errors.push("Insufficient green coins for cashout");
  }

  // Detect rapid cashout attempts (potential abuse)
  if (greenCoinsToWithdraw > totalGreenCoins * 0.9) {
    console.log(
      `[ANTI_CHEAT] Large cashout attempt - User: ${userId}, Amount: ${greenCoinsToWithdraw}, Balance: ${totalGreenCoins}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate cryptographic proof of game result
 */
export function generateGameResultProof(
  userId: number,
  spinId: string,
  result: string,
  winAmount: number
): string {
  const data = `${userId}:${spinId}:${result}:${winAmount}`;
  return antiCheat.generateResultHash(userId, spinId, data);
}

/**
 * Verify game result proof hasn't been tampered with
 */
export function verifyGameResultProof(
  userId: number,
  spinId: string,
  result: string,
  providedProof: string
): boolean {
  const data = `${userId}:${spinId}:${result}`;
  try {
    return antiCheat.verifyResultHash(userId, spinId, data, providedProof);
  } catch (error) {
    console.error("[ANTI_CHEAT] Failed to verify result proof:", error);
    return false;
  }
}

/**
 * Detect and prevent common cheating patterns
 */
export function detectCheatPattern(
  userId: number,
  recentSpins: Array<{ bet: number; winAmount: number; timestamp: Date }>,
  recentPayments: Array<{ amount: number; timestamp: Date }>
): string | null {
  // Pattern 1: Suspiciously high win rate
  if (recentSpins.length >= 10) {
    const winRate = recentSpins.filter((s) => s.winAmount > 0).length / recentSpins.length;
    if (winRate > 0.8) {
      return "Suspiciously high win rate detected";
    }
  }

  // Pattern 2: Rapid payment followed by large wins
  if (recentPayments.length > 0 && recentSpins.length > 0) {
    const lastPayment = recentPayments[recentPayments.length - 1];
    const recentWins = recentSpins.filter(
      (s) => s.timestamp.getTime() - lastPayment.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
    );

    const totalWins = recentWins.reduce((sum, s) => sum + s.winAmount, 0);
    if (totalWins > lastPayment.amount * 10) {
      return "Unusually high wins after payment detected";
    }
  }

  // Pattern 3: Consistent maximum bets with high win rate
  if (recentSpins.length >= 5) {
    const maxBets = recentSpins.filter((s) => s.bet === 1000);
    if (maxBets.length >= 3) {
      const maxBetWinRate = maxBets.filter((s) => s.winAmount > 0).length / maxBets.length;
      if (maxBetWinRate > 0.7) {
        return "Suspicious betting pattern detected";
      }
    }
  }

  return null;
}
