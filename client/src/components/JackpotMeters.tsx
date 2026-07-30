/**
 * JackpotMeters — Professional casino-style jackpot tier display
 * Shows MINI / MINOR / MAJOR / GRAND jackpot amounts like Jackpot Party & LuckyLand
 */

import { useEffect, useState } from "react";

interface Props {
  jackpotPool: number;
}

export default function JackpotMeters({ jackpotPool }: Props) {
  const [flash, setFlash] = useState<string | null>(null);

  // Compute tier amounts from jackpot pool
  const grand = jackpotPool;
  const major = Math.floor(jackpotPool * 0.25);
  const minor = Math.floor(jackpotPool * 0.08);
  const mini = Math.floor(jackpotPool * 0.02);

  // Periodically flash a random tier for excitement
  useEffect(() => {
    const interval = setInterval(() => {
      const tiers = ["GRAND", "MAJOR", "MINOR", "MINI"];
      const random = tiers[Math.floor(Math.random() * tiers.length)];
      setFlash(random);
      setTimeout(() => setFlash(null), 800);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tiers = [
    {
      id: "GRAND",
      label: "GRAND",
      amount: grand,
      color: "#FFD700",
      glow: "rgba(255,215,0,0.9)",
      bg: "linear-gradient(135deg, #2a1a00, #3a2500)",
      border: "#FFD700",
      size: "text-base sm:text-lg",
      labelSize: "text-xs",
    },
    {
      id: "MAJOR",
      label: "MAJOR",
      amount: major,
      color: "#FF6B35",
      glow: "rgba(255,107,53,0.8)",
      bg: "linear-gradient(135deg, #2a1000, #3a1800)",
      border: "#FF6B35",
      size: "text-sm sm:text-base",
      labelSize: "text-xs",
    },
    {
      id: "MINOR",
      label: "MINOR",
      amount: minor,
      color: "#C0C0C0",
      glow: "rgba(192,192,192,0.7)",
      bg: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
      border: "#C0C0C0",
      size: "text-xs sm:text-sm",
      labelSize: "text-xs",
    },
    {
      id: "MINI",
      label: "MINI",
      amount: mini,
      color: "#CD7F32",
      glow: "rgba(205,127,50,0.7)",
      bg: "linear-gradient(135deg, #1a1000, #2a1800)",
      border: "#CD7F32",
      size: "text-xs sm:text-sm",
      labelSize: "text-xs",
    },
  ];

  return (
    <div className="w-full flex gap-1 sm:gap-2 px-2 sm:px-0">
      {tiers.map((tier) => {
        const isFlashing = flash === tier.id;
        return (
          <div
            key={tier.id}
            className="flex-1 rounded text-center py-1 sm:py-1.5 px-1 transition-all duration-300"
            style={{
              background: tier.bg,
              border: `1px solid ${isFlashing ? tier.color : tier.color + "66"}`,
              boxShadow: isFlashing
                ? `0 0 15px ${tier.glow}, 0 0 30px ${tier.glow}`
                : `0 0 6px ${tier.glow.replace("0.9", "0.3").replace("0.8", "0.2").replace("0.7", "0.15")}`,
              transform: isFlashing ? "scale(1.05)" : "scale(1)",
            }}
          >
            <div
              className={`font-numbers font-bold uppercase tracking-widest ${tier.labelSize}`}
              style={{
                color: tier.color,
                textShadow: isFlashing ? `0 0 8px ${tier.glow}` : "none",
              }}
            >
              {tier.label}
            </div>
            <div
              className={`font-numbers font-bold ${tier.size} leading-tight`}
              style={{
                color: isFlashing ? "#FFFFFF" : tier.color,
                textShadow: isFlashing ? `0 0 12px ${tier.glow}` : `0 0 6px ${tier.glow}`,
              }}
            >
              {tier.amount.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
