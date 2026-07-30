/**
 * Cryptocurrency Payment Processing
 * Integrates with Coinbase Commerce for Bitcoin, Ethereum, and other crypto payments
 */

import CoinbaseCommerce from "coinbase-commerce-node";

// Initialize Coinbase Commerce client
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;

let client: any = null;
const Charge = CoinbaseCommerce.resources.Charge;
const Client = CoinbaseCommerce.Client;

export function initializeCoinbaseCommerce() {
  if (COINBASE_API_KEY) {
    Client.init(COINBASE_API_KEY);
    client = Client;
  }
}

// Initialize on module load
initializeCoinbaseCommerce();

export interface CryptoChargeRequest {
  packageId: number;
  coins: number;
  priceUsd: number;
  userId: number;
  displayName: string;
}

export interface CryptoChargeResponse {
  chargeId: string;
  chargeCode: string;
  hostedUrl: string;
  cryptoAddress: string;
  cryptoAmount: string;
  currency: string;
  pricing: {
    bitcoin: { amount: string; currency: string };
    ethereum: { amount: string; currency: string };
    litecoin: { amount: string; currency: string };
    usdc: { amount: string; currency: string };
  };
  expiresAt: string;
}

/**
 * Create a Coinbase Commerce charge for cryptocurrency payment
 */
export async function createCryptoCharge(
  request: CryptoChargeRequest
): Promise<CryptoChargeResponse | null> {
  if (!client || !COINBASE_API_KEY) {
    console.warn("[Crypto] Coinbase Commerce not configured");
    return null;
  }

  try {
    const chargeData = {
      name: request.displayName,
      description: `${request.coins} coins for Rolling in the Dough`,
      local_price: {
        amount: (request.priceUsd / 100).toString(), // Convert cents to dollars
        currency: "USD",
      },
      pricing_type: "fixed_price",
      metadata: {
        userId: request.userId.toString(),
        packageId: request.packageId.toString(),
        coins: request.coins.toString(),
      },
    };

    const charge = await Charge.create(chargeData);

    const pricing = charge.pricing || {};
    return {
      chargeId: charge.id,
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      cryptoAddress: charge.addresses?.bitcoin || "",
      cryptoAmount: charge.local_price?.amount || "0",
      currency: charge.local_price?.currency || "USD",
      pricing: {
        bitcoin: { amount: pricing.bitcoin?.amount || "0", currency: pricing.bitcoin?.currency || "BTC" },
        ethereum: { amount: pricing.ethereum?.amount || "0", currency: pricing.ethereum?.currency || "ETH" },
        litecoin: { amount: pricing.litecoin?.amount || "0", currency: pricing.litecoin?.currency || "LTC" },
        usdc: { amount: pricing.usdc?.amount || "0", currency: pricing.usdc?.currency || "USDC" },
      },
      expiresAt: charge.expires_at || new Date(Date.now() + 3600000).toISOString(),
    };
  } catch (error) {
    console.error("[Crypto] Failed to create charge:", error);
    return null;
  }
}

/**
 * Get charge details to check payment status
 */
export async function getCryptoChargeStatus(chargeId: string) {
  if (!client || !COINBASE_API_KEY) {
    return null;
  }

  try {
    const charge = await Charge.retrieve(chargeId);
    return {
      id: charge.id,
      status: charge.status,
      amount: charge.local_price?.amount,
      currency: charge.local_price?.currency,
      metadata: charge.metadata,
      payments: charge.payments || [],
      timeline: charge.timeline || [],
    };
  } catch (error) {
    console.error("[Crypto] Failed to retrieve charge:", error);
    return null;
  }
}

/**
 * Verify webhook signature from Coinbase Commerce
 */
export function verifyCoinbaseWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!COINBASE_API_KEY) {
    return false;
  }

  try {
    // Coinbase Commerce uses HMAC-SHA256 for webhook signatures
    // The signature header format is: "t=timestamp,s=signature"
    const crypto = require("crypto");
    const [timestamp, sig] = signature.split(",").map((s) => s.split("=")[1]);

    const message = `${timestamp}.${body}`;
    const hash = crypto
      .createHmac("sha256", COINBASE_API_KEY)
      .update(message)
      .digest("hex");

    return hash === sig;
  } catch (error) {
    console.error("[Crypto] Webhook signature verification failed:", error);
    return false;
  }
}

export interface CryptoWebhookPayload {
  id: string;
  type: string; // "charge:created", "charge:confirmed", "charge:failed", etc.
  data: {
    id: string;
    status: string;
    metadata: {
      userId: string;
      packageId: string;
      coins: string;
    };
    payments: Array<{
      network: string; // "bitcoin", "ethereum", etc.
      transaction_id: string;
      status: string;
      value: {
        local: {
          amount: string;
          currency: string;
        };
        crypto: {
          amount: string;
          currency: string;
        };
      };
    }>;
  };
}

/**
 * Parse and validate webhook payload
 */
export function parseCryptoWebhook(payload: unknown): CryptoWebhookPayload | null {
  try {
    const data = payload as CryptoWebhookPayload;

    if (!data.id || !data.type || !data.data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Crypto] Failed to parse webhook:", error);
    return null;
  }
}
