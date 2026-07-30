/**
 * CoinPackageCard - Premium gradient card for coin packages
 * High-end mobile game purchase screen aesthetic
 */

import { cn } from "@/lib/utils";
import { Sparkles, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";

interface CoinPackageCardProps {
  id: number;
  coins: number;
  bonus: number;
  priceUsd: number;
  isBestValue?: boolean;
  isDailyDeal?: boolean;
  isSelected?: boolean;
  onSelect: (id: number) => void;
  accentColor?: string;
  currency?: "gold" | "green";
  salePriceUsd?: number;
  dealEndTime?: Date;
  onCountdownEnd?: () => void;
}

// Gradient presets for different price tiers
const GRADIENTS = [
  "from-amber-600/30 via-amber-500/10 to-transparent",    // Budget
  "from-yellow-500/40 via-yellow-400/15 to-transparent",   // Starter
  "from-orange-500/40 via-orange-400/20 to-transparent",   // Popular
  "from-red-500/40 via-red-400/20 to-transparent",         // Pro
  "from-purple-600/40 via-purple-500/20 to-transparent",   // High Roller
  "from-rose-600/50 via-rose-500/25 to-transparent",       // Elite
];

function getTierGradient(priceUsd: number): string {
  if (priceUsd <= 1) return GRADIENTS[0];
  if (priceUsd <= 5) return GRADIENTS[1];
  if (priceUsd <= 10) return GRADIENTS[2];
  if (priceUsd <= 20) return GRADIENTS[3];
  if (priceUsd <= 50) return GRADIENTS[4];
  return GRADIENTS[5];
}

export function CoinPackageCard({
  id,
  coins,
  bonus,
  priceUsd,
  isBestValue = false,
  isDailyDeal = false,
  isSelected = false,
  onSelect,
  accentColor = "#D4AF37",
  salePriceUsd,
}: CoinPackageCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const totalCoins = coins + bonus;
  const effectivePrice = salePriceUsd ?? priceUsd;
  const coinsPerDollar = (totalCoins / effectivePrice).toFixed(1);
  const discount = salePriceUsd ? Math.round((1 - salePriceUsd / priceUsd) * 100) : 0;
  
  const gradient = getTierGradient(effectivePrice);

  return (
    <button
      onClick={() => onSelect(id)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden transition-all duration-200",
        "border-2 backdrop-blur-sm group",
        "hover:scale-[1.02] active:scale-[0.98]",
        isSelected 
          ? "border-current shadow-lg shadow-black/30" 
          : "border-white/10 hover:border-white/20",
        isPressed && "scale-95"
      )}
      style={{ 
        borderColor: isSelected ? accentColor : undefined,
        boxShadow: isSelected ? `0 0 30px ${accentColor}40` : undefined,
      }}
    >
      {/* Daily deal ribbon */}
      {isDailyDeal && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg animate-pulse">
            🔥 DEAL OF THE DAY
          </div>
        </div>
      )}

      {/* Best value badge */}
      {isBestValue && !isDailyDeal && (
        <div className="absolute top-2 right-2 z-10">
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}, #F5E6C8)`,
              color: "#1a1200" 
            }}
          >
            <Sparkles size={10} />
            BEST VALUE
          </div>
        </div>
      )}

      {/* Discount badge */}
      {discount > 0 && (
        <div 
          className="absolute top-2 left-2 z-10"
          style={{ 
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            color: "#fff" 
          }}
        >
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold">
            -{discount}%
          </div>
        </div>
      )}

      {/* Gradient background */}
      <div 
        className={cn(
          "absolute inset-0 opacity-60 transition-opacity duration-300",
          `bg-gradient-to-br ${gradient}`,
          "group-hover:opacity-80"
        )}
      />

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            animation: "shimmer 2s infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 pt-6">
        {/* Coin amount - prominent */}
        <div className="text-center mb-3">
          <div 
            className="text-3xl font-black tracking-tight"
            style={{ 
              fontFamily: "'Oswald', sans-serif",
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}40`
            }}
          >
            {totalCoins.toLocaleString()}
          </div>
          <div className="text-sm text-white/60 font-medium tracking-wide">
            COINS
          </div>
          {bonus > 0 && (
            <div 
              className="text-xs mt-1 font-semibold"
              style={{ color: "#4ADE80" }}
            >
              +{bonus.toLocaleString()} bonus
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-center mt-3">
          {discount > 0 && (
            <div className="text-sm text-white/40 line-through mb-0.5">
              ${priceUsd.toFixed(2)}
            </div>
          )}
          <div 
            className="text-2xl font-bold"
            style={{ 
              fontFamily: "'Oswald', sans-serif",
              color: discount > 0 ? "#4ADE80" : "white"
            }}
          >
            ${effectivePrice.toFixed(2)}
          </div>
        </div>

        {/* Coins per dollar */}
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-white/50">
          <TrendingUp size={10} />
          {coinsPerDollar} coins/$
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="mt-3 flex items-center justify-center">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: accentColor }}
            >
              <span className="text-black text-sm font-bold">✓</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default CoinPackageCard;