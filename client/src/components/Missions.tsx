/**
 * Missions - Daily missions/challenges component
 * Shows 3 daily missions with progress bars and rewards
 */

import { useState } from "react";
import type { Mission } from "@/hooks/useRetention";

interface MissionsProps {
  missions: Mission[];
  onClaimReward: (missionId: string) => number;
  onClose: () => void;
}

export function Missions({ missions, onClaimReward, onClose }: MissionsProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);

  const handleClaim = (mission: Mission) => {
    if (!mission.completed || claimingId) return;

    setClaimingId(mission.id);
    
    // Small delay for animation
    setTimeout(() => {
      const reward = onClaimReward(mission.id);
      setJustClaimed(mission.id);
      
      setTimeout(() => {
        setClaimingId(null);
        setJustClaimed(null);
      }, 1000);
    }, 300);
  };

  const totalMissions = missions.length;
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: "linear-gradient(160deg, #0d0d20 0%, #1a1a35 50%, #0f0f25 100%)",
          border: "3px solid #D4AF37",
          boxShadow: "0 0 60px rgba(212,175,55,0.3), 0 0 120px rgba(212,175,55,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #2a2a4a)",
            borderBottom: "2px solid rgba(212,175,55,0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2
                className="font-display font-black text-xl tracking-wider"
                style={{ color: "#F5E6C8" }}
              >
                Daily Missions
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / totalMissions) * 100}%`,
                  background: "linear-gradient(90deg, #D4AF37, #FFD700)",
                }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: "#D4AF37" }}>
              {completedCount}/{totalMissions}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1">Complete all missions for bonus rewards!</p>
        </div>

        {/* Missions list */}
        <div className="px-4 py-4 space-y-3">
          {missions.map((mission, index) => {
            const progressPercent = Math.min(100, (mission.progress / mission.target) * 100);
            const isComplete = mission.completed;
            const isClaiming = claimingId === mission.id;
            const wasClaimed = justClaimed === mission.id;

            return (
              <div
                key={mission.id}
                className="relative rounded-xl p-4 transition-all duration-300"
                style={{
                  background: isComplete
                    ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  border: isComplete
                    ? "2px solid rgba(34,197,94,0.4)"
                    : "2px solid rgba(255,255,255,0.08)",
                  animation: `missionSlideIn 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Mission icon */}
                <div
                  className="absolute -left-1 -top-1 w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{
                    background: isComplete
                      ? "linear-gradient(135deg, #22C55E, #16A34A)"
                      : "linear-gradient(135deg, #374151, #4B5563)",
                    boxShadow: isComplete
                      ? "0 0 15px rgba(34,197,94,0.4)"
                      : "none",
                  }}
                >
                  {isComplete ? "✓" : mission.type === "spin" ? "🎰" : mission.type === "bonus" ? "🎁" : "💰"}
                </div>

                {/* Content */}
                <div className="pl-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: isComplete ? "#86EFAC" : "#F5E6C8" }}
                      >
                        {mission.title}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">{mission.description}</p>
                    </div>
                    <div
                      className="text-right"
                      style={{
                        color: "#FFD700",
                        animation: isComplete && !wasClaimed ? "rewardPulse 1.5s ease-in-out infinite" : "none",
                      }}
                    >
                      <span className="text-sm font-bold">{mission.reward}</span>
                      <span className="text-xs ml-0.5">🪙</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div
                      className="h-2 rounded-full overflow-hidden relative"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300 relative"
                        style={{
                          width: `${progressPercent}%`,
                          background: isComplete
                            ? "linear-gradient(90deg, #22C55E, #4ADE80)"
                            : "linear-gradient(90deg, #D4AF37, #FFD700)",
                        }}
                      >
                        {/* Shimmer during progress */}
                        {!isComplete && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                              animation: "shimmer 1.5s linear infinite",
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-white/40">
                        {mission.progress} / {mission.target}
                      </span>
                      {isComplete && (
                        <span className="text-xs" style={{ color: "#86EFAC" }}>
                          COMPLETE!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Claim button or completed state */}
                  {isComplete ? (
                    <button
                      onClick={() => handleClaim(mission)}
                      disabled={!!claimingId}
                      className="w-full py-2 rounded-lg font-semibold text-sm transition-all duration-200 active:scale-95"
                      style={{
                        background: wasClaimed
                          ? "linear-gradient(135deg, #22C55E, #16A34A)"
                          : isClaiming
                          ? "linear-gradient(135deg, #16A34A, #15803D)"
                          : "linear-gradient(135deg, #D4AF37, #FFD700)",
                        color: "#1a1200",
                        boxShadow: wasClaimed
                          ? "0 0 20px rgba(34,197,94,0.5)"
                          : "0 0 15px rgba(212,175,55,0.3)",
                        animation: !wasClaimed ? "claimPulse 1.5s ease-in-out infinite" : "none",
                        opacity: claimingId && !isClaiming ? 0.5 : 1,
                      }}
                    >
                      {wasClaimed ? "✓ CLAIMED!" : isClaiming ? "Claiming..." : "CLAIM REWARD"}
                    </button>
                  ) : (
                    <div
                      className="w-full py-2 rounded-lg text-center text-xs text-white/30"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                      }}
                    >
                      Keep spinning to complete
                    </div>
                  )}
                </div>

                {/* Completion confetti burst */}
                {wasClaimed && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute text-sm"
                        style={{
                          left: "50%",
                          top: "50%",
                          animation: `confettiBurst 0.8s ease-out forwards`,
                          animationDelay: `${i * 0.05}s`,
                          transform: `rotate(${i * 45}deg)`,
                        }}
                      >
                        🎉
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-white/30">
            ✨ New missions refresh daily at midnight
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes missionSlideIn {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes claimPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.3); }
          50% { box-shadow: 0 0 25px rgba(212,175,55,0.5); }
        }
        @keyframes rewardPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes confettiBurst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx, 50px)), calc(-50% + var(--ty, -50px))) scale(0); }
        }
      `}</style>
    </div>
  );
}