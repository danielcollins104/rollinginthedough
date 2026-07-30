import { useEffect, useRef, useState } from "react";
import type { WinType } from "@shared/game";

const winTypeLabel: Record<string, string> = {
  SMALL_WIN: "🎉 SMALL WIN",
  BIG_WIN: "🔥 BIG WIN",
  MEGA_WIN: "💥 MEGA WIN",
  JACKPOT: "👑 JACKPOT!",
  HUNTRESS_BONUS: "🗡️ HUNTRESS BONUS!",
};

const winTypeColor: Record<string, string> = {
  SMALL_WIN: "#90EE90",
  BIG_WIN: "#FFD700",
  MEGA_WIN: "#FF6B35",
  JACKPOT: "#FF1493",
  HUNTRESS_BONUS: "#8B0000",
};

const winTypeGlow: Record<string, string> = {
  SMALL_WIN: "rgba(144,238,144,0.6)",
  BIG_WIN: "rgba(255,215,0,0.8)",
  MEGA_WIN: "rgba(255,107,53,0.8)",
  JACKPOT: "rgba(255,20,147,0.8)",
  HUNTRESS_BONUS: "rgba(139,0,0,0.8)",
};

export function AnimatedWinCounter({ target, active }: { target: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || target === 0) {
      setDisplay(target);
      return;
    }
    const start = Date.now();
    const duration = Math.min(1200, 400 + target / 10);
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, active]);

  return <>{display.toLocaleString()}</>;
}

function SpinningDots() {
  return (
    <div className="flex gap-2 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#D4AF37",
            animation: `paylinePulse 0.9s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface WinMessageProps {
  showWin: boolean;
  winAmount: number;
  lastWinType: WinType | null;
  cascadeActive: boolean;
  cascadeLevel: number;
  spinning: boolean;
  coins: number;
  bet: number;
  freeSpins: number;
}

export default function WinMessage({
  showWin,
  winAmount,
  lastWinType,
  cascadeActive,
  cascadeLevel,
  spinning,
  coins,
  bet,
  freeSpins,
}: WinMessageProps) {
  return (
    <div className="mt-0.5 text-center min-h-[1.5rem] flex items-center justify-center">
      {showWin && winAmount > 0 && lastWinType ? (
        <div
          className="flex items-center gap-2"
          style={{ animation: `winBanner ${lastWinType === "SMALL_WIN" ? "0.4s" : "0.6s"} cubic-bezier(0.175, 0.885, 0.32, 1.275) both` }}
        >
          <div
            className="font-display font-black win-message"
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
              color: winTypeColor[lastWinType],
              textShadow: `0 0 10px ${winTypeGlow[lastWinType]}, 0 0 20px ${winTypeGlow[lastWinType]}`,
              animation: lastWinType === "MEGA_WIN" ? "megaWinPulse 1s ease-in-out infinite" :
                          lastWinType === "JACKPOT" ? "jackpotPulse 0.8s ease-in-out infinite" :
                          `winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both`,
            }}
          >
            {winTypeLabel[lastWinType]}
          </div>
          <div
            className="font-numbers font-bold"
            style={{
              fontSize: "clamp(1.3rem, 4vw, 2rem)",
              color: "#FFD700",
              textShadow: "0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.4)",
              animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.25s both",
            }}
          >
            +<AnimatedWinCounter target={winAmount} active={showWin} /> 🪙
          </div>
        </div>
      ) : cascadeActive && cascadeLevel > 0 ? (
        <div
          className="font-display font-black"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
            color: cascadeLevel >= 4 ? "#FF6B35" : cascadeLevel >= 3 ? "#FFD700" : "#D4AF37",
            textShadow: `0 0 15px ${cascadeLevel >= 4 ? "rgba(255,107,53,0.8)" : cascadeLevel >= 3 ? "rgba(255,215,0,0.8)" : "rgba(212,175,55,0.6)"}`,
            animation: "cascadeLevelPulse 0.6s ease-in-out infinite",
          }}
        >
          🔥 {cascadeLevel}x CASCADE! 🔥
        </div>
      ) : spinning ? (
        <SpinningDots />
      ) : (
        <div className="text-xs font-body italic" style={{ color: "rgba(212,175,55,0.3)" }}>
          {coins < bet && freeSpins === 0 ? "⚠ Not enough coins" : cascadeActive ? "Cascading..." : "Press SPIN to play"}
        </div>
      )}
    </div>
  );
}
