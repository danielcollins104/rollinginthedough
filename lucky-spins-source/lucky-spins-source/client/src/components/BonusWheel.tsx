/**
 * Bonus Wheel Spin Game Component
 * Dramatic spinning wheel with wedges and tension-building animation
 */

import { useState, useEffect, useRef } from "react";

interface Props {
  baseReward: number;
  maxMultiplier: number;
  onWin: (multiplier: number) => void;
}

const WHEEL_SEGMENTS = [
  { label: "1x", value: 1, color: "#4A5568" },
  { label: "2x", value: 2, color: "#2D3748" },
  { label: "2x", value: 2, color: "#4A5568" },
  { label: "3x", value: 3, color: "#C53030" },
  { label: "3x", value: 3, color: "#2D3748" },
  { label: "4x", value: 4, color: "#4A5568" },
  { label: "5x", value: 5, color: "#D69E2E" },
  { label: "5x", value: 5, color: "#2D3748" },
];

const SPIN_DURATION = 4000; // 4 seconds
const SPIN_ROTATIONS = 5; // Minimum rotations before stopping

export default function BonusWheel({ baseReward, maxMultiplier, onWin }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ segment: typeof WHEEL_SEGMENTS[0]; multiplier: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Pick a random winning segment (weighted toward higher multipliers)
    const weights = WHEEL_SEGMENTS.map((s, i) => {
      const baseWeight = s.value;
      // Add extra weight to middle segments for better UX
      const middleBonus = i >= 2 && i <= 5 ? 1.5 : 1;
      return baseWeight * middleBonus;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const selectedSegment = WHEEL_SEGMENTS[selectedIndex];

    // Calculate final rotation
    // Each segment is rotated so its center is at the top (0°)
    const segmentCenter = selectedIndex * segmentAngle + segmentAngle / 2;
    const extraRotations = SPIN_ROTATIONS * 360;
    const targetRotation = extraRotations + (360 - segmentCenter) + 180; // 180 = pointer at top

    const startRotation = rotation;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);

      // Ease out cubic for realistic deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * eased;

      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setRotation(currentRotation);
        setSpinning(false);
        setResult({ segment: selectedSegment, multiplier: selectedSegment.value });
        setTimeout(() => setShowResult(true), 300);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleCollect = () => {
    if (result) {
      onWin(result.multiplier);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur">
      {/* Header */}
      <div className="text-center mb-4 px-4">
        <div
          className="font-display font-black text-2xl sm:text-3xl mb-1"
          style={{
            background: "linear-gradient(135deg, #C8860A, #D4AF37, #F5E6C8, #D4AF37, #C8860A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🎡 LUCKY WHEEL 🎡
        </div>
        <p className="text-yellow-200/80 text-sm">Spin to multiply your reward!</p>
      </div>

      {/* Wheel container */}
      <div className="relative">
        {/* Pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{
            top: "-12px",
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "24px solid #FFD700",
              filter: "drop-shadow(0 4px 8px rgba(255,215,0,0.6))",
            }}
          />
          <div
            className="w-3 h-3 rounded-full mx-auto -mt-1"
            style={{ background: "linear-gradient(180deg, #FFD700, #C8860A)" }}
          />
        </div>

        {/* Wheel outer ring glow */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)",
            transform: "scale(1.15)",
          }}
        />

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-72 h-72 sm:w-80 sm:h-80"
          style={{
            transition: spinning ? "none" : "transform 0.1s ease-out",
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              {/* Outer gold ring */}
              <radialGradient id="outerGold" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="#1a1200" />
                <stop offset="90%" stopColor="#D4AF37" />
                <stop offset="95%" stopColor="#C8860A" />
                <stop offset="100%" stopColor="#1a1200" />
              </radialGradient>
              {/* Center gold */}
              <radialGradient id="centerGold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5E6C8" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#C8860A" />
              </radialGradient>
            </defs>

            {/* Outer ring */}
            <circle cx="100" cy="100" r="98" fill="url(#outerGold)" />

            {/* Wheel segments */}
            {WHEEL_SEGMENTS.map((segment, i) => {
              const startAngle = i * segmentAngle - 90;
              const endAngle = startAngle + segmentAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 100 + 85 * Math.cos(startRad);
              const y1 = 100 + 85 * Math.sin(startRad);
              const x2 = 100 + 85 * Math.cos(endRad);
              const y2 = 100 + 85 * Math.sin(endRad);

              const pathD = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 85 85 0 0 1 ${x2} ${y2}`,
                `Z`,
              ].join(" ");

              return (
                <g key={i}>
                  <path d={pathD} fill={segment.color} stroke="#1a1200" strokeWidth="2" />
                  <text
                    x={100 + 55 * Math.cos((endRad + startRad) / 2)}
                    y={100 + 55 * Math.sin((endRad + startRad) / 2)}
                    fill={segment.color === "#D69E2E" || segment.color === "#C53030" ? "#F5E6C8" : "#D4AF37"}
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                      transform: `rotate(${(endRad + startRad) * 180 / Math.PI + 90}deg, ${100 + 55 * Math.cos((endRad + startRad) / 2)}px, ${100 + 55 * Math.sin((endRad + startRad) / 2)}px)`,
                    }}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx="100" cy="100" r="18" fill="url(#centerGold)" />
            <circle cx="100" cy="100" r="14" fill="#1a1200" />
            <circle cx="100" cy="100" r="12" fill="url(#centerGold)" />
          </svg>
        </div>

        {/* Spin button overlay when not spinning */}
        {!spinning && !showResult && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={spinWheel}
              className="w-16 h-16 rounded-full font-display font-black text-lg shadow-xl"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F5E6C8, #D4AF37)",
                boxShadow: "0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(212,175,55,0.4)",
                color: "#1a1200",
              }}
            >
              SPIN
            </button>
          </div>
        )}
      </div>

      {/* Result display */}
      {showResult && result && (
        <div
          className="mt-6 text-center"
          style={{
            animation: "winBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
          }}
        >
          <div
            className="text-5xl sm:text-6xl mb-2"
            style={{
              animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both",
            }}
          >
            🎉
          </div>
          <div
            className="font-display font-black text-2xl sm:text-3xl mb-1"
            style={{ color: result.segment.color === "#D69E2E" ? "#FFD700" : result.segment.color === "#C53030" ? "#FF6B6B" : "#D4AF37" }}
          >
            {result.segment.label} MULTIPLIER!
          </div>
          <div
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.8)" }}
          >
            +{(baseReward * result.multiplier).toLocaleString()} 🪙
          </div>
          <button
            onClick={handleCollect}
            className="px-8 py-3 rounded-full font-display font-black text-lg tracking-wider shadow-xl"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
              color: "#1a1200",
              boxShadow: "0 0 30px rgba(212,175,55,0.6)",
              animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s both",
            }}
          >
            COLLECT WINNINGS
          </button>
        </div>
      )}

      <style>{`
        @keyframes winBounce {
          0% { opacity: 0; transform: scale(0.5) translateY(-20px); }
          40% { opacity: 1; transform: scale(1.15) translateY(0); }
          65% { transform: scale(0.97); }
          80% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}