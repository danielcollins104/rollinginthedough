/**
 * Rolling in the Dough — Game Header (Professional Casino Edition)
 * Matches Jackpot Party / Chumba Casino header standards
 * Features: animated coin counter, level badge, XP bar, daily bonus, compact layout
 */

import { useState, useEffect, useRef } from "react";
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

// Animated number counter with color flash
function AnimatedNumber({ value, flashOnChange = false }: { value: number; flashOnChange?: boolean }) {
  const [display, setDisplay] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (display === value) return;
    setIsAnimating(true);
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
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span
      className="inline-block font-numbers tabular-nums"
      style={{
        display: "inline-block",
        transition: "color 0.3s ease",
        color: direction === "up" ? "#90EE90" : direction === "down" ? "#FF6B6B" : "#F5E6C8",
        textShadow: isAnimating && direction === "up"
          ? "0 0 12px rgba(144,238,144,0.8)"
          : isAnimating && direction === "down"
          ? "0 0 12px rgba(255,107,107,0.8)"
          : "none",
      }}
    >
      {display.toLocaleString()}
    </span>
  );
}

// Coin icon with spin-on-change animation
function AnimatedCoinIcon({ value }: { value: number }) {
  const [spinKey, setSpinKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setSpinKey((k) => k + 1);
    }
  }, [value]);

  return (
    <span
      key={spinKey}
      style={{
        fontSize: "1.1rem",
        filter: "drop-shadow(0 0 4px rgba(255,215,0,0.5))",
        animation: "coinSpin 0.5s ease-out",
        display: "inline-block",
      }}
    >
      🪙
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 shrink-0 relative overflow-hidden"
            style={{
              background: jackpotFlash
                ? "linear-gradient(135deg, #2a1a00, #3a2500)"
                : "linear-gradient(135deg, #0d0a00, #1a1200)",
              border: `1px solid ${jackpotFlash ? "#FFD700" : "rgba(212,175,55,0.35)"}`,
              boxShadow: jackpotFlash
                ? "0 0 30px rgba(255,215,0,0.7), 0 0 60px rgba(255,215,0,0.3), inset 0 0 15px rgba(255,215,0,0.15)"
                : "inset 0 0 8px rgba(0,0,0,0.4), 0 0 12px rgba(255,215,0,0.08)",
            }}
          >
            {/* Ambient pulse ring */}
            {!jackpotFlash && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  animation: "jackpotAmbient 2.5s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
            <span
              style={{
                fontSize: "1rem",
                filter: jackpotFlash ? "drop-shadow(0 0 8px #FFD700)" : "drop-shadow(0 0 3px rgba(255,215,0,0.4))",
                transition: "filter 0.3s ease",
              }}
            >
              ⭐
            </span>
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
                  textShadow: jackpotFlash
                    ? "0 0 12px rgba(255,215,0,1)"
                    : "0 0 4px rgba(212,175,55,0.4)",
                  lineHeight: 1.2,
                  transition: "color 0.3s ease, text-shadow 0.3s ease",
                }}
              >
                {jackpotDisplay.toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── Coin balance (main display) ── */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
              border: "1px solid rgba(212,175,55,0.35)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.4), 0 0 8px rgba(212,175,55,0.1)",
            }}
          >
            <AnimatedCoinIcon value={coins} />
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
                <AnimatedNumber value={coins} flashOnChange />
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

function DailyBonusBanner({ onClaim }: { onClaim?: () => void }) {
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [giftBounce, setGiftBounce] = useState(false);

  useEffect(() => {
    const lastBonus = localStorage.getItem("ritd_last_bonus");
    const now = Date.now();
    if (!lastBonus || now - parseInt(lastBonus) > 24 * 60 * 60 * 1000) {
      setShow(true);
      // Bounce the gift icon to draw attention
      setTimeout(() => setGiftBounce(true), 300);
    }
  }, []);

  if (!show || claimed) return null;

  return (
    <div
      className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
      style={{
        background: "linear-gradient(135deg, #0a1a0a, #1a2a1a)",
        border: "1px solid rgba(76,175,80,0.5)",
        color: "#90EE90",
        boxShadow: "0 0 15px rgba(76,175,80,0.2), inset 0 0 20px rgba(76,175,80,0.05)",
        animation: "dailyBonusSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-xl"
          style={{
            animation: giftBounce
              ? "giftBounce 0.6s ease-in-out 3"
              : "none",
            filter: "drop-shadow(0 0 6px rgba(255,215,0,0.8))",
          }}
        >
          🎁
        </span>
        <div>
          <div className="font-numbers font-bold tracking-wide text-sm">
            Daily bonus available!
          </div>
          <div className="font-numbers text-xs" style={{ color: "#FFD700" }}>
            +500 coins
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          localStorage.setItem("ritd_last_bonus", Date.now().toString());
          setClaimed(true);
          setShow(false);
          onClaim?.();
          const event = new CustomEvent("dailyBonus");
          window.dispatchEvent(event);
        }}
        className="px-4 py-1.5 rounded-full font-numbers font-bold text-sm transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #1a5a1a, #2a8a2a)",
          border: "1px solid #4CAF50",
          color: "#90EE90",
          boxShadow: "0 0 12px rgba(76,175,80,0.4), 0 2px 8px rgba(0,0,0,0.3)",
          letterSpacing: "0.1em",
        }}
      >
        CLAIM
      </button>
    </div>
  );
}

<style>{`
  @keyframes dailyBonusSlideIn {
    0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes giftBounce {
    0%, 100% { transform: scale(1) rotate(0deg); }
    20% { transform: scale(1.3) rotate(-10deg); }
    40% { transform: scale(1.1) rotate(8deg); }
    60% { transform: scale(1.2) rotate(-5deg); }
    80% { transform: scale(1.05) rotate(3deg); }
  }
  @keyframes coinSpin {
    0% { transform: scale(1); }
    30% { transform: scale(1.3); }
    60% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  @keyframes jackpotAmbient {
    0%, 100% {
      box-shadow: inset 0 0 8px rgba(255,215,0,0.05);
      border-color: rgba(212,175,55,0.25);
    }
    50% {
      box-shadow: inset 0 0 15px rgba(255,215,0,0.12);
      border-color: rgba(212,175,55,0.45);
    }
  }
`}</style>
