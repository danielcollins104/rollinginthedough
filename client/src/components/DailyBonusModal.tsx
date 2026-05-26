/**
 * Daily Bonus Modal
 * Encourages daily return visits with escalating rewards
 * Research-backed: streak psychology increases retention 3-5x
 */

import { useState, useEffect } from "react";

interface DailyBonusProps {
  streak: number; // 1-7 day streak
  onClose: (coins: number) => void;
}

const STREAK_REWARDS = [
  { day: 1, coins: 500, label: "DAY 1", multiplier: "1x" },
  { day: 2, coins: 800, label: "DAY 2", multiplier: "1.5x" },
  { day: 3, coins: 1200, label: "DAY 3", multiplier: "2x" },
  { day: 4, coins: 1800, label: "DAY 4", multiplier: "2.5x" },
  { day: 5, coins: 2500, label: "DAY 5", multiplier: "3x" },
  { day: 6, coins: 3500, label: "DAY 6", multiplier: "4x" },
  { day: 7, coins: 5000, label: "DAY 7", multiplier: "5x" },
];

const ANIMATED_EMOJIS = ["🪙", "⭐", "✨", "💰", "🎁", "🌟", "🎉"];

export default function DailyBonus({ streak, onClose }: DailyBonusProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "celebrate">("intro");
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [progress, setProgress] = useState(0);

  const reward = STREAK_REWARDS[Math.min(streak - 1, 6)];

  useEffect(() => {
    // Intro animation
    const introTimer = setTimeout(() => {
      setPhase("reveal");
      revealCoins();
    }, 2000);

    return () => clearTimeout(introTimer);
  }, []);

  const revealCoins = () => {
    let count = 0;
    const totalSteps = 20;
    const increment = reward.coins / totalSteps;

    const interval = setInterval(() => {
      count++;
      setEarnedCoins(Math.floor(increment * count));
      setProgress((count / totalSteps) * 100);

      // Add particle every other step
      if (count % 2 === 0 && particles.length < 12) {
        setParticles(prev => [
          ...prev,
          {
            id: Date.now() + count,
            x: 30 + Math.random() * 40,
            y: 20 + Math.random() * 30,
            emoji: ANIMATED_EMOJIS[Math.floor(Math.random() * ANIMATED_EMOJIS.length)],
          },
        ]);
      }

      if (count >= totalSteps) {
        clearInterval(interval);
        setEarnedCoins(reward.coins);
        setPhase("celebrate");
      }
    }, 80);
  };

  const handleCollect = () => {
    onClose(earnedCoins);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur">
      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Main modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a1a 0%, #1a1030 50%, #0d0d25 100%)",
          border: "3px solid #D4AF37",
          boxShadow: "0 0 60px rgba(212,175,55,0.4), 0 0 120px rgba(212,175,55,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #C8860A, #D4AF37, #F5E6C8, #D4AF37, #C8860A)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
            }}
          />
          <h2
            className="font-display font-black text-2xl tracking-wider relative z-10"
            style={{ color: "#1a1200", textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}
          >
            🎁 DAILY BONUS 🎁
          </h2>
          <p className="text-sm font-bold mt-1 relative z-10" style={{ color: "#3d2800" }}>
            Day {streak} Streak Bonus
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center relative">
          {/* Floating particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute text-2xl animate-float-up"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animation: "floatUp 1s ease-out forwards",
              }}
            >
              {p.emoji}
            </div>
          ))}

          {/* Coin animation area */}
          <div
            className="relative inline-block mb-4"
            style={{
              animation: phase === "celebrate" ? "pulseGlow 1s ease-in-out infinite" : "none",
            }}
          >
            <div className="text-6xl mb-2">
              {phase === "intro" ? "🎁" : phase === "reveal" ? "🪙" : "🎉"}
            </div>
            {/* Glowing ring behind coin */}
            {phase !== "intro" && (
              <div
                className="absolute inset-0 rounded-full -z-10"
                style={{
                  background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)",
                  transform: "scale(1.5)",
                }}
              />
            )}
          </div>

          {/* Streak progress */}
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <div
                  key={day}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: day <= streak
                      ? "linear-gradient(135deg, #D4AF37, #F5E6C8)"
                      : "rgba(255,255,255,0.1)",
                    color: day <= streak ? "#1a1200" : "rgba(255,255,255,0.3)",
                    boxShadow: day <= streak ? "0 0 10px rgba(212,175,55,0.5)" : "none",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-yellow-200/60 text-xs">
              {streak < 7 ? `${7 - streak} days until MAX bonus!` : "MAX STREAK ACHIEVED!"}
            </p>
          </div>

          {/* Reward display */}
          <div
            className="py-4 px-6 rounded-lg mb-6"
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "2px solid #D4AF37",
            }}
          >
            {phase === "intro" ? (
              <>
                <p className="text-amber-200 text-sm mb-2">Today's Reward</p>
                <p className="text-4xl font-bold text-yellow-300" style={{ color: "#FFD700" }}>
                  {reward.coins.toLocaleString()} 🪙
                </p>
                <p className="text-amber-200 text-xs mt-1">{reward.multiplier} multiplier</p>
              </>
            ) : (
              <>
                <p className="text-amber-200 text-sm mb-2">Coins Earned</p>
                <div className="text-4xl font-bold" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.8)" }}>
                  +{earnedCoins.toLocaleString()} 🪙
                </div>
                {/* Progress bar during reveal */}
                {phase === "reveal" && (
                  <div className="mt-2 w-full h-1 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #D4AF37, #FFD700)",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Collect button */}
          {phase === "celebrate" && (
            <button
              onClick={handleCollect}
              className="w-full py-4 rounded-lg font-display font-black text-xl tracking-wider shadow-xl"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F5E6C8, #D4AF37)",
                color: "#1a1200",
                boxShadow: "0 0 30px rgba(212,175,55,0.6)",
                animation: "winBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
              }}
            >
              COLLECT BONUS
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <p className="text-yellow-200/40 text-xs">
            ✨ Come back tomorrow for even bigger rewards! ✨
          </p>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes winBounce {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 1; transform: scale(1.1); }
          65% { transform: scale(0.97); }
          80% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}