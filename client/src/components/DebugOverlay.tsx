/**
 * DebugOverlay — a movable window with runtime stats and a copy-to-clipboard button.
 */

import { useState } from "react";

interface DebugStats {
  spins: number;
  wins: number;
  totalBet: number;
  totalWon: number;
  ldws: number;
  nearMisses: number;
  lastError: string | null;
}

interface Props {
  stats: DebugStats;
}

export default function DebugOverlay({ stats }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const copy = async () => {
    try {
      const text = JSON.stringify({
        ...stats,
        timestamp: new Date().toISOString(),
      }, null, 2);
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore copy failures on restricted contexts.
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        border: "1px solid #D4AF37",
        borderRadius: 8,
        color: "#FFD700",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        padding: 8,
        maxWidth: 280,
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      }}
      draggable={false}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-bold">Debug Stats</span>
        <button onClick={() => setCollapsed((c) => !c)} style={{ color: "#fff" }}>
          {collapsed ? "▸" : "▾"}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="space-y-1">
            <div>spins: {stats.spins}</div>
            <div>wins: {stats.wins}</div>
            <div>totalBet: {stats.totalBet}</div>
            <div>totalWon: {stats.totalWon}</div>
            <div>ldws: {stats.ldws}</div>
            <div>nearMisses: {stats.nearMisses}</div>
            <div className="text-red-400">lastError: {stats.lastError ?? "none"}</div>
          </div>
          <button
            onClick={copy}
            className="mt-2 w-full"
            style={{
              background: "#D4AF37",
              color: "#000",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            Copy to clipboard
          </button>
        </>
      )}
    </div>
  );
}
