/**
 * Cash-Out Modal Component
 * Allows players to withdraw Green Coins (Sweeps Coins) as real money
 * Gold Coins cannot be cashed out
 */

import { useState } from "react";
import { X, DollarSign, Bitcoin } from "lucide-react";

interface CashOutModalProps {
  playerCoins: number;
  onClose: () => void;
  onSubmit: (coinsRequested: number, paymentMethod: string) => Promise<void>;
}

export default function CashOutModal({
  playerCoins,
  onClose,
  onSubmit,
}: CashOutModalProps) {
  const [coinsRequested, setCoinsRequested] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState<"square" | "bitcoin">(
    "square"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversion: 100 coins = $1
  const amountUsd = coinsRequested / 100;
  const minimumCoins = 500; // $5 minimum
  const maximumCoins = 50000; // $500 maximum

  const handleSliderChange = (value: number) => {
    setCoinsRequested(Math.round(value));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (coinsRequested < minimumCoins) {
        throw new Error(`Minimum cash-out is ${minimumCoins} coins ($5)`);
      }
      if (coinsRequested > maximumCoins) {
        throw new Error(`Maximum cash-out is ${maximumCoins} coins ($500)`);
      }
      if (coinsRequested > playerCoins) {
        throw new Error("Insufficient coins");
      }

      await onSubmit(coinsRequested, paymentMethod);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cash-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg p-6 max-w-md w-full relative"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "2px solid #D4AF37",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded"
        >
          <X size={20} style={{ color: "#D4AF37" }} />
        </button>

        <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFD700" }}>
          Cash Out
        </h2>
        <p className="text-sm mb-6" style={{ color: "rgba(245,230,200,0.7)" }}>
          Convert your coins to real money
        </p>

        {/* Coin Balance */}
        <div className="p-4 rounded-lg mb-6" style={{ background: "rgba(212,175,55,0.1)" }}>
          <div className="text-xs" style={{ color: "#D4AF37" }}>
            Available Coins
          </div>
          <div className="text-2xl font-bold" style={{ color: "#FFD700" }}>
            {playerCoins.toLocaleString()}
          </div>
        </div>

        {/* Coin Slider */}
        <div className="mb-6">
          <label className="text-xs" style={{ color: "#D4AF37" }}>
            Coins to Withdraw
          </label>
          <input
            type="range"
            min={minimumCoins}
            max={Math.min(maximumCoins, playerCoins)}
            value={coinsRequested}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-2"
            style={{
              background: "linear-gradient(to right, #D4AF37, #FFD700)",
            }}
          />
          <div className="flex justify-between text-xs mt-2" style={{ color: "rgba(212,175,55,0.6)" }}>
            <span>{minimumCoins.toLocaleString()}</span>
            <span>{Math.min(maximumCoins, playerCoins).toLocaleString()}</span>
          </div>
        </div>

        {/* Amount Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-3 rounded-lg"
            style={{ background: "rgba(212,175,55,0.1)" }}
          >
            <div className="text-xs" style={{ color: "#D4AF37" }}>
              Coins
            </div>
            <div className="text-xl font-bold" style={{ color: "#FFD700" }}>
              {coinsRequested.toLocaleString()}
            </div>
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ background: "rgba(212,175,55,0.1)" }}
          >
            <div className="text-xs" style={{ color: "#D4AF37" }}>
              USD Amount
            </div>
            <div className="text-xl font-bold" style={{ color: "#FFD700" }}>
              ${amountUsd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="text-xs" style={{ color: "#D4AF37" }}>
            Payment Method
          </label>
          <div className="space-y-2 mt-3">
            <button
              onClick={() => setPaymentMethod("square")}
              className="w-full p-3 rounded-lg border-2 transition flex items-center gap-3"
              style={{
                background:
                  paymentMethod === "square"
                    ? "rgba(212,175,55,0.2)"
                    : "rgba(212,175,55,0.05)",
                borderColor:
                  paymentMethod === "square"
                    ? "#D4AF37"
                    : "rgba(212,175,55,0.3)",
              }}
            >
              <DollarSign size={18} style={{ color: "#D4AF37" }} />
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: "#FFD700" }}>
                  Bank Transfer
                </div>
                <div className="text-xs" style={{ color: "rgba(212,175,55,0.6)" }}>
                  Via Square
                </div>
              </div>
              {paymentMethod === "square" && (
                <div className="ml-auto w-4 h-4 rounded-full" style={{ background: "#D4AF37" }} />
              )}
            </button>

            <button
              onClick={() => setPaymentMethod("bitcoin")}
              className="w-full p-3 rounded-lg border-2 transition flex items-center gap-3"
              style={{
                background:
                  paymentMethod === "bitcoin"
                    ? "rgba(212,175,55,0.2)"
                    : "rgba(212,175,55,0.05)",
                borderColor:
                  paymentMethod === "bitcoin"
                    ? "#D4AF37"
                    : "rgba(212,175,55,0.3)",
              }}
            >
              <Bitcoin size={18} style={{ color: "#D4AF37" }} />
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: "#FFD700" }}>
                  Bitcoin
                </div>
                <div className="text-xs" style={{ color: "rgba(212,175,55,0.6)" }}>
                  Instant crypto
                </div>
              </div>
              {paymentMethod === "bitcoin" && (
                <div className="ml-auto w-4 h-4 rounded-full" style={{ background: "#D4AF37" }} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded mb-4 bg-red-500/20 border border-red-500 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Legal Notice */}
        <div className="p-3 rounded mb-4 bg-blue-500/10 border border-blue-500/30 text-xs" style={{ color: "rgba(245,230,200,0.6)" }}>
          💡 This is a sweepstakes game. Virtual coins have no monetary value and cannot be exchanged for real money. Withdrawal is subject to verification and compliance review.
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || coinsRequested > playerCoins}
          className="w-full py-3 rounded font-bold transition disabled:opacity-50"
          style={{
            background: "#D4AF37",
            color: "#000",
          }}
        >
          {loading ? "Processing..." : `Cash Out ${coinsRequested.toLocaleString()} Coins`}
        </button>
      </div>
    </div>
  );
}
