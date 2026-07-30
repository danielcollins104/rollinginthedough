/**
 * Payline Highlight Component
 * Displays animated visual overlays for each winning payline across the reels
 */

import { useEffect, useState } from "react";

interface PaylineHighlightProps {
  paylineIndex: number;
  isActive: boolean;
  reelCount?: number;
  rowCount?: number;
}

function getPaylinePath(paylineIndex: number): number[] {
  const paylines: number[][] = [
    [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 0, 1, 0, 0], [2, 2, 1, 2, 2],
    [0, 0, 0, 1, 1], [0, 1, 0, 1, 0], [0, 0, 1, 1, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0],
    [2, 2, 2, 1, 1], [2, 1, 2, 1, 2], [2, 2, 1, 1, 1], [1, 2, 2, 2, 1], [2, 1, 1, 1, 2],
    [0, 1, 2, 1, 0], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2],
    [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 0, 2, 2, 2],
  ];
  return paylines[paylineIndex % paylines.length];
}

export default function PaylineHighlight({
  paylineIndex,
  isActive,
  reelCount = 5,
  rowCount = 3,
}: PaylineHighlightProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isActive) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive) return null;

  const path = getPaylinePath(paylineIndex);
  const cellHeight = 100 / rowCount;
  const cellWidth = 100 / reelCount;

  // Create SVG path for the payline
  let pathData = "";
  for (let i = 0; i < reelCount; i++) {
    const row = path[i];
    const x = (i + 0.5) * cellWidth;
    const y = (row + 0.5) * cellHeight;
    pathData += `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 20,
        animation: animate ? "paylinePulse 0.6s ease-out" : "none",
      }}
    >
      <defs>
        <style>{`
          @keyframes paylinePulse {
            0% {
              stroke-width: 4;
              opacity: 1;
              filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
            }
            50% {
              stroke-width: 3;
              opacity: 0.8;
              filter: drop-shadow(0 0 12px rgba(255, 215, 0, 1));
            }
            100% {
              stroke-width: 2;
              opacity: 0;
              filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0));
            }
          }
        `}</style>
        <linearGradient id={`paylineGradient-${paylineIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Main payline */}
      <path
        d={pathData}
        stroke={`url(#paylineGradient-${paylineIndex})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))",
        }}
      />

      {/* Highlight circles at each reel position */}
      {path.map((row, reelIdx) => (
        <circle
          key={`${paylineIndex}-${reelIdx}`}
          cx={`${((reelIdx + 0.5) * cellWidth).toFixed(1)}%`}
          cy={`${((row + 0.5) * cellHeight).toFixed(1)}%`}
          r="8%"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.8"
          style={{
            filter: "drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))",
            animation: animate ? `paylinePulse 0.6s ease-out 0.${reelIdx}s` : "none",
          }}
        />
      ))}
    </svg>
  );
}
