/**
 * DailyStreakDisplay - Enhanced streak display with fire animation and milestone celebrations
 * Shows current streak, level progress, and achievements with animations
 */

import { useEffect, useState } from "react";
import { STREAK_MILESTONES, STREAK_REWARDS } from "@/hooks/useRetention";

interface DailyStreakDisplayProps {
  currentStreak: number;
  level: number;
  xp: number;
  xpToNext: number;
  lifetimeXp?: number;
  onMilestone?: (milestone: number) => void;
}

export function DailyStreakDisplay({
  currentStreak,
  level,
  xp,
  xpToNext,
  lifetimeXp = 0,
  onMilestone,
}: DailyStreakDisplayProps) {
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);
  const [fireOffset, setFireOffset] = useState(0);

  // Fire animation for active streaks
  useEffect(() => {
    if (currentStreak < 1) return;
    const interval = setInterval(() => {
      setFireOffset((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [currentStreak]);

  // Milestone celebration effect
  useEffect(() => {
    if (STREAK_MILESTONES.includes(currentStreak)) {
      setShowMilestone(currentStreak);
      onMilestone?.(currentStreak);

      // Generate confetti
      const newConfetti = Array.from({ length: 40 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][Math.floor(Math.random() * 6)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(newConfetti);

      const timer = setTimeout(() => {
        setShowMilestone(null);
        setConfetti([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [currentStreak, onMilestone]);

  // XP progress percentage
  const xpProgress = xpToNext > 0 ? (xp / xpToNext) * 100 : 0;

  // Next streak reward
  const nextReward = STREAK_REWARDS[Math.min(currentStreak + 1, 7)] || STREAK_REWARDS[7];

  return (
    <div className="relative">
      {/* Confetti overlay for milestones */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${c.x}%`,
                top: "-10px",
                background: c.color,
                animation: `confettiFall 3s ease-in ${c.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main card */}
      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a1200 0%, #2a1a00 50%, #1a1200 100%)",
          border: "2px solid rgba(212,175,55,0.4)",
          boxShadow: "0 0 30px rgba(212,175,55,0.15), inset 0 0 30px rgba(212,175,55,0.05)",
        }}
      >
        {/* Streak milestone banner */}
        {showMilestone && (
          <div
            className="absolute inset-0 flex items-center justify-center z-40"
            style={{
              background: "rgba(0,0,0,0.85)",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <div className="text-center" style={{ animation: "milestoneZoom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
              <div className="text-6xl mb-2">🏆</div>
              <div
                className="text-3xl font-black tracking-wider"
                style={{
                  color: "#FFD700",
                  textShadow: "0 0 30px rgba(255,215,0,0.8)",
                }}
              >
                {showMilestone} DAY STREAK!
              </div>
              <p className="text-yellow-200/70 text-sm mt-2">You&apos;re on fire! 🔥</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Current Streak with Fire */}
          <div className="text-center relative">
            <div className="relative inline-block">
              {/* Fire glow behind streak number */}
              {currentStreak > 0 && (
                <div
                  className="absolute inset-0 rounded-full -z-10"
                  style={{
                    background: `radial-gradient(circle, rgba(255,100,0,0.3) 0%, transparent 70%)`,
                    transform: `scale(${1.5 + Math.sin(fireOffset * Math.PI / 180) * 0.2})`,
                    filter: "blur(8px)",
                  }}
                />
              )}
              <div className="text-sm text-yellow-300/80 font-semibold uppercase tracking-wider mb-1">
                {currentStreak > 0 ? "🔥 STREAK" : "STREAK"}
              </div>
              <div className="flex items-center justify-center gap-1">
                {currentStreak > 0 && (
                  <span
                    className="text-2xl"
                    style={{
                      animation: `fireFlicker ${0.3 + currentStreak * 0.05}s ease-in-out infinite`,
                    }}
                  >
                    🔥
                  </span>
                )}
                <div
                  className="text-4xl font-black"
                  style={{
                    color: currentStreak > 0 ? "#FF6B35" : "#D4AF37",
                    textShadow: currentStreak > 0
                      ? "0 0 20px rgba(255,107,53,0.6), 0 0 40px rgba(255,107,53,0.3)"
                      : "0 0 10px rgba(212,175,55,0.3)",
                  }}
                >
                  {currentStreak}
                </div>
                {currentStreak > 0 && (
                  <span
                    className="text-2xl"
                    style={{
                      animation: `fireFlicker ${0.3 + currentStreak * 0.05}s ease-in-out infinite`,
                      animationDelay: "0.15s",
                    }}
                  >
                    🔥
                  </span>
                )}
              </div>
              <div className="text-xs text-yellow-200/50 mt-1">days</div>
            </div>

            {/* Next reward preview */}
            {currentStreak > 0 && currentStreak < 7 && (
              <div className="mt-2 text-xs">
                <span className="text-yellow-200/40">Next: </span>
                <span className="text-yellow-300 font-semibold">{nextReward} 🪙</span>
              </div>
            )}
          </div>

          {/* Level */}
          <div className="text-center">
            <div className="text-sm text-purple-300/80 font-semibold uppercase tracking-wider mb-1">
              ⭐ LEVEL
            </div>
            <div
              className="text-4xl font-black"
              style={{
                color: "#A855F7",
                textShadow: "0 0 20px rgba(168,85,247,0.5)",
              }}
            >
              {level}
            </div>
            <div className="text-xs text-purple-200/50 mt-1">{lifetimeXp.toLocaleString()} XP earned</div>
          </div>

          {/* XP Progress Bar */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-purple-200/60 font-medium">XP Progress</span>
              <span className="text-xs text-purple-200/80 font-mono">
                {xp.toLocaleString()} / {xpToNext.toLocaleString()}
              </span>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden relative"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              {/* Animated fill */}
              <div
                className="h-full rounded-full relative"
                style={{
                  width: `${Math.min(100, xpProgress)}%`,
                  background: "linear-gradient(90deg, #7C3AED, #A855F7, #C084FC)",
                  boxShadow: "0 0 10px rgba(168,85,247,0.5)",
                  transition: "width 0.5s ease-out",
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    animation: "shimmer 2s linear infinite",
                  }}
                />
              </div>

              {/* Milestone markers */}
              {STREAK_MILESTONES.map((m) => (
                <div
                  key={m}
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{
                    left: `${(m / 7) * 100}%`,
                    background: "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>

            {/* Streak milestones indicator */}
            <div className="flex justify-between mt-1.5">
              {STREAK_MILESTONES.map((m) => (
                <div
                  key={m}
                  className="text-xs font-medium"
                  style={{
                    color: currentStreak >= m ? "#FFD700" : "rgba(255,255,255,0.25)",
                  }}
                >
                  {m === 7 ? "wk" : `${m}d`}
                </div>
              ))}
            </div>
          </div>

          {/* Achievement badges */}
          <div className="col-span-2 flex flex-wrap gap-2 mt-2 justify-center">
            {STREAK_MILESTONES.filter((m) => currentStreak >= m).map((m) => (
              <div
                key={m}
                className="px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{
                  background: "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))",
                  border: "1px solid rgba(255,215,0,0.4)",
                  color: "#FFD700",
                }}
              >
                🏆 {m} Day
              </div>
            ))}
            {currentStreak >= 7 && (
              <div
                className="px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"
                style={{
                  background: "linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,100,0,0.2))",
                  border: "1px solid #FFD700",
                  color: "#FF6B35",
                }}
              >
                🔥 WEEKLY MASTER
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fireFlicker {
          0%, 100% { transform: scale(1) rotate(-5deg); filter: brightness(1); }
          25% { transform: scale(1.1) rotate(5deg); filter: brightness(1.2); }
          50% { transform: scale(0.95) rotate(-3deg); filter: brightness(0.9); }
          75% { transform: scale(1.05) rotate(3deg); filter: brightness(1.1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        @keyframes milestoneZoom {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}