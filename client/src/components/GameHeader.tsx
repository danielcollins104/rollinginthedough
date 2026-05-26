/**
 * Rolling in the Dough — Game Header (Professional Casino Edition)
 * Matches Jackpot Party / Chumba Casino header standards
 * Features: animated coin counter, level badge, XP bar, daily bonus, compact layout
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface Props {
  coins: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalWins: number;
  jackpotPool: number;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  onLoginClick?: () => void;
}

// Animated number counter
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (display === value) return;
    setDirection(value > display ? "up" : "down");
    const diff = value - display;
    const steps = Math.min(Math.abs(diff), 25);
    const step = diff / steps;
    let current = display;
    let count = 0;
    const interval = setInterval(() => {
      current += step;
      count++;
      setDisplay(Math.round(current));
      if (count >= steps) {
        setDisplay(value);
        setDirection(null);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span
      style={{
        display: "inline-block",
        transition: "color 0.3s ease",
        color: direction === "up" ? "#90EE90" : direction === "down" ? "#FF6B6B" : "inherit",
      }}
    >
      {display.toLocaleString()}
    </span>
  );
}

export default function GameHeader({
  coins,
  level,
  xp,
  xpToNext,
  totalWins,
  jackpotPool,
  soundEnabled,
  setSoundEnabled,
  onLoginClick,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const [jackpotDisplay, setJackpotDisplay] = useState(jackpotPool);

  // Animate jackpot counter
  useEffect(() => {
    if (jackpotDisplay === jackpotPool) return;
    const diff = jackpotPool - jackpotDisplay;
    const steps = Math.min(Math.abs(diff), 20);
    const step = diff / steps;
    let current = jackpotDisplay;
    let count = 0;
    const interval = setInterval(() => {
      current += step;
      count++;
      setJackpotDisplay(Math.round(current));
      if (count >= steps) {
        setJackpotDisplay(jackpotPool);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [jackpotPool]);

  // Flash jackpot periodically for excitement
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotFlash(true);
      setTimeout(() => setJackpotFlash(false), 700);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const xpPercent = Math.min((xp / xpToNext) * 100, 100);
  const xpToNextLevel = xpToNext - xp;

  return (
    <header
      className="relative z-20 w-full"
      style={{
        background: "linear-gradient(180deg, #03030d 0%, #06060f 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.35)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Art Deco shimmer top line */}
      <div
        className="h-0.5 w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #C8860A 20%, #FFD700 50%, #C8860A 80%, transparent 100%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-2 py-1">
        <div className="flex items-center gap-2">

          {/* ── Jackpot pool (compact) ── */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 shrink-0"
            style={{
              background: jackpotFlash
                ? "linear-gradient(135deg, #2a1a00, #3a2500)"
                : "linear-gradient(135deg, #0d0a00, #1a1200)",
              border: `1px solid ${jackpotFlash ? "#FFD700" : "rgba(212,175,55,0.35)"}`,
              boxShadow: jackpotFlash
                ? "0 0 20px rgba(255,215,0,0.5), inset 0 0 10px rgba(255,215,0,0.1)"
                : "inset 0 0 8px rgba(0,0,0,0.4)",
            }}
          >
            <span style={{ fontSize: "1rem", filter: jackpotFlash ? "drop-shadow(0 0 6px #FFD700)" : "none" }}>⭐</span>
            <div>
              <div
                className="font-numbers uppercase tracking-widest"
                style={{ fontSize: "0.55rem", color: "#C8860A", lineHeight: 1 }}
              >
                Jackpot
              </div>
              <div
                className="font-numbers font-bold"
                style={{
                  fontSize: "0.85rem",
                  color: jackpotFlash ? "#FFD700" : "#D4AF37",
                  textShadow: jackpotFlash ? "0 0 8px rgba(255,215,0,0.8)" : "none",
                  lineHeight: 1.2,
                }}
              >
                {jackpotDisplay.toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── Coin balance (main display) ── */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1"
            style={{
              background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
              border: "1px solid rgba(212,175,55,0.35)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.4)",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🪙</span>
            <div className="flex-1 min-w-0">
              <div
                className="font-numbers uppercase tracking-widest"
                style={{ fontSize: "0.55rem", color: "#C8860A", lineHeight: 1 }}
              >
                Coins
              </div>
              <div
                className="font-numbers font-bold truncate"
                style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)", color: "#F5E6C8", lineHeight: 1.2 }}
              >
                <AnimatedNumber value={coins} />
              </div>
            </div>
          </div>

          {/* ── Level badge with XP bar ── */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg shrink-0"
            style={{
              background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
              border: "1px solid rgba(212,175,55,0.35)",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.4)",
            }}
          >
            {/* Level circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-numbers font-black text-sm shrink-0"
              style={{
                background: "linear-gradient(135deg, #8B5E0A, #C8860A, #D4AF37)",
                color: "#0a0a1a",
                boxShadow: "0 0 10px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              {level}
            </div>
            {/* XP progress */}
            <div className="hidden sm:block">
              <div
                className="font-numbers uppercase tracking-widest"
                style={{ fontSize: "0.55rem", color: "#C8860A", lineHeight: 1 }}
              >
                Level {level}
              </div>
              <div className="w-16 h-1.5 rounded-full overflow-hidden mt-0.5" style={{ background: "rgba(212,175,55,0.15)" }}>
                <div
                  className="h-full rounded-full level-bar transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <div
                className="font-numbers"
                style={{ fontSize: "0.5rem", color: "rgba(212,175,55,0.4)", lineHeight: 1, marginTop: "2px" }}
              >
                {xpToNextLevel.toLocaleString()} XP to next
              </div>
            </div>
          </div>

          {/* ── Sound toggle ── */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95 shrink-0"
            style={{
              background: soundEnabled
                ? "linear-gradient(135deg, #1a3a1a, #2a5a2a)"
                : "linear-gradient(135deg, #3a1a1a, #5a2a2a)",
              border: `1px solid ${soundEnabled ? "rgba(76,175,80,0.4)" : "rgba(255,107,107,0.4)"}`,
              color: soundEnabled ? "#90EE90" : "#FF6B6B",
              boxShadow: soundEnabled
                ? "0 0 8px rgba(76,175,80,0.2)"
                : "0 0 8px rgba(255,107,107,0.2)",
            }}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            <span style={{ fontSize: "1.1rem" }}>{soundEnabled ? "🔊" : "🔇"}</span>
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => {
                if (onLoginClick) {
                  onLoginClick();
                } else {
                  window.location.href = getLoginUrl();
                }
              }}
              className="px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 shrink-0 font-numbers font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #1a5a1a, #2a8a2a)",
                border: "1px solid #4CAF50",
                color: "#90EE90",
                boxShadow: "0 0 8px rgba(76,175,80,0.3)",
              }}
              title="Sign in to play Sweepstakes"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Daily bonus banner */}
        <DailyBonusBanner />
      </div>
    </header>
  );
}

function DailyBonusBanner() {
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const lastBonus = localStorage.getItem("ritd_last_bonus");
    const now = Date.now();
    if (!lastBonus || now - parseInt(lastBonus) > 24 * 60 * 60 * 1000) {
      setShow(true);
    }
  }, []);

  if (!show || claimed) return null;

  return (
    <div
      className="mt-1.5 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: "linear-gradient(135deg, #0a1a0a, #1a2a1a)",
        border: "1px solid rgba(76,175,80,0.4)",
        color: "#90EE90",
        boxShadow: "0 0 10px rgba(76,175,80,0.15)",
      }}
    >
      <div className="flex items-center gap-2">
        <span>🎁</span>
        <span className="font-numbers tracking-wide">Daily bonus available! +500 coins</span>
      </div>
      <button
        onClick={() => {
          localStorage.setItem("ritd_last_bonus", Date.now().toString());
          setClaimed(true);
          setShow(false);
          const event = new CustomEvent("dailyBonus");
          window.dispatchEvent(event);
        }}
        className="px-3 py-0.5 rounded-full font-numbers font-bold text-xs transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #1a5a1a, #2a8a2a)",
          border: "1px solid #4CAF50",
          color: "#90EE90",
          boxShadow: "0 0 8px rgba(76,175,80,0.3)",
        }}
      >
        CLAIM
      </button>
    </div>
  );
}
