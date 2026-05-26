/**
 * LevelUp - Full-screen level-up celebration overlay
 * Triggers when user accumulates enough XP and levels up
 */

import { useEffect, useState } from "react";

interface LevelUpProps {
  fromLevel: number;
  toLevel: number;
  onDismiss: () => void;
}

// Rewards unlocked at each level
const LEVEL_REWARDS: Record<number, { icon: string; label: string; description: string }[]> = {
  2: [{ icon: "🎁", label: "Starter Pack", description: "100 free coins" }],
  3: [{ icon: "🧁", label: "Sweet Bonus", description: "2x cupcake wins" }],
  5: [{ icon: "🫓", label: "Wild Bun", description: "Sweet Bun wild multiplier" }],
  7: [{ icon: "🎰", label: "Extra Spin", description: "+5 free spins" }],
  10: [{ icon: "💰", label: "VIP Status", description: "Exclusive daily bonus" }],
  15: [{ icon: "👑", label: "Royal Bonus", description: "3x crown multiplier" }],
  20: [{ icon: "🏆", label: "Grand Master", description: "All bonuses doubled" }],
};

function getRewardsForLevel(level: number) {
  const rewards: { icon: string; label: string; description: string }[] = [];
  
  // Check all levels up to current
  for (let l = 2; l <= level; l++) {
    if (LEVEL_REWARDS[l]) {
      rewards.push(...LEVEL_REWARDS[l]);
    }
  }
  
  return rewards.slice(0, 4); // Max 4 rewards shown
}

export function LevelUp({ fromLevel, toLevel, onDismiss }: LevelUpProps) {
  const [phase, setPhase] = useState<"zoom" | "reveal" | "rewards">("zoom");
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; delay: number; rotation: number }[]>([]);
  const rewards = getRewardsForLevel(toLevel);

  // Generate confetti on mount
  useEffect(() => {
    const newConfetti = Array.from({ length: 60 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#87CEEB"][Math.floor(Math.random() * 8)],
      delay: Math.random() * 1,
      size: 4 + Math.random() * 8,
    }));
    setConfetti(newConfetti);

    const newStars = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + 100 + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
    }));
    setStars(newStars);

    // Phase transitions
    const t1 = setTimeout(() => setPhase("reveal"), 800);
    const t2 = setTimeout(() => setPhase("rewards"), 2500);
    const t3 = setTimeout(onDismiss, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDismiss]);

  const levelDiff = toLevel - fromLevel;
  const isBigJump = levelDiff > 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.x}%`,
              top: "-20px",
              width: c.size,
              height: c.size * 0.6,
              background: c.color,
              animation: `confettiFall ${2 + Math.random() * 2}s ease-in ${c.delay}s infinite`,
              boxShadow: `0 0 ${c.size}px ${c.color}`,
            }}
          />
        ))}

        {/* Stars */}
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute text-yellow-300/60"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animation: `starPulse ${1.5 + Math.random()}s ease-in-out ${s.delay}s infinite`,
              transform: `rotate(${s.rotation}deg)`,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* Central content */}
      <div className="text-center relative z-10">
        {/* Zoom-in LEVEL UP text */}
        <div
          className="mb-4"
          style={{
            animation: phase === "zoom" ? "levelZoomIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none",
          }}
        >
          <div
            className="text-6xl md:text-8xl font-black tracking-wider"
            style={{
              color: "#FFD700",
              textShadow: `
                0 0 20px rgba(255,215,0,0.8),
                0 0 40px rgba(255,215,0,0.6),
                0 0 60px rgba(255,215,0,0.4),
                0 0 80px rgba(255,215,0,0.3),
                0 4px 0 #B8860B
              `,
              animation: phase === "reveal" || phase === "rewards" ? "levelGlow 1.5s ease-in-out infinite" : "none",
            }}
          >
            LEVEL UP!
          </div>
        </div>

        {/* Level number */}
        <div
          className="mb-6"
          style={{
            animation: phase !== "zoom" ? "fadeSlideUp 0.5s ease-out" : "none",
            opacity: phase !== "zoom" ? 1 : 0,
          }}
        >
          <div className="text-sm text-purple-300/80 uppercase tracking-widest mb-1">
            {isBigJump ? "Jumped to" : "Reached"}
          </div>
          <div
            className="inline-flex items-center justify-center w-32 h-32 rounded-full"
            style={{
              background: "radial-gradient(circle, #7C3AED 0%, #5B21B6 50%, #4C1D95 100%)",
              border: "4px solid #A855F7",
              boxShadow: "0 0 40px rgba(168,85,247,0.6), inset 0 0 30px rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="text-6xl font-black"
              style={{
                color: "#F5E6C8",
                textShadow: "0 0 20px rgba(255,255,255,0.5)",
              }}
            >
              {toLevel}
            </div>
          </div>
        </div>

        {/* Level transition */}
        {isBigJump && (
          <div
            className="mb-4 text-yellow-200/70"
            style={{
              animation: "fadeSlideUp 0.5s ease-out 0.3s both",
            }}
          >
            <span className="text-yellow-400 font-bold">{levelDiff} levels</span> in one session!
          </div>
        )}

        {/* Rewards unlocked */}
        {phase === "rewards" && rewards.length > 0 && (
          <div
            className="max-w-xs mx-auto"
            style={{
              animation: "fadeSlideUp 0.5s ease-out",
            }}
          >
            <div className="text-sm text-yellow-300/80 uppercase tracking-widest mb-3">
              ✨ Rewards Unlocked ✨
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {rewards.map((r, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                    border: "1px solid rgba(212,175,55,0.4)",
                    animation: `fadeSlideUp 0.3s ease-out ${i * 0.1}s both`,
                  }}
                >
                  <span className="text-xl mr-1">{r.icon}</span>
                  <span className="text-yellow-200 font-medium">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dismiss hint */}
        <div
          className="mt-8 text-xs text-white/40"
          style={{
            animation: phase === "rewards" ? "fadeIn 0.5s ease-out 0.5s both" : "none",
            opacity: phase === "rewards" ? 1 : 0,
          }}
        >
          Tap anywhere to continue
        </div>
      </div>

      {/* Click to dismiss */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onDismiss}
        style={{ zIndex: 5 }}
      />

      <style>{`
        @keyframes levelZoomIn {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes levelGlow {
          0%, 100% {
            filter: brightness(1);
            transform: scale(1);
          }
          50% {
            filter: brightness(1.2);
            transform: scale(1.02);
          }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes starPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5) rotate(180deg);
          }
        }
        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}