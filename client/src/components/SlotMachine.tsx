/**
 * Rolling in the Dough — Slot Machine Component
 * PROFESSIONAL CASINO STANDARDS: Matches Jackpot Party / Chumba Casino / LuckyLand
 * Features: Dominant SPIN button, jackpot meters, win overlays, payline animations,
 *           reel blur effects, idle animations, bottom nav, animated win counters,
 *           cascade system, scatter anticipation, sticky wilds, near-miss tension
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { SYMBOLS, type SymbolId, type WinLine, type WinType } from "@shared/game";
import {
  playSound,
  playWinSound,
  startScatterAnticipation,
  stopScatterAnticipation,
  playScatterFanfare,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "@/lib/sounds";
import { useCascadeSystem } from "@/hooks/useCascadeSystem";
import { isScatterSymbol, isWildSymbol, findNearMiss } from "@/lib/reelHelpers";
import { WinParticles } from "./WinParticles";
import ScratchGame from "./ScratchGame";
import DealsModal from "./DealsModal";
import BigWinOverlay from "./BigWinOverlay";
import JackpotMeters from "./JackpotMeters";
import WinLineHighlight from "./WinLineHighlight";
import SymbolIcon from "./SymbolIcon";
import ReelGrid from "./ReelGrid";
import WinMessage, { AnimatedWinCounter } from "./WinMessage";
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

// Cascade multiplier display
function CascadeMultiplierDisplay({ level, active }: { level: number; active: boolean }) {
  if (!active || level <= 1) return null;
  
  return (
    <div
      className="absolute inset-0 pointer-events-none z-25 flex items-center justify-center"
      style={{ animation: "cascadeMultiplierPopup 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both" }}
    >
      <div
        className="font-display font-black"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 3rem)",
          color: level >= 4 ? "#FF6B35" : level >= 3 ? "#FFD700" : "#D4AF37",
          textShadow: `0 0 20px ${level >= 4 ? "rgba(255,107,53,0.9)" : level >= 3 ? "rgba(255,215,0,0.9)" : "rgba(212,175,55,0.8)"}`,
          animation: "cascadeMultiplierPulse 0.5s ease-in-out infinite alternate",
        }}
      >
        {level}x CASCADE!
      </div>
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
  const [shakeIntensity, setShakeIntensity] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const prevSpinCount = useRef(spinCount);
  const prevSpinning = useRef(false);
  const bgMusicStarted = useRef(false);

  // Start ambient background music on first interaction, stop on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // Scatter anticipation state
  const [scatterSlowdownActive, setScatterSlowdownActive] = useState(false);
  const [scatterFanfareActive, setScatterFanfareActive] = useState(false);

  // Cascade system
  const cascade = useCascadeSystem({ reels, paylines, soundEnabled });
  const {
    cascadeActive,
    cascadeLevel,
    cascadeGrid,
    cascadeWinningCells,
    cascadeAnimatingCells,
    showCascadeMultiplier,
    stickyWildCells,
    wildLockAnimating,
    nearMissCells,
    nearMissAnimating,
    displayGrid,
    startCascade,
  } = cascade;

  // Sync external triggers for DEALS and SCRATCH from BottomNavBar
  useEffect(() => {
    if (externalShowDeals) setShowDealsModal(true);
  }, [externalShowDeals]);

  useEffect(() => {
    if (externalShowScratch) setShowScratchGame(true);
  }, [externalShowScratch]);

  // Pulse SPIN button when idle
  useEffect(() => {
    if (!spinning && !cascadeActive) {
      const timer = setTimeout(() => setSpinButtonPulse(true), 4000);
      return () => clearTimeout(timer);
    } else {
      setSpinButtonPulse(false);
    }
  }, [spinning, cascadeActive, lastSpinTime]);

  // Check for scatter anticipation needs
  const checkScatterAnticipation = useCallback((grid: SymbolId[][], doneReels: boolean[]) => {
    if (!doneReels.every(d => d)) return; // Only check when all reels stopped
    
    let scatterCount = 0;
    const scatterPositions: { reelIdx: number; rowIdx: number }[] = [];
    
    for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
      for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        if (isScatterSymbol(grid[reelIdx][rowIdx])) {
          scatterCount++;
          scatterPositions.push({ reelIdx, rowIdx });
        }
      }
    }
    
    if (scatterCount === 2) {
      // 2 scatters visible - trigger anticipation on next spin
      setScatterSlowdownActive(true);
      startScatterAnticipation();
    } else if (scatterCount >= 3) {
      // 3+ scatters - fanfare!
      stopScatterAnticipation();
      setScatterFanfareActive(true);
      if (soundEnabled) playScatterFanfare();
      setTimeout(() => setScatterFanfareActive(false), 2000);
    }
  }, [soundEnabled]);



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
      cascade.resetVisuals();

      if (soundEnabled) {
        playSound("spin");
        if (!bgMusicStarted.current) {
          bgMusicStarted.current = true;
          startBackgroundMusic();
        }
      }

      // Count initial scatters for anticipation
      let initialScatterCount = 0;
      reels.forEach(reel => {
        reel.forEach(symId => {
          if (isScatterSymbol(symId)) initialScatterCount++;
        });
      });

      // Start scatter anticipation sound if 2 scatters visible (rising tension)
      if (scatterSlowdownActive || initialScatterCount === 2) {
        startScatterAnticipation();
      }

      // Determine reel stop timing with scatter anticipation
      const getReelStopDelay = (reelIdx: number): number => {
        const baseDelay = 500 + reelIdx * 220;
        
        // Scatter anticipation: if 2 scatters visible and this is reel 2 or 3, slow down
        if (initialScatterCount === 2 && (reelIdx === 2 || reelIdx === 3)) {
          // Dramatic slowdown for scatter anticipation
          return baseDelay + (reelIdx === 2 ? 400 : 600);
        }
        
        return baseDelay;
      };

      // Stagger reel stops with scatter anticipation timing
      [0, 1, 2, 3, 4].forEach((i) => {
        setTimeout(() => {
          setReelDone((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
          
          if (soundEnabled) {
            const reelSymbols = reels[i];
            
            // Check for scatter on this reel
            const hasScatter = reelSymbols.some(s => isScatterSymbol(s));
            const hasWild = reelSymbols.some(s => isWildSymbol(s));
            
            if (hasScatter && scatterSlowdownActive) {
              // This reel has scatter during anticipation - fanfare!
              stopScatterAnticipation();
              playScatterFanfare();
              playSound("scatter_land");
              setScatterFanfareActive(true);
              setTimeout(() => setScatterFanfareActive(false), 1500);
            } else if (hasWild) {
              playSound("wild_land");
            } else {
              playSound("reel_stop");
            }
          }
          
          // After all reels done, check for scatter anticipation on next spin
          if (i === 4) {
            setTimeout(() => {
              stopScatterAnticipation();
              checkScatterAnticipation(reels, [true, true, true, true, true]);
            }, 100);
          }
        }, getReelStopDelay(i));
      });
    }
    prevSpinning.current = spinning;
  }, [spinning, soundEnabled, reels, checkScatterAnticipation, scatterSlowdownActive]);

  // Show win after spinning stops (and trigger cascades)
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

          // Enhanced Screen shake based on win tier
          const shakeMap: Record<string, 'light' | 'medium' | 'heavy'> = {
            JACKPOT: 'heavy',
            MEGA_WIN: 'heavy',
            BIG_WIN: 'medium',
            SMALL_WIN: 'light',
            HUNTRESS_BONUS: 'medium',
          };
          const shake = lastWinType ? (shakeMap[lastWinType] || 'light') : 'none';
          setShakeIntensity(shake);
          
          // If it's a mega win or jackpot, add an extra "impact" shake
          if (shake === 'heavy') {
            setTimeout(() => setShakeIntensity('medium'), 400);
            setTimeout(() => setShakeIntensity('none'), 800);
          } else {
            const shakeDuration = shake === 'medium' ? 500 : 300;
            setTimeout(() => setShakeIntensity('none'), shakeDuration);
          }

          // Show big win overlay for significant wins
          if (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") {
            setTimeout(() => setShowBigWin(true), 600);
          }

          if (!soundMuted) {
            const winLineCount = winLines.length;
            if (lastWinType === "JACKPOT") {
              playSound("jackpot");
            } else if (lastWinType === "MEGA_WIN") {
              playSound("mega_win");
              if (winLineCount >= 3) {
                setTimeout(() => playSound("multi_win"), 400);
              }
            } else if (lastWinType === "BIG_WIN") {
              playSound("big_win");
              if (winLineCount >= 2) {
                setTimeout(() => playSound("multi_win"), 400);
              }
            } else if (lastWinType === "SMALL_WIN") {
              playWinSound(winLineCount);
            } else {
              playWinSound(winLineCount);
            }
          }

          // Trigger cascade system
          if (winLines.length > 0) {
            startCascade(reels, winLines);
          }
        } else {
          // No win - check for near miss for "almost" excitement
          const misses = findNearMiss(reels, []);
          if (misses.length > 0 && !spinning) {
            cascade.setNearMissCells(new Set(misses.map(m => `${m.reelIdx}-${m.rowIdx}`)));
            cascade.setNearMissAnimating(true);
            setTimeout(() => {
              cascade.setNearMissAnimating(false);
              setTimeout(() => cascade.setNearMissCells(new Set()), 300);
            }, 800);
          }
        }
        // No sound on losing spins — silence only
      }, 400);
    }
  }, [spinning, spinCount, winAmount, lastWinType, soundEnabled, reels, winLines, startCascade, findNearMiss, soundMuted]);

  const canSpin = !spinning && !cascadeActive && (coins >= bet || freeSpins > 0);
  const totalBet = bet * (paylines || 1);



  return (
    <div 
      className={`w-full max-w-3xl mx-auto flex flex-col items-center gap-0 pb-0 ${shakeIntensity !== 'none' ? `screen-shake-${shakeIntensity}` : ''}`}
      style={{ minHeight: "450px" }}
    >
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

        <div className="glass-card" style={{ borderBottom: "none", borderRadius: "0.75rem 0.75rem 0 0" }}>
          {/* Gold top line */}
          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, #F5E6C8, #D4AF37, transparent)" }} />

          {/* Logo area — compact */}
          <div className="py-1 px-3 flex items-center justify-between">
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
          <div className="overflow-hidden" style={{ borderTop: "1px solid rgba(212,175,55,0.15)", padding: "2px 0" }}>
            <div className="marquee-text text-xs font-numbers px-4" style={{ color: "#C8860A", fontSize: "0.65rem" }}>
              ◆ FREE SWEEPSTAKES GAME — NO REAL MONEY ◆ MATCH 3+ SYMBOLS TO WIN ◆ 🍀 WILD CLOVER SUBSTITUTES ALL ◆ ⭐ 3 SCATTERS = 10 FREE SPINS ◆ ⭐ 5 SCATTERS = JACKPOT ◆ 🗡️ 3 HUNTRESS = BONUS ROUND ◆ JACKPOT GROWS WITH EVERY SPIN ◆
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO DISPLAY PANEL ── */}
      <div className="glass-panel grid grid-cols-3 gap-2 px-2 py-1.5" style={{ width: "100%", borderTop: "none", borderBottom: "none" }}>
        {/* Balance */}
        <div className="rounded text-center py-1.5 px-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.55)", fontSize: "0.6rem" }}>
            Balance
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
              ? "rgba(255,215,0,0.05)"
              : "rgba(76,175,80,0.05)",
            border: selectedCurrency === 'gold'
              ? "1px solid rgba(255,215,0,0.2)"
              : "1px solid rgba(76,175,80,0.2)",
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
          background: "linear-gradient(180deg, #020208 0%, #060614 50%, #020208 100%)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderTop: "none",
          borderBottom: "none",
          padding: "4px 4px",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)",
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

        {/* Cascade multiplier popup */}
        <CascadeMultiplierDisplay level={cascadeLevel} active={showCascadeMultiplier} />

        {/* Win line highlight overlay */}
        <WinLineHighlight winLines={winLines} show={showWin && !cascadeActive} />

        {/* Payline highlights for each winning line */}
        {showWin && winLines.map((line, idx) => (
          <PaylineHighlight key={idx} paylineIndex={line.row} isActive={true} reelCount={5} rowCount={3} />
        ))}

        {/* Idle animations */}
        <IdleAnimations spinning={spinning} lastSpinTime={lastSpinTime} />

        <ReelGrid
          displayGrid={displayGrid}
          reelDone={reelDone}
          spinning={spinning}
          showWin={showWin}
          cascadeActive={cascadeActive}
          cascadeWinningCells={cascadeWinningCells}
          cascadeAnimatingCells={cascadeAnimatingCells}
          scatterSlowdownActive={scatterSlowdownActive}
          scatterFanfareActive={scatterFanfareActive}
          wildLockAnimating={wildLockAnimating}
          stickyWildCells={stickyWildCells}
          nearMissCells={nearMissCells}
          nearMissAnimating={nearMissAnimating}
          winLines={winLines}
        />

        <WinMessage
          showWin={showWin}
          winAmount={winAmount}
          lastWinType={lastWinType}
          cascadeActive={cascadeActive}
          cascadeLevel={cascadeLevel}
          spinning={spinning}
          coins={coins}
          bet={bet}
          freeSpins={freeSpins}
        />
      </div>

      {/* ── PROFESSIONAL CONTROLS PANEL ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #060610 100%)",
          border: "2px solid #D4AF37",
          borderTop: "none",
          borderRadius: "0 0 0.75rem 0.75rem",
          padding: "8px",
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
            className="w-full rounded-full font-display font-black tracking-wider transition-all relative overflow-hidden"
            onPointerDown={() => canSpin && soundEnabled && playSound("button_click")}
            onMouseDown={(e) => {
              if (canSpin) {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(255,215,0,1), 0 0 80px rgba(255,215,0,0.7), 0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.3)";
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              padding: "clamp(12px, 2.5vw, 18px) clamp(16px, 4vw, 32px)",
              fontSize: "clamp(1.1rem, 3.5vw, 1.6rem)",
              background: canSpin
                ? "linear-gradient(135deg, #D4AF37 0%, #F5E6C8 30%, #FFD700 50%, #D4AF37 70%, #8B5E0A 100%)"
                : "linear-gradient(135deg, #1a1a2a, #2a2a3a)",
              border: `1px solid ${canSpin ? "rgba(245,230,200,0.6)" : "rgba(212,175,55,0.15)"}`,
              color: canSpin ? "#06060f" : "#444",
              boxShadow: canSpin
                ? spinButtonPulse
                  ? "0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3), 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)"
                  : "0 0 20px rgba(212,175,55,0.3), 0 0 50px rgba(212,175,55,0.1), 0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "none",
              cursor: canSpin ? "pointer" : "not-allowed",
              textShadow: canSpin ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              animation: canSpin && spinButtonPulse ? "spinBtnPulse 1.2s ease-in-out infinite" : "none",
              letterSpacing: "0.15em",
              transform: "translateY(0)",
              transition: "transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s ease",
            }}
            title="Click to spin the reels"
          >
            {/* Inner shine overlay */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: canSpin
                  ? "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 100%)"
                  : "none",
                pointerEvents: "none",
              }}
            />
            {cascadeActive
              ? `⟳ CASCADE ${cascadeLevel}x...`
              : freeSpins > 0
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
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 hover:brightness-125 active:scale-95"
            style={{
              background: "rgba(100,180,255,0.08)",
              border: "1px solid rgba(100,180,255,0.3)",
              color: "#88CCFF",
              boxShadow: "0 0 8px rgba(100,180,255,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            DEALS
          </button>
          <button
            onClick={() => {
              setShowScratchGame(true);
              if (soundEnabled) playSound("button_click");
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 hover:brightness-125 active:scale-95"
            style={{
              background: "rgba(255,107,107,0.08)",
              border: "1px solid rgba(255,107,107,0.3)",
              color: "#FFB6B6",
              boxShadow: "0 0 8px rgba(255,107,107,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            SCRATCH
          </button>
          <button
            onClick={() => {
              setAutoplay(!autoplay);
              if (soundEnabled) playSound("button_click");
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: autoplay
                ? "rgba(76,175,80,0.12)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${autoplay ? "rgba(76,175,80,0.4)" : "rgba(212,175,55,0.2)"}`,
              color: autoplay ? "#90EE90" : "#D4AF37",
              boxShadow: autoplay ? "0 0 12px rgba(76,175,80,0.2)" : "none",
              backdropFilter: "blur(4px)",
            }}
          >
            {autoplay ? "STOP" : "AUTO"}
          </button>
        </div>

        {/* ── Bet Controls — Desktop ── */}
        <div className="hidden sm:block mb-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Bet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)" }}>
                  Bet Per Line
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { const nb = Math.max(10, bet - BET_DECREMENT); setBet(nb); if (soundEnabled) playSound("button_click"); }}
                    disabled={spinning || cascadeActive}
                    className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center transition-all"
                    style={{
                      background: spinning || cascadeActive ? "rgba(255,255,255,0.03)" : "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      color: spinning || cascadeActive ? "#444" : "#C8860A",
                    }}
                  >−</button>
                  <button
                    onClick={() => { const nb = Math.min(200, bet + BET_INCREMENT); setBet(nb); if (soundEnabled) playSound("button_click"); }}
                    disabled={spinning || cascadeActive}
                    className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center transition-all"
                    style={{
                      background: spinning || cascadeActive ? "rgba(255,255,255,0.03)" : "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      color: spinning || cascadeActive ? "#444" : "#C8860A",
                    }}
                  >+</button>
                </div>
              </div>
              <div className="flex gap-1">
                {BET_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => { if (!spinning && !cascadeActive) { setBet(b); if (soundEnabled) playSound("button_click"); } }}
                    disabled={spinning || cascadeActive}
                    className="flex-1 py-1.5 text-xs rounded font-numbers font-bold transition-all hover:scale-105"
                    style={{
                      background: bet === b ? "linear-gradient(135deg, #C8860A, #D4AF37)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${bet === b ? "#F5E6C8" : "rgba(212,175,55,0.2)"}`,
                      color: bet === b ? "#0a0a1a" : "#D4AF37",
                      boxShadow: bet === b ? "0 0 12px rgba(212,175,55,0.4)" : "none",
                      opacity: spinning || cascadeActive ? 0.5 : 1,
                    }}
                  >{b}</button>
                ))}
              </div>
            </div>

            {/* Paylines */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-numbers uppercase tracking-widest" style={{ color: "rgba(76,175,80,0.6)" }}>
                  Paylines
                </div>
                <button
                  onClick={() => { if (!spinning && !cascadeActive) { setBet(200); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning || cascadeActive}
                  className="px-2 py-0.5 rounded text-xs font-numbers font-bold transition-all"
                  style={{
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    color: "#C8860A",
                    opacity: spinning || cascadeActive ? 0.5 : 1,
                  }}
                >MAX BET</button>
              </div>
              <div className="flex gap-1">
                {PAYLINE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { if (!spinning && !cascadeActive && setPaylines) { setPaylines(p); if (soundEnabled) playSound("button_click"); } }}
                    disabled={spinning || cascadeActive}
                    className="flex-1 py-1.5 text-xs rounded font-numbers font-bold transition-all hover:scale-105"
                    style={{
                      background: paylines === p ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${paylines === p ? "rgba(76,175,80,0.5)" : "rgba(76,175,80,0.15)"}`,
                      color: paylines === p ? "#90EE90" : "rgba(212,175,55,0.5)",
                      boxShadow: paylines === p ? "0 0 12px rgba(76,175,80,0.2)" : "none",
                      opacity: spinning || cascadeActive ? 0.5 : 1,
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
            <div className="text-xs font-numbers uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.6rem" }}>BET</div>
            <div className="flex gap-0.5 flex-wrap">
              {[10, 25, 50, 100, 200].map((b) => (
                <button
                  key={b}
                  onClick={() => { if (!spinning && !cascadeActive) { setBet(b); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning || cascadeActive}
                  className="flex-1 min-w-[2rem] py-1 text-xs rounded font-numbers font-bold"
                  style={{
                    background: bet === b ? "linear-gradient(135deg, #C8860A, #D4AF37)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${bet === b ? "#F5E6C8" : "rgba(212,175,55,0.15)"}`,
                    color: bet === b ? "#0a0a1a" : "#D4AF37",
                    opacity: spinning || cascadeActive ? 0.5 : 1,
                    fontSize: "0.65rem",
                  }}
                >{b}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-numbers uppercase tracking-widest mb-1" style={{ color: "rgba(76,175,80,0.5)", fontSize: "0.6rem" }}>LINES</div>
            <div className="flex gap-0.5 flex-wrap">
              {[1, 5, 10, 15, 20, 25].map((p) => (
                <button
                  key={p}
                  onClick={() => { if (!spinning && !cascadeActive && setPaylines) { setPaylines(p); if (soundEnabled) playSound("button_click"); } }}
                  disabled={spinning || cascadeActive}
                  className="flex-1 min-w-[2rem] py-1 text-xs rounded font-numbers font-bold"
                  style={{
                    background: paylines === p ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${paylines === p ? "rgba(76,175,80,0.5)" : "rgba(76,175,80,0.15)"}`,
                    color: paylines === p ? "#90EE90" : "rgba(212,175,55,0.5)",
                    opacity: spinning || cascadeActive ? 0.5 : 1,
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
            }}
            className="px-3 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:brightness-125"
            style={{
              background: soundMuted ? "rgba(255,107,107,0.08)" : "rgba(76,175,80,0.08)",
              border: soundMuted ? "1px solid rgba(255,107,107,0.3)" : "1px solid rgba(76,175,80,0.3)",
              color: soundMuted ? "#FF6B6B" : "#90EE90",
            }}
          >
            {soundMuted ? "MUTE" : "SOUND"}
          </button>
          {onCoinShop && (
            <button
              onClick={onCoinShop}
              className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105"
              style={{
                background: "rgba(76,175,80,0.08)",
                border: "1px solid rgba(76,175,80,0.3)",
                color: "#90EE90",
              }}
            >
              SHOP
            </button>
          )}
          <button
            onClick={() => {
              const btn = document.querySelector('[data-paytable-toggle]');
              if (btn) (btn as HTMLButtonElement).click();
            }}
            className="flex-1 py-2 rounded-lg font-numbers font-bold text-xs tracking-wider transition-all hover:scale-105"
            style={{
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "#D4AF37",
            }}
          >
            RULES
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
        @keyframes winBounce {
          0% { transform: scale(1); }
          15% { transform: scale(1.3); }
          30% { transform: scale(0.92); }
          45% { transform: scale(1.12); }
          60% { transform: scale(0.97); }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes winFlashBg {
          0%, 100% { opacity: 0; }
          10%, 30%, 50%, 70%, 90% { opacity: 1; }
          20%, 40%, 60%, 80% { opacity: 0; }
        }
        @keyframes winFlashReel {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(2.5) saturate(1.5); }
        }
        @keyframes screenShakeLight {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, -1px); }
          50% { transform: translate(2px, 1px); }
          75% { transform: translate(-1px, 2px); }
        }
        @keyframes screenShakeMedium {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, -3px); }
          20% { transform: translate(4px, 3px); }
          30% { transform: translate(-4px, 3px); }
          40% { transform: translate(4px, -3px); }
          50% { transform: translate(-3px, 2px); }
          60% { transform: translate(3px, -2px); }
          70% { transform: translate(-2px, 3px); }
          80% { transform: translate(2px, -3px); }
          90% { transform: translate(-1px, 1px); }
        }
        @keyframes screenShakeHeavy {
          0%, 100% { transform: translate(0, 0); }
          5% { transform: translate(-8px, -6px) rotate(-1deg); }
          10% { transform: translate(8px, 6px) rotate(1deg); }
          15% { transform: translate(-8px, 4px) rotate(-0.5deg); }
          20% { transform: translate(8px, -4px) rotate(0.5deg); }
          25% { transform: translate(-6px, -5px); }
          30% { transform: translate(6px, 5px); }
          35% { transform: translate(-5px, 3px); }
          40% { transform: translate(5px, -3px); }
          45% { transform: translate(-4px, 4px); }
          50% { transform: translate(4px, -4px); }
          55% { transform: translate(-3px, 2px); }
          60% { transform: translate(3px, -2px); }
          65% { transform: translate(-2px, 3px); }
          70% { transform: translate(2px, -3px); }
          75% { transform: translate(-2px, 2px); }
          80% { transform: translate(2px, -2px); }
          85% { transform: translate(-1px, 1px); }
          90% { transform: translate(1px, -1px); }
        }
        .screen-shake-light { animation: screenShakeLight 0.3s ease-in-out; }
        .screen-shake-medium { animation: screenShakeMedium 0.5s ease-in-out; }
        .screen-shake-heavy { animation: screenShakeHeavy 0.8s ease-in-out; }
        .screen-shake-heavy svg { transform-origin: center; }
        @keyframes winBanner {
          0% { opacity: 0; transform: scale(0.5) translateY(-20px); }
          40% { opacity: 1; transform: scale(1.15) translateY(0); }
          65% { transform: scale(0.97); }
          80% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes winBannerBig {
          0% { opacity: 0; transform: scale(0.3) rotate(-8deg); }
          35% { opacity: 1; transform: scale(1.2) rotate(3deg); }
          55% { transform: scale(0.95) rotate(-1deg); }
          70% { transform: scale(1.04) rotate(0.5deg); }
          85% { transform: scale(0.99) rotate(0deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes symbolPopWin {
          0% { transform: scale(1); }
          40% { transform: scale(1.45); filter: brightness(2); }
          65% { transform: scale(0.88); }
          82% { transform: scale(1.08); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes bigWinTrail {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes megaWinPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(255,107,53,0.8), 0 0 40px rgba(255,107,53,0.4); }
          50% { text-shadow: 0 0 40px rgba(255,107,53,1), 0 0 80px rgba(255,107,53,0.7); }
        }
        @keyframes jackpotPulse {
          0%, 100% { text-shadow: 0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.5); }
          50% { text-shadow: 0 0 60px rgba(255,215,0,1), 0 0 120px rgba(255,215,0,0.8), 0 0 200px rgba(255,215,0,0.5); }
        }
        .symbol-win-pop {
          animation: symbolPopWin 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both !important;
        }
        @keyframes symbolBounce {
          0% { transform: scale(1); }
          15% { transform: scale(1.3); }
          30% { transform: scale(0.9); }
          45% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .symbol-bounce {
          animation: symbolBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes symbolFlash {
          0% { filter: brightness(1) saturate(1); }
          30% { filter: brightness(3) saturate(0); }
          100% { filter: brightness(1) saturate(1); }
        }
        .symbol-flash {
          animation: symbolFlash 0.4s ease-out;
        }
        @keyframes reelWinGlow {
          0%, 100% { box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.2); }
          50% { box-shadow: inset 0 0 30px rgba(0,0,0,0.4), 0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4); }
        }
        
        /* ── Cascade Animations ── */
        @keyframes cascadeDisappear {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
        .cascade-disappear {
          animation: cascadeDisappear 0.4s ease-in forwards;
        }
        
        @keyframes cascadeFall {
          0% { transform: translateY(-100%); opacity: 0; }
          30% { opacity: 0; }
          60% { transform: translateY(10%); }
          100% { transform: translateY(0); opacity: 1; }
        }
        .cascade-fall {
          animation: cascadeFall 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes cascadeSpawn {
          0% { transform: scale(0.5) translateY(-50%); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cascade-spawn {
          animation: cascadeSpawn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        @keyframes cascadeMultiplierPopup {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          70% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes cascadeMultiplierPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes cascadeLevelPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }
        
        /* ── Scatter Anticipation Animations ── */
        @keyframes scatterSlowdown {
          0% { filter: blur(0px); }
          30% { filter: blur(4px) brightness(1.3); }
          60% { filter: blur(6px) brightness(1.5); }
          80% { filter: blur(3px); }
          100% { filter: blur(0px); }
        }
        .scatter-slowdown-reel {
          animation: scatterSlowdown 0.8s ease-in-out;
        }
        
        @keyframes scatterFanfare {
          0% { background: radial-gradient(ellipse at center, rgba(255,107,107,0.3) 0%, transparent 50%); }
          50% { background: radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 60%); }
          100% { background: transparent; }
        }
        .scatter-fanfare {
          animation: scatterFanfare 0.5s ease-out;
        }
        
        /* ── Sticky Wild Animations ── */
        @keyframes stickyWildLock {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .wild-lock-shake {
          animation: stickyWildLock 0.6s ease-in-out;
        }
        
        @keyframes stickyWildPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .sticky-wild-glow {
          animation: stickyWildPulse 0.8s ease-in-out infinite;
        }
        
        @keyframes stickyWildCelebrate {
          0% { transform: scale(1); filter: brightness(1); }
          25% { transform: scale(1.3); filter: brightness(1.5); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
          75% { transform: scale(1.2); filter: brightness(1.4); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .sticky-wild-celebrate {
          animation: stickyWildCelebrate 0.8s ease-out;
        }
        
        /* ── Near-Miss Animations ── */
        @keyframes nearMissJiggle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(-4px) rotate(-2deg); }
          30% { transform: translateX(4px) rotate(2deg); }
          45% { transform: translateX(-3px) rotate(-1deg); }
          60% { transform: translateX(3px) rotate(1deg); }
          75% { transform: translateX(-2px) rotate(0deg); }
          90% { transform: translateX(2px) rotate(0deg); }
        }
        .near-miss-jiggle {
          animation: nearMissJiggle 0.6s ease-in-out;
        }
        
        @keyframes nearMissGold {
          0% { 
            box-shadow: 0 0 0 rgba(255,215,0,0);
            filter: brightness(1);
          }
          30% { 
            box-shadow: 0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.4);
            filter: brightness(1.5);
          }
          60% { 
            box-shadow: 0 0 20px rgba(255,215,0,0.6), inset 0 0 15px rgba(255,215,0,0.3);
            filter: brightness(1.3);
          }
          100% { 
            box-shadow: 0 0 0 rgba(255,215,0,0);
            filter: brightness(1);
          }
        }
        .near-miss-gold {
          animation: nearMissGold 0.8s ease-out;
        }
        
        /* ── Empty Cell Animation ── */
        @keyframes emptyCellFade {
          0% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .empty-cell {
          animation: emptyCellFade 0.3s ease-out forwards;
        }
      `}</style>
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
                  <SymbolIcon symbolId={sym.id} size={22} />
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
                <div className="mt-2" style={{ color: "rgba(255,107,53,0.7)" }}>
                  🔥 CASCADE SYSTEM: Consecutive wins multiply up to 5x! 🔥
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}