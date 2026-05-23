/**
 * DailyLoginBonus - Modal that appears when user opens the app
 * Shows current streak calendar, today's bonus, and CLAIM button
 */

import { useEffect, useState } from "react";
import { STREAK_REWARDS } from "@/hooks/useRetention";

interface DailyLoginBonusProps {
  currentStreak: number;
  onClaim: () => void;
}

export function DailyLoginBonus({ currentStreak, onClaim }: DailyLoginBonusProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "ready">("intro");
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<string>("");

  const reward = STREAK_REWARDS[Math.min(currentStreak, 7)];
  const displayStreak = currentStreak || 1;

  // Animation sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 800);
    const t2 = setTimeout(() => setPhase("ready"), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Coin reveal animation
  useEffect(() => {
    if (phase !== "reveal") return;

    let count = 0;
    const totalSteps = 25;
    const increment = reward / totalSteps;
    const interval = setInterval(() => {
      count++;
      setEarnedCoins(Math.floor(increment * count));
      setProgress((count / totalSteps) * 100);

      if (count % 3 === 0 && particles.length < 15) {
        setParticles((prev) => [
          ...prev,
          {
            id: Date.now() + count,
            x: 20 + Math.random() * 60,
            y: 10 + Math.random() * 40,
            emoji: ["🪙", "⭐", "✨", "💰", "🎁"][Math.floor(Math.random() * 5)],
          },
        ]);
      }

      if (count >= totalSteps) {
        clearInterval(interval);
        setEarnedCoins(reward);
        setPhase("ready");
      }
    }, 60);

    return () => clearInterval(interval);
  }, [phase, reward, particles.length]);

  // Countdown to tomorrow
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = tomorrow.getTime() - now.getTime();

      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((ms % (1000 * 60)) / 1000);
      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = () => {
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-300/20 text-xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: "linear-gradient(160deg, #0d0d20 0%, #1a1a35 50%, #0f0f25 100%)",
          border: "3px solid #D4AF37",
          boxShadow: "0 0 80px rgba(212,175,55,0.35), 0 0 160px rgba(212,175,55,0.15), inset 0 0 60px rgba(212,175,55,0.05)",
        }}
      >
        {/* Gold header bar */}
        <div
          className="relative px-6 py-5 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #B8860B 0%, #D4AF37 30%, #F5E6C8 50%, #D4AF37 70%, #B8860B 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.15) 12px, rgba(255,255,255,0.15) 24px)",
            }}
          />
          <div className="relative z-10">
            <div className="text-3xl mb-1 animate-bounce-slow">🎁</div>
            <h2
              className="font-display font-black text-2xl tracking-wider"
              style={{ color: "#1a1200", textShadow: "0 2px 4px rgba(255,255,255,0.3)" }}
            >
              DAILY BONUS
            </h2>
            <p className="text-sm font-bold mt-1" style={{ color: "#3d2800" }}>
              Day {displayStreak} Streak
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 py-7 text-center relative">
          {/* Floating particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animation: "particleFloat 1.2s ease-out forwards",
              }}
            >
              {p.emoji}
            </div>
          ))}

          {/* Icon display */}
          <div
            className="relative inline-flex items-center justify-center mb-5"
            style={{
              animation: phase === "ready" ? "pulseGold 2s ease-in-out infinite" : "none",
            }}
          >
            <div className="text-6xl">
              {phase === "intro" ? "📅" : phase === "reveal" ? "🪙" : "🎉"}
            </div>
            {phase !== "intro" && (
              <div
                className="absolute inset-0 rounded-full -z-10 animate-ping"
                style={{
                  background: "radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 70%)",
                  transform: "scale(1.8)",
                }}
              />
            )}
          </div>

          {/* Streak calendar strip */}
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isActive = day <= displayStreak;
                const isToday = day === displayStreak;
                return (
                  <div
                    key={day}
                    className="relative"
                    style={{ animationDelay: `${day * 80}ms` }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, #D4AF37, #F5E6C8)"
                          : "rgba(255,255,255,0.06)",
                        color: isActive ? "#1a1200" : "rgba(255,255,255,0.25)",
                        boxShadow: isActive
                          ? "0 0 16px rgba(212,175,55,0.6), 0 0 32px rgba(212,175,55,0.3)"
                          : "none",
                        transform: isToday && isActive ? "scale(1.15)" : "scale(1)",
                        border: isToday && isActive ? "2px solid #fff" : "2px solid transparent",
                      }}
                    >
                      {day}
                    </div>
                    {isActive && (
                      <div
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs"
                        style={{ color: "#D4AF37" }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-yellow-200/50 text-xs">
              {displayStreak < 7
                ? `${7 - displayStreak} days to WEEKLY BONUS!`
                : "🔥 MAX STREAK! Weekly reward unlocked!"}
            </p>
          </div>

          {/* Reward display */}
          <div
            className="py-4 px-5 rounded-xl mb-5"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))",
              border: "2px solid rgba(212,175,55,0.4)",
            }}
          >
            {phase === "intro" ? (
              <>
                <p className="text-amber-200/60 text-xs mb-1 uppercase tracking-wider">Today&apos;s Reward</p>
                <p
                  className="text-4xl font-black"
                  style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}
                >
                  {reward.toLocaleString()} 🪙
                </p>
              </>
            ) : (
              <>
                <p className="text-amber-200/60 text-xs mb-1 uppercase tracking-wider">Coins Earned</p>
                <div
                  className="text-4xl font-black"
                  style={{ color: "#FFD700", textShadow: "0 0 30px rgba(255,215,0,0.8)" }}
                >
                  +{earnedCoins.toLocaleString()} 🪙
                </div>
                {phase === "reveal" && (
                  <div className="mt-3 w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #D4AF37, #FFD700, #F5E6C8)",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Claim button */}
          {phase === "ready" && (
            <button
              onClick={handleClaim}
              className="w-full py-4 rounded-xl font-display font-black text-xl tracking-wider shadow-lg active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #F5E6C8 50%, #D4AF37 100%)",
                color: "#1a1200",
                boxShadow: "0 0 40px rgba(212,175,55,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
                animation: "claimPulse 1.5s ease-in-out infinite",
              }}
            >
              CLAIM BONUS
            </button>
          )}

          {/* Countdown if already claimed today (shouldn't show on first render, but just in case) */}
          {false && (
            <div className="py-3 px-4 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-yellow-200/60 text-xs mb-1">Next bonus in:</p>
              <p className="text-xl font-mono font-bold text-yellow-300">{countdown}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <p className="text-yellow-200/40 text-xs">
            ✨ Come back daily for bigger rewards! ✨
          </p>
        </div>
      </div>

      <style>{`
        @keyframes particleFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.4); }
        }
        @keyframes pulseGold {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.15); }
        }
        @keyframes claimPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(212,175,55,0.5), inset 0 2px 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 50px rgba(212,175,55,0.7), 0 0 80px rgba(212,175,55,0.4), inset 0 2px 0 rgba(255,255,255,0.3); }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}