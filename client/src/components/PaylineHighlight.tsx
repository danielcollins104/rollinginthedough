/**
 * PaylineHighlight — Animated win-line overlay for the reel grid
 *
 * Draws an SVG path that follows the actual payline geometry
 * (zigzags, V-shapes, etc.) using the same `getPaylinePath` helper
 * the game logic uses. A win on a zigzag payline shows a zigzag line.
 *
 * Replaces the previous straight-line approach (WinLineHighlight.tsx,
 * now deleted) which was geometrically wrong on 22 of the 25 paylines.
 *
 * Visual style: 8-color palette (one color per simultaneous win line,
 * cycled), drop-shadow glow, pulsing animation. Z-index 20 — drawn
 * underneath the reel symbols but above the reel background.
 */

import { useEffect, useState } from "react";

interface PaylineHighlightProps {
  paylineIndex: number;
  isActive: boolean;
  /** Zero-based index of this payline in the winLines array, used to pick a color. */
  lineIndex?: number;
  reelCount?: number;
  rowCount?: number;
}

// 8 distinct colors so up to 8 simultaneous wins are visually
// distinguishable. Matches the palette that was in WinLineHighlight.tsx
// before its removal.
const LINE_COLORS = [
  "#FFD700", // Gold
  "#FF6B35", // Orange
  "#00E5FF", // Cyan
  "#FF1744", // Red
  "#76FF03", // Green
  "#E040FB", // Purple
  "#FF9100", // Amber
  "#00BFA5", // Teal
];

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
  lineIndex = 0,
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
  const color = LINE_COLORS[lineIndex % LINE_COLORS.length];

  // Build SVG path data (M ... L ... L ... L ... L ...) following
  // the actual payline geometry, not a straight horizontal line.
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
              filter: drop-shadow(0 0 8px ${color}CC) drop-shadow(0 0 16px ${color}66);
            }
            50% {
              stroke-width: 3;
              opacity: 0.85;
              filter: drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color}99);
            }
            100% {
              stroke-width: 2;
              opacity: 0;
              filter: drop-shadow(0 0 4px transparent);
            }
          }
          @keyframes paylineCirclePulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}</style>
        <linearGradient id={`paylineGradient-${paylineIndex}-${lineIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Main payline path — follows the actual geometry */}
      <path
        d={pathData}
        stroke={`url(#paylineGradient-${paylineIndex}-${lineIndex})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 6px ${color}CC) drop-shadow(0 0 12px ${color}66)`,
        }}
      />

      {/* Highlight circles at each reel position */}
      {path.map((row, reelIdx) => (
        <circle
          key={`${paylineIndex}-${lineIndex}-${reelIdx}`}
          cx={`${((reelIdx + 0.5) * cellWidth).toFixed(1)}%`}
          cy={`${((row + 0.5) * cellHeight).toFixed(1)}%`}
          r="8%"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.8"
          style={{
            filter: `drop-shadow(0 0 6px ${color}CC)`,
            animation: animate
              ? `paylineCirclePulse 0.6s ease-out ${0.1 * reelIdx}s`
              : "none",
          }}
        />
      ))}
    </svg>
  );
}
