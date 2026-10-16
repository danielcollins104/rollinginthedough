/**
 * Rolling in the Dough — Slot Machine Component
 * AUTHENTIC CASINO CABINET UI based on real video slot machines
 * Features: Physical cabinet with LED edge lighting, 7-segment displays,
 *           glass bezel, prominent SPIN button, gold/black aesthetic
 */

import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { SYMBOLS, type SymbolId, type WinLine, type WinType } from "@/hooks/useGameState";
import { playSound, playWinSound, setSoundEnabled as setLibSoundEnabled, isSoundEnabled } from "@/lib/sounds";
import { detectNearMisses, playNearMissSound } from "@/lib/nearMiss";
import { haptics } from "@/lib/haptics";
import { track } from "@/lib/analytics";
import { recordExposure, variantOf } from "@/lib/ab";
import { WinParticles } from "./WinParticles";
import CoinParticles from "./CoinParticles";
// On-demand modals are code-split so they don't inflate the initial
// bundle — they only load when the player opens them. BigWinOverlay
// stays eager because it must render instantly at the big-win moment.
const ScratchGame = lazy(() => import("./ScratchGame"));
const DealsModal = lazy(() => import("./DealsModal"));
import BigWinOverlay from "./BigWinOverlay";
import JackpotMeters from "./JackpotMeters";
import WinLineHighlight from "./WinLineHighlight";
import SymbolIcon from "./SymbolIcon";
import FreeSpinsDisplay from "./FreeSpinsDisplay";
import { PayTableDrawer } from "./PayTableDrawer";
import { IdleAmbiance } from "./IdleAmbiance";
import IdleAnimations from "./IdleAnimations";
import PaylineHighlight from "./PaylineHighlight";
import CitySkylineScene from "./CitySkylineScene";

const BET_OPTIONS = [10, 25, 50, 100, 200];
const PAYLINE_OPTIONS = [1, 5, 10, 15, 20, 25];

const CASCADE_MULTIPLIERS = [1, 2, 3, 4, 5];
const MAX_CASCADE_LEVEL = 5;

interface Props {
  reels: SymbolId[][];
  spinning: boolean;
  winAmount: number;
  winLines: WinLine[];
  lastWinType: WinType;
  freeSpins: number;
  coins: number;
  bet: number;
  setBet: (b: number) => void;
  spin: () => void;
  triggerDemoSpin?: () => void;
  autoplay: boolean;
  setAutoplay: (a: boolean) => void;
  spinCount: number;
  soundEnabled: boolean;
  consecutiveWins?: number;
  maxStreak?: number;
  rescueOffered?: boolean;
  paylines?: number;
  setPaylines?: (p: number) => void;
  onCoinShop?: () => void;
  jackpotPool?: number;
  externalShowDeals?: boolean;
  externalShowScratch?: boolean;
  onDealsClose?: () => void;
  onScratchClose?: () => void;
  onScratchWin?: (amount: number) => void;
  selectedCurrency?: 'gold' | 'green';
  goldCoins?: number;
  greenCoins?: number;
  stickyBonus?: { totalWin: number; grandJackpot: boolean; locked: { reelIdx: number; rowIdx: number; type: "greenCoin" | "goldCoin" }[] } | null;
  stickyBonusSpinning?: boolean;
  onDailyBonus?: () => void;
  onCashOut?: () => void;
  level?: number;
  xp?: number;
  xpToNext?: number;
}

function getSymbol(id: SymbolId) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}

function isWinningCell(reelIdx: number, rowIdx: number, winLines: WinLine[]): boolean {
  return winLines.some((line) => {
    if (line.row >= 0 && line.row < 25) {
      const path = getPaylinePath(line.row);
      return path[reelIdx] === rowIdx;
    }
    return false;
  });
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

function isWildSymbol(id: SymbolId): boolean {
  const sym = getSymbol(id);
  return sym.isWild || false;
}

function isScatterSymbol(id: SymbolId): boolean {
  const sym = getSymbol(id);
  return sym.isScatter || false;
}

function getRandomSymbolId(): SymbolId {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
}

// ─── Cabinet Frame Components ─────────────────────────────────────────────────

/** Dual-currency balance pill: GC = gold, SC = cyan ("Sweeps"). */
function CurrencyStat({ active, color, dim, glow, label, value, icon }: {
  active: boolean;
  color: string;
  dim: string;
  glow: string;
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        background: "linear-gradient(180deg, rgba(20,10,35,0.9) 0%, rgba(5,3,12,0.95) 100%)",
        border: `1.5px solid ${active ? color : dim}`,
        boxShadow: active ? `0 0 12px ${glow}` : "none",
      }}
    >
      <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>{icon}</span>
      <span className="font-numbers uppercase" style={{ color: dim, fontSize: "0.55rem", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span className="font-numbers tabular-nums font-bold" style={{ color, fontSize: "0.78rem", textShadow: `0 0 8px ${glow}`, lineHeight: 1 }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

/** Purple neon gift chip with live countdown to the next daily bonus. */
function DailyBonusChip({ onClick }: { onClick?: () => void }) {
  const [remain, setRemain] = useState("…");
  useEffect(() => {
    const tick = () => {
      const last = Number(localStorage.getItem("lastDailyBonus") || 0);
      const left = last + 24 * 3600 * 1000 - Date.now();
      if (!last || left <= 0) setRemain("READY");
      else {
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        setRemain(`${h}H ${String(m).padStart(2, "0")}M`);
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  const ready = remain === "READY";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 transition-transform active:scale-95"
      aria-label={`Daily bonus, ${ready ? "ready to claim" : `available in ${remain}`}`}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: 34,
          height: 34,
          fontSize: "1rem",
          background: "radial-gradient(circle at 32% 28%, #3b1163 0%, #1c0836 70%)",
          border: "2px solid #b026ff",
          boxShadow: `0 0 14px rgba(176,38,255,${ready ? 0.9 : 0.5}), inset 0 1px 0 rgba(233,213,255,0.3)`,
          animation: ready ? "dailyBonusPulse 1.2s ease-in-out infinite" : "none",
        }}
      >
        🎁
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="font-numbers uppercase" style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "rgba(233,213,255,0.85)" }}>
          DAILY BONUS
        </span>
        <span className="font-numbers tabular-nums font-bold" style={{ fontSize: "0.7rem", color: ready ? "#FFD700" : "#c084fc", textShadow: ready ? "0 0 8px rgba(255,215,0,0.7)" : "0 0 8px rgba(192,132,252,0.6)" }}>
          {remain}
        </span>
      </span>
    </button>
  );
}

function CabinetTopGlass({ freeSpins, isFullscreen, onToggleFullscreen, goldCoins = 0, greenCoins = 0, selectedCurrency = 'gold', onDailyBonus }: {
  freeSpins: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  goldCoins?: number;
  greenCoins?: number;
  selectedCurrency?: 'gold' | 'green';
  onDailyBonus?: () => void;
}) {
  return (
    <div className="relative" style={{
      background: "linear-gradient(180deg, #0a0514 0%, #150827 55%, #1d0c33 100%)",
      borderBottom: "2px solid rgba(168,85,247,0.55)",
      borderRadius: "1rem 1rem 0 0",
      padding: "4px 10px 6px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Neon purple edge lighting — top of the machine */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{
        background: "linear-gradient(90deg, #7c3aed, #c084fc, #e9d5ff, #c084fc, #7c3aed)",
        boxShadow: "0 0 18px #a855f7, 0 0 36px #7c3aed",
        animation: "cabinetGlow 3s ease-in-out infinite",
      }} />

      {/* Soft light rays fanning down from behind the logo */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(168,85,247,0.10) 14deg, transparent 30deg, rgba(255,215,0,0.06) 48deg, transparent 62deg, rgba(168,85,247,0.10) 82deg, transparent 100deg)",
      }} />

      {/* Fullscreen toggle — top-left corner */}
      <button
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute left-2 top-3 z-20 flex w-8 h-8 items-center justify-center rounded-lg transition-all active:scale-95"
        style={{
          background: "linear-gradient(180deg, #2b1145, #160827)",
          border: "1.5px solid rgba(168,85,247,0.6)",
          color: "#c084fc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          fontSize: "0.95rem",
          lineHeight: 1,
        }}
      >
        {isFullscreen ? "⛶" : "⛗"}
      </button>

      {/* Header art: real key art sliced from the owned mockups.
          Mobile: portrait band (logo + skyline) with stacked live chips
          veiled over the band's baked-in static chips.
          Desktop: the wide desktop band (GC top-left, logo center, SC +
          daily bonus top-right) full-width; live chips overlay the baked
          zones via edge veils so balances stay real. */}
      <div className="relative">
        {/* ── Mobile header band ── */}
        <div className="lg:hidden flex justify-center">
          <div className="relative" style={{ width: "min(100%, 560px)" }}>
            <img
              src="/pg/header-band.png"
              alt="Pirate's Gold"
              draggable={false}
              style={{ width: "100%", display: "block", borderRadius: 10, boxShadow: "0 0 24px rgba(124,58,237,0.35), 0 0 10px rgba(212,175,55,0.35)" }}
            />
            {/* Veil over the baked-in status chips at the band's right edge —
                live chips go on top so balances are real */}
            <div className="absolute right-0 top-0 bottom-0" style={{ width: "30%", background: "linear-gradient(270deg, rgba(10,5,20,0.95) 25%, rgba(10,5,20,0.55) 70%, transparent)", borderRadius: "0 10px 10px 0" }} />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
              <CurrencyStat
                active={selectedCurrency === 'gold'}
                color="#FFD700" dim="rgba(212,175,55,0.45)" glow="rgba(255,215,0,0.6)"
                label="GC" value={goldCoins} icon="🪙"
              />
              <CurrencyStat
                active={selectedCurrency === 'green'}
                color="#41E3FF" dim="rgba(65,227,255,0.4)" glow="rgba(65,227,255,0.55)"
                label="SC" value={greenCoins} icon="💠"
              />
              <DailyBonusChip onClick={onDailyBonus} />
            </div>
          </div>
        </div>

        {/* ── Desktop header band (wide key art) ── */}
        <div className="hidden lg:block relative w-full">
          <img
            src="/pg/header-band-desktop.png"
            alt="Pirate's Gold"
            draggable={false}
            style={{ width: "100%", display: "block", borderRadius: 10, boxShadow: "0 0 28px rgba(124,58,237,0.4), 0 0 12px rgba(212,175,55,0.35)" }}
          />
          {/* Veils over the baked-in GC (left) and SC/bonus (right) zones */}
          <div className="absolute left-0 top-0 bottom-0" style={{ width: "21%", background: "linear-gradient(90deg, rgba(10,5,20,0.9) 15%, rgba(10,5,20,0.45) 65%, transparent)", borderRadius: "10px 0 0 10px" }} />
          <div className="absolute right-0 top-0 bottom-0" style={{ width: "21%", background: "linear-gradient(270deg, rgba(10,5,20,0.9) 15%, rgba(10,5,20,0.45) 65%, transparent)", borderRadius: "0 10px 10px 0" }} />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <CurrencyStat
              active={selectedCurrency === 'gold'}
              color="#FFD700" dim="rgba(212,175,55,0.45)" glow="rgba(255,215,0,0.6)"
              label="GC" value={goldCoins} icon="🪙"
            />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-3">
            <CurrencyStat
              active={selectedCurrency === 'green'}
              color="#41E3FF" dim="rgba(65,227,255,0.4)" glow="rgba(65,227,255,0.55)"
              label="SC" value={greenCoins} icon="💠"
            />
            <DailyBonusChip onClick={onDailyBonus} />
          </div>
        </div>
      </div>

      {/* Free spins badge */}
      <FreeSpinsDisplay freeSpins={freeSpins} />

      {/* Idle ambiance: drifting medallions behind the cabinet body */}
      <IdleAmbiance />

      {/* Scrolling marquee - thematic legal disclaimer (hidden on mobile to save ~30px; visible on tablet+; hidden in fullscreen) */}
      <div className="hidden sm:block overflow-hidden sm-top-marquee" style={{
        background: "linear-gradient(90deg, #07030f, #1c0b33, #07030f)",
        border: "1px solid rgba(168,85,247,0.35)",
        borderRadius: "0.5rem",
        padding: "4px 8px",
        marginTop: "6px",
      }}>
        <div className="marquee-text text-xs font-numbers px-2" style={{ color: "#C8860A", fontSize: "0.6rem" }}>
          ◆ FREE SWEEPSTAKES GAME — NO PURCHASE NECESSARY ◆ MATCH 3+ SYMBOLS TO WIN ◆ 👑 CROWN P WILD SUBSTITUTES ALL ◆ 🏴‍☠️ 3 TREASURE CHESTS = BONUS ROUND ◆ 💎 3 DIAMOND CROWNS = 10 FREE SPINS ◆ 💎 5 DIAMOND CROWNS = JACKPOT ◆ 🌃 TOP OF THE GAME PAYS UP TO 606X ◆ 🎤 THE CITY NEVER SLEEPS — NEITHER DO THE REELS ◆
        </div>
      </div>
    </div>
  );
}

function LEDDisplay({ label, value, color = "#FFD700", labelColor = "rgba(212,175,55,0.6)", animated = false, animatedValue = 0 }: { 
  label: string; 
  value: number; 
  color?: string; 
  labelColor?: string; 
  animated?: boolean;
  animatedValue?: number;
}) {
  const displayValue = animated && animatedValue > 0 ? animatedValue : value;
  
  return (
    <div className="relative" style={{
      background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
      border: "2px solid #333",
      borderRadius: "8px",
      padding: "clamp(4px, 1.2vw, 8px) clamp(6px, 1.8vw, 12px)",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)",
      minWidth: 0,
    }}>
      <div className="text-[0.55rem] font-numbers uppercase tracking-widest mb-0.5 sm:mb-1" style={{ color: labelColor }}>
        {label}
      </div>
      <div
        className="font-numbers tabular-nums text-center"
        style={{
          fontSize: "clamp(0.95rem, 3.2vw, 2rem)",
          color,
          textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
          fontFamily: '"Orbitron", "Share Tech Mono", monospace',
          letterSpacing: "0.05em",
        }}
      >
        {displayValue.toLocaleString()}
      </div>
      {/* LED glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at center, ${color}20 0%, transparent 70%)`,
        borderRadius: "6px",
        opacity: animated ? 1 : 0.3,
        animation: animated ? "ledPulse 1s ease-in-out infinite alternate" : "none",
      }} />
    </div>
  );
}

function CabinetJackpotMeters({ jackpotPool = 5000 }: { jackpotPool?: number }) {
  const tiers = [
    { name: "GRAND", value: jackpotPool, color: "#FFD700", bg: "linear-gradient(180deg, #3a2a00, #1a1500)" },
    { name: "MAJOR", value: Math.floor(jackpotPool * 0.4), color: "#FFA500", bg: "linear-gradient(180deg, #3a2000, #1a1000)" },
    { name: "MINOR", value: Math.floor(jackpotPool * 0.15), color: "#FF6B35", bg: "linear-gradient(180deg, #3a1500, #1a0a00)" },
    { name: "MINI", value: Math.floor(jackpotPool * 0.05), color: "#FFD700", bg: "linear-gradient(180deg, #2a2a00, #151500)" },
  ];

  return (
    <div className="w-full grid grid-cols-4 gap-2 mb-2">
      {tiers.map((tier, i) => (
        <div 
          key={tier.name}
          className="relative rounded"
          style={{
            background: tier.bg,
            border: `2px solid ${tier.color}`,
            borderRadius: "8px",
            padding: "8px 4px",
            boxShadow: `0 0 20px ${tier.color}40, inset 0 0 20px rgba(0,0,0,0.5)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Tier name */}
          <div className="font-numbers text-[0.55rem] uppercase tracking-widest text-center mb-1" style={{ color: tier.color }}>
            {tier.name}
          </div>
          {/* Amount */}
          <div className="font-numbers tabular-nums text-center" style={{ 
            fontSize: "clamp(0.85rem, 3vw, 1.2rem)",
            color: tier.color,
            textShadow: `0 0 8px ${tier.color}`,
            fontFamily: '"Orbitron", monospace',
          }}>
            {tier.value.toLocaleString()}
          </div>
          {/* Glow accent */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{
            background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
            opacity: 0.6,
          }} />
        </div>
      ))}
    </div>
  );
}

function GameInfoPanel({ freeSpins }: { freeSpins: number }) {
  const infoLines = [
    "👑 CROWN P WILD substitutes all except scatters",
    "💎 3 DIAMOND CROWNS = 10 FREE SPINS",
    "💎 5 DIAMOND CROWNS = JACKPOT",
    "🏴‍☠️ 3+ TREASURE CHESTS = BONUS ROUND",
    "🔥 CASCADING WINS multiply up to 5x!",
  ];

  return (
    <div className="w-full" style={{ marginTop: "8px" }}>
      <div className="overflow-hidden" style={{
        background: "linear-gradient(90deg, #1a1000, #0a0500, #1a1000)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: "6px",
        padding: "6px 12px",
      }}>
        <div className="marquee-text text-xs font-numbers" style={{ color: "#C8860A", fontSize: "0.6rem", fontWeight: 500 }}>
          {infoLines.join("  ◆  ")}
        </div>
      </div>
    </div>
  );
}

// Physics-based spinning reel strip with elastic slam stop.
// Phases: 200ms accel ramp → ~900-1400ms cruise at target velocity with
// sin-wave organic jitter → spring decel back to targetY with overshoot.
// Total visible motion is ~1.4-1.6s per reel (staggered by reelIndex).
function ReelStrip({ symbols, spinning, done, size = 80, reelIndex = 0 }: { symbols: SymbolId[]; spinning: boolean; done: boolean; size?: number; reelIndex?: number }) {
  const [translateY, setTranslateY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [animFrame, setAnimFrame] = useState<number | null>(null);
  const [stripSymbols, setStripSymbols] = useState<SymbolId[]>(() => {
    return Array.from({ length: 20 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id);
  });

  useEffect(() => {
    if (spinning && !done) {
      const startTime = Date.now();
      // Velocity tuned to size — bigger reels scroll faster for the same
      // visual cadence, so the user can clearly see the strip moving.
      // size=80 → targetVelocity = 2400 px/s = 40 px/frame at 60fps.
      const targetVelocity = size * 30;
      // Quick accel: hit cruise velocity in 12 frames (~200ms).
      const acceleration = targetVelocity / 12;

      let currentVelocity = 0;
      let currentY = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const frameId = requestAnimationFrame(animate);
        setAnimFrame(frameId);

        if (elapsed < 200) {
          // Acceleration ramp
          currentVelocity = Math.min(currentVelocity + acceleration, targetVelocity);
        } else {
          // Cruise with organic variation so the strip doesn't look
          // mechanically uniform. Each reel gets a phase offset so they
          // don't all jitter in sync.
          const phase = reelIndex * 0.7;
          const jitter = Math.sin(elapsed * 0.012 + phase) * 60;
          currentVelocity = targetVelocity + jitter;
        }

        currentY += currentVelocity / 60;
        setTranslateY(currentY);
        setVelocity(currentVelocity);
      };

      const frameId = requestAnimationFrame(animate);
      setAnimFrame(frameId);

      return () => { if (frameId) cancelAnimationFrame(frameId); };
    } else if (done && spinning === false) {
      const targetIndex = 10;
      const symbolHeight = size;
      const targetY = -targetIndex * symbolHeight;

      let currentY = translateY;
      let currentV = velocity > 0 ? velocity : -targetY * 0.03;

      // Track if we've fired the slam event (only once per stop)
      let slamFired = false;
      // Track if we've triggered the sticky-lock for winning symbols
      let stickyLockFired = false;

      const animateStop = () => {
        // Spring constants tuned for a HEAVY SLAM with overshoot + stick.
        // Higher stiffness = harder snap-back; lower damping = more bounce cycles.
        // These values create a "thunk... boing... stick" feel like Vegas cabinets.
        const stiffness = 0.18;   // was 0.10 — snaps harder
        const damping = 0.08;     // was 0.14 — more oscillation before settle
        const displacement = currentY - targetY;

        const acceleration = -stiffness * displacement - damping * currentV;
        currentV += acceleration;
        currentY += currentV / 60;

        const settled = Math.abs(displacement) < 0.3 && Math.abs(currentV) < 0.3;

        setTranslateY(currentY);
        setVelocity(currentV);

        // Fire the "reel-slam" event on first crossing of targetY (the impact moment)
        // This is when the symbols physically HIT the payline — the "thunk".
        if (!slamFired && displacement <= 0 && currentV < 0) {
          slamFired = true;
          window.dispatchEvent(new CustomEvent('reel-slam', { detail: { reelIndex, impact: true } }));
        }

        // Fire sticky-lock for winning/bonus symbols after the main slam settles
        // This triggers the "symbol locks into place" animation
        if (!stickyLockFired && settled) {
          stickyLockFired = true;
          window.dispatchEvent(new CustomEvent('reel-sticky-lock', { detail: { reelIndex } }));
        }

        if (!settled) {
          const frameId = requestAnimationFrame(animateStop);
          setAnimFrame(frameId);
        } else {
          setTranslateY(targetY);
          setVelocity(0);
          if (!slamFired) {
            window.dispatchEvent(new CustomEvent('reel-slam', { detail: { reelIndex, impact: true } }));
          }
        }
      };

      const frameId = requestAnimationFrame(animateStop);
      setAnimFrame(frameId);

      return () => { if (frameId) cancelAnimationFrame(frameId); };
    }
  }, [spinning, done, size, translateY, velocity, reelIndex]);

  if (done && !spinning) {
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {symbols.map((symId, i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <SymbolIcon symbolId={symId} size={Math.floor(size * 0.9)} />
          </div>
        ))}
      </div>
    );
  }

  if (spinning) {
    const startIdx = Math.max(0, Math.floor(-translateY / size));
    const visibleCount = Math.ceil(360 / size) + 4;

    // Normalized speed factor: 0 = stopped, 1 = at cruise velocity.
    const speedFactor = Math.min(Math.abs(velocity) / (size * 22), 1);

    return (
      <div
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{
          transform: `translateY(${translateY}px)`,
          // Top + bottom band darken deepens with speed — when cruising
          // at full speed the symbols at the edges melt into darkness,
          // creating the classic "spinning reel slot" look.
          WebkitMaskImage: `linear-gradient(180deg, rgba(0,0,0,${0.2 + speedFactor * 0.3}) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,${0.2 + speedFactor * 0.3}) 100%)`,
          maskImage: `linear-gradient(180deg, rgba(0,0,0,${0.2 + speedFactor * 0.3}) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,${0.2 + speedFactor * 0.3}) 100%)`,
        }}
      >
        {Array.from({ length: visibleCount }, (_, i) => {
          const idx = (startIdx + i) % stripSymbols.length;
          const symId = stripSymbols[idx];
          const sym = getSymbol(symId);
          // Velocity-dependent blur: at cruise speed symbols smear into
          // vertical streaks (up to 12px). Maximum blur ALSO increases
          // with reel size — bigger reels need more blur to read as motion.
          const blur = speedFactor * Math.min(size * 0.18, 14);
          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center"
              style={{
                filter: `blur(${blur.toFixed(2)}px)`,
                opacity: Math.max(0.25, 1 - blur * 0.06),
              }}
            >
              <div style={{ aspectRatio: "1", width: "min(100%, 88%)", maxHeight: "88%" }}>
                <SymbolIcon symbolId={sym.id} fill />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function ReelWindow({ reels, spinning, reelDone, winLines, showWin, cascadeActive, cascadeWinningCells, cascadeAnimatingCells, cascadeGrid, stickyWildCells, wildLockAnimating, nearMissCells, nearMissAnimating, scatterSlowdownActive, lastWinType, scatterFanfareActive, symbolLockAnimating, displayGrid }: any) {

  return (
    <div className="sm-reel-frame relative" style={{
      // Dark reel vault with gold + neon purple edging (Pirate's Gold theme).
      background: "linear-gradient(180deg, #07030f 0%, #0c0618 50%, #07030f 100%)",
      border: "3px solid #241239",
      borderRadius: "10px",
      boxShadow: `
        inset 0 0 60px rgba(0,0,0,0.9),
        inset 0 0 0 1px rgba(212,175,55,0.5),
        inset 0 0 0 4px rgba(124,58,237,0.45),
        inset 0 0 0 5px rgba(212,175,55,0.4),
        0 0 22px rgba(168,85,247,0.35),
        0 0 44px rgba(212,175,55,0.18)
      `,
      padding: "10px",
      position: "relative",
    }}>
      {/* (chrome pillars removed — they were a Starburst reference
          experiment but their 6-col grid math didn't align with the
          cabinet-rim's actual 5-col grid + 4px gap layout, so they
          sat 89px to the left of where the reel boundaries are.
          Cleaner without them — the rim's double-keyline + glow
          already frames each reel cell.) */}
      {/* Gold corner ornaments — top-left */}
      <div className="absolute -top-1 -left-1 w-6 h-6 pointer-events-none" style={{
        background: "radial-gradient(circle, #FFD700 0%, #8B6914 60%, transparent 100%)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
        zIndex: 5,
      }} />
      {/* top-right */}
      <div className="absolute -top-1 -right-1 w-6 h-6 pointer-events-none" style={{
        background: "radial-gradient(circle, #FFD700 0%, #8B6914 60%, transparent 100%)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
        zIndex: 5,
      }} />
      {/* bottom-left */}
      <div className="absolute -bottom-1 -left-1 w-6 h-6 pointer-events-none" style={{
        background: "radial-gradient(circle, #FFD700 0%, #8B6914 60%, transparent 100%)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
        zIndex: 5,
      }} />
      {/* bottom-right */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 pointer-events-none" style={{
        background: "radial-gradient(circle, #FFD700 0%, #8B6914 60%, transparent 100%)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
        zIndex: 5,
      }} />
      {/* Reel glass bezel - inner glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        border: "2px solid rgba(212,175,55,0.15)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 40px rgba(212,175,55,0.05)",
      }} />

      {/* Payline indicator columns — Starburst-style numbered circles flanking the reels (desktop only; too tight on phones) */}
      <div className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-7 flex-col gap-1.5 z-10 py-2 px-1 rounded" style={{
        background: "linear-gradient(180deg, rgba(20,10,5,0.6), rgba(40,20,10,0.6))",
        border: "1px solid rgba(212,175,55,0.3)",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.15)",
      }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="w-4 h-4 rounded-full flex items-center justify-center font-numbers"
            style={{
              fontSize: "0.55rem",
              fontWeight: 800,
              background: "linear-gradient(180deg, #1a1005, #050510)",
              border: "1px solid rgba(212,175,55,0.5)",
              color: "#FFD700",
              boxShadow: "0 0 4px rgba(212,175,55,0.4), inset 0 0 2px rgba(255,215,0,0.3)",
              animation: `paylinePulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-7 flex-col gap-1.5 z-10 py-2 px-1 rounded" style={{
        background: "linear-gradient(180deg, rgba(20,10,5,0.6), rgba(40,20,10,0.6))",
        border: "1px solid rgba(212,175,55,0.3)",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.15)",
      }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="w-4 h-4 rounded-full flex items-center justify-center font-numbers"
            style={{
              fontSize: "0.55rem",
              fontWeight: 800,
              background: "linear-gradient(180deg, #1a1005, #050510)",
              border: "1px solid rgba(212,175,55,0.5)",
              color: "#FFD700",
              boxShadow: "0 0 4px rgba(212,175,55,0.4), inset 0 0 2px rgba(255,215,0,0.3)",
              animation: `paylinePulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Scatter fanfare overlay */}
      {scatterFanfareActive && (
        <div
          className="absolute inset-0 pointer-events-none z-25 rounded"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,107,107,0.2) 0%, transparent 60%)",
            animation: "scatterFanfare 0.5s ease-out",
            borderRadius: "4px",
          }}
        />
      )}

      {/* Reels — wrapped in cabinet-rim (CSS provides grid + gap, plus
          the gold gradient rim via ::before). flex-grow so the grid
          expands to fill cabinet space, not fixed 200px. */}
      <div className="cabinet-rim sm-reel-grid relative" style={{ minHeight: "280px", flex: "1 1 auto" }}>
        {displayGrid.map((reel: SymbolId[], reelIdx: number) => (
          <div
            key={reelIdx}
            className={`reel-container relative ${scatterSlowdownActive && reelIdx >= 2 && reelIdx <= 4 ? 'scatter-anticipation' : ''} ${scatterSlowdownActive && reelIdx === 2 ? 'scatter-slowdown-reel' : ''} ${wildLockAnimating && stickyWildCells.has(`${reelIdx}-${getPaylinePath(0)[reelIdx]}`) ? 'wild-lock-shake' : ''}`}
            style={{
              minHeight: "280px",
              height: "100%",
              transition: "box-shadow 0.3s ease",
              boxShadow: reelDone[reelIdx] && showWin && !cascadeActive && reel.some((_, rowIdx) => isWinningCell(reelIdx, rowIdx, winLines))
                ? "0 0 30px rgba(255,215,0,0.7), inset 0 0 20px rgba(255,215,0,0.15)"
                : "inset 0 0 28px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,220,160,0.18), 0 0 18px rgba(212,175,55,0.35)",
            }}
          >
            {/* Reel frame highlight when stopped with win */}
            {reelDone[reelIdx] && showWin && !cascadeActive && reel.some((_, rowIdx) => isWinningCell(reelIdx, rowIdx, winLines)) && (
              <div className="absolute inset-0 pointer-events-none" style={{
                border: "2px solid #FFD700",
                borderRadius: "4px",
                boxShadow: "0 0 20px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.2)",
                animation: "reelWinGlow 1s ease-in-out infinite alternate",
              }} />
            )}

            {/* SPINNING STREAK OVERLAY — only visible while this reel is
                actually spinning. Multi-position bright bands scroll
                upward, giving an unmistakable visual cue that the strip
                is in motion. The bands progress across the reel tile
                and the top/bottom masks fade them into the bezel. */}
            {spinning && !reelDone[reelIdx] && (
                <div
                  className="absolute inset-0 pointer-events-none z-[7]"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,0.05) 94%, rgba(0,0,0,0.32) 100%)",
                  }}
                />
            )}
            {spinning && !reelDone[reelIdx] && (
                <div
                  className="absolute inset-0 pointer-events-none z-[8] overflow-hidden"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, transparent 25%, rgba(255,235,180,0.55) 26%, rgba(255,255,255,0.95) 27%, rgba(255,235,180,0.55) 28%, transparent 29%, transparent 54%, rgba(212,175,55,0.55) 55%, rgba(255,255,255,0.95) 56%, rgba(212,175,55,0.55) 57%, transparent 58%, transparent 80%, rgba(255,255,255,0.55) 81%, rgba(255,235,180,0.95) 82%, rgba(255,255,255,0.55) 83%, transparent 84%)",
                    backgroundSize: "100% 280px",
                    animation: "spinStreaks 0.45s linear infinite",
                  }}
                />
            )}

            {/* Spinning blur overlay */}
            <ReelStrip symbols={reel} spinning={spinning} done={reelDone[reelIdx]} reelIndex={reelIdx} />

            {/* Symbols */}
            {reel.map((symId: SymbolId, rowIdx: number) => {
                          const isWin = showWin && !cascadeActive && isWinningCell(reelIdx, rowIdx, winLines);
                          const isCascadeWinner = cascadeWinningCells.has(`${reelIdx}-${rowIdx}`);
                          const isCascadeAnimating = cascadeAnimatingCells.has(`${reelIdx}-${rowIdx}`);
                          const isStickyWild = stickyWildCells.has(`${reelIdx}-${rowIdx}`);
                          const isNearMiss = nearMissCells.has(`${reelIdx}-${rowIdx}`);
                          const isSymbolLock = symbolLockAnimating.has(`${reelIdx}-${rowIdx}`);
                          const sym = getSymbol(symId);

                          return (
                            <div
                              key={rowIdx}
                              className={`  
                                symbol-tile flex items-center justify-center transition-all duration-300 
                                ${isWin ? "cell-win-glow symbol-win" : ""}
                                ${isCascadeWinner ? "cascade-disappear" : ""}
                                ${isCascadeAnimating && !isCascadeWinner ? "cascade-fall" : ""}
                                ${isStickyWild && wildLockAnimating ? "sticky-wild-lock" : ""}
                                ${isStickyWild && !wildLockAnimating ? "sticky-wild-glow" : ""}
                                ${isNearMiss && nearMissAnimating ? "near-miss-gold" : ""}
                                ${isSymbolLock ? "symbol-lock-slam" : ""}
                                ${symId === 'empty' ? "empty-cell" : ""}
                              : ""}
                              `}
                              style={{
                                flex: "1 1 0%",
                                minHeight: 0,
                                background: isWin
                                  ? `radial-gradient(circle at center, ${sym.bgColor}ff 0%, #14081c 100%)`
                                  : isCascadeWinner
                                  ? `radial-gradient(circle at center, ${sym.bgColor}66 0%, #14081c 100%)`
                                  : `radial-gradient(circle at center, ${sym.bgColor}66 0%, #14081c 100%)`,
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                  {isWin && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle, ${sym.color}30, transparent 70%)`,
                        animation: "winCellPulse 0.8s ease-in-out infinite alternate",
                      }}
                    />
                  )}
                  {isStickyWild && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "radial-gradient(circle, rgba(76,175,80,0.4), transparent 70%)",
                        animation: "stickyWildPulse 0.8s ease-in-out infinite",
                      }}
                    />
                  )}
                  {isNearMiss && nearMissAnimating && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "radial-gradient(circle, rgba(255,215,0,0.5), transparent 70%)",
                      }}
                    />
                  )}
                  {symId !== 'empty' && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ padding: "5%", zIndex: 1, pointerEvents: "none" }}
                    >
                      <div style={{ aspectRatio: "1", width: "min(100%, 88%)", maxHeight: "88%" }}>
                        <SymbolIcon
                          symbolId={symId}
                          fill
                          className={`${isWin ? 'symbol-win-pop symbol-bounce' : ''}`}
                          style={{
                            filter: isWin ? "brightness(1.3) drop-shadow(0 0 8px #FFD700)" : "none",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Ambient neon payline rays — one gold, one purple, cutting diagonally
          across the reels like the Pirate's Gold key art. Subtle screen-blend
          glow; real win lines still paint over this via WinLineHighlight. */}
      <svg
        className="absolute inset-0 pointer-events-none neon-rays"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 6, mixBlendMode: "screen" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rayGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rayPurple" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B026FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#B026FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B026FF" stopOpacity="0" />
          </linearGradient>
          <filter id="rayGlow" x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <line x1="-2" y1="24" x2="102" y2="62" stroke="url(#rayGold)" strokeWidth="1.3" filter="url(#rayGlow)" />
        <line x1="-2" y1="78" x2="102" y2="22" stroke="url(#rayPurple)" strokeWidth="1.1" filter="url(#rayGlow)" />
      </svg>

      {/* Win line highlight overlay */}
      <WinLineHighlight winLines={winLines} show={showWin && !cascadeActive} />
      
      {/* Payline highlights for each winning line */}
      {(winLines as WinLine[] | undefined)?.map((line: WinLine, idx: number) => (
        <PaylineHighlight key={idx} paylineIndex={line.row} isActive={true} reelCount={5} rowCount={3} />
      ))}

      {/* Idle animations */}
      <IdleAnimations spinning={spinning} lastSpinTime={Date.now()} />
    </div>
  );
}

// ─── Desktop side-panel chrome (Pirate's Gold fullscreen layout) ─────────────

function NeonSwitch({ on, onToggle, disabled = false, ariaLabel }: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      className="relative block transition-transform active:scale-95"
      style={{
        width: 46, height: 24, borderRadius: 999,
        background: on ? "linear-gradient(180deg, #7c3aed, #a855f7)" : "#1c1030",
        border: `2px solid ${on ? "#c084fc" : "rgba(124,58,237,0.55)"}`,
        boxShadow: on ? "0 0 14px rgba(168,85,247,0.8)" : "inset 0 2px 4px rgba(0,0,0,0.6)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: 16, height: 16, top: 2,
          left: on ? 24 : 2,
          background: on ? "#ffffff" : "#a78bfa",
          boxShadow: "0 1px 3px rgba(0,0,0,0.6)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-xl px-3 py-3"
      style={{
        background: "linear-gradient(180deg, rgba(24,11,44,0.92) 0%, rgba(8,4,18,0.95) 100%)",
        border: "1.5px solid rgba(168,85,247,0.4)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(192,132,252,0.18)",
      }}
    >
      {children}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-numbers uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.16em", color: "rgba(233,213,255,0.7)", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function DesktopLeftPanel({ soundMuted, setSoundMuted, level, xp, xpToNext, onCashOut }: any) {
  const [, setLocation] = useLocation();
  const openPaytable = () => {
    const btn = document.querySelector("[data-paytable-toggle]");
    if (btn) (btn as HTMLButtonElement).click();
  };
  const pct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpToNext)) * 100)));
  return (
    <aside className="sm-side-panel hidden lg:flex flex-col gap-3 shrink-0 select-none" style={{ width: 208 }}>
      {/* PAYTABLE */}
      <PanelCard>
        <button
          onClick={() => { playSound("button_click"); openPaytable(); }}
          className="w-full flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          aria-label="Open paytable"
        >
          <span style={{ fontSize: "1.6rem", lineHeight: 1, filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }}>📜</span>
          <span className="font-numbers font-bold uppercase" style={{ fontSize: "0.8rem", letterSpacing: "0.18em", color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.5)" }}>
            PAYTABLE
          </span>
        </button>
      </PanelCard>

      {/* SOUND */}
      <PanelCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.2rem" }}>{soundMuted ? "🔇" : "🔊"}</span>
            <span className="font-numbers uppercase font-bold" style={{ fontSize: "0.75rem", letterSpacing: "0.12em", color: "#E9D5FF" }}>SOUND</span>
          </div>
          <NeonSwitch on={!soundMuted} onToggle={() => setSoundMuted(!soundMuted)} ariaLabel={soundMuted ? "Unmute sound" : "Mute sound"} />
        </div>
      </PanelCard>

      {/* RESPONSIBLE PLAY */}
      <PanelCard>
        <button
          onClick={() => setLocation("/terms")}
          className="w-full flex items-center gap-2 transition-transform active:scale-95"
        >
          <span style={{ fontSize: "1.2rem" }}>🛡️</span>
          <span className="font-numbers uppercase font-bold text-left leading-tight" style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#E9D5FF" }}>
            RESPONSIBLE<br />PLAY
          </span>
        </button>
      </PanelCard>

      {/* VIP STATUS */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: "1.2rem", filter: "drop-shadow(0 0 6px rgba(255,215,0,0.7))" }}>⭐</span>
          <span className="font-numbers uppercase font-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "#FFD700" }}>VIP STATUS</span>
        </div>
        <div className="font-display font-black uppercase" style={{ fontSize: "0.85rem", color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.5)" }}>
          GOLD TIER
        </div>
        <div className="font-numbers" style={{ fontSize: "0.6rem", color: "rgba(233,213,255,0.6)" }}>LEVEL {level}</div>
        {/* Gold progress bar */}
        <div className="w-full rounded-full mt-1.5" style={{ height: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(212,175,55,0.5)", overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #8B5E0A, #FFD700, #FFE9A8)",
              boxShadow: "0 0 8px rgba(255,215,0,0.7)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div className="font-numbers tabular-nums text-right mt-1" style={{ fontSize: "0.65rem", color: "#FFE9A8" }}>
          {xp.toLocaleString()} / {xpToNext.toLocaleString()}
        </div>
      </PanelCard>

      {/* CASH OUT (desktop entry point — mobile uses the bottom MENU tray) */}
      {onCashOut && (
        <PanelCard>
          <button
            onClick={() => { playSound("button_click"); onCashOut(); }}
            className="w-full flex items-center gap-2 transition-transform active:scale-95"
          >
            <span style={{ fontSize: "1.2rem", filter: "drop-shadow(0 0 6px rgba(65,227,255,0.6))" }}>💸</span>
            <span className="font-numbers uppercase font-bold" style={{ fontSize: "0.75rem", letterSpacing: "0.12em", color: "#41E3FF" }}>
              CASH OUT
            </span>
          </button>
        </PanelCard>
      )}
    </aside>
  );
}

function DesktopRightPanel({ winAmount, curLabel, autoplay, setAutoplay, spinning, freeSpins }: any) {
  return (
    <aside className="sm-side-panel hidden lg:flex flex-col gap-3 shrink-0 select-none" style={{ width: 208 }}>
      {/* LAST WIN */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: "1.3rem", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }}>🪙</span>
          <PanelLabel>LAST WIN</PanelLabel>
        </div>
        <div className="font-numbers tabular-nums font-black" style={{ fontSize: "1.5rem", lineHeight: 1.1, color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" }}>
          {winAmount.toLocaleString()} <span style={{ fontSize: "0.7em" }}>{curLabel}</span>
        </div>
      </PanelCard>

      {/* AUTO-SPIN */}
      <PanelCard>
        <div className="flex items-center justify-between">
          <PanelLabel>AUTO-SPIN</PanelLabel>
          <span className="font-numbers font-bold" style={{ fontSize: "0.7rem", color: autoplay ? "#c084fc" : "rgba(233,213,255,0.5)" }}>
            {autoplay ? "ON" : "OFF"}
          </span>
        </div>
        <div className="flex justify-center mt-1">
          <NeonSwitch on={autoplay} onToggle={() => setAutoplay(!autoplay)} disabled={spinning} ariaLabel={autoplay ? "Disable auto spin" : "Enable auto spin"} />
        </div>
      </PanelCard>

      {/* FREE SPINS */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: "1.3rem", filter: freeSpins > 0 ? "drop-shadow(0 0 8px rgba(144,238,144,0.8))" : "none" }}>☸️</span>
          <PanelLabel>FREE SPINS</PanelLabel>
        </div>
        <div className="font-numbers tabular-nums font-black" style={{ fontSize: "1.5rem", lineHeight: 1.1, color: freeSpins > 0 ? "#90EE90" : "#E9D5FF", textShadow: freeSpins > 0 ? "0 0 12px rgba(144,238,144,0.6)" : "none" }}>
          {freeSpins} <span style={{ fontSize: "0.6em", color: "rgba(233,213,255,0.55)" }}>/ 10</span>
        </div>
      </PanelCard>
    </aside>
  );
}

/** The big circular SPIN orb — purple neon ring + gold center disc. */
function SpinOrb({ size = 88, canSpin, freeSpins, spinning, spin, pulse }: any) {
  const disc = Math.round(size * 0.66);
  const big = size >= 100;
  return (
    <div className="flex flex-col items-center -mt-1 shrink-0">
      <button
        onClick={() => { playSound("button_click"); spin(); }}
        disabled={!canSpin}
        aria-label={freeSpins > 0 ? "Spin free game" : "Spin reels"}
        aria-keyshortcuts="Space"
        className="relative flex items-center justify-center transition-transform active:scale-95"
        style={{
          width: size, height: size, borderRadius: "50%",
          border: `${big ? 4 : 3}px solid ${freeSpins > 0 ? "#90EE90" : "#b026ff"}`,
          background: "radial-gradient(circle at 35% 28%, #2b1145 0%, #160827 60%, #0a0514 100%)",
          boxShadow: freeSpins > 0
            ? "0 0 22px rgba(76,175,80,0.8), 0 0 54px rgba(76,175,80,0.45), inset 0 0 18px rgba(144,238,144,0.25)"
            : "0 0 22px rgba(176,38,255,0.75), 0 0 54px rgba(124,58,237,0.45), inset 0 0 18px rgba(168,85,247,0.3)",
          animation: freeSpins > 0
            ? "freeSpinRingPulse 1s ease-in-out infinite"
            : pulse ? "spinRingPulse 1.6s ease-in-out infinite" : "none",
          opacity: canSpin ? 1 : 0.45,
          transition: "transform 0.1s ease",
        }}
      >
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: disc, height: disc,
            background: "radial-gradient(circle at 35% 28%, #ffe9a8 0%, #FFD700 38%, #C8860A 78%, #7a5800 100%)",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: big ? "2.1rem" : "1.7rem",
              color: "#2a1a00",
              textShadow: "0 1px 0 rgba(255,255,255,0.4)",
              display: "inline-block",
              animation: spinning ? "spinIconRotate 0.8s linear infinite" : "none",
            }}
          >
            ⟳
          </span>
        </span>
      </button>
      <span
        className="font-display font-black uppercase"
        style={{
          marginTop: 4,
          fontSize: big ? "1.15rem" : "0.95rem",
          letterSpacing: "0.22em",
          color: freeSpins > 0 ? "#90EE90" : "#FFD700",
          textShadow: freeSpins > 0 ? "0 0 12px rgba(144,238,144,0.7)" : "0 0 10px rgba(255,215,0,0.55)",
        }}
      >
        {freeSpins > 0 ? `FREE ${freeSpins}` : "SPIN"}
      </span>
    </div>
  );
}

function CabinetButtonPanel({
  bet, setBet, paylines, setPaylines, spin, autoplay, setAutoplay,
  canSpin, totalBet, coins, onCoinShop, soundEnabled, setSoundMuted, soundMuted,
  spinButtonPulse, shakeIntensity, selectedCurrency, spinning, freeSpins, rescueOffered,
  winAmount = 0,
}: any) {
  const curLabel = selectedCurrency === "green" ? "SC" : "GC";
  // The paytable drawer lives one level up — open it via its toggle.
  const openPaytable = () => {
    const btn = document.querySelector("[data-paytable-toggle]");
    if (btn) (btn as HTMLButtonElement).click();
  };
  return (
    <div className="w-full" style={{
      background: "linear-gradient(180deg, #0d0716 0%, #070310 100%)",
      borderRadius: "0 0 16px 16px",
      padding: "12px 0 10px",
      borderTop: "1px solid rgba(168,85,247,0.45)",
      boxShadow: "0 -6px 24px rgba(124,58,237,0.22), inset 0 1px 0 rgba(192,132,252,0.2)",
    }}>
      {/* Mobile control rows (phones/tablets) */}
      <div className="lg:hidden">
      {/* Row A — PAYTABLE | BET stepper | AUTO switch (Pirate's Gold control strip) */}
      <div className="flex items-center justify-between gap-2 px-3 mb-2">
        {/* Paytable (open book) */}
        <button
          onClick={() => { playSound("button_click"); openPaytable(); }}
          aria-label="Open paytable"
          className="flex flex-col items-center gap-0.5 shrink-0 transition-transform active:scale-95"
        >
          <span
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 42, height: 42, fontSize: "1.2rem",
              background: "linear-gradient(180deg, #3a2a00, #1a1200)",
              border: "2px solid #D4AF37",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            📖
          </span>
          <span className="font-numbers uppercase" style={{ fontSize: "0.48rem", letterSpacing: "0.14em", color: "rgba(255,220,160,0.75)" }}>
            PAYTABLE
          </span>
        </button>

        {/* Bet stepper */}
        <div
          className="flex items-center gap-1 rounded-full px-1.5 py-1"
          style={{ background: "rgba(0,0,0,0.5)", border: "1.5px solid rgba(212,175,55,0.4)" }}
        >
          <button
            onClick={() => { playSound("button_click"); setBet(Math.max(10, bet - 10)); }}
            disabled={spinning || bet <= 10}
            aria-label="Decrease bet"
            className="rounded-full font-bold transition-transform active:scale-95"
            style={{
              width: 34, height: 34, fontSize: "1.1rem", lineHeight: 1,
              background: "linear-gradient(180deg, #D4AF37, #8B5E0A)",
              color: "#1a1000",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)",
              opacity: spinning || bet <= 10 ? 0.45 : 1,
            }}
          >
            −
          </button>
          <div className="text-center px-1" style={{ minWidth: 62 }}>
            <div className="font-numbers uppercase" style={{ fontSize: "0.48rem", letterSpacing: "0.16em", color: "rgba(212,175,55,0.65)" }}>
              BET
            </div>
            <div className="font-numbers tabular-nums font-bold" style={{ fontSize: "0.95rem", lineHeight: 1.1, color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.6)" }}>
              {bet} <span style={{ fontSize: "0.62em", color: selectedCurrency === 'green' ? "#41E3FF" : "#C9A227" }}>{curLabel}</span>
            </div>
          </div>
          <button
            onClick={() => { playSound("button_click"); setBet(Math.min(200, bet + 10)); }}
            disabled={spinning || bet >= 200}
            aria-label="Increase bet"
            className="rounded-full font-bold transition-transform active:scale-95"
            style={{
              width: 34, height: 34, fontSize: "1.1rem", lineHeight: 1,
              background: "linear-gradient(180deg, #D4AF37, #8B5E0A)",
              color: "#1a1000",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)",
              opacity: spinning || bet >= 200 ? 0.45 : 1,
            }}
          >
            +
          </button>
        </div>

        {/* Auto-spin switch (purple) */}
        <button
          onClick={() => setAutoplay(!autoplay)}
          disabled={spinning}
          role="switch"
          aria-checked={autoplay}
          aria-label={autoplay ? "Disable auto spin" : "Enable auto spin"}
          className="flex flex-col items-center gap-1 shrink-0 transition-transform active:scale-95"
          style={{ opacity: spinning ? 0.5 : 1 }}
        >
          <span className="font-numbers uppercase" style={{ fontSize: "0.48rem", letterSpacing: "0.14em", color: "rgba(192,132,252,0.85)" }}>
            AUTO
          </span>
          <span
            className="relative block"
            style={{
              width: 46, height: 24, borderRadius: 999,
              background: autoplay ? "linear-gradient(180deg, #7c3aed, #a855f7)" : "#1c1030",
              border: `2px solid ${autoplay ? "#c084fc" : "rgba(124,58,237,0.5)"}`,
              boxShadow: autoplay ? "0 0 14px rgba(168,85,247,0.8)" : "inset 0 2px 4px rgba(0,0,0,0.6)",
              transition: "all 0.2s ease",
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                width: 16, height: 16, top: 2,
                left: autoplay ? 24 : 2,
                background: autoplay ? "#ffffff" : "#a78bfa",
                boxShadow: "0 1px 3px rgba(0,0,0,0.6)",
                transition: "left 0.2s ease",
              }}
            />
          </span>
          <span className="font-numbers" style={{ fontSize: "0.5rem", color: autoplay ? "#c084fc" : "rgba(192,132,252,0.4)" }}>
            {autoplay ? "ON" : "OFF"}
          </span>
        </button>
      </div>
      </div>

      {/* Rescue spin indicator (Vegas "save the player" mechanic).
          Visible only when rescueOffered is true, i.e. player just lost
          and is running low. Shows the guaranteed half-bet return so
          they know this next spin is a 'free pass'. */}
      {rescueOffered && (
        <div
          className="w-full flex justify-center mb-2 px-2 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div
            className="font-display font-black uppercase tracking-widest select-none"
            style={{
              fontSize: "clamp(0.75rem, 2.2vw, 0.95rem)",
              color: "#FFD700",
              background: "linear-gradient(180deg, rgba(255,215,0,0.22) 0%, rgba(0,0,0,0.7) 100%)",
              border: "2px solid #FFD700",
              borderRadius: "999px",
              padding: "4px 14px",
              textShadow: "0 0 10px rgba(255,215,0,0.9)",
              boxShadow: "0 0 18px rgba(255,215,0,0.5)",
              animation: "freeSpinButtonPulse 1.2s ease-in-out infinite",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span aria-hidden="true">🎟️</span>
            <span>RESCUE SPIN — GUARANTEED {Math.floor(bet * 0.5)} RETURN!</span>
          </div>
        </div>
      )}

      <div className="lg:hidden">
      {/* Row B — LAST WIN chip | big circular SPIN | TOTAL BET + paylines */}
      <div className="flex items-center justify-between gap-2 px-3">
        {/* Last win (stacked coins) */}
        <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: 88 }} role="status" aria-live="polite">
          <span aria-hidden="true" style={{ fontSize: "1.35rem", filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }}>🪙</span>
          <span>
            <span className="block font-numbers uppercase" style={{ fontSize: "0.48rem", letterSpacing: "0.14em", color: "rgba(212,175,55,0.65)" }}>
              LAST WIN
            </span>
            <span className="block font-numbers tabular-nums font-bold" style={{ fontSize: "0.95rem", lineHeight: 1.15, color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.5)" }}>
              {winAmount.toLocaleString()} <span style={{ fontSize: "0.62em" }}>{curLabel}</span>
            </span>
          </span>
        </div>

        {/* Big circular SPIN: purple neon ring + gold center disc, label below */}
        <SpinOrb size={88} canSpin={canSpin} freeSpins={freeSpins} spinning={spinning} spin={spin} pulse={spinButtonPulse} />

        {/* Total bet + paylines stepper */}
        <div className="text-right shrink-0" style={{ minWidth: 88 }}>
          <div className="font-numbers uppercase" style={{ fontSize: "0.48rem", letterSpacing: "0.14em", color: "rgba(212,175,55,0.65)" }}>
            TOTAL BET
          </div>
          <div className="font-numbers tabular-nums font-bold" style={{
            fontSize: "1.05rem", lineHeight: 1.15,
            color: selectedCurrency === 'gold' ? "#FFD700" : "#41E3FF",
            textShadow: "0 0 10px rgba(255,215,0,0.5)",
          }}>
            {totalBet.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <button
              onClick={() => { playSound("button_click"); setPaylines?.(Math.max(1, (paylines || 1) - 1)); }}
              disabled={spinning || (paylines || 1) <= 1}
              aria-label="Fewer paylines"
              className="rounded-full font-bold transition-transform active:scale-95"
              style={{
                width: 24, height: 24, fontSize: "0.8rem", lineHeight: 1,
                border: "1.5px solid rgba(168,85,247,0.55)",
                color: "#c084fc",
                background: "rgba(0,0,0,0.5)",
                opacity: spinning || (paylines || 1) <= 1 ? 0.4 : 1,
              }}
            >
              −
            </button>
            <span className="font-numbers tabular-nums" style={{ fontSize: "0.72rem", color: "#c084fc", minWidth: 24, textAlign: "center" }}>
              {paylines || 1}L
            </span>
            <button
              onClick={() => { playSound("button_click"); setPaylines?.(Math.min(25, (paylines || 1) + 1)); }}
              disabled={spinning || (paylines || 1) >= 25}
              aria-label="More paylines"
              className="rounded-full font-bold transition-transform active:scale-95"
              style={{
                width: 24, height: 24, fontSize: "0.8rem", lineHeight: 1,
                border: "1.5px solid rgba(168,85,247,0.55)",
                color: "#c084fc",
                background: "rgba(0,0,0,0.5)",
                opacity: spinning || (paylines || 1) >= 25 ? 0.4 : 1,
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Desktop control strip (lg+): BET stepper | big SPIN orb | AUTO-SPIN + LAST WIN */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1" style={{ gap: 24 }}>
        {/* Bet stepper — large, mouse-friendly */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { playSound("button_click"); setBet(Math.max(10, bet - 10)); }}
            disabled={spinning || bet <= 10}
            aria-label="Decrease bet"
            className="rounded-full font-bold transition-transform active:scale-95"
            style={{
              width: 44, height: 44, fontSize: "1.35rem", lineHeight: 1,
              background: "linear-gradient(180deg, #D4AF37, #8B5E0A)",
              color: "#1a1000",
              boxShadow: "0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
              opacity: spinning || bet <= 10 ? 0.45 : 1,
            }}
          >
            −
          </button>
          <div className="text-center" style={{ minWidth: 118 }}>
            <div className="font-numbers uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(212,175,55,0.7)" }}>
              BET
            </div>
            <div className="font-numbers tabular-nums font-bold" style={{ fontSize: "1.3rem", lineHeight: 1.15, color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.6)" }}>
              {bet} <span style={{ fontSize: "0.6em", color: selectedCurrency === 'green' ? "#41E3FF" : "#C9A227" }}>{curLabel}</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <button
                onClick={() => { playSound("button_click"); setPaylines?.(Math.max(1, (paylines || 1) - 1)); }}
                disabled={spinning || (paylines || 1) <= 1}
                aria-label="Fewer paylines"
                className="rounded-full font-bold"
                style={{ width: 20, height: 20, fontSize: "0.7rem", lineHeight: 1, border: "1.5px solid rgba(168,85,247,0.55)", color: "#c084fc", background: "rgba(0,0,0,0.5)", opacity: spinning || (paylines || 1) <= 1 ? 0.4 : 1 }}
              >
                −
              </button>
              <span className="font-numbers tabular-nums" style={{ fontSize: "0.7rem", color: "#c084fc", minWidth: 26, textAlign: "center" }}>
                {paylines || 1}L
              </span>
              <button
                onClick={() => { playSound("button_click"); setPaylines?.(Math.min(25, (paylines || 1) + 1)); }}
                disabled={spinning || (paylines || 1) >= 25}
                aria-label="More paylines"
                className="rounded-full font-bold"
                style={{ width: 20, height: 20, fontSize: "0.7rem", lineHeight: 1, border: "1.5px solid rgba(168,85,247,0.55)", color: "#c084fc", background: "rgba(0,0,0,0.5)", opacity: spinning || (paylines || 1) >= 25 ? 0.4 : 1 }}
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => { playSound("button_click"); setBet(Math.min(200, bet + 10)); }}
            disabled={spinning || bet >= 200}
            aria-label="Increase bet"
            className="rounded-full font-bold transition-transform active:scale-95"
            style={{
              width: 44, height: 44, fontSize: "1.35rem", lineHeight: 1,
              background: "linear-gradient(180deg, #D4AF37, #8B5E0A)",
              color: "#1a1000",
              boxShadow: "0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
              opacity: spinning || bet >= 200 ? 0.45 : 1,
            }}
          >
            +
          </button>
        </div>

        {/* Big SPIN orb */}
        <SpinOrb size={112} canSpin={canSpin} freeSpins={freeSpins} spinning={spinning} spin={spin} pulse={spinButtonPulse} />

        {/* AUTO-SPIN + LAST WIN */}
        <div className="flex items-center" style={{ gap: 28 }}>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-numbers uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(233,213,255,0.75)" }}>
              AUTO-SPIN
            </span>
            <NeonSwitch on={autoplay} onToggle={() => setAutoplay(!autoplay)} disabled={spinning} ariaLabel={autoplay ? "Disable auto spin" : "Enable auto spin"} />
            <span className="font-numbers font-bold" style={{ fontSize: "0.6rem", color: autoplay ? "#c084fc" : "rgba(233,213,255,0.45)" }}>
              {autoplay ? "ON" : "OFF"}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-numbers uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.16em", color: "rgba(212,175,55,0.7)" }}>
              <span aria-hidden="true" style={{ fontSize: "0.9rem" }}>🪙</span> LAST WIN
            </div>
            <div className="font-numbers tabular-nums font-black" style={{ fontSize: "1.5rem", lineHeight: 1.1, color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" }}>
              {winAmount.toLocaleString()} <span style={{ fontSize: "0.6em" }}>{curLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop extras — coin shop + sound (mobile uses the bottom icon row) */}
      <div className="hidden sm:flex items-center justify-center gap-3 mt-3 px-2">
        <button
          onClick={onCoinShop}
          aria-label="Open coin shop"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all"
          style={{
            background: "linear-gradient(180deg, #3a2a00, #2a1a00)",
            border: "2px solid #D4AF37",
            color: "#FFD700",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>💰</span>
          <span className="font-numbers">COINS</span>
        </button>
        <button
          onClick={() => setSoundMuted(!soundMuted)}
          aria-label={soundMuted ? "Unmute sound" : "Mute sound"}
          className="w-12 h-12 rounded-xl transition-all flex items-center justify-center"
          style={{
            background: soundMuted ? "linear-gradient(180deg, #2a0000, #1a0000)" : "linear-gradient(180deg, #1c1030, #0d0716)",
            border: `2px solid ${soundMuted ? "#FF6B6B" : "#a855f7"}`,
            color: soundMuted ? "#FF6B6B" : "#c084fc",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>{soundMuted ? "🔇" : "🔊"}</span>
        </button>
      </div>

      {/* Cabinet base - bill validator / ticket printer simulation (decorative; hidden on mobile where bottom nav already provides nav chrome) */}
      <div className="hidden sm:flex w-full mt-4 items-center justify-center gap-8 px-2" style={{ opacity: 0.6 }}>
        <div className="flex items-center gap-2" style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.7rem" }}>
          <span>💵</span>
          <span className="font-numbers">BILL ACCEPTOR</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.7rem" }}>
          <span>🎫</span>
          <span className="font-numbers">TICKET OUT</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.7rem" }}>
          <span>💳</span>
          <span className="font-numbers">PLAYER CARD</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SlotMachine({
  reels,
  spinning,
  winAmount,
  winLines,
  lastWinType,
  freeSpins,
  coins,
  bet,
  setBet,
  spin,
  triggerDemoSpin,
  autoplay,
  setAutoplay,
  spinCount,
  soundEnabled,
  consecutiveWins = 0,
  maxStreak = 0,
  rescueOffered = false,
  paylines,
  setPaylines,
  onCoinShop,
  jackpotPool = 5000,
  externalShowDeals,
  externalShowScratch,
  onDealsClose,
  onScratchClose,
  onScratchWin,
  selectedCurrency = 'gold',
  stickyBonus,
  stickyBonusSpinning = false,
  goldCoins = 0,
  greenCoins = 0,
  onDailyBonus,
  onCashOut,
  level = 1,
  xp = 0,
  xpToNext = 100,
}: Props) {
  const [reelDone, setReelDone] = useState<boolean[]>([true, true, true, true, true]);
  const [showWin, setShowWin] = useState(false);
  const [winFlash, setWinFlash] = useState(false);
  const [showCoinShower, setShowCoinShower] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  // Local UI flag for the speaker icon (reflects the sound state
  // visually). The actual mute gate is audioCore.setMuted, set via
  // the setLibSoundEnabled wrapper. We sync the icon to the audio
  // library's true state on mount and after each toggle.
  const [soundMuted, setSoundMuted] = useState(() => !isSoundEnabled());
  useEffect(() => { setLibSoundEnabled(!soundMuted); }, [soundMuted]);
  const [showScratchGame, setShowScratchGame] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [lastSpinTime, setLastSpinTime] = useState(Date.now());
  const [spinButtonPulse, setSpinButtonPulse] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const prevSpinCount = useRef(spinCount);
  const prevSpinning = useRef(false);

  // Fullscreen mode — lets the cabinet occupy the whole screen with all controls visible
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── AUTO-FULLSCREEN ON ENTRY ──
  // Entering the play area should take the screen. Browsers refuse fullscreen
  // without a user gesture, so: try on mount, and if refused, arm a one-time
  // "tap/click anywhere to enter fullscreen" fallback plus the header button.
  const [needsFullscreenTap, setNeedsFullscreenTap] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || document.fullscreenElement) return;

    let cancelled = false;
    const attempt = el.requestFullscreen?.();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        if (!cancelled && !document.fullscreenElement) setNeedsFullscreenTap(true);
      });
    } else {
      setNeedsFullscreenTap(true);
    }

    const arm = () => {
      if (document.fullscreenElement) { setNeedsFullscreenTap(false); return; }
      const onGesture = () => {
        rootRef.current?.requestFullscreen?.().catch(() => {});
        setNeedsFullscreenTap(false);
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("keydown", onGesture);
      };
      window.addEventListener("pointerdown", onGesture, { once: true });
      window.addEventListener("keydown", onGesture, { once: true });
    };

    const t = setTimeout(arm, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Cascade system state
  const [cascadeActive, setCascadeActive] = useState(false);
  const [cascadeLevel, setCascadeLevel] = useState(0);
  const [cascadeGrid, setCascadeGrid] = useState<SymbolId[][] | null>(null);
  const [cascadeWinningCells, setCascadeWinningCells] = useState<Set<string>>(new Set());
  const [cascadeAnimatingCells, setCascadeAnimatingCells] = useState<Set<string>>(new Set());
  const [showCascadeMultiplier, setShowCascadeMultiplier] = useState(false);

  // Scatter anticipation state
  const [scatterSlowdownActive, setScatterSlowdownActive] = useState(false);
  const [scatterFanfareActive, setScatterFanfareActive] = useState(false);

  // Sticky wild state
  const [stickyWildCells, setStickyWildCells] = useState<Set<string>>(new Set());
  const [wildLockAnimating, setWildLockAnimating] = useState(false);

  // Near-miss state
  const [nearMissCells, setNearMissCells] = useState<Set<string>>(new Set());
  const [nearMissAnimating, setNearMissAnimating] = useState(false);

  // Sticky-lock animation for winning/bonus symbols (slam + lock)
  const [symbolLockAnimating, setSymbolLockAnimating] = useState<Set<string>>(new Set());

  // Sync external triggers
  useEffect(() => { if (externalShowDeals) setShowDealsModal(true); }, [externalShowDeals]);
  useEffect(() => { if (externalShowScratch) setShowScratchGame(true); }, [externalShowScratch]);

  // Listen for reel slam events
  useEffect(() => {
    const handleReelSlam = (event: CustomEvent<{ reelIndex: number; impact?: boolean }>) => {
      const { reelIndex, impact } = event.detail;
      if (!soundEnabled) return;

      const shakeIntensity: 'light' | 'medium' | 'heavy' = reelIndex >= 3 ? 'heavy' : reelIndex >= 2 ? 'medium' : 'light';
      setShakeIntensity(shakeIntensity);
      const shakeDuration = shakeIntensity === 'heavy' ? 400 : shakeIntensity === 'medium' ? 300 : 200;
      setTimeout(() => setShakeIntensity('none'), shakeDuration);

      // Impact thunk — the physical "thunk" when reel hits payline
      if (impact) {
        playSound("reel_stop");
      }
    };
    window.addEventListener('reel-slam', handleReelSlam as EventListener);

    // Sticky lock — winning/bonus symbols lock into place with a satisfying "ka-chunk"
    const handleStickyLock = (event: CustomEvent<{ reelIndex: number }>) => {
      const { reelIndex } = event.detail;
      if (!soundEnabled) return;

      // Find winning/bonus symbols on this reel BEFORE making any noise —
      // on a dead spin every reel fires this event, which stacked 5 heavy
      // wild_lock stacks per spin (the "horrible" churn). Silent unless
      // there is an actual winning/scatter/wild cell to lock.
      const winningKeys: string[] = [];
      // Winning payline symbols
      if (showWin && winLines.length > 0) {
        winLines.forEach(line => {
          const path = getPaylinePath(line.row);
          const rowIdx = path[reelIndex];
          if (rowIdx >= 0 && rowIdx < 3) {
            winningKeys.push(`${reelIndex}-${rowIdx}`);
          }
        });
      }
      // Scatter symbols (bonus triggers)
      if (displayGrid) {
        for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
          const symId = displayGrid[reelIndex][rowIdx];
          if (isScatterSymbol(symId) || isWildSymbol(symId)) {
            winningKeys.push(`${reelIndex}-${rowIdx}`);
          }
        }
      }
      if (winningKeys.length === 0) return;

      // Heavier shake for the lock moment
      setShakeIntensity('medium');
      setTimeout(() => setShakeIntensity('none'), 200);
      playSound("wild_lock"); // repurpose for "symbol locks in"
      // Trigger lock animation for each
      winningKeys.forEach((key, i) => {
        setTimeout(() => {
          setSymbolLockAnimating(prev => new Set(prev).add(key));
          // Auto-clear after animation
          setTimeout(() => {
            setSymbolLockAnimating(prev => { const next = new Set(prev); next.delete(key); return next; });
          }, 500);
        }, i * 60); // Stagger the locks
      });
    };
    window.addEventListener('reel-sticky-lock', handleStickyLock as EventListener);

    return () => {
      window.removeEventListener('reel-slam', handleReelSlam as EventListener);
      window.removeEventListener('reel-sticky-lock', handleStickyLock as EventListener);
    };
  }, [soundEnabled]);

  // Pulse SPIN button when idle
  useEffect(() => {
    if (!spinning && !cascadeActive) {
      const timer = setTimeout(() => setSpinButtonPulse(true), 4000);
      return () => clearTimeout(timer);
    } else {
      setSpinButtonPulse(false);
    }
  }, [spinning, cascadeActive, lastSpinTime]);

  // ─── Idle attract mode (Vegas methodology) ───────────────────────────────
  // Standard behavior of physical casino cabinets: when no one has played
  // for ~15s, run a free demo spin to attract attention. The demo spin
  // doesn't deduct bet, doesn't award coins, doesn't grant bonuses — it
  // just shows the reels spinning so a passerby sees what the machine does.
  // Any user interaction (real spin, button click, etc.) resets the timer
  // because lastSpinTime updates whenever spinning starts.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!triggerDemoSpin) return; // Older callers without this prop = no attract
    // Only run attract when: not spinning, no free spins, no autoplay,
    // player has enough coins for at least one real spin (don't demo on
    // a busted cabinet — that's depressing).
    const activeBalance = selectedCurrency === 'gold' ? coins : coins;
    const canAfford = activeBalance >= bet;
    if (spinning || autoplay || freeSpins > 0 || !canAfford) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }
    idleTimerRef.current = setTimeout(() => {
      triggerDemoSpin();
    }, 15000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [spinning, autoplay, freeSpins, bet, coins, selectedCurrency, lastSpinTime, triggerDemoSpin]);

  const displayGrid = cascadeGrid || reels;

  const checkScatterAnticipation = useCallback((grid: SymbolId[][], doneReels: boolean[]) => {
    if (!doneReels.every(d => d)) return;
    
    let scatterCount = 0;
    for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
      for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        if (isScatterSymbol(grid[reelIdx][rowIdx])) scatterCount++;
      }
    }
    
    if (scatterCount === 2) setScatterSlowdownActive(true);
    else if (scatterCount >= 3) {
      setScatterFanfareActive(true);
      if (soundEnabled) playSound("scatter_win");
      setTimeout(() => setScatterFanfareActive(false), 2000);
    }
  }, [soundEnabled]);

  const findStickyWilds = useCallback((grid: SymbolId[][], lines: WinLine[]): Set<string> => {
    const wilds = new Set<string>();
    lines.forEach(line => {
      if (line.row < 0 || line.row >= 25) return;
      const path = getPaylinePath(line.row);
      for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        const rowIdx = path[reelIdx];
        if (isWildSymbol(grid[reelIdx][rowIdx])) wilds.add(`${reelIdx}-${rowIdx}`);
      }
    });
    return wilds;
  }, []);

  const processCascade = useCallback((grid: SymbolId[][], winningCells: Set<string>): SymbolId[][] => {
    const newGrid: SymbolId[][] = grid.map(reel => [...reel]);
    const affectedReels = new Set<number>();
    
    Array.from(winningCells).map(key => {
      const [reelIdx, rowIdx] = key.split('-').map(Number);
      affectedReels.add(reelIdx);
      newGrid[reelIdx][rowIdx] = 'empty';
    });
    
    affectedReels.forEach(reelIdx => {
      const column = newGrid[reelIdx];
      const symbols: SymbolId[] = column.filter(s => s !== 'empty');
      const emptyCount = 3 - symbols.length;
      const newColumn: SymbolId[] = [];
      for (let i = 0; i < emptyCount; i++) newColumn.push(getRandomSymbolId());
      for (const sym of symbols) newColumn.push(sym);
      newGrid[reelIdx] = newColumn;
    });
    return newGrid;
  }, []);

  const checkCascadeWin = useCallback((grid: SymbolId[][]): { hasWin: boolean; winLines: WinLine[]; multiplier: number } => {
    const activeLines = paylines || 1;
    const allWinLines: WinLine[] = [];
    for (let lineIdx = 0; lineIdx < activeLines && lineIdx < 25; lineIdx++) {
      const path = getPaylinePath(lineIdx);
      const cells = path.map((rowIdx, reelIdx) => ({ reelIdx, rowIdx, symId: grid[reelIdx][rowIdx] }));
      const first = cells[0];
      if (isWildSymbol(first.symId) || cells.every(c => c.symId === first.symId || isWildSymbol(c.symId))) {
        allWinLines.push({ row: lineIdx, cells: cells.map(c => ({ reelIdx: c.reelIdx, rowIdx: c.rowIdx })), symbols: cells.map(c => c.symId), amount: 0, count: cells.length });
      }
    }
    const hasWin = allWinLines.length > 0;
    const multiplier = hasWin ? CASCADE_MULTIPLIERS[Math.min(cascadeLevel, MAX_CASCADE_LEVEL - 1)] : 1;
    return { hasWin, winLines: allWinLines, multiplier };
  }, [paylines, cascadeLevel]);

  const startCascade = useCallback((initialGrid: SymbolId[][], initialWins: WinLine[]) => {
    if (initialWins.length === 0) return;
    setCascadeActive(true);
    setCascadeLevel(1);
    setCascadeGrid(initialGrid);
    
    const winningCells = new Set<string>();
    initialWins.forEach(line => {
      const path = getPaylinePath(line.row);
      path.forEach((rowIdx, reelIdx) => winningCells.add(`${reelIdx}-${rowIdx}`));
    });
    setCascadeWinningCells(winningCells);
    setCascadeAnimatingCells(winningCells);
    
    const wilds = findStickyWilds(initialGrid, initialWins);
    if (wilds.size > 0) {
      setWildLockAnimating(true);
      setStickyWildCells(wilds);
      if (soundEnabled) playSound("wild_lock");
      setTimeout(() => setWildLockAnimating(false), 800);
    }
    
    const animationDuration = 600;
    setTimeout(() => {
      setCascadeWinningCells(new Set());
      setTimeout(() => {
        const newGrid = processCascade(initialGrid, winningCells);
        setCascadeGrid(newGrid);
        if (cascadeLevel >= 2) {
          setShowCascadeMultiplier(true);
          setTimeout(() => setShowCascadeMultiplier(false), 1000);
        }
        setTimeout(() => {
          const result = checkCascadeWin(newGrid);
          if (result.hasWin && cascadeLevel < MAX_CASCADE_LEVEL) {
            const nextLevel = cascadeLevel + 1;
            setCascadeLevel(prev => prev + 1);
            // Cascade level-up sound: ascending "klaxon" each level so
            // the player feels the multiplier climbing. The variation
            // cascade_1..5 in sounds.ts has a higher fundamental +
            // brighter timbre as the level rises. Capped at 5 to match
            // MAX_CASCADE_LEVEL.
            const cascadeLevelNum = Math.min(nextLevel, 5);
            const soundName = `cascade_${cascadeLevelNum}` as
              | "cascade_1" | "cascade_2" | "cascade_3" | "cascade_4" | "cascade_5";
            playSound(soundName);
            // Coin drop on every cascade step — falling money = payoff
            // for the multiplier climbing.
            setTimeout(() => playSound("coin_drop"), 80);
            const newWinningCells = new Set<string>();
            result.winLines.forEach(line => {
              const path = getPaylinePath(line.row);
              path.forEach((rowIdx, reelIdx) => newWinningCells.add(`${reelIdx}-${rowIdx}`));
            });
            setCascadeWinningCells(newWinningCells);
            setCascadeAnimatingCells(newWinningCells);
            const newWilds = findStickyWilds(newGrid, result.winLines);
            if (newWilds.size > 0) {
              setWildLockAnimating(true);
              setStickyWildCells(prev => { const merged = new Set(prev); newWilds.forEach(w => merged.add(w)); return merged; });
              playSound("wild_lock");
              setTimeout(() => setWildLockAnimating(false), 800);
            }
            setTimeout(() => {
              setCascadeWinningCells(new Set());
              setTimeout(() => {
                const nextGrid = processCascade(newGrid, newWinningCells);
                setCascadeGrid(nextGrid);
                setTimeout(() => {
                  const nextResult = checkCascadeWin(nextGrid);
                  if (!nextResult.hasWin || cascadeLevel >= MAX_CASCADE_LEVEL) {
                    setCascadeActive(false);
                    setCascadeLevel(0);
                    setCascadeGrid(null);
                    setStickyWildCells(new Set());
                  }
                }, 400);
              }, 50);
            }, animationDuration);
          } else {
            setCascadeActive(false);
            setCascadeLevel(0);
            setCascadeGrid(null);
            setStickyWildCells(new Set());
          }
        }, 400);
      }, 200);
    }, animationDuration);
  }, [findStickyWilds, processCascade, checkCascadeWin, soundEnabled, cascadeLevel]);

  // Trigger reel spin animation
  useEffect(() => {
    if (spinning && !prevSpinning.current) {
      setShowWin(false);
      setWinFlash(false);
      setShowCoinShower(false);
      setShowBigWin(false);
      setSpinButtonPulse(false);
      setReelDone([false, false, false, false, false]);
      setLastSpinTime(Date.now());
      setScatterSlowdownActive(false);
      setScatterFanfareActive(false);
      setStickyWildCells(new Set());
      setNearMissCells(new Set());

      if (soundEnabled) playSound("spin");
      haptics.spin();
      track("spin", { bet: totalBet });
      recordExposure("win_threshold");

      let initialScatterCount = 0;
      reels.forEach(reel => reel.forEach(symId => { if (isScatterSymbol(symId)) initialScatterCount++; }));

      const getReelStopDelay = (reelIdx: number): number => {
        const baseDelay = 500 + reelIdx * 220;
        if (initialScatterCount === 2 && (reelIdx === 2 || reelIdx === 3)) {
          return baseDelay + (reelIdx === 2 ? 400 : 600);
        }
        return baseDelay;
      };

      [0, 1, 2, 3, 4].forEach((i) => {
        setTimeout(() => {
          setReelDone(prev => { const next = [...prev]; next[i] = true; return next; });
          if (soundEnabled) {
            const reelSymbols = reels[i];
            const hasScatter = reelSymbols.some(s => isScatterSymbol(s));
            const hasWild = reelSymbols.some(s => isWildSymbol(s));
            if (hasScatter && scatterSlowdownActive) {
              playSound("scatter_land");
              setScatterFanfareActive(true);
              setTimeout(() => setScatterFanfareActive(false), 1500);
            } else if (hasWild) {
              playSound("wild_land");
            }
          }
          if (i === 4) {
            setTimeout(() => checkScatterAnticipation(reels, [true, true, true, true, true]), 100);
          }
        }, getReelStopDelay(i));
      });
    }
    prevSpinning.current = spinning;
  }, [spinning, soundEnabled, reels, checkScatterAnticipation, scatterSlowdownActive]);

  // Show win after spinning stops
  useEffect(() => {
    if (!spinning && spinCount !== prevSpinCount.current) {
      prevSpinCount.current = spinCount;
      
      setTimeout(() => {
        if (winAmount > 0) {
          setShowWin(true);
          setWinFlash(true);
          setShowCoinShower(true);
          setParticleTrigger(prev => prev + 1);
          setTimeout(() => setWinFlash(false), 2500);
          setTimeout(() => setShowCoinShower(false), 3000);

          const shakeMap: Record<string, 'light' | 'medium' | 'heavy'> = {
            JACKPOT: 'heavy', MEGA_WIN: 'heavy', BIG_WIN: 'medium', SMALL_WIN: 'light', HUNTRESS_BONUS: 'medium',
          };
          const shake = lastWinType ? (shakeMap[lastWinType] || 'light') : 'none';
          setShakeIntensity(shake);
          const shakeDuration = shake === 'heavy' ? 800 : shake === 'medium' ? 500 : 300;
          setTimeout(() => setShakeIntensity('none'), shakeDuration);

          if (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") {
            setTimeout(() => setShowBigWin(true), 600);
          }

          // Fire the win sting. playSound is already gated by the
          // unified audioCore mute flag, so the !soundMuted check is
          // belt-and-suspenders for the local React state.
          const winLineCount = winLines.length;
          if (winAmount > 0) track("win", { bet: totalBet, win: winAmount });
          if (winAmount > 0) recordExposure("win_threshold", true);
          if (lastWinType === "JACKPOT") { playSound("jackpot"); haptics.bigWin(); track("jackpot"); }
          else if (lastWinType === "MEGA_WIN") { playSound("mega_win"); haptics.bigWin(); track("mega_win"); if (winLineCount >= 3) setTimeout(() => playSound("multi_win"), 400); }
          else if (lastWinType === "BIG_WIN") { playSound("big_win"); haptics.win(); track("big_win"); if (winLineCount >= 2) setTimeout(() => playSound("multi_win"), 400); }
          else { playWinSound(winLines.length); }

          // Coin particle audio: each "shower" of falling coins gets a
          // coin_drop sound so the visual money has a metallic clink
          // to match. Stagger 3-5 clinks across ~600ms so the rain
          // feels layered, not a single click.
          if (winAmount > 0) {
            const coinCount = lastWinType === "JACKPOT" ? 5 : lastWinType === "MEGA_WIN" ? 4 : lastWinType === "BIG_WIN" ? 3 : 2;
            for (let i = 0; i < coinCount; i++) {
              setTimeout(() => playSound("coin_drop"), i * 130);
            }
          }

          if (winLines.length > 0) startCascade(reels, winLines);
        } else {
          // Loss branch — fire Loss-Disguised-as-Win (LDW) sound
          // when a losing spin still had a near-miss event, so the
          // player feels like they "almost" won. Wood & Griffiths
          // (2007) showed LDW audio measurably increases playing time.
          const misses = findNearMiss(reels, []);
          if (misses.length > 0 && !spinning) {
            setNearMissCells(new Set(misses.map(m => `${m.reelIdx}-${m.rowIdx}`)));
            setNearMissAnimating(true);
            // Fire the abstract near-miss sound (in sounds.ts) + a
            // detectNearMisses event for the typed handler. Only the FIRST
            // typed event makes a sound — one gentle "almost" sweep instead
            // of a cluster of overlapping sweeps on a losing spin.
            const events = detectNearMisses(reels);
            events.slice(0, 1).forEach((ev) => {
              setTimeout(() => playNearMissSound(ev), 0);
            });
            if (events.length > 0) { haptics.nearMiss(); track("near_miss"); }
            // LDW only when player lost coins — gate on net loss.
            // (We don't have post-spin coins here; loss branch implies
            // a real net loss because the win branch is the alternative.)
            setTimeout(() => playSound("near_miss"), 100);
            setTimeout(() => { setNearMissAnimating(false); setTimeout(() => setNearMissCells(new Set()), 300); }, 800);
          }
        }
      }, 400);
    }
  }, [spinning, spinCount, winAmount, lastWinType, soundEnabled, reels, winLines, startCascade, soundMuted]);

  const canSpin = !spinning && !cascadeActive && (coins >= bet || freeSpins > 0);
  const totalBet = bet * (paylines || 1);

  // Keyboard accessibility: Space (or Enter) triggers a spin when a spin
  // is allowed. Skips when the user is typing in an input/textarea or
  // when a dialog is open so we never hijack typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
      if (!canSpin) return;
      e.preventDefault();
      playSound("button_click");
      spin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSpin, spin]);

  return (
    <div
      ref={rootRef}
      className={`sm-root w-full max-w-3xl lg:max-w-5xl mx-auto flex flex-col items-center gap-0 pb-0 ${shakeIntensity !== 'none' ? `screen-shake-${shakeIntensity}` : ''} ${isFullscreen ? 'sm-fullscreen' : ''}`}
      style={isFullscreen
        ? { width: "100%", height: "100dvh", overflow: "hidden", background: "#050510", position: "relative" }
        : { minHeight: "450px", position: "relative" }}
    >
      {/* In fullscreen the page background is gone — paint the neon city
          skyline inside the fullscreen element so it frames the cabinet. */}
      {isFullscreen && (
        <CitySkylineScene opacity={1} className="absolute inset-0" />
      )}
      {/* Ocean hue drift backdrop — slow color cycle so the cabinet feels alive */}
      <div className="sm-ocean-drift" aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(13,59,71,0.75) 0%, rgba(7,34,46,0.55) 45%, rgba(3,10,16,0) 100%)',
      }} />
      <div className="sm-ocean-shimmer" aria-hidden style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
        filter: 'blur(40px)',
      }} />
      {/* Tap-to-enter-fullscreen fallback — browsers refuse fullscreen without a
          user gesture. Shown only until the first interaction takes the screen. */}
      {needsFullscreenTap && !isFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="sm-fs-prompt"
          aria-label="Enter fullscreen"
        >
          <span aria-hidden="true">⛗</span> Tap to play fullscreen
        </button>
      )}
      {/* Win Particle Animations */}
      <WinParticles trigger={particleTrigger} winAmount={winAmount} isJackpot={lastWinType === "JACKPOT" } />

      {/* Coin Shower — continuous falling coins during/win moment */}
      {showCoinShower && (
        <CoinParticles count={lastWinType === "JACKPOT" ? 60 : lastWinType === "MEGA_WIN" ? 45 : lastWinType === "BIG_WIN" ? 35 : winAmount > 0 ? 25 : 0} />
      )}

      {/* Win flash overlay — full-screen lightning flash on any win */}
      {winFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[70]"
          style={{
            background: lastWinType === "JACKPOT"
              ? "radial-gradient(circle at 50% 45%, rgba(255,215,0,0.55) 0%, rgba(255,140,0,0.25) 40%, transparent 70%)"
              : lastWinType === "MEGA_WIN"
              ? "radial-gradient(circle at 50% 45%, rgba(255,107,53,0.5) 0%, rgba(255,69,0,0.2) 40%, transparent 70%)"
              : "radial-gradient(circle at 50% 45%, rgba(255,215,0,0.4) 0%, rgba(212,175,55,0.15) 40%, transparent 70%)",
            animation: "winFlash 900ms ease-out forwards",
          }}
        />
      )}

      {/* Cabinet backdrop glow — pulses behind the whole cabinet during big wins */}
      {showWin && winAmount > 0 && (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") && (
        <div
          className="fixed inset-0 pointer-events-none z-[-1]"
          style={{
            background:
              lastWinType === "JACKPOT"
                ? "radial-gradient(ellipse at center, rgba(255,215,0,0.35) 0%, rgba(255,140,0,0.1) 35%, transparent 65%)"
                : lastWinType === "MEGA_WIN"
                ? "radial-gradient(ellipse at center, rgba(255,107,53,0.3) 0%, rgba(255,69,0,0.08) 35%, transparent 65%)"
                : "radial-gradient(ellipse at center, rgba(255,215,0,0.22) 0%, rgba(212,175,55,0.06) 35%, transparent 65%)",
            animation: "cabinetWinGlow 2s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Big Win Overlay */}
      {showBigWin && (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") && (
        <BigWinOverlay winType={lastWinType} winAmount={winAmount} onDismiss={() => setShowBigWin(false)} />
      )}

      {/* Scratch Game modal (opens from bottom-nav 🎰 Scratch) */}
      {showScratchGame && (
        <Suspense fallback={null}>
          <ScratchGame
            onClose={() => {
              setShowScratchGame(false);
              onScratchClose?.();
            }}
            onWin={(amount) => onScratchWin?.(amount)}
          />
        </Suspense>
      )}

      {/* Deals modal (opens from bottom-nav 🎁 Deals) */}
      {showDealsModal && (
        <Suspense fallback={null}>
          <DealsModal
            onClose={() => {
              setShowDealsModal(false);
              onDealsClose?.();
            }}
          />
        </Suspense>
      )}

      {/* ── Desktop stage: side panels flanking the cabinet (lg+ / fullscreen) ── */}
      <div className="sm-stage w-full lg:flex lg:items-stretch lg:gap-4">
        <DesktopLeftPanel
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
          level={level}
          xp={xp}
          xpToNext={xpToNext}
          onCashOut={onCashOut}
        />

      {/* ── Physical Cabinet Structure ── */}
      <div
        className={`w-full min-w-0 flex-1 relative sm-cabinet-col ${scatterFanfareActive ? 'bonus-alert bonus-alert-shake' : ''}`}
        style={{
          background: "linear-gradient(180deg, #0a0a12 0%, #050510 50%, #030308 100%)",
          borderRadius: "16px 16px 0 0",
          boxShadow: `
            inset 0 0 60px rgba(0,0,0,0.8),
            0 0 40px rgba(0, 100, 255, 0.15),
            0 0 80px rgba(0, 80, 200, 0.1),
            inset 0 2px 0 rgba(0, 150, 255, 0.3),
            inset 0 -2px 0 rgba(0, 150, 255, 0.1)
          `,
          border: "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blue LED edge strips - left & right */}
        <div className="absolute inset-y-0 left-0 w-1 pointer-events-none" style={{
          background: "linear-gradient(180deg, transparent, #0066ff, #0088ff, #00aaff, #0088ff, #0066ff, transparent)",
          boxShadow: "0 0 20px #0088ff, 0 0 40px #0066ff",
          opacity: 0.8,
          animation: "ledPulse 3s ease-in-out infinite alternate",
        }} />
        <div className="absolute inset-y-0 right-0 w-1 pointer-events-none" style={{
          background: "linear-gradient(180deg, transparent, #0066ff, #0088ff, #00aaff, #0088ff, #0066ff, transparent)",
          boxShadow: "0 0 20px #0088ff, 0 0 40px #0066ff",
          opacity: 0.8,
          animation: "ledPulse 3s ease-in-out infinite alternate-reverse",
        }} />

        {/* ── Top Glass ── */}
        <CabinetTopGlass
          freeSpins={freeSpins}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          goldCoins={goldCoins}
          greenCoins={greenCoins}
          selectedCurrency={selectedCurrency}
          onDailyBonus={onDailyBonus}
        />

        {/* ── Jackpot Meters (hidden on mobile; hidden in fullscreen so reels fill the view) ── */}
        <div className="hidden sm:block w-full px-4 mb-3 sm-jackpot-row">
          <CabinetJackpotMeters jackpotPool={jackpotPool} />
        </div>

        {/* ── Game Info Panel (hidden on mobile; hidden in fullscreen) ── */}
        <div className="hidden md:block w-full px-4 mb-2 sm-info-row">
          <GameInfoPanel freeSpins={freeSpins} />
        </div>

        {/* ── LED Credit/Bet/Win Displays ── */}
        <div className="w-full grid grid-cols-3 gap-3 px-4 mb-3">
          <LEDDisplay 
            label="CREDIT" 
            value={coins} 
            color="#FFD700" 
            labelColor="rgba(212,175,55,0.6)" 
            animated={showWin && winAmount > 0}
            animatedValue={coins}
          />
          <LEDDisplay 
            label="BET" 
            value={totalBet} 
            color={selectedCurrency === 'gold' ? "#FFD700" : "#90EE90"} 
            labelColor={selectedCurrency === 'gold' ? "rgba(255,215,0,0.6)" : "rgba(144,238,144,0.6)"}
          />
          <LEDDisplay 
            label="WIN" 
            value={winAmount} 
            color="#FFD700" 
            labelColor="rgba(255,215,0,0.7)"
            animated={showWin && winAmount > 0}
            animatedValue={winAmount}
          />
        </div>

        {/* ── Hot Streak Indicator (Vegas continuation-of-play mechanic) ── */}
        {/* Hidden until 2+ consecutive wins, then pulses + scales with intensity.
            "MAX: N" subtitle shows the player's best streak this session. */}
        {consecutiveWins >= 2 && (
          <div
            className="w-full px-4 mb-2 flex justify-center pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="font-display font-black tracking-widest uppercase select-none"
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1.15rem)",
                color: consecutiveWins >= 5 ? "#FF6B35" : "#FFD700",
                background: consecutiveWins >= 5
                  ? "linear-gradient(180deg, rgba(255,107,53,0.18) 0%, rgba(0,0,0,0.6) 100%)"
                  : "linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0.6) 100%)",
                border: `2px solid ${consecutiveWins >= 5 ? "#FF6B35" : "#FFD700"}`,
                borderRadius: "999px",
                padding: "4px 16px",
                textShadow: consecutiveWins >= 5
                  ? "0 0 12px rgba(255,107,53,0.9)"
                  : "0 0 10px rgba(255,215,0,0.8)",
                boxShadow: consecutiveWins >= 5
                  ? "0 0 20px rgba(255,107,53,0.5)"
                  : "0 0 15px rgba(255,215,0,0.4)",
                animation: consecutiveWins >= 5
                  ? "streakPulse 0.5s ease-in-out infinite alternate"
                  : "streakPulse 1s ease-in-out infinite alternate",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span aria-hidden="true">🔥</span>
              <span>{consecutiveWins}x STREAK!</span>
              {maxStreak > consecutiveWins && (
                <span style={{ fontSize: "0.7em", opacity: 0.7 }}>MAX: {maxStreak}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Reel Window ── */}
        <div className="sm-reel-slot w-full px-4 mb-3">
          <ReelWindow 
            reels={reels}
            spinning={spinning}
            reelDone={reelDone}
            winLines={winLines}
            showWin={showWin}
            cascadeActive={cascadeActive}
            cascadeWinningCells={cascadeWinningCells}
            cascadeAnimatingCells={cascadeAnimatingCells}
            cascadeGrid={cascadeGrid}
            stickyWildCells={stickyWildCells}
            wildLockAnimating={wildLockAnimating}
            nearMissCells={nearMissCells}
            nearMissAnimating={nearMissAnimating}
            scatterSlowdownActive={scatterSlowdownActive}
            lastWinType={lastWinType}
            scatterFanfareActive={scatterFanfareActive}
            symbolLockAnimating={symbolLockAnimating}
            displayGrid={displayGrid}
          />
        </div>

        {/* ── Cascade Multiplier Display ── */}
        {showCascadeMultiplier && cascadeLevel > 1 && (
          <div className="w-full px-4 mb-2 flex justify-center pointer-events-none z-20">
            <div className="font-display font-black" style={{
              fontSize: "clamp(1.5rem, 5vw, 3rem)",
              color: cascadeLevel >= 4 ? "#FF6B35" : cascadeLevel >= 3 ? "#FFD700" : "#D4AF37",
              textShadow: `0 0 30px ${cascadeLevel >= 4 ? "rgba(255,107,53,0.9)" : cascadeLevel >= 3 ? "rgba(255,215,0,0.9)" : "rgba(212,175,55,0.8)"}`,
              animation: "cascadeMultiplierPopup 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
            }}>
              {cascadeLevel}x CASCADE!
            </div>
          </div>
        )}

        {/* ── Sticky Coin Bonus Display ── */}
        {(stickyBonus || stickyBonusSpinning) && (
          <div className="w-full px-4 mb-2 flex flex-col items-center justify-center pointer-events-none z-20">
            <div className="font-display font-black" style={{
              fontSize: "clamp(1rem, 4vw, 2.5rem)",
              color: "#32CD32",
              textShadow: "0 0 30px rgba(50,205,50,0.9)",
              animation: "cascadeMultiplierPopup 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
            }}>
              🪙 COIN HOLD & WIN
            </div>
            {stickyBonus && (
              <div className="font-numbers tabular-nums text-center" style={{ color: "#FFD700", fontSize: "1.25rem", textShadow: "0 0 10px #FFD700" }}>
                +{stickyBonus.totalWin.toLocaleString()}
              </div>
            )}
            {stickyBonus?.grandJackpot && (
              <div className="font-display font-black uppercase" style={{ color: "#FFD700", fontSize: "1rem", animation: "pulse 1s infinite" }}>
                GRAND JACKPOT
              </div>
            )}
          </div>
        )}

        {/* ── Button Panel ── */}
        <PayTableDrawer />
        <div className="sm-controls-slot w-full">
        <CabinetButtonPanel
          bet={bet}
          setBet={setBet}
          paylines={paylines}
          setPaylines={setPaylines}
          spin={spin}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
          canSpin={canSpin}
          totalBet={totalBet}
          coins={coins}
          onCoinShop={onCoinShop}
          soundEnabled={soundEnabled}
          setSoundMuted={setSoundMuted}
          soundMuted={soundMuted}
          spinButtonPulse={spinButtonPulse}
          shakeIntensity={shakeIntensity}
          selectedCurrency={selectedCurrency}
          spinning={spinning}
          freeSpins={freeSpins}
          rescueOffered={rescueOffered}
          winAmount={winAmount}
        />
        </div>
      </div>

        <DesktopRightPanel
          winAmount={winAmount}
          curLabel={selectedCurrency === "green" ? "SC" : "GC"}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
          spinning={spinning}
          freeSpins={freeSpins}
        />
      </div>

      {/* Global styles */}
      <style>{`
        /* ── One-screen play layout ── */
        .sm-root.sm-fullscreen {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 40%, #1a0a2a 0%, #050510 70%) !important;
        }
        /* Cabinet width owned by CSS (inline styles would override). */
        .sm-root.sm-fullscreen { width: 600px; }
        @media (min-width: 900px) {
          .sm-root.sm-fullscreen { width: 980px; max-width: 96vw; }
        }
        /* Cabinet fills the viewport; inner column becomes a flex stack. */
        .sm-root.sm-fullscreen > div {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        /* Reel area absorbs leftover space so controls stay pinned in view. */
        .sm-root.sm-fullscreen .sm-reel-slot {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
          overflow: hidden;
        }
        /* Let the reel window + grid stretch to fill the slot. */
        .sm-root.sm-fullscreen .sm-reel-frame {
          height: 100%;
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
        }
        .sm-root.sm-fullscreen .sm-reel-grid {
          flex: 1 1 auto;
          height: 100%;
        }
        .sm-root.sm-fullscreen .cabinet-rim,
        .sm-root.sm-fullscreen .reel-container {
          min-height: 0 !important;
        }
        .sm-root.sm-fullscreen .reel-container {
          height: 100%;
        }
        .sm-root.sm-fullscreen .sm-controls-slot {
          flex: 0 0 auto;
        }
        /* Hide non-essential chrome in fullscreen so the reels own the screen. */
        .sm-root.sm-fullscreen .sm-top-marquee,
        .sm-root.sm-fullscreen .sm-jackpot-row,
        .sm-root.sm-fullscreen .sm-info-row {
          display: none !important;
        }
        /* Never page-scroll while playing fullscreen. */
        body:has(.sm-root.sm-fullscreen) { overflow: hidden; }
        .sm-fs-prompt {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 90;
          padding: 8px 16px;
          border-radius: 999px;
          border: 2px solid #D4AF37;
          background: linear-gradient(180deg, #2a1a00, #1a1000);
          color: #FFD700;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 18px rgba(0,0,0,0.6), 0 0 16px rgba(255,215,0,0.35);
          cursor: pointer;
        }
        /* Stage becomes a 3-column row in fullscreen; side panels show even
           if the window was narrow when fullscreen was entered. */
        .sm-root.sm-fullscreen > .sm-stage { flex-direction: row; align-items: stretch; gap: 14px; padding: 4px 14px; }
        .sm-root.sm-fullscreen .sm-cabinet-col { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; height: 100%; }
        .sm-root.sm-fullscreen .sm-side-panel { display: flex !important; align-self: center; }
        .sm-fullscreen .sm-cabinet-inner {
          max-width: none;
        }
        .sm-fullscreen::-webkit-scrollbar { display: none; }
        @keyframes cabinetGlow {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 12px #D4AF37, 0 0 24px rgba(212,175,55,0.4); }
          50%      { opacity: 1.0; box-shadow: 0 0 24px #FFD700, 0 0 48px rgba(255,215,0,0.7); }
        }
        @keyframes cabinetOrnamentGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(212,175,55,0.5), inset 0 2px 4px rgba(255,255,255,0.3); }
          50%      { box-shadow: 0 0 22px rgba(255,215,0,0.95), inset 0 2px 4px rgba(255,255,255,0.5); }
        }
        @keyframes winFlash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cabinetWinGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes ledPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes ledPulseDim {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0; }
        }
        @keyframes spinPulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.9), 0 0 120px rgba(212,175,55,0.5), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3); }
        }
        /* Free-spin mode: faster green pulse to telegraph "this spin is free" */
        @keyframes freeSpinButtonPulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 40px rgba(76,175,80,0.6), 0 0 80px rgba(76,175,80,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3); }
          50%      { box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 70px rgba(144,238,144,1), 0 0 140px rgba(76,175,80,0.6), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3); }
        }
        @keyframes spinIconRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes paylinePulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes scatterFanfare {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes reelWinGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.2); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,1), inset 0 0 40px rgba(255,215,0,0.4); }
        }
        @keyframes winCellPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes cascadeMultiplierPopup {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .cascade-disappear { animation: cascadeDisappear 0.4s ease-out forwards; }
        @keyframes cascadeDisappear {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        .cascade-fall { animation: cascadeFall 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes cascadeFall { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .sticky-wild-lock { animation: stickyWildLock 0.6s ease-in-out; }
        @keyframes stickyWildLock {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .sticky-wild-glow { animation: stickyWildPulse 0.8s ease-in-out infinite; }
        @keyframes stickyWildPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        .sticky-wild-celebrate { animation: stickyWildCelebrate 0.8s ease-out; }
        @keyframes stickyWildCelebrate { 0% { transform: scale(1); filter: brightness(1); } 25% { transform: scale(1.3); filter: brightness(1.5); } 50% { transform: scale(1.1); filter: brightness(1.3); } 75% { transform: scale(1.2); filter: brightness(1.4); } 100% { transform: scale(1); filter: brightness(1); } }
        .symbol-win-pop { animation: symbolWinPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes symbolWinPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .symbol-bounce { animation: symbolBounce 0.6s ease-out; }
        @keyframes symbolBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .cell-win-glow { box-shadow: 0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.2); animation: winCellPulse 0.8s ease-in-out infinite alternate; }
        .near-miss-gold { animation: nearMissGold 0.8s ease-out; }
        @keyframes nearMissGold {
          0% { box-shadow: 0 0 0 rgba(255,215,0,0); filter: brightness(1); }
          30% { box-shadow: 0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.4); filter: brightness(1.5); }
          60% { box-shadow: 0 0 20px rgba(255,215,0,0.6), inset 0 0 15px rgba(255,215,0,0.3); filter: brightness(1.3); }
          100% { box-shadow: 0 0 0 rgba(255,215,0,0); filter: brightness(1); }
        }
        .near-miss-jiggle { animation: nearMissJiggle 0.6s ease-in-out; }
        @keyframes nearMissJiggle { 0%, 100% { transform: translateX(0) rotate(0deg); } 15% { transform: translateX(-4px) rotate(-2deg); } 30% { transform: translateX(4px) rotate(2deg); } 45% { transform: translateX(-3px) rotate(-1deg); } 60% { transform: translateX(3px) rotate(1deg); } 75% { transform: translateX(-2px) rotate(0deg); } 90% { transform: translateX(2px) rotate(0deg); } }
        .empty-cell { animation: emptyCellFade 0.3s ease-out forwards; }
        @keyframes emptyCellFade { 0% { opacity: 1; } 100% { opacity: 0.3; } }
        .wild-lock-shake { animation: stickyWildLock 0.6s ease-in-out; }
        .scatter-slowdown-reel { animation: scatterSlowdown 0.5s ease-in-out; }
        @keyframes scatterSlowdown { 0%, 100% { border-color: rgba(255,107,107,0.5); } 50% { border-color: #FF6B6B; box-shadow: 0 0 30px rgba(255,107,107,0.5); } }
        /* Symbol lock slam — winning/bonus symbols slam and stick into place.
           Heavy overshoot + quick settle = "ka-chunk" feel. */
        .symbol-lock-slam { animation: symbolLockSlam 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
        @keyframes symbolLockSlam {
          0%   { transform: translateY(0) scale(1); filter: brightness(1); }
          25%  { transform: translateY(-8px) scale(1.15); filter: brightness(1.4); }
          50%  { transform: translateY(4px) scale(0.92); filter: brightness(1.2); }
          75%  { transform: translateY(-2px) scale(1.05); filter: brightness(1.1); }
          100% { transform: translateY(0) scale(1); filter: brightness(1); }
        }
        /* Sustained shimmer while scatter is approaching — runs as long as
           scatterSlowdownActive is true, gives the player anticipatory
           feedback that "something's coming" (Langer & Imber 2007). */
        .scatter-anticipation { position: relative; }
        .scatter-anticipation::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 107, 107, 0.35) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 250% 250%;
          animation: scatterShimmer 1.4s linear infinite;
          mix-blend-mode: screen;
          z-index: 2;
        }
        @keyframes scatterShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -150% 0; }
        }
        /* Bonus entry strobe — 5 quick red flashes over 700ms when 3+
           scatters land (which also triggers the bonus game overlay).
           Pulses the entire cabinet body border so the alert reads
           even with peripheral vision. */
        @keyframes bonusAlertStrobe {
          0%, 100% { box-shadow: inset 0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 100, 255, 0.15), 0 0 80px rgba(0, 80, 200, 0.1); }
          10%, 30%, 50%, 70%, 90% { box-shadow: inset 0 0 80px rgba(255, 0, 0, 0.5), 0 0 60px rgba(255, 50, 50, 0.9), 0 0 120px rgba(255, 30, 30, 0.6); }
          20%, 40%, 60%, 80%     { box-shadow: inset 0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(255, 30, 30, 0.3), 0 0 80px rgba(255, 50, 50, 0.2); }
        }
        .bonus-alert { animation: bonusAlertStrobe 0.7s ease-in-out 2; }
        /* Brief screen shake to amplify the alert (~140ms, 2 cycles) */
        @keyframes bonusAlertShake {
          0%, 100% { transform: translate(0, 0); }
          20%      { transform: translate(-4px, 2px); }
          40%      { transform: translate(4px, -2px); }
          60%      { transform: translate(-3px, -1px); }
          80%      { transform: translate(3px, 1px); }
        }
        .bonus-alert-shake { animation: bonusAlertShake 0.7s ease-in-out 2; }
        /* Neon payline rays + new control-strip pulses (Pirate's Gold) */
        .neon-rays { animation: neonRayPulse 4.5s ease-in-out infinite; }
        @keyframes neonRayPulse {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.5; }
        }
        @keyframes spinRingPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(176,38,255,0.75), 0 0 54px rgba(124,58,237,0.45), inset 0 0 18px rgba(168,85,247,0.3); }
          50%      { box-shadow: 0 0 34px rgba(192,132,252,0.95), 0 0 90px rgba(168,85,247,0.65), inset 0 0 26px rgba(192,132,252,0.45); }
        }
        @keyframes freeSpinRingPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(76,175,80,0.8), 0 0 54px rgba(76,175,80,0.45), inset 0 0 18px rgba(144,238,144,0.25); }
          50%      { box-shadow: 0 0 34px rgba(144,238,144,1), 0 0 90px rgba(76,175,80,0.7), inset 0 0 26px rgba(144,238,144,0.4); }
        }
        @keyframes dailyBonusPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.12); }
        }
        /* Desktop: bigger cabinet — taller reel window (mobile stays 280px).
           !important on the grid because it sets inline minHeight. */
        @media (min-width: 640px) {
          .sm-reel-grid { min-height: 380px !important; }
          .reel-container { min-height: 380px; }
        }
        @media (min-width: 1024px) {
          .sm-reel-grid { min-height: 460px !important; }
          .reel-container { min-height: 460px; }
        }
        @keyframes toastSlideIn {
          0%   { opacity: 0; transform: translateY(40px) scale(0.85); }
          70%  { opacity: 1; transform: translateY(-4px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideOut {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes streakPulse {
          0%   { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        .screen-shake-light { animation: screenShakeLight 0.3s ease-out; }
        @keyframes screenShakeLight { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        .screen-shake-medium { animation: screenShakeMedium 0.5s ease-out; }
        @keyframes screenShakeMedium { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-5px, -3px); } 40% { transform: translate(5px, 3px); } 60% { transform: translate(-4px, 2px); } 80% { transform: translate(4px, -2px); } }
        .screen-shake-heavy { animation: screenShakeHeavy 0.8s ease-out; }
        @keyframes screenShakeHeavy { 0%, 100% { transform: translate(0, 0); } 15% { transform: translate(-8px, -5px) rotate(-1deg); } 30% { transform: translate(8px, 5px) rotate(1deg); } 45% { transform: translate(-6px, 3px) rotate(-1deg); } 60% { transform: translate(6px, -3px) rotate(1deg); } 75% { transform: translate(-4px, 2px) rotate(-1deg); } 90% { transform: translate(4px, -2px) rotate(0deg); } }
        .marquee-text { display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite; }
        @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
        @keyframes cabinetCoinOrbit {
          0%   { transform: translateY(-50%) rotate(0deg)   translateX(0px); }
          25%  { transform: translateY(-58%) rotate(45deg)  translateX(8px); }
          50%  { transform: translateY(-50%) rotate(90deg)  translateX(0px); }
          75%  { transform: translateY(-42%) rotate(135deg) translateX(-8px); }
          100% { transform: translateY(-50%) rotate(180deg) translateX(0px); }
        }
/* Slow ocean-light drift on the cabinet backdrop — the dominant hue
           swings between deep teal and warm teal-green to mimic sun on water,
           so the cabinet reads as alive even when nothing else is happening. */
        @keyframes cabinetOceanDrift {
          0%   { background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(13,59,71,0.75) 0%, rgba(7,34,46,0.55) 45%, rgba(3,10,16,0) 100%); }
          33%  { background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,79,90,0.78) 0%, rgba(9,42,55,0.58) 45%, rgba(3,10,16,0) 100%); }
          66%  { background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(18,52,68,0.78) 0%, rgba(6,28,38,0.58) 45%, rgba(3,10,16,0) 100%); }
          100% { background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(13,59,71,0.75) 0%, rgba(7,34,46,0.55) 45%, rgba(3,10,16,0) 100%); }
        }
        .sm-ocean-drift { animation: cabinetOceanDrift 14s ease-in-out infinite; pointer-events: none; }
        /* Wave shimmer — a subtle moving highlight that overlays the cabinet
           backdrop so the eye picks up motion even at a glance. */
        @keyframes cabinetShimmer {
          0%   { transform: translateX(-30%) skewX(-15deg); opacity: 0; }
          15%  { opacity: 0.08; }
          85%  { opacity: 0.08; }
          100% { transform: translateX(30%) skewX(-15deg); opacity: 0; }
        }
        .sm-ocean-shimmer { animation: cabinetShimmer 9s ease-in-out infinite; pointer-events: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @media (max-width: 480px) {
          .slot-machine-cabinet { border-radius: 8px 8px 0 0; }
          .spin-button { font-size: 1.2rem !important; padding: 12px 20px !important; min-height: 60px !important; }
        }
      `}</style>
    </div>
  );
}

// Helper functions (defined outside component to avoid recreating)
function findNearMiss(reels: SymbolId[][], winLines: WinLine[]): { reelIdx: number; rowIdx: number }[] {
  const nearMisses: { reelIdx: number; rowIdx: number }[] = [];
  winLines.forEach((line) => {
    if (line.row < 0 || line.row >= 25) return;
    const path = getPaylinePath(line.row);
    const paylineSymbols = reels.map((reel, reelIdx) => ({ symId: reel[path[reelIdx]], reelIdx, rowIdx: path[reelIdx] }));
    const counts: Record<string, number> = {};
    paylineSymbols.forEach(cell => { if (!isWildSymbol(cell.symId) && !isScatterSymbol(cell.symId)) counts[cell.symId] = (counts[cell.symId] || 0) + 1; });
    const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);
    pairs.forEach(([symId]) => {
      paylineSymbols.forEach(cell => {
        if (cell.symId === symId) return;
        if (isWildSymbol(cell.symId) || isScatterSymbol(cell.symId)) return;
        const cellSym = getSymbol(cell.symId);
        const targetSym = getSymbol(symId as SymbolId);
        if (cellSym.payouts[0] > 0 && cellSym.payouts[0] <= targetSym.payouts[0] * 2 && cellSym.payouts[0] >= targetSym.payouts[0] / 2) {
          nearMisses.push({ reelIdx: cell.reelIdx, rowIdx: cell.rowIdx });
        }
      });
    });
  });
  const seen = new Set<string>();
  return nearMisses.filter(nm => { const key = `${nm.reelIdx}-${nm.rowIdx}`; if (seen.has(key)) return false; seen.add(key); return true; });
}