/**
 * PracticeBoard — the UI for the local leaderboard.
 *
 * This is a SOLO practice board, NOT live multiplayer. It is labelled as
 * such in the UI so players are never misled into thinking the rivals are
 * real people. Scores pivot around the player's own progress so there is
 * always a next target to chase.
 */
import { useMemo } from "react";
import { buildLeaderboard, yourRank } from "@/lib/localLeaderboard";

export default function PracticeBoard({ onClose }: { onClose: () => void }) {
  const board = useMemo(() => buildLeaderboard(), []);
  const rank = useMemo(() => yourRank(), []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Practice board"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-5"
        style={{
          background: "linear-gradient(180deg, #0d3b47 0%, #07222e 45%, #030a10 100%)",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 40px rgba(255,194,71,0.35), 0 20px 60px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2
            className="font-display font-black uppercase"
            style={{ color: "#FFD700", letterSpacing: "0.08em", fontSize: "1.15rem" }}
          >
            ⚓ Practice Board
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ color: "#FFD700", fontSize: "1.2rem" }}>
            ✕
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", marginBottom: 12 }}>
          A solo ranking against rival pacesetters — not live players. Climb the board!
        </p>

        <div className="flex flex-col gap-1">
          {board.map((e, i) => (
            <div
              key={e.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                background: e.isYou ? "rgba(255,215,0,0.15)" : "rgba(0,0,0,0.35)",
                border: e.isYou ? "1px solid #FFD700" : "1px solid rgba(212,175,55,0.15)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-numbers font-bold"
                  style={{ color: i < 3 ? "#FFD700" : "rgba(255,255,255,0.5)", minWidth: 22 }}
                >
                  {i + 1}
                </span>
                <span style={{ color: e.isYou ? "#FFD700" : "#E8E8F0", fontWeight: e.isYou ? 800 : 500 }}>
                  {e.name}
                </span>
              </div>
              <span className="font-numbers" style={{ color: "#FFD700" }}>
                {e.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center" style={{ color: "#E8E8F0", fontSize: "0.85rem" }}>
          You're ranked <span style={{ color: "#FFD700", fontWeight: 800 }}>#{rank}</span> of {board.length}
        </div>
      </div>
    </div>
  );
}
