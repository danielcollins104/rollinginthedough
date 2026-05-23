/**
 * Rolling in the Dough — Slot Machine Component
 * PROFESSIONAL CASINO STANDARDS: Matches Jackpot Party / Chumba Casino / LuckyLand
 * Features: Dominant SPIN button, jackpot meters, win overlays, payline animations,
 *           reel blur effects, idle animations, bottom nav, animated win counters
 */

import { useEffect, useRef, useState } from "react";
import { SYMBOLS, type SymbolId, type WinLine, type WinType } from "@/hooks/useGameState";
import { playSound, playWinSound } from "@/lib/sounds";
import { WinParticles } from "./WinParticles";
import { soundManager } from "@/lib/soundManager";
import ScratchGame from "./ScratchGame";
import DealsModal from "./DealsModal";
import BigWinOverlay from "./BigWinOverlay";
import JackpotMeters from "./JackpotMeters";
import WinLineHighlight from "./WinLineHighlight";
import FreeSpinsDisplay from "./FreeSpinsDisplay";
import IdleAnimations from "./IdleAnimations";
import PaylineHighlight from "./PaylineHighlight";

const BET_OPTIONS = [10, 25, 50, 100, 200];
const PAYLINE_OPTIONS = [1, 5, 10, 15, 20, 25];
const BET_INCREMENT = 10;
const BET_DECREMENT = 10;

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
  autoplay: boolean;
  setAutoplay: (a: boolean) => void;
  spinCount: number;
  soundEnabled: boolean;
  paylines?: number;
  setPaylines?: (p: number) => void;
  onCoinShop?: () => void;
  jackpotPool?: number;
  externalShowDeals?: boolean;
  externalShowScratch?: boolean;
  onDealsClose?: () => void;
  onScratchClose?: () => void;
  selectedCurrency?: 'gold' | 'green';
}

function getSymbol(id: SymbolId) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}

function isWinningCell(reelIdx: number, rowIdx: number, winLines: WinLine[]): boolean {
  return winLines.some((line) => {
    // For new payline system, line.row is the payline index (0-24)
    // We need to check if this cell is on the winning payline
    if (line.row >= 0 && line.row < 25) {
      // Get the payline path and check if this cell is on it
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

// Spinning reel strip with blur effect
function ReelStrip({ symbols, spinning, done }: { symbols: SymbolId[]; spinning: boolean; done: boolean }) {
  const [blurSymbols, setBlurSymbols] = useState<SymbolId[]>([]);

  useEffect(() => {
    if (spinning && !done) {
      const interval = setInterval(() => {
        setBlurSymbols(
          Array.from({ length: 5 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id)
        );
      }, 60);
      return () => clearInterval(interval);
    }
  }, [spinning, done]);

  if (spinning && !done) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "rgba(5,5,16,0.05)" }}>
        {blurSymbols.map((symId, i) => {
          const sym = getSymbol(symId);
          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center"
              style={{ filter: "blur(2px)", opacity: 0.5 }}
            >
              <span style={{ fontSize: "clamp(1.2rem, 3vw, 2rem)" }}>{sym.emoji}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

// Animated win counter
function AnimatedWinCounter({ target, active }: { target: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || target === 0) {
      setDisplay(target);
      return;
    }
    const start = Date.now();
    const duration = Math.min(1200, 400 + target / 10);
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, active]);

  return <>{display.toLocaleString()}</>;
}

// Payline indicator dots on sides
function PaylineIndicators({ paylines = 1 }: { paylines?: number }) {
  const indicators = Math.min(paylines, 25);
  return (
    <>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 flex flex-col gap-0.5 z-10">
        {Array.from({ length: Math.min(indicators, 12) }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="w-2 h-2 rounded-full"
            style={{
              background: `hsl(${(i * 30) % 360}, 100%, 55%)`,
              boxShadow: `0 0 6px hsl(${(i * 30) % 360}, 100%, 55%)`,
              animation: `paylinePulse 1.2s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 flex flex-col gap-0.5 z-10">
        {Array.from({ length: Math.min(indicators, 12) }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="w-2 h-2 rounded-full"
            style={{
              background: `hsl(${(i * 30) % 360}, 100%, 55%)`,
              boxShadow: `0 0 6px hsl(${(i * 30) % 360}, 100%, 55%)`,
              animation: `paylinePulse 1.2s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// Floating coin shower on win
function CoinShower({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${5 + (i * 6) % 90}%`,
            top: "-10%",
            animation: `coinShower ${1.5 + (i % 4) * 0.3}s ease-in ${i * 0.1}s forwards`,
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
}

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
  autoplay,
  setAutoplay,
  spinCount,
  soundEnabled,
  paylines,
  setPaylines,
  onCoinShop,
  jackpotPool = 5000,
  externalShowDeals,
  externalShowScratch,
  onDealsClose,
  onScratchClose,
  selectedCurrency = 'gold',
}: Props) {
  const [reelDone, setReelDone] = useState<boolean[]>([true, true, true, true, true]);
  const [showWin, setShowWin] = useState(false);
  const [winFlash, setWinFlash] = useState(false);
  const [showCoinShower, setShowCoinShower] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showScratchGame, setShowScratchGame] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [lastSpinTime, setLastSpinTime] = useState(Date.now());
  const [spinButtonPulse, setSpinButtonPulse] = useState(false);
  const prevSpinCount = useRef(spinCount);
  const prevSpinning = useRef(false);

  // Sync external triggers for DEALS and SCRATCH from BottomNavBar
  useEffect(() => {
    if (externalShowDeals) setShowDealsModal(true);
  }, [externalShowDeals]);

  useEffect(() => {
    if (externalShowScratch) setShowScratchGame(true);
  }, [externalShowScratch]);

  // Pulse SPIN button when idle
  useEffect(() => {
    if (!spinning) {
      const timer = setTimeout(() => setSpinButtonPulse(true), 4000);
      return () => clearTimeout(timer);
    } else {
      setSpinButtonPulse(false);
    }
  }, [spinning, lastSpinTime]);

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

      if (soundEnabled) playSound("spin");

      // Stagger reel stops with crescendo huntress slam
      let huntressCount = 0;
      [0, 1, 2, 3, 4].forEach((i) => {
        setTimeout(() => {
          setReelDone((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
          if (soundEnabled) {
            // Check if huntress landed on this reel
            const reelSymbols = reels[i];
            if (reelSymbols && reelSymbols.some(s => s === "huntress")) {
              huntressCount++;
              // Play crescendo slam based on how many huntress symbols have landed
              if (huntressCount === 1) {
                playSound("huntress_slam");
              } else if (huntressCount === 2) {
                playSound("huntress_slam_2");
              } else if (huntressCount === 3) {
                playSound("huntress_slam_3");
              } else if (huntressCount === 4) {
                playSound("huntress_slam_4");
              } else if (huntressCount >= 5) {
                playSound("huntress_slam_5");
              }
            } else {
              playSound("reel_stop");
            }
          }
        }, 500 + i * 220);
      });
    }
    prevSpinning.current = spinning;
  }, [spinning, soundEnabled, reels]);

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

          // Show big win overlay for significant wins
          if (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") {
            setTimeout(() => setShowBigWin(true), 600);
          }

          if (!soundMuted) {
            const winLineCount = winLines.length;
            if (lastWinType === "JACKPOT") {
              playSound("jackpot");
              soundManager.playJackpot();
            } else if (lastWinType === "MEGA_WIN") {
              playSound("mega_win");
              soundManager.playBigWin();
              if (winLineCount >= 3) {
                setTimeout(() => playSound("multi_win"), 400);
              }
            } else if (lastWinType === "BIG_WIN") {
              playSound("big_win");
              soundManager.playBigWin();
              if (winLineCount >= 2) {
                setTimeout(() => playSound("multi_win"), 400);
              }
            } else {
              playWinSound(winLineCount);
              soundManager.playSmallWin();
            }
          }
        }
        // No sound on losing spins — silence only
      }, 400);
    }
  }, [spinning, spinCount, winAmount, lastWinType, soundEnabled]);

  const canSpin = !spinning && (coins >= bet || freeSpins > 0);
  const totalBet = bet * (paylines || 1);

  const winTypeLabel: Record<string, string> = {
    SMALL_WIN: "Winner!",
    BIG_WIN: "Big Win!",
    MEGA_WIN: "Mega Win!",
    JACKPOT: "JACKPOT!",
    HUNTRESS_BONUS: "Huntress Bonus!",
  };

  const winTypeColor: Record<string, string> = {
    SMALL_WIN: "#D4AF37",
    BIG_WIN: "#FFA500",
    MEGA_WIN: "#FF6B35",
    JACKPOT: "#FFD700",
    HUNTRESS_BONUS: "#FF6B6B",
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-0 pb-14 sm:pb-0">
      {/* Win Particle Animations */}
      <WinParticles trigger={particleTrigger} winAmount={winAmount} isJackpot={lastWinType === "JACKPOT"} />

      {/* Big Win Overlay */}
      {showBigWin && (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") && (
        <BigWinOverlay
          winType={lastWinType}
          winAmount={winAmount}
          onDismiss={() => setShowBigWin(false)}
        />
      )}

      {/* ── Jackpot Meters ── */}
      <div className="w-full px-2 pt-2 pb-1">
        <JackpotMeters jackpotPool={jackpotPool} />
      </div>

      {/* ── Machine Top Banner ── */}
      <div className="w-full relative">
        {/* Free spins badge */}
        <FreeSpinsDisplay freeSpins={freeSpins} />

        <div
          style={{
            background: "linear-gradient(180deg, #06060f 0%, #0d0d22 100%)",
            border: "2px solid #D4AF37",
            borderBottom: "none",
            borderRadius: "0.75rem 0.75rem 0 0",
          }}
        >
          {/* Gold top line */}
          <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, #F5E6C8, #D4AF37, transparent)" }} />

          {/* Logo area — compact */}
          <div className="py-2 px-4 flex items-center justify-between">
            <ArtDecoOrnament />
            <div className="text-center flex-1">
              <div
                className="font-display font-black tracking-widest uppercase text-gold-gradient"
                style={{ fontSize: "clamp(0.9rem, 3vw, 1.5rem)", letterSpacing: "0.12em" }}
              >
                Rolling in the Dough
              </div>
              <div
                className="font-numbers tracking-[0.35em] uppercase"
                style={{ fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)", color: "#C8860A" }}
              >
                ◆ Sweepstakes Slots ◆
              </div>
            </div>
            <ArtDecoOrnament flip />
          </div>

          {/* Scrolling marquee */}
          <div
            className="overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #050510, #0d0a00, #050510)",
              borderTop: "1px solid rgba(212,175,55,0.2)",
              padding: "4px 0",
            }}
          >
            <div className="marquee-text text-xs font-numbers px-4" style={{ color: "#C8860A", fontSize: "0.65rem" }}>
              ◆ FREE SWEEPSTAKES GAME — NO REAL MONEY ◆ MATCH 3+ SYMBOLS TO WIN ◆ 🍀 WILD CLOVER SUBSTITUTES ALL ◆ ⭐ 3 SCATTERS = 10 FREE SPINS ◆ ⭐ 5 SCATTERS = JACKPOT ◆ 🗡️ 3 HUNTRESS = BONUS ROUND ◆ JACKPOT GROWS WITH EVERY SPIN ◆
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFESSIONAL INFO DISPLAY PANEL ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #050510 100%)",
          border: "2px solid #D4AF37",
          borderTop: "none",
          borderBottom: "none",
          padding: "8px 12px",
          width: "100%",
        }}
        className="grid grid-cols-3 gap-2"
      >
        {/* Balance */}
        <div
          className="rounded text-center py-1.5 px-2"
          style={{
            background: "linear-gradient(135deg, #1a1a3a, #0d0d20)",
            border: "1px solid rgba(212,175,55,0.35)",
          }}
        >
          <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.55)", fontSize: "0.6rem" }}>
            💰 Balance
          </div>
          <div className="font-numbers font-bold" style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.2rem)", color: "#FFD700" }}>
            {coins.toLocaleString()}
          </div>
        </div>

        {/* Total Bet */}
        <div
          className="rounded text-center py-1.5 px-2"
          style={{
            background: selectedCurrency === 'gold'
              ? "linear-gradient(135deg, #2a1a00, #3a2500)"
              : "linear-gradient(135deg, #1a2a1a, #0d1a0d)",
            border: selectedCurrency === 'gold'
              ? "1px solid rgba(255,215,0,0.35)"
              : "1px solid rgba(76,175,80,0.35)",
          }}
        >
          <div className="text-xs font-numbers uppercase tracking-widest" style={{
            color: selectedCurrency === 'gold' ? "rgba(255,215,0,0.55)" : "rgba(76,175,80,0.55)",
            fontSize: "0.6rem"
          }}>
            🎲 Total Bet
          </div>
          <div className="font-numbers font-bold" style={{
            fontSize: "clamp(0.85rem, 2.5vw, 1.2rem)",
            color: selectedCurrency === 'gold' ? "#FFD700" : "#90EE90"
          }}>
            {totalBet.toLocaleString()}
          </div>
        </div>

        {/* Win Amount with animated counter */}
        <div
          className="rounded text-center py-1.5 px-2 transition-all duration-300"
          style={{
            background: showWin && winAmount > 0
              ? "linear-gradient(135deg, #2a1a00, #3a2500)"
              : "linear-gradient(135deg, #1a1a2a, #0d0d1a)",
            border: showWin && winAmount > 0 ? "1px solid rgba(255,215,0,0.7)" : "1px solid rgba(212,175,55,0.2)",
            boxShadow: showWin && winAmount > 0 ? "0 0 15px rgba(255,215,0,0.4)" : "none",
          }}
        >
          <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: showWin && winAmount > 0 ? "rgba(255,215,0,0.7)" : "rgba(212,175,55,0.4)", fontSize: "0.6rem" }}>
            🏆 Win
          </div>
          <div
            className="font-numbers font-bold"
            style={{
              fontSize: "clamp(0.85rem, 2.5vw, 1.2rem)",
              color: showWin && winAmount > 0 ? "#FFD700" : "#555",
              textShadow: showWin && winAmount > 0 ? "0 0 10px rgba(255,215,0,0.8)" : "none",
            }}
          >
            {showWin && winAmount > 0 ? (
              <>+<AnimatedWinCounter target={winAmount} active={showWin} /></>
            ) : "—"}
          </div>
        </div>
      </div>

      {/* ── Reel Window ── */}
      <div
        className="w-full relative"
        style={{
          background: "linear-gradient(180deg, #04040e 0%, #080818 50%, #04040e 100%)",
          border: "2px solid #D4AF37",
          borderTop: "none",
          borderBottom: "none",
          padding: "8px 8px",
        }}
      >
        {/* Payline indicators */}
        <PaylineIndicators paylines={paylines} />

        {/* Coin shower on win */}
        <CoinShower show={showCoinShower} />

        {/* Win flash overlay */}
        {winFlash && (
          <div
            className="absolute inset-0 pointer-events-none z-30 rounded"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,215,0,0.12) 0%, transparent 70%)",
              animation: "flashPulse 0.4s ease-in-out 3",
            }}
          />
        )}

        {/* Win line highlight overlay */}
        <WinLineHighlight winLines={winLines} show={showWin} />

        {/* Payline highlights for each winning line */}
        {showWin && winLines.map((line, idx) => (
          <PaylineHighlight key={idx} paylineIndex={line.row} isActive={true} reelCount={5} rowCount={3} />
        ))}

        {/* Idle animations */}
        <IdleAnimations spinning={spinning} lastSpinTime={lastSpinTime} />

        {/* Reels */}
        <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {reels.map((reel, reelIdx) => (
            <div
              key={reelIdx}
              className="reel-container rounded relative"
              style={{
                aspectRatio: "1/3.2",
                minHeight: "clamp(55px, 11vw, 180px)",
                transition: "box-shadow 0.3s ease",
                boxShadow: reelDone[reelIdx] && showWin && reel.some((_, rowIdx) => isWinningCell(reelIdx, rowIdx, winLines))
                  ? "0 0 20px rgba(255,215,0,0.6), inset 0 0 15px rgba(255,215,0,0.1)"
                  : "inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.2)",
              }}
            >
              {/* Spinning blur overlay */}
              <ReelStrip symbols={reel} spinning={spinning} done={reelDone[reelIdx]} />

              {/* Symbols */}
              {reel.map((symId, rowIdx) => {
                const isWin = showWin && isWinningCell(reelIdx, rowIdx, winLines);
                const sym = getSymbol(symId);
                return (
                  <div
                    key={rowIdx}
                    className={`flex items-center justify-center transition-all duration-300 ${isWin ? "cell-win-glow symbol-win" : ""}`}
                    style={{
                      height: "33.333%",
                      background: isWin
                        ? `radial-gradient(circle at center, ${sym.bgColor}ff 0%, #050510 100%)`
                        : `radial-gradient(circle at center, ${sym.bgColor}55 0%, #030310 100%)`,
                      borderBottom: rowIdx < 2 ? "1px solid rgba(212,175,55,0.1)" : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isWin && (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle, ${sym.color}30, transparent 70%)`,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "clamp(1.4rem, 3.8vw, 2.3rem)",
                        filter: isWin
                          ? `drop-shadow(0 0 8px ${sym.color}) drop-shadow(0 0 16px ${sym.color}88)`
                          : "none",
                        transition: "filter 0.3s ease",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {sym.emoji}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Win display below reels */}
        <div className="mt-1 sm:mt-2 text-center min-h-[2rem] flex items-center justify-center">
          {showWin && winAmount > 0 && lastWinType ? (
            <div className="flex items-center gap-2">
              <div
                className="font-display font-black win-message"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", color: winTypeColor[lastWinType] }}
              >
                {winTypeLabel[lastWinType]}
              </div>
              <div
                className="font-numbers font-bold"
                style={{
                  fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
                  color: "#FFD700",
                  textShadow: "0 0 15px rgba(255,215,0,0.8)",
                }}
              >
                +<AnimatedWinCounter target={winAmount} active={showWin} /> 🪙
              </div>
            </div>
          ) : spinning ? (
            <SpinningDots />
          ) : (
            <div className="text-xs font-body italic" style={{ color: "rgba(212,175,55,0.3)" }}>
              {coins < bet && freeSpins === 0 ? "⚠ Not enough coins" : "Press SPIN to play"}
            </div>
          )}
        </div>
      </div>

      {/* ── PROFESSIONAL CONTROLS PANEL ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #060610 100%)",
          border: "2px solid #D4AF37",
          borderTop: "none",
          borderRadius: "0 0 0.75rem 0.75rem",
          padding: "12px",
          width: "100%",
        }}
      >
        {/* ── DOMINANT SPIN BUTTON — Professional casino standard ── */}
        <div className="mb-3">
          <button
            onClick={() => {
              if (canSpin) {
                spin();
                if (soundEnabled) playSound("button_click");
                setSpinButtonPulse(false);
              }
            }}
            disabled={!canSpin}
            className="w-full rounded-full font-display font-black tracking-wider transition-all transform active:scale-95"
            style={{
              padding: "clamp(12px, 2.5vw, 18px) clamp(16px, 4vw, 32px)",
              fontSize: "clamp(1.1rem, 3.5vw, 1.6rem)",
              background: canSpin
                ? "linear-gradient(135deg, #8B5E0A 0%, #C8860A 25%, #FFD700 50%, #C8860A 75%, #8B5E0A 100%)"
                : "linear-gradient(135deg, #1a1a2a, #2a2a3a)",
              border: `3px solid ${canSpin ? "#F5E6C8" : "rgba(212,175,55,0.2)"}`,
              color: canSpin ? "#0a0a1a" : "#444",
              boxShadow: canSpin
                ? spinButtonPulse
                  ? "0 0 40px rgba(255,215,0,1), 0 0 80px rgba(255,215,0,0.6), 0 8px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.4)"
                  : "0 0 25px rgba(255,215,0,0.7), 0 0 50px rgba(255,215,0,0.3), 0 6px 20px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3)"
                : "none",
              cursor: canSpin ? "pointer" : "not-allowed",
              textShadow: canSpin ? "0 2px 4px rgba(0,0,0,0.4)" : "none",
              animation: canSpin && spinButtonPulse ? "spinBtnPulse 1.5s ease-in-out infinite" : "none",
              letterSpacing: "0.15em",
            }}
            title="Click to spin the reels"
          >
            {freeSpins > 0
              ? `🎁 FREE SPIN (${freeSpins})`
              : spinning
              ? "⟳ SPINNING..."
              : "✦ SPIN ✦"}
          </button>
        </div>

        {/* ── Secondary action buttons ── */}
        <div className="flex gap-1.5 mb-3">
          <button
            onClick={() => {
              setShowDealsModal(true);
              if (soundEnabled) playSound("button_click");
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1a3a5a, #2a5a7a)",
              border: "2px solid rgba(100,180,255,0.5)",
              color: "#88CCFF",
              boxShadow: "0 0 10px rgba(100,180,255,0.2)",
            }}
          >
            🎁 DEALS
          </button>
          <button
            onClick={() => {
              setShowScratchGame(true);
              if (soundEnabled) playSound("button_click");
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #5a2a1a, #7a3a2a)",
              border: "2px solid rgba(255,107,107,0.5)",
              color: "#FFB6B6",
              boxShadow: "0 0 10px rgba(255,107,107,0.2)",
            }}
          >
            🎰 SCRATCH
          </button>
          <button
            onClick={() => {
              setAutoplay(!autoplay);
              if (soundEnabled) playSound("button_click");
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: autoplay
                ? "linear-gradient(135deg, #1a3a1a, #2a5a2a)"
                : "linear-gradient(135deg, #1a1a2a, #2a2a3a)",
              border: `2px solid ${autoplay ? "rgba(76,175,80,0.6)" : "rgba(212,175,55,0.3)"}`,
              color: autoplay ? "#90EE90" : "#D4AF37",
              boxShadow: autoplay ? "0 0 10px rgba(76,175,80,0.3)" : "none",
            }}
          >
            {autoplay ? "■ STOP" : "▶ AUTO"}
          </button>
        </div>

        {/* ── Bet Controls — Desktop ── */}
        <div className="hidden sm:block mb-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Bet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.7)" }}>
                  💰 Bet Per Line
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { const nb = Math.max(10, bet - BET_DECREMENT); setBet(nb); if (soundEnabled) playSound("button_click"); }}
                    disabled={spinning || bet <= 10}
                    className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center transition-all"
                    style={{
                      background: bet <= 10 ? "#222" : "linear-gradient(135deg, #2a1a00, #3a2a00)",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: bet <= 10 ? "#444" : "#C8860A",
                    }}
                  >−</button>
                  <button
                    onClick={() => { const nb = Math.min(200, bet + BET_INCREMENT); setBet(nb); if (soundEnabled) playSound("button_click"); }}
                    disabled={spinning || bet >= 200}
                    className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center transition-all"
                    style={{
                      background: bet >= 200 ? "#222" : "linear-gradient(135deg, #2a1a00, #3a2a00)",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: bet >= 200 ? "#444" : "#C8860A",
                    }}
                  >+</button>
                </div>
              </div>
              <div className="flex gap-1">
                {BET_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => { if (!spinning) { setBet(b); if (soundEnabled) playSound("button_click"); } }}
                    disabled={spinning}
                    className="flex-1 py-1.5 text-xs rounded font-numbers font-bold transition-all hover:scale-105"
                    style={{
                      background: bet === b ? "linear-gradient(135deg, #C8860A, #D4AF37)" : "linear-gradient(135deg, #0d0d20, #1a1a35)",
                      border: `1px solid ${bet === b ? "#F5E6C8" : "rgba(212,175,55,0.3)"}`,
                      color: bet === b ? "#0a0a1a" : "#D4AF37",
                      boxShadow: bet === b ? "0 0 10px rgba(212,175,55,0.5)" : "none",
                      opacity: spinning ? 0.5 : 1,
                    }}
                  >{b}</button>
                ))}
              </div>
            </div>

            {/* Paylines */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(76,175,80,0.7)" }}>
                  📊 Paylines
                </div>
                <button
                  onClick={() => { if (!spinning) { setBet(200); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning}
                  className="px-2 py-0.5 rounded text-xs font-numbers font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #2a1a00, #3a2a00)",
                    border: "1px solid rgba(212,175,55,0.4)",
                    color: "#C8860A",
                    opacity: spinning ? 0.5 : 1,
                  }}
                >MAX BET</button>
              </div>
              <div className="flex gap-1">
                {PAYLINE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { if (!spinning && setPaylines) { setPaylines(p); if (soundEnabled) playSound("button_click"); } }}
                    disabled={spinning}
                    className="flex-1 py-1.5 text-xs rounded font-numbers font-bold transition-all hover:scale-105"
                    style={{
                      background: paylines === p ? "linear-gradient(135deg, #1a5a1a, #2a8a2a)" : "linear-gradient(135deg, #0d0d20, #1a1a35)",
                      border: `1px solid ${paylines === p ? "#90EE90" : "rgba(76,175,80,0.3)"}`,
                      color: paylines === p ? "#90EE90" : "#D4AF37",
                      boxShadow: paylines === p ? "0 0 10px rgba(144,238,144,0.4)" : "none",
                      opacity: spinning ? 0.5 : 1,
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Bet/Paylines ── */}
        <div className="sm:hidden grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-xs font-numbers uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.6)", fontSize: "0.6rem" }}>💰 BET</div>
            <div className="flex gap-0.5 flex-wrap">
              {[10, 25, 50, 100, 200].map((b) => (
                <button
                  key={b}
                  onClick={() => { if (!spinning) { setBet(b); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning}
                  className="flex-1 min-w-[2rem] py-1 text-xs rounded font-numbers font-bold"
                  style={{
                    background: bet === b ? "linear-gradient(135deg, #C8860A, #D4AF37)" : "linear-gradient(135deg, #0d0d20, #1a1a35)",
                    border: `1px solid ${bet === b ? "#F5E6C8" : "rgba(212,175,55,0.3)"}`,
                    color: bet === b ? "#0a0a1a" : "#D4AF37",
                    opacity: spinning ? 0.5 : 1,
                    fontSize: "0.65rem",
                  }}
                >{b}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-numbers uppercase tracking-widest mb-1" style={{ color: "rgba(76,175,80,0.6)", fontSize: "0.6rem" }}>📊 LINES</div>
            <div className="flex gap-0.5 flex-wrap">
              {[1, 5, 10, 15, 20, 25].map((p) => (
                <button
                  key={p}
                  onClick={() => { if (!spinning && setPaylines) { setPaylines(p); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning}
                  className="flex-1 min-w-[2rem] py-1 text-xs rounded font-numbers font-bold"
                  style={{
                    background: paylines === p ? "linear-gradient(135deg, #1a5a1a, #2a8a2a)" : "linear-gradient(135deg, #0d0d20, #1a1a35)",
                    border: `1px solid ${paylines === p ? "#90EE90" : "rgba(76,175,80,0.3)"}`,
                    color: paylines === p ? "#90EE90" : "#D4AF37",
                    opacity: spinning ? 0.5 : 1,
                    fontSize: "0.65rem",
                  }}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom utility row ── */}
        <div className="hidden sm:flex gap-1.5">
          <button
            onClick={() => {
              const newMuted = !soundMuted;
              setSoundMuted(newMuted);
              soundManager.setMuted(newMuted);
            }}
            className="px-3 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all"
            style={{
              background: soundMuted ? "linear-gradient(135deg, #3a1a1a, #5a2a2a)" : "linear-gradient(135deg, #1a3a1a, #2a5a2a)",
              border: soundMuted ? "1px solid rgba(255,107,107,0.5)" : "1px solid rgba(76,175,80,0.5)",
              color: soundMuted ? "#FF6B6B" : "#90EE90",
            }}
          >
            {soundMuted ? "🔇 MUTE" : "🔊 SOUND"}
          </button>
          {onCoinShop && (
            <button
              onClick={onCoinShop}
              className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1a3a1a, #2a5a2a)",
                border: "1px solid rgba(76,175,80,0.5)",
                color: "#90EE90",
              }}
            >
              💰 SHOP
            </button>
          )}
          <button
            onClick={() => {
              const btn = document.querySelector('[data-paytable-toggle]');
              if (btn) (btn as HTMLButtonElement).click();
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1a1a3a, #2a2a4a)",
              border: "1px solid rgba(212,175,55,0.4)",
              color: "#D4AF37",
            }}
          >
            📖 RULES
          </button>
        </div>
      </div>

      {/* ── Paytable ── */}
      <PayTable />

      {/* Scratch Game Modal */}
      {showScratchGame && (
        <ScratchGame
          onClose={() => {
            setShowScratchGame(false);
            onScratchClose?.();
          }}
          onWin={(amount) => {
            if (soundEnabled) playSound('big_win');
            soundManager.playBigWin();
            // Note: scratch win is handled by the parent via onWin callback
          }}
        />
      )}

      {/* Deals Modal */}
      {showDealsModal && (
        <DealsModal onClose={() => {
          setShowDealsModal(false);
          onDealsClose?.();
        }} />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes coinShower {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120%) rotate(360deg); opacity: 0; }
        }
        @keyframes flashPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes paylinePulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes spinBtnPulse {
          0%, 100% {
            box-shadow: 0 0 25px rgba(255,215,0,0.7), 0 0 50px rgba(255,215,0,0.3), 0 6px 20px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3);
          }
          50% {
            box-shadow: 0 0 45px rgba(255,215,0,1), 0 0 90px rgba(255,215,0,0.6), 0 8px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.4);
          }
        }
      `}</style>
    </div>
  );
}

function SpinningDots() {
  return (
    <div className="flex gap-2 items-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#D4AF37",
            animation: `paylinePulse 0.9s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ArtDecoOrnament({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="flex items-center gap-1 opacity-40"
      style={{ transform: flip ? "scaleX(-1)" : "none" }}
    >
      <div className="w-6 h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
      <div className="text-xs font-numbers" style={{ color: "#D4AF37" }}>◆</div>
      <div className="w-3 h-px" style={{ background: "#D4AF37" }} />
      <div className="text-xs font-numbers" style={{ color: "#C8860A" }}>◇</div>
    </div>
  );
}

function PayTable() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full mt-2">
      <button
        data-paytable-toggle
        onClick={() => setOpen((o) => !o)}
        className="w-full py-2 text-xs font-numbers tracking-widest uppercase transition-all opacity-50 hover:opacity-90"
        style={{ color: "#D4AF37", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {open ? "▲ Hide Paytable" : "▼ View Paytable & Rules"}
      </button>

      {open && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #050510, #0a0a1a)",
            border: "1px solid rgba(212,175,55,0.25)",
          }}
        >
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="font-display text-base text-gold-gradient">Paytable</div>
              <div className="text-xs font-body mt-0.5" style={{ color: "rgba(212,175,55,0.5)" }}>
                Payouts per 10-coin bet unit · 3 / 4 / 5 matching symbols
              </div>
            </div>
            <div className="space-y-1">
              {SYMBOLS.map((sym) => (
                <div
                  key={sym.id}
                  className="paytable-row flex items-center gap-3 py-2 px-3 rounded"
                >
                  <span className="text-xl w-8 text-center">{sym.emoji}</span>
                  <div className="flex-1">
                    <div className="text-xs font-numbers font-bold" style={{ color: sym.color }}>
                      {sym.name}
                      {sym.isWild && <span className="ml-1 text-xs" style={{ color: "#90EE90" }}>[WILD]</span>}
                      {sym.isScatter && <span className="ml-1 text-xs" style={{ color: "#FF6B6B" }}>[SCATTER]</span>}
                    </div>
                  </div>
                  <div className="text-xs font-numbers text-right" style={{ color: "rgba(212,175,55,0.7)" }}>
                    {sym.payouts[0]}x / {sym.payouts[1]}x / {sym.payouts[2]}x
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
              <div className="text-xs font-body space-y-1" style={{ color: "rgba(212,175,55,0.5)" }}>
                <div>🍀 Wild Clover substitutes for all symbols except scatters</div>
                <div>⭐ 3+ Scatters = 10 Free Spins · 5 Scatters = Jackpot</div>
                <div>🗡️ 3+ Huntress = Bonus Round with multiplier rewards</div>
                <div>All wins multiplied by paylines × bet per line</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
