/**
 * SessionTimeReward - Popup that appears after 30 min of continuous play
 * Shows a small appreciation bonus to keep players engaged
 */

import { useEffect, useState } from "react";

interface SessionTimeRewardProps {
  onClaim: (coins: number) => void;
  onDismiss: () => void;
}

const SESSION_BONUS = 50; // Small but meaningful coin reward

export function SessionTimeReward({ onClaim, onDismiss }: SessionTimeRewardProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "ready">("intro");
  const [coins, setCoins] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    // Phase transitions
    const t1 = setTimeout(() => setPhase("reveal"), 600);

    return () => clearTimeout(t1);
  }, []);

  // Coin reveal animation
  useEffect(() => {
    if (phase !== "reveal") return;

    let count = 0;
    const steps = 15;
    const increment = SESSION_BONUS / steps;
    const interval = setInterval(() => {
      count++;
      setCoins(Math.floor(increment * count));

      if (count >= steps) {
        clearInterval(interval);
        setCoins(SESSION_BONUS);
        setTimeout(() => setPhase("ready"), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase]);

  // Generate ambient sparkles
  useEffect(() => {
    const newSparkles = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setSparkles(newSparkles);
  }, []);

  const handleClaim = () => {
    onClaim(SESSION_BONUS);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {/* Ambient sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="absolute text-yellow-300/30 text-lg"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animation: `sparkleFloat ${2 + Math.random()}s ease-in-out ${s.delay}s infinite`,
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
          background: "linear-gradient(160deg, #0d1a0d 0%, #1a2a1a 50%, #0f1f0f 100%)",
          border: "2px solid #4ADE80",
          boxShadow: "0 0 50px rgba(74,222,128,0.2), 0 0 100px rgba(74,222,128,0.1)",
        }}
      >
        {/* Header - Green/growth themed */}
        <div
          className="relative px-6 py-4 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #166534 0%, #22C55E 50%, #4ADE80 100%)",
          }}
        >
          <div className="relative z-10">
            <div className="text-2xl mb-1" style={{ animation: "bounce-slow 1s ease-in-out infinite" }}>
              ⏰
            </div>
            <h2
              className="font-display font-black text-lg tracking-wider"
              style={{ color: "#052e16", textShadow: "0 1px 2px rgba(255,255,255,0.2)" }}
            >
              YOU&apos;VE BEEN PLAYING!
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          {/* Heart/appreciation icon */}
          <div className="relative inline-block mb-4">
            <div
              className="text-5xl"
              style={{
                animation: phase === "ready" ? "heartPulse 1s ease-in-out infinite" : "none",
              }}
            >
              💚
            </div>
            <div
              className="absolute inset-0 rounded-full -z-10 animate-ping"
              style={{
                background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)",
                transform: "scale(1.5)",
              }}
            />
          </div>

          <p className="text-green-200/80 text-sm mb-4">
            You&apos;ve been enjoying the game for a while now!
            <br />
            Here&apos;s a little something for your time. 🎁
          </p>

          {/* Reward display */}
          <div
            className="py-3 px-5 rounded-xl mb-5 inline-block"
            style={{
              background: "rgba(74,222,128,0.1)",
              border: "2px solid rgba(74,222,128,0.4)",
            }}
          >
            <p className="text-green-200/60 text-xs mb-1 uppercase tracking-wider">Appreciation Bonus</p>
            <div
              className="text-3xl font-black"
              style={{
                color: "#4ADE80",
                textShadow: "0 0 20px rgba(74,222,128,0.5)",
              }}
            >
              +{coins} 🪙
            </div>
          </div>

          {/* Claim button */}
          {phase === "ready" && (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl font-display font-bold text-base tracking-wider shadow-lg active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #22C55E 0%, #4ADE80 50%, #22C55E 100%)",
                color: "#052e16",
                boxShadow: "0 0 30px rgba(74,222,128,0.4)",
                animation: "greenPulse 2s ease-in-out infinite",
              }}
            >
              THANK YOU! 💚
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
          <p className="text-green-200/40 text-xs">
            Keep having fun! More rewards await 🎮
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkleFloat {
          0%, 100% { opacity: 0.2; transform: translateY(0) scale(1); }
          50% { opacity: 0.5; transform: translateY(-10px) scale(1.2); }
        }
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes greenPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(74,222,128,0.4); }
          50% { box-shadow: 0 0 50px rgba(74,222,128,0.6); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}