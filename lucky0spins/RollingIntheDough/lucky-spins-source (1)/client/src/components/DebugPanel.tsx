/**
 * Debug Panel Component
 * Shows game statistics and analytics for testing
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DebugStats {
  totalSpins: number;
  totalWins: number;
  winRate: number;
  totalCoinsWon: number;
  totalCoinsBet: number;
  netProfit: number;
  rtp: number;
  cascades: number;
  bonusGames: number;
  freeSpinsTriggered: number;
  jackpotsHit: number;
}

interface Props {
  stats: DebugStats;
  freePlayMode: boolean;
  onToggleFreePlay: () => void;
}

export default function DebugPanel({ stats, freePlayMode, onToggleFreePlay }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-xs"
      style={{
        background: "linear-gradient(135deg, rgba(13, 13, 32, 0.95), rgba(26, 26, 53, 0.95))",
        border: "2px solid #D4AF37",
        borderRadius: "0.5rem",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/20 transition"
        style={{ borderBottom: expanded ? "1px solid rgba(212,175,55,0.3)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase" style={{ color: "#D4AF37" }}>
            🔧 Debug Panel
          </span>
          {freePlayMode && (
            <span
              className="text-xs px-2 py-1 rounded font-bold"
              style={{ background: "#90EE90", color: "#000" }}
            >
              FREE PLAY
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={16} style={{ color: "#D4AF37" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "#D4AF37" }} />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3 text-xs" style={{ color: "#F5E6C8" }}>
          {/* Free Play Toggle */}
          <button
            onClick={onToggleFreePlay}
            className="w-full py-2 px-3 rounded font-bold uppercase transition hover:opacity-80"
            style={{
              background: freePlayMode ? "#90EE90" : "rgba(212,175,55,0.2)",
              color: freePlayMode ? "#000" : "#D4AF37",
              border: `1px solid ${freePlayMode ? "#90EE90" : "#D4AF37"}`,
            }}
          >
            {freePlayMode ? "✓ Free Play ON" : "Free Play OFF"}
          </button>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Total Spins" value={stats.totalSpins} />
            <StatBox label="Total Wins" value={stats.totalWins} />
            <StatBox label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
            <StatBox label="RTP" value={`${stats.rtp.toFixed(1)}%`} />
            <StatBox label="Coins Won" value={stats.totalCoinsWon.toLocaleString()} />
            <StatBox label="Coins Bet" value={stats.totalCoinsBet.toLocaleString()} />
            <StatBox
              label="Net Profit"
              value={stats.netProfit.toLocaleString()}
              highlight={stats.netProfit >= 0}
            />
            <StatBox label="Cascades" value={stats.cascades} />
            <StatBox label="Bonus Games" value={stats.bonusGames} />
            <StatBox label="Free Spins" value={stats.freeSpinsTriggered} />
            <StatBox label="Jackpots" value={stats.jackpotsHit} />
          </div>

          {/* Info Text */}
          <div
            className="text-xs italic p-2 rounded"
            style={{ background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)" }}
          >
            Free Play Mode: Spins don't cost coins. Stats still tracked.
          </div>
        </div>
      )}
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatBox({ label, value, highlight }: StatBoxProps) {
  return (
    <div
      className="p-2 rounded"
      style={{
        background: highlight ? "rgba(144,238,144,0.1)" : "rgba(212,175,55,0.1)",
        border: `1px solid ${highlight ? "rgba(144,238,144,0.3)" : "rgba(212,175,55,0.2)"}`,
      }}
    >
      <div style={{ color: "rgba(212,175,55,0.6)", fontSize: "0.65rem" }}>{label}</div>
      <div
        style={{
          color: highlight ? "#90EE90" : "#FFD700",
          fontWeight: "bold",
          fontSize: "0.85rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}
