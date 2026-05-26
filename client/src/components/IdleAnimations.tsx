/**
 * IdleAnimations — Subtle animations when the player is idle
 * Floating coins, sparkles, and attention-grabbing effects
 */

import { useEffect, useState } from "react";

interface Props {
  spinning: boolean;
  lastSpinTime: number;
}

export default function IdleAnimations({ spinning, lastSpinTime }: Props) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (spinning) {
      setIsIdle(false);
      return;
    }
    // Consider idle after 5 seconds of no spin
    const timer = setTimeout(() => setIsIdle(true), 5000);
    return () => clearTimeout(timer);
  }, [spinning, lastSpinTime]);

  if (!isIdle || spinning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
      {/* Floating sparkles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${15 + i * 15}%`,
            bottom: "10%",
            animation: `idleFloat ${3 + i * 0.5}s ease-in-out ${i * 0.8}s infinite`,
            opacity: 0,
          }}
        >
          <span style={{ fontSize: "1rem" }}>✨</span>
        </div>
      ))}

      <style>{`
        @keyframes idleFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
