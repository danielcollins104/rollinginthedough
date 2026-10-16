/**
 * BottomNavBar — Mobile control dock ("Pirate's Gold" bottom icon row).
 *
 * Primary row: SOUND / RESPONSIBLE PLAY / VIP / MENU.
 * MENU opens an action tray with the secondary features (Shop, Deals,
 * Scratch, Missions, Referrals, Board) that used to crowd the bar.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface Props {
  onShop: () => void;
  onRules: () => void;
  onDeals: () => void;
  onScratch: () => void;
  onMissions: () => void;
  onReferrals: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBoard?: () => void;
}

export default function BottomNavBar({
  onShop,
  onRules,
  onDeals,
  onScratch,
  onMissions,
  onReferrals,
  onBoard,
  soundEnabled,
  onToggleSound,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const trayItems: { icon: string; label: string; onClick: () => void; highlight?: boolean }[] = [
    { icon: "💰", label: "Shop", onClick: onShop, highlight: true },
    { icon: "🎁", label: "Deals", onClick: onDeals },
    { icon: "🎰", label: "Scratch", onClick: onScratch },
    { icon: "📋", label: "Missions", onClick: onMissions },
    { icon: "📖", label: "Pays", onClick: onRules },
    { icon: "👥", label: "Refer", onClick: onReferrals },
    { icon: "🏆", label: "Board", onClick: onBoard ?? (() => {}) },
    ...(!isAuthenticated
      ? [{ icon: "👤", label: "Sign in", onClick: () => { window.location.href = getLoginUrl(); }, highlight: true }]
      : []),
  ];

  const dockItems = [
    {
      icon: soundEnabled ? "🔊" : "🔇",
      label: "Sound",
      onClick: onToggleSound,
      active: soundEnabled,
    },
    {
      icon: "🛡️",
      label: "Responsible Play",
      onClick: () => setLocation("/terms"),
    },
    {
      icon: "🎖️",
      label: "VIP",
      onClick: onMissions,
    },
    {
      icon: menuOpen ? "✕" : "☰",
      label: "Menu",
      onClick: () => setMenuOpen((o) => !o),
      active: menuOpen,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Action tray — slides up over the dock when MENU is tapped */}
      {menuOpen && (
        <div
          className="grid grid-cols-4 gap-2 px-3 py-3"
          style={{
            background: "linear-gradient(180deg, rgba(18,8,34,0.97) 0%, rgba(8,4,18,0.99) 100%)",
            borderTop: "1px solid rgba(168,85,247,0.35)",
            boxShadow: "0 -8px 24px rgba(0,0,0,0.7)",
          }}
        >
          {trayItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setMenuOpen(false);
                item.onClick();
              }}
              className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: item.highlight
                  ? "linear-gradient(180deg, rgba(212,175,55,0.16), rgba(0,0,0,0.4))"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${item.highlight ? "rgba(212,175,55,0.5)" : "rgba(168,85,247,0.25)"}`,
              }}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
              <span
                className="font-numbers uppercase tracking-wide"
                style={{ fontSize: "0.55rem", color: item.highlight ? "#FFD700" : "rgba(233,213,255,0.75)" }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Primary dock row */}
      <div
        className="flex items-stretch"
        style={{
          background: "linear-gradient(180deg, rgba(10,5,20,0.98) 0%, rgba(5,2,12,1) 100%)",
          borderTop: "1px solid rgba(168,85,247,0.45)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.8), 0 -1px 12px rgba(124,58,237,0.25)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {dockItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95"
            style={{ minHeight: "54px" }}
          >
            <span
              style={{
                fontSize: "1.25rem",
                lineHeight: 1,
                filter: item.active ? "drop-shadow(0 0 6px rgba(192,132,252,0.8))" : "none",
              }}
            >
              {item.icon}
            </span>
            <span
              className="font-numbers uppercase"
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.08em",
                color: item.active ? "#c084fc" : "rgba(212,175,55,0.6)",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
