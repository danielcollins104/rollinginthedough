/**
 * Bonus Entrance Animation Component
 * Dramatic "BONUS!" banner that slams in from top with flash and sound
 */

import { useEffect, useState } from "react";
import { playBonusAlert } from "@/lib/soundsPsychology";

interface Props {
  onComplete: () => void;
  bonusType?: "wheel" | "pick" | "free_spins" | "legendary";
}

export default function BonusEntrance({ onComplete, bonusType = "wheel" }: Props) {
  const [phase, setPhase] = useState<"flash" | "slam" | "hold" | "exit">("flash");

  useEffect(() => {
    // Flash + sound immediately
    playBonusAlert();

    // Slam in
    const slamTimer = setTimeout(() => setPhase("slam"), 100);

    // Hold visible
    const holdTimer = setTimeout(() => setPhase("hold"), 800);

    // Exit animation
    const exitTimer = setTimeout(() => setPhase("exit"), 1400);

    // Complete and remove
    const completeTimer = setTimeout(() => onComplete(), 1800);

    return () => {
      clearTimeout(slamTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const bonusIcon = {
    wheel: "🎡",
    pick: "🎁",
    free_spins: "⭐",
    legendary: "👑",
  }[bonusType];

  const bonusText = {
    wheel: "WHEEL BONUS",
    pick: "BONUS GAME",
    free_spins: "FREE SPINS",
    legendary: "LEGENDARY",
  }[bonusType];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
      {/* Screen flash */}
      {phase === "flash" && (
        <div
          className="absolute inset-0 bg-white"
          style={{
            animation: "bonusFlash 0.15s ease-out forwards",
          }}
        />
      )}

      {/* Glow burst behind banner */}
      {phase !== "exit" && (
        <div
          className="absolute w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)",
            animation: phase === "slam" ? "glowBurst 0.3s ease-out forwards" : "none",
          }}
        />
      )}

      {/* Banner */}
      <div
        className="relative"
        style={{
          transform:
            phase === "flash"
              ? "translateY(-150vh) scale(0.5)"
              : phase === "slam"
              ? "translateY(0) scale(1.2)"
              : phase === "hold"
              ? "translateY(0) scale(1)"
              : "translateY(-50vh) scale(0.8)",
          opacity: phase === "exit" ? 0 : 1,
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out",
        }}
      >
        {/* Main banner shape */}
        <div
          className="relative px-12 py-6 rounded-lg"
          style={{
            background: "linear-gradient(135deg, #8B0000, #DC143C, #FF4500, #DC143C, #8B0000)",
            border: "4px solid #FFD700",
            boxShadow: "0 0 60px rgba(255,215,0,0.8), 0 0 120px rgba(255,215,0,0.4), inset 0 0 40px rgba(255,255,255,0.3)",
          }}
        >
          {/* Inner glow border */}
          <div
            className="absolute inset-2 rounded"
            style={{
              border: "2px solid rgba(255,255,255,0.4)",
              boxShadow: "inset 0 0 20px rgba(255,215,0,0.3)",
            }}
          />

          {/* Text content */}
          <div className="relative text-center">
            <div
              className="text-6xl mb-1"
              style={{
                animation: phase === "slam" || phase === "hold" ? "iconPop 0.5s ease-out 0.3s both" : "none",
              }}
            >
              {bonusIcon}
            </div>
            <div
              className="font-display font-black tracking-widest"
              style={{
                fontSize: "clamp(2rem, 8vw, 4rem)",
                background: "linear-gradient(180deg, #FFFFFF 0%, #FFD700 30%, #FFA500 70%, #FFD700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                animation: phase === "slam" || phase === "hold" ? "textSlam 0.4s ease-out 0.1s both" : "none",
              }}
            >
              BONUS!
            </div>
            <div
              className="font-numbers font-bold tracking-[0.3em] mt-1"
              style={{
                fontSize: "clamp(0.8rem, 2vw, 1.2rem)",
                color: "#FFE4B5",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                animation: phase === "slam" || phase === "hold" ? "textSlam 0.4s ease-out 0.2s both" : "none",
              }}
            >
              {bonusText}
            </div>
          </div>

          {/* Decorative corners */}
          {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
            <div
              key={corner}
              className="absolute w-6 h-6"
              style={{
                top: corner.includes("top") ? "-2px" : "auto",
                bottom: corner.includes("bottom") ? "-2px" : "auto",
                left: corner.includes("left") ? "-2px" : "auto",
                right: corner.includes("right") ? "-2px" : "auto",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  borderTop: corner.includes("top") ? "3px solid #FFD700" : "none",
                  borderBottom: corner.includes("bottom") ? "3px solid #FFD700" : "none",
                  borderLeft: corner.includes("left") ? "3px solid #FFD700" : "none",
                  borderRight: corner.includes("right") ? "3px solid #FFD700" : "none",
                  borderRadius: corner === "top-left" ? "4px 0 0 0" : corner === "top-right" ? "0 4px 0 0" : corner === "bottom-left" ? "0 0 0 4px" : "0 0 4px 0",
                }}
              />
            </div>
          ))}
        </div>

        {/* Particle sparkles */}
        {phase !== "exit" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-xl"
                style={{
                  left: `${10 + (i * 7) % 80}%`,
                  top: `${10 + (i * 11) % 80}%`,
                  animation: `sparkle${i % 3} 0.6s ease-out ${0.1 + i * 0.05}s both`,
                }}
              >
                ✦
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bonusFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes glowBurst {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes iconPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes textSlam {
          0% { opacity: 0; transform: scale(2) translateY(-20px); }
          60% { opacity: 1; transform: scale(0.95); }
          80% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle0 {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes sparkle1 {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(-180deg); opacity: 1; }
          100% { transform: scale(0) rotate(-360deg); opacity: 0; }
        }
        @keyframes sparkle2 {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.4) rotate(90deg); opacity: 1; }
          100% { transform: scale(0) rotate(-270deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}