/**
 * PurchaseConfirmModal - Animated purchase confirmation flow
 * Shows: Package details → Loading → Success celebration
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles, Gift, PartyPopper } from "lucide-react";
import { CoinFlyAnimation, ConfettiEffect } from "./ConfettiEffect";

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  packageName: string;
  coinAmount: number;
  bonusAmount: number;
  priceUsd: number;
  isFirstPurchase: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  accentColor?: string;
  currency?: "gold" | "green";
}

type PurchaseState = "confirm" | "loading" | "success";

export function PurchaseConfirmModal({
  isOpen,
  packageName,
  coinAmount,
  bonusAmount,
  priceUsd,
  isFirstPurchase,
  onConfirm,
  onCancel,
  accentColor = "#D4AF37",
  currency = "gold",
}: PurchaseConfirmModalProps) {
  const [state, setState] = useState<PurchaseState>("confirm");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCoinFly, setShowCoinFly] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  // Reset state when modal opens with new package
  useEffect(() => {
    if (isOpen) {
      setState("confirm");
      setShowConfetti(false);
      setShowCoinFly(false);
    }
  }, [isOpen, packageName]);

  const handleConfirm = async () => {
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 150);
    
    setState("loading");

    try {
      await onConfirm();
      
      // Success!
      setState("success");
      setShowConfetti(true);
      setShowCoinFly(true);

      // Play success sound
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleE0AL5Li0bdjFgU5p+PStWUYBTKc4dW3ZBkFMJ/f1LpkGgU2oN/VumYbBTWh3tS5ZRwGOKPg07lmHQc5pN7UumcfCDyj3tO5ZyAJPKTg1LpoIQo/p+DTuWkhCkCm4NS6aiILQKjg1LpqIwtBqeDVu2sjDEKt4Na8bCQMRA==");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}

      // Auto close after celebration
      setTimeout(() => {
        setShowConfetti(false);
        setShowCoinFly(false);
        onCancel();
      }, 3500);
    } catch {
      setState("confirm");
    }
  };

  if (!isOpen) return null;

  const totalCoins = coinAmount + (isFirstPurchase ? bonusAmount * 2 : bonusAmount);
  const actualBonus = isFirstPurchase ? bonusAmount * 2 : bonusAmount;

  return (
    <>
      <ConfettiEffect 
        active={showConfetti} 
        intensity="high"
        duration={4000}
      />
      <CoinFlyAnimation 
        active={showCoinFly}
        onComplete={() => setShowCoinFly(false)}
      />

      {/* Modal backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => state !== "loading" && onCancel()}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Modal content */}
        <div
          className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-2 rounded-2xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
          style={{ 
            borderColor: state === "success" ? "#4ADE80" : accentColor,
            boxShadow: `0 0 40px ${accentColor}30, 0 0 80px ${accentColor}10`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* CONFIRM STATE */}
          {state === "confirm" && (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)`,
                    border: `2px solid ${accentColor}60`
                  }}
                >
                  {currency === "green" ? (
                    <span className="text-3xl">💰</span>
                  ) : (
                    <span className="text-3xl">🪙</span>
                  )}
                </div>
                <h2 
                  className="text-xl font-bold mb-1"
                  style={{ color: accentColor }}
                >
                  Confirm Purchase
                </h2>
                <p className="text-gray-400 text-sm">You're about to buy</p>
              </div>

              {/* Package details */}
              <div 
                className="bg-black/20 rounded-xl p-4 mb-6 border border-white/10"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60 text-sm">Package</span>
                  <span className="text-white font-semibold">{packageName}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60 text-sm">Coins</span>
                  <span className="font-bold text-xl" style={{ color: accentColor }}>
                    {coinAmount.toLocaleString()}
                  </span>
                </div>
                {bonusAmount > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/60 text-sm">
                      {isFirstPurchase ? "First Purchase Bonus (2x)" : "Bonus"}
                    </span>
                    <span className="font-semibold" style={{ color: "#4ADE80" }}>
                      +{actualBonus.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white/60 text-sm">Total you'll receive</span>
                  <span className="font-black text-2xl" style={{ color: accentColor }}>
                    {totalCoins.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* First purchase bonus banner */}
              {isFirstPurchase && (
                <div 
                  className="mb-4 p-3 rounded-lg text-center"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))",
                    border: "1px solid #4ADE8060"
                  }}
                >
                  <p className="text-green-400 font-bold text-sm flex items-center justify-center gap-2">
                    <Gift size={16} />
                    DOUBLE YOUR BONUS!
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-gray-400 text-sm">Total</span>
                <div 
                  className="text-4xl font-black"
                  style={{ 
                    fontFamily: "'Oswald', sans-serif",
                    color: "white"
                  }}
                >
                  ${priceUsd.toFixed(2)}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 relative overflow-hidden group"
                  style={{ 
                    backgroundColor: accentColor,
                    color: "#000"
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Sparkles size={16} />
                    Confirm Purchase
                  </span>
                  {buttonPressed && (
                    <div 
                      className="absolute inset-0 bg-white/30 animate-pulse"
                      style={{ transform: "scale(1)", borderRadius: "inherit" }}
                    />
                  )}
                </Button>
              </div>

              {/* Secure footer */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  Secure checkout powered by Square
                </p>
              </div>
            </>
          )}

          {/* LOADING STATE */}
          {state === "loading" && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)`,
                    border: `3px solid ${accentColor}`
                  }}
                >
                  <Loader2 
                    className="w-10 h-10 animate-spin" 
                    style={{ color: accentColor }} 
                  />
                </div>
                {/* Spinning coin rings */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-dashed animate-spin"
                  style={{ 
                    borderColor: `${accentColor}40`,
                    animationDuration: "3s",
                    animationDirection: "reverse"
                  }}
                />
              </div>
              <h2 
                className="text-xl font-bold mb-2"
                style={{ color: accentColor }}
              >
                Processing...
              </h2>
              <p className="text-gray-400 text-sm">
                Preparing your secure checkout
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state === "success" && (
            <div className="text-center py-8">
              {/* Animated checkmark */}
              <div className="relative inline-block mb-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    background: "linear-gradient(135deg, #4ADE80, #22C55E)",
                    boxShadow: "0 0 30px #4ADE8060"
                  }}
                >
                  <Check className="w-10 h-10 text-white animate-bounce" />
                </div>
                {/* Sparkle rings */}
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ background: "#4ADE8040" }}
                />
              </div>

              <h2 className="text-2xl font-bold mb-2 text-white">
                🎉 Thanks! 🎉
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                Your coins are on the way!
              </p>

              {/* Coin received */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ 
                  background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))",
                  border: "1px solid #D4AF3760"
                }}
              >
                <span className="text-2xl">🪙</span>
                <span 
                  className="text-2xl font-black"
                  style={{ 
                    fontFamily: "'Oswald', sans-serif",
                    color: accentColor
                  }}
                >
                  +{totalCoins.toLocaleString()}
                </span>
              </div>

              <p className="text-gray-500 text-xs mt-4">
                Check your balance in a few moments
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PurchaseConfirmModal;