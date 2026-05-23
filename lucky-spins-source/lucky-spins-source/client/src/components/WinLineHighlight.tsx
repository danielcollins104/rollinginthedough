/**
 * WinLineHighlight — Animated win line overlay for the reel grid
 * Draws colored glowing lines across winning paylines like professional casino apps
 */

import type { WinLine } from "@/hooks/useGameState";

interface Props {
  winLines: WinLine[];
  show: boolean;
  reelCount?: number;
  rowCount?: number;
}

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

export default function WinLineHighlight({ winLines, show, reelCount = 5, rowCount = 3 }: Props) {
  if (!show || winLines.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-25">
      {winLines.map((line, lineIdx) => {
        const color = LINE_COLORS[lineIdx % LINE_COLORS.length];
        const rowPct = (line.row / rowCount) * 100 + (100 / rowCount / 2);

        if (line.row >= 0) {
          // Straight horizontal line
          return (
            <div
              key={lineIdx}
              className="absolute left-0 right-0"
              style={{
                top: `calc(${rowPct}% - 2px)`,
                height: "4px",
                background: `linear-gradient(90deg, transparent 0%, ${color} 5%, ${color} 95%, transparent 100%)`,
                boxShadow: `0 0 8px ${color}, 0 0 20px ${color}88, 0 0 40px ${color}44`,
                animation: "winLinePulse 0.8s ease-in-out infinite",
                animationDelay: `${lineIdx * 0.15}s`,
              }}
            />
          );
        }

        if (line.row === -1) {
          // Diagonal top-left to bottom-right
          return (
            <svg
              key={lineIdx}
              className="absolute inset-0 w-full h-full"
              style={{ overflow: "visible" }}
            >
              <line
                x1="0%"
                y1={`${(0 / rowCount) * 100 + (100 / rowCount / 2)}%`}
                x2="100%"
                y2={`${(2 / rowCount) * 100 + (100 / rowCount / 2)}%`}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
                  animation: "winLinePulse 0.8s ease-in-out infinite",
                  animationDelay: `${lineIdx * 0.15}s`,
                }}
              />
            </svg>
          );
        }

        if (line.row === -2) {
          // Diagonal top-right to bottom-left
          return (
            <svg
              key={lineIdx}
              className="absolute inset-0 w-full h-full"
              style={{ overflow: "visible" }}
            >
              <line
                x1="0%"
                y1={`${(2 / rowCount) * 100 + (100 / rowCount / 2)}%`}
                x2="100%"
                y2={`${(0 / rowCount) * 100 + (100 / rowCount / 2)}%`}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
                  animation: "winLinePulse 0.8s ease-in-out infinite",
                  animationDelay: `${lineIdx * 0.15}s`,
                }}
              />
            </svg>
          );
        }

        return null;
      })}

      <style>{`
        @keyframes winLinePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
