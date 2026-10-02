/**
 * PayTableDrawer — collapsible PAYS panel that shows every symbol, its
 * 3-of-a-kind payout multiplier, and a hint about its special role.
 *
 * Lives just above the SPIN controls. Tap to expand/collapse.
 * Pirates Gold themed: dark teal case + gold accents.
 */
import { useState } from "react";
import { SYMBOLS } from "@/hooks/useGameState";
import { type SymbolId } from "@/hooks/useGameState";
import SymbolIcon from "./SymbolIcon";

function tier(p: { tier: "low" | "mid" | "high" }) {
  if (p.tier === "high") return { label: "MEGA", color: "#FFD700" };
  if (p.tier === "mid") return { label: "MID", color: "#C9A227" };
  return { label: "LOW", color: "#9CB0C8" };
}

function getArt(symbolId: SymbolId): string | null {
  const map: Partial<Record<SymbolId, string>> = {
    bread: "chim", rolling: "anchor", pretzel: "compass", croissant: "cutlass",
    cookie: "***", cupcake: "wolf", cake: "ship", muffin: "goldbars",
    bun: "wild", huntress: "captain", dough: "scatter",
  };
  return map[symbolId] ?? null;
}

export function PayTableDrawer() {
  const [open, setOpen] = useState(false);
  const shown = SYMBOLS.filter((s) => s.id !== "greenCoin" && s.id !== "goldCoin" && s.id !== "cookie");
  return (
    <div className="w-full px-4 mb-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg transition-all"
        style={{
          background: "linear-gradient(180deg, #1a1000, #0a0500)",
          border: "1px solid rgba(212,175,55,0.45)",
          color: "#FFD700",
          fontSize: "0.85rem",
          letterSpacing: "0.18em",
          fontWeight: 800,
        }}
      >
        <span>{open ? "▾" : "▴"}</span>
        <span>PAYS &amp; SYMBOLS</span>
        <span>{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <div
          className="mt-1 rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(0,30,40,0.85) 0%, rgba(3,10,16,0.95) 100%)",
            border: "1px solid rgba(212,175,55,0.35)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, padding: 10 }}
          >
            {shown.map((s) => {
              const t = s.isScatter ? "high" : s.isWild ? "high" : (s.payouts?.[2] ?? 0) >= 90 ? "high" : (s.payouts?.[2] ?? 0) >= 30 ? "mid" : "low";
              const tier_ = tier({ tier: t as "low" | "mid" | "high" });
              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-1 p-2 rounded"
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(212,175,55,0.15)",
                  }}
                >
                  <div style={{ width: 56, height: 56 }}>
                    {getArt(s.id) ? (
                      <SymbolIcon symbolId={s.id} fill />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-2xl"
                        style={{ background: "linear-gradient(135deg,#0a1a1a,#1a2a2a)", border: "2px solid #D4AF37" }}
                      >
                        {s.emoji}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#FFD700", fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{s.name}</div>
                  <div style={{ fontSize: "0.62rem", color: tier_.color, fontWeight: 600 }}>{tier_.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#FFFFFF", fontWeight: 700 }}>3× = {s.payouts?.[2] ?? 0}x</div>
                  <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
                    {s.isWild ? "substitutes all" : s.isScatter ? "3+ = free games" : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: "6px 10px",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.55)",
              borderTop: "1px solid rgba(212,175,55,0.15)",
            }}
          >
            Payouts are 3-of-a-kind multipliers × coin value. Wild substitutes; Scatter triggers free spins.
          </div>
        </div>
      )}
    </div>
  );
}