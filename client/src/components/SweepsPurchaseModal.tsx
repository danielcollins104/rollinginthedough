/**
 * Sweeps Purchase Modal
 * Appears when user clicks on Sweeps currency button with zero balance
 * Integrates with Square Web Payments SDK and CoinShop for real purchases
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Zap, Gift, X } from "lucide-react";
import CoinShop from "./CoinShop";

interface SweepsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export default function SweepsPurchaseModal({
  isOpen,
  onClose,
  onPurchaseSuccess,
}: SweepsPurchaseModalProps) {
  const [showCoinShop, setShowCoinShop] = useState(false);
  const packagesQuery = trpc.shop.packages.useQuery();

  const handlePurchaseSuccess = () => {
    setShowCoinShop(false);
    onClose();
    onPurchaseSuccess?.();
  };

  if (!isOpen) return null;

  // Show CoinShop if user clicks on a package
  if (showCoinShop) {
    return (
      <CoinShop onClose={handlePurchaseSuccess} />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl p-6 max-w-md w-full shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 30px rgba(212,175,55,0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={28} style={{ color: "#00FF00" }} />
            <h2 className="text-xl font-bold" style={{ color: "#00FF00" }}>
              No Sweeps Available
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm mb-6" style={{ color: "#F5E6C8" }}>
          You're out of Sweeps coins! Purchase some to keep playing and winning big prizes.
        </p>

        {/* Coin Packages */}
        <div className="space-y-3 mb-6">
          {packagesQuery.data?.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setShowCoinShop(true)}
              className="w-full p-3 rounded-lg transition-all text-left hover:scale-105"
              style={{
                background:
                  pkg.isPopular === 1
                    ? "linear-gradient(135deg, #1a1a35, #2d2d50)"
                    : "rgba(212,175,55,0.1)",
                border: pkg.isPopular === 1 ? "2px solid #FFD700" : "1px solid #D4AF37",
                boxShadow: pkg.isPopular === 1 ? "0 0 15px rgba(255,215,0,0.3)" : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={18} style={{ color: "#00FF00" }} />
                  <div>
                    <div className="font-bold" style={{ color: "#F5E6C8" }}>
                      {pkg.displayName}
                    </div>
                    <div className="text-xs" style={{ color: "#D4AF37" }}>
                      {pkg.coins + pkg.bonus} total coins ({pkg.bonus} bonus)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: "#00FF00" }}>
                    ${(pkg.priceUsd / 100).toFixed(2)}
                  </div>
                  {pkg.isPopular === 1 && (
                    <div className="text-xs flex items-center gap-1" style={{ color: "#FFD700" }}>
                      <Gift size={12} />
                      Popular
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition hover:opacity-80"
            style={{
              background: "rgba(212,175,55,0.1)",
              color: "#D4AF37",
              border: "1px solid #D4AF37",
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => setShowCoinShop(true)}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00FF00, #00CC00)",
              color: "#000",
            }}
          >
            Buy Now
          </button>
        </div>

        {/* Sweepstakes Notice */}
        <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "rgba(212,175,55,0.05)" }}>
          <p style={{ color: "#D4AF37" }}>
            💡 <strong>Sweepstakes Notice:</strong> This is a free-to-play sweepstakes game. Sweeps coins can be cashed out for real money.
          </p>
        </div>
      </div>
    </div>
  );
}
