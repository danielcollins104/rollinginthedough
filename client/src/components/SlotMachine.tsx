/**
 * Rolling in the Dough — Slot Machine Component
 * AUTHENTIC CASINO CABINET UI based on real video slot machines
 * Features: Physical cabinet with LED edge lighting, 7-segment displays,
 *           glass bezel, prominent SPIN button, gold/black aesthetic
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { SYMBOLS, type SymbolId, type WinLine, type WinType } from "@/hooks/useGameState";
import { playSound, playWinSound } from "@/lib/sounds";
import { WinParticles } from "./WinParticles";
import { soundManager } from "@/lib/soundManager";
import ScratchGame from "./ScratchGame";
import DealsModal from "./DealsModal";
import BigWinOverlay from "./BigWinOverlay";
import JackpotMeters from "./JackpotMeters";
import WinLineHighlight from "./WinLineHighlight";
import SymbolIcon from "./SymbolIcon";
import FreeSpinsDisplay from "./FreeSpinsDisplay";
import IdleAnimations from "./IdleAnimations";
import PaylineHighlight from "./PaylineHighlight";

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

function CabinetTopGlass({ freeSpins }: { freeSpins: number }) {
  return (
    <div className="relative" style={{
      background: "linear-gradient(180deg, #1a1005 0%, #2d1f0a 40%, #3d2a0f 100%)",
      borderBottom: "3px solid #D4AF37",
      borderRadius: "1rem 1rem 0 0",
      padding: "12px 16px 8px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Cabinet edge lighting - top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{
        background: "linear-gradient(90deg, #D4AF37, #F5E6C8, #FFD700, #F5E6C8, #D4AF37)",
        boxShadow: "0 0 20px #FFD700, 0 0 40px #D4AF37",
        animation: "cabinetGlow 3s ease-in-out infinite",
      }} />
      
      {/* Game title area */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Side cabinet ornament */}
          <div className="w-10 h-10" style={{
            background: "linear-gradient(135deg, #8B5E0A, #C8860A, #FFD700, #C8860A, #8B5E0A)",
            borderRadius: "50%",
            boxShadow: "0 0 15px rgba(212,175,55,0.8), inset 0 2px 4px rgba(255,255,255,0.3)",
            border: "2px solid #F5E6C8",
            animation: "cabinetOrnamentGlow 5s ease-in-out infinite",
          }} />
          <div className="text-center">
            <div className="font-display font-black tracking-widest uppercase text-gold-gradient" 
                 style={{ fontSize: "clamp(1rem, 3.5vw, 1.5rem)", letterSpacing: "0.1em", textShadow: "0 0 20px rgba(212,175,55,0.8)" }}>
              Rolling in the Dough
            </div>
            <div className="font-numbers tracking-wider uppercase" style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.8rem)", color: "#C8860A" }}>
              ◆ Sweepstakes Slots ◆
            </div>
          </div>
          <div className="w-10 h-10" style={{
            background: "linear-gradient(135deg, #8B5E0A, #C8860A, #FFD700, #C8860A, #8B5E0A)",
            borderRadius: "50%",
            boxShadow: "0 0 15px rgba(212,175,55,0.8), inset 0 2px 4px rgba(255,255,255,0.3)",
            border: "2px solid #F5E6C8",
            transform: "scaleX(-1)",
            animation: "cabinetOrnamentGlow 5s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Free spins badge */}
      <FreeSpinsDisplay freeSpins={freeSpins} />

      {/* Scrolling marquee - legal disclaimer */}
      <div className="overflow-hidden" style={{
        background: "linear-gradient(90deg, #0a0500, #1a1000, #0a0500)",
        border: "1px solid rgba(212,175,55,0.3)",
        borderRadius: "0.5rem",
        padding: "4px 8px",
        marginTop: "8px",
      }}>
        <div className="marquee-text text-xs font-numbers px-2" style={{ color: "#C8860A", fontSize: "0.6rem" }}>
          ◆ FREE SWEEPSTAKES GAME — NO PURCHASE NECESSARY ◆ MATCH 3+ SYMBOLS TO WIN ◆ 🍀 WILD SUBSTITUTES ALL ◆ ⭐ 3 SCATTERS = 10 FREE SPINS ◆ ⭐ 5 SCATTERS = JACKPOT ◆ 🗡️ 3 HUNTRESS = BONUS ROUND ◆ JACKPOT GROWS WITH EVERY SPIN ◆
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
      padding: "8px 12px",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)",
      minWidth: "120px",
    }}>
      <div className="text-[0.6rem] font-numbers uppercase tracking-widest mb-1" style={{ color: labelColor }}>
        {label}
      </div>
      <div 
        className="font-numbers tabular-nums text-center"
        style={{ 
          fontSize: "clamp(1.2rem, 4vw, 2rem)", 
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
    "🍀 WILD substitutes all except scatter",
    "⭐ 3 SCATTERS = 10 FREE SPINS",
    "⭐ 5 SCATTERS = JACKPOT",
    "🗡️ 3+ HUNTRESS = BONUS ROUND",
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

// Physics-based spinning reel strip with elastic slam stop
function ReelStrip({ symbols, spinning, done, size = 56, reelIndex = 0 }: { symbols: SymbolId[]; spinning: boolean; done: boolean; size?: number; reelIndex?: number }) {
  const [translateY, setTranslateY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [animFrame, setAnimFrame] = useState<number | null>(null);
  const [stripSymbols, setStripSymbols] = useState<SymbolId[]>(() => {
    return Array.from({ length: 20 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id);
  });

  useEffect(() => {
    if (spinning && !done) {
      const startTime = Date.now();
      const targetVelocity = size * 22;
      const acceleration = targetVelocity / 15;
      
      let currentVelocity = 0;
      let currentY = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const frameId = requestAnimationFrame(animate);
        setAnimFrame(frameId);
        
        if (elapsed < 250) {
          currentVelocity = Math.min(currentVelocity + acceleration, targetVelocity);
        } else {
          currentVelocity = targetVelocity + Math.sin(elapsed * 0.01) * 50;
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
      
      const animateStop = () => {
        const stiffness = 0.08;
        const damping = 0.12;
        const displacement = currentY - targetY;
        
        const acceleration = -stiffness * displacement - damping * currentV;
        currentV += acceleration;
        currentY += currentV / 60;
        
        const settled = Math.abs(displacement) < 0.5 && Math.abs(currentV) < 0.5;
        
        setTranslateY(currentY);
        setVelocity(currentV);
        
        if (!settled) {
          const frameId = requestAnimationFrame(animateStop);
          setAnimFrame(frameId);
        } else {
          setTranslateY(targetY);
          setVelocity(0);
          window.dispatchEvent(new CustomEvent('reel-slam', { detail: { reelIndex } }));
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
    const visibleCount = Math.ceil(360 / size) + 2;
    
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ transform: `translateY(${translateY}px)` }}>
        {Array.from({ length: visibleCount }, (_, i) => {
          const idx = (startIdx + i) % stripSymbols.length;
          const symId = stripSymbols[idx];
          const sym = getSymbol(symId);
          const blur = Math.min(Math.abs(velocity) / (size * 22), 1) * 4;
          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center"
              style={{ 
                filter: `blur(${blur}px)`, 
                opacity: Math.max(0.3, 1 - blur * 0.15)
              }}
            >
              <SymbolIcon symbolId={sym.id} size={Math.floor(size * 0.9)} />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function ReelWindow({ reels, spinning, reelDone, winLines, showWin, cascadeActive, cascadeWinningCells, cascadeAnimatingCells, cascadeGrid, stickyWildCells, wildLockAnimating, nearMissCells, nearMissAnimating, scatterSlowdownActive, lastWinType, scatterFanfareActive }: any) {
  const displayGrid: SymbolId[][] = cascadeGrid || reels;

  return (
    <div className="relative" style={{
      background: "linear-gradient(180deg, #030308 0%, #080814 50%, #030308 100%)",
      border: "4px solid #1a1005",
      borderRadius: "8px",
      boxShadow: "inset 0 0 60px rgba(0,0,0,0.9), inset 0 2px 0 rgba(212,175,55,0.1), 0 0 30px rgba(212,175,55,0.1)",
      padding: "8px",
      position: "relative",
    }}>
      {/* Reel glass bezel - inner glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        border: "2px solid rgba(212,175,55,0.15)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 40px rgba(212,175,55,0.05)",
      }} />

      {/* Payline indicator dots on sides */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex flex-col gap-1 z-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `hsl(${(i * 30) % 360}, 100%, 55%)`,
              boxShadow: `0 0 8px hsl(${(i * 30) % 360}, 100%, 55%)`,
              animation: `paylinePulse 1.5s ease-in-out ${i * 0.1}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex flex-col gap-1 z-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `hsl(${(i * 30) % 360}, 100%, 55%)`,
              boxShadow: `0 0 8px hsl(${(i * 30) % 360}, 100%, 55%)`,
              animation: `paylinePulse 1.5s ease-in-out ${i * 0.1}s infinite`,
              opacity: 0.6,
            }}
          />
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

      {/* Reels */}
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {displayGrid.map((reel, reelIdx) => (
          <div
            key={reelIdx}
            className={`reel-container rounded relative ${scatterSlowdownActive && reelIdx >= 2 && reelIdx <= 4 ? 'scatter-anticipation' : ''} ${scatterSlowdownActive && reelIdx === 2 ? 'scatter-slowdown-reel' : ''} ${wildLockAnimating && stickyWildCells.has(`${reelIdx}-${getPaylinePath(0)[reelIdx]}`) ? 'wild-lock-shake' : ''}`}
            style={{
              minHeight: "200px",
              height: "100%",
              maxHeight: "500px",
              transition: "box-shadow 0.3s ease",
              background: "linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #050510 100%)",
              border: "2px solid rgba(212,175,55,0.1)",
              borderRadius: "6px",
              boxShadow: reelDone[reelIdx] && showWin && !cascadeActive && reel.some((_, rowIdx) => isWinningCell(reelIdx, rowIdx, winLines))
                ? "0 0 30px rgba(255,215,0,0.7), inset 0 0 20px rgba(255,215,0,0.15)"
                : "inset 0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(212,175,55,0.3)",
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

            {/* Spinning blur overlay */}
            <ReelStrip symbols={reel} spinning={spinning} done={reelDone[reelIdx]} reelIndex={reelIdx} />

            {/* Symbols */}
            {reel.map((symId, rowIdx) => {
              const isWin = showWin && !cascadeActive && isWinningCell(reelIdx, rowIdx, winLines);
              const isCascadeWinner = cascadeWinningCells.has(`${reelIdx}-${rowIdx}`);
              const isCascadeAnimating = cascadeAnimatingCells.has(`${reelIdx}-${rowIdx}`);
              const isStickyWild = stickyWildCells.has(`${reelIdx}-${rowIdx}`);
              const isNearMiss = nearMissCells.has(`${reelIdx}-${rowIdx}`);
              const sym = getSymbol(symId);

              return (
                <div
                  key={rowIdx}
                  className={`
                    flex items-center justify-center transition-all duration-300 
                    ${isWin ? "cell-win-glow symbol-win" : ""}
                    ${isCascadeWinner ? "cascade-disappear" : ""}
                    ${isCascadeAnimating && !isCascadeWinner ? "cascade-fall" : ""}
                    ${isStickyWild && wildLockAnimating ? "sticky-wild-lock" : ""}
                    ${isStickyWild && !wildLockAnimating ? "sticky-wild-glow" : ""}
                    ${isNearMiss && nearMissAnimating ? "near-miss-gold" : ""}
                    ${symId === 'empty' ? "empty-cell" : ""}
                  `}
                  style={{
                    flex: "1 1 0%",
                    minHeight: 0,
                    background: isWin
                      ? `radial-gradient(circle at center, ${sym.bgColor}ff 0%, #050510 100%)`
                      : isCascadeWinner
                      ? `radial-gradient(circle at center, ${sym.bgColor}66 0%, #050510 100%)`
                      : `radial-gradient(circle at center, ${sym.bgColor}55 0%, #030308 100%)`,
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
                    <SymbolIcon
                      symbolId={symId}
                      size={56}
                      className={`${isWin ? 'symbol-win-pop symbol-bounce' : ''}`}
                      style={{
                        filter: isWin ? "brightness(1.3) drop-shadow(0 0 8px #FFD700)" : "none",
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

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

function CabinetButtonPanel({
  bet, setBet, paylines, setPaylines, spin, autoplay, setAutoplay,
  canSpin, totalBet, coins, onCoinShop, soundEnabled, setSoundMuted, soundMuted,
  spinButtonPulse, shakeIntensity, selectedCurrency, spinning
}: any) {
  return (
    <div className="w-full px-2 pb-4" style={{
      background: "linear-gradient(180deg, #0a0a12 0%, #050510 100%)",
      borderRadius: "0 0 16px 16px",
      padding: "16px 0 8px",
      boxShadow: "inset 0 2px 0 rgba(0, 150, 255, 0.2), 0 -4px 20px rgba(0,0,0,0.5)",
      borderTop: "1px solid rgba(212,175,55,0.1)",
    }}>
      {/* Bet / Lines Row */}
      <div className="flex items-center justify-between gap-3 mb-3 px-2 overflow-x-auto scrollbar-hide" style={{ minWidth: 0 }}>
        {/* Bet controls */}
        <div className="flex items-center gap-2 shrink-0" style={{ background: "rgba(0,0,0,0.4)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.2)" }}>
          <button
            onClick={() => setBet(Math.max(10, bet - 10))}
            disabled={spinning || bet <= 10}
            className="w-10 h-10 rounded-full font-bold text-lg transition-all"
            style={{
              background: "linear-gradient(180deg, #3a2a00, #1a1500)",
              border: "2px solid #D4AF37",
              color: "#FFD700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            −
          </button>
          <div className="w-20 text-center font-numbers tabular-nums" style={{ 
            fontSize: "1.1rem", 
            color: "#FFD700",
            textShadow: "0 0 10px rgba(212,175,55,0.5)",
          }}>
            {bet}
          </div>
          <button
            onClick={() => setBet(Math.min(200, bet + 10))}
            disabled={spinning || bet >= 200}
            className="w-10 h-10 rounded-full font-bold text-lg transition-all"
            style={{
              background: "linear-gradient(180deg, #3a2a00, #1a1500)",
              border: "2px solid #D4AF37",
              color: "#FFD700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            +
          </button>
        </div>

        {/* Paylines controls */}
        <div className="flex items-center gap-2 shrink-0" style={{ background: "rgba(0,0,0,0.4)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.2)" }}>
          <button
            onClick={() => setPaylines?.(Math.max(1, (paylines || 1) - 1))}
            disabled={spinning || (paylines || 1) <= 1}
            className="w-10 h-10 rounded-full font-bold text-lg transition-all"
            style={{
              background: "linear-gradient(180deg, #2a1a00, #1a1000)",
              border: "2px solid #FFA500",
              color: "#FFD700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            −
          </button>
          <div className="w-16 text-center font-numbers tabular-nums" style={{ 
            fontSize: "1.1rem", 
            color: "#FFD700",
            textShadow: "0 0 10px rgba(212,175,55,0.5)",
          }}>
            {paylines || 1} LINES
          </div>
          <button
            onClick={() => setPaylines?.(Math.min(25, (paylines || 1) + 1))}
            disabled={spinning || (paylines || 1) >= 25}
            className="w-10 h-10 rounded-full font-bold text-lg transition-all"
            style={{
              background: "linear-gradient(180deg, #2a1a00, #1a1000)",
              border: "2px solid #FFA500",
              color: "#FFD700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            +
          </button>
        </div>

        {/* Total Bet Display */}
        <div className="flex-1 min-w-0" style={{ marginLeft: "auto" }}>
          <div className="text-right">
            <div className="text-[0.55rem] font-numbers uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
              TOTAL BET
            </div>
            <div className="font-numbers tabular-nums" style={{ 
              fontSize: "clamp(1rem, 3vw, 1.4rem)",
              color: selectedCurrency === 'gold' ? "#FFD700" : "#90EE90",
              textShadow: selectedCurrency === 'gold' ? "0 0 10px rgba(255,215,0,0.8)" : "0 0 10px rgba(144,238,144,0.8)",
              fontFamily: '"Orbitron", monospace',
            }}>
              {totalBet.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Button Row */}
      <div className="flex items-center justify-between gap-3 px-2">
        {/* Coin Shop */}
        <button
          onClick={onCoinShop}
          className="flex items-center gap-2 px-4 py-3 rounded-lg shrink-0 transition-all"
          style={{
            background: "linear-gradient(180deg, #3a2a00, #2a1a00)",
            border: "2px solid #D4AF37",
            color: "#FFD700",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: "1.2rem" }}>💰</span>
          <span className="font-numbers">COINS</span>
        </button>

        {/* AUTOSPIN */}
        <button
          onClick={() => setAutoplay(!autoplay)}
          disabled={spinning}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shrink-0 transition-all ${autoplay ? 'ring-2' : ''}`}
          style={{
            background: autoplay 
              ? "linear-gradient(180deg, #3a002a, #2a001a)" 
              : "linear-gradient(180deg, #1a2a1a, #0d1a0d)",
            border: `2px solid ${autoplay ? "#FF6B6B" : "#4CAF50"}`,
            color: autoplay ? "#FF6B6B" : "#90EE90",
            boxShadow: `0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), ${autoplay ? "0 0 20px rgba(255,107,107,0.5)" : "0 0 20px rgba(76,175,80,0.3)"}`,
            fontWeight: 600,
            fontSize: "0.85rem",
            opacity: spinning ? 0.5 : 1,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: "1.2rem" }}>{autoplay ? "⏹" : "▶"}</span>
          <span className="font-numbers">AUTO</span>
        </button>

        {/* SPIN BUTTON - MASSIVE, DOMINANT */}
        <button
          onClick={spin}
          disabled={!canSpin}
          className="flex-1 flex items-center justify-center gap-3 py-5 px-8 rounded-xl transition-all min-h-[80px]"
          style={{
            background: canSpin 
              ? "linear-gradient(180deg, #8B5E0A 0%, #D4AF37 30%, #FFD700 50%, #D4AF37 70%, #8B5E0A 100%)" 
              : "linear-gradient(180deg, #3a2a00, #2a1a00)",
            border: "3px solid #FFD700",
            borderRadius: "20px",
            color: "#1a1000",
            boxShadow: `
              0 8px 30px rgba(0,0,0,0.6),
              0 0 40px rgba(212,175,55,0.6),
              0 0 80px rgba(212,175,55,0.3),
              inset 0 2px 4px rgba(255,255,255,0.3),
              inset 0 -2px 4px rgba(0,0,0,0.3)
            `,
            fontWeight: 900,
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            letterSpacing: "0.1em",
            textShadow: "0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)",
            opacity: canSpin ? 1 : 0.4,
            transform: spinButtonPulse ? "scale(1.02)" : "scale(1)",
            animation: spinButtonPulse ? "spinPulse 1.5s ease-in-out infinite" : "none",
          }}
          onMouseDown={(e) => { if (canSpin) e.currentTarget.style.transform = "scale(0.96)"; }}
          onMouseUp={(e) => { if (canSpin) e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { if (canSpin) e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: "2rem", animation: "spinIconRotate 0.8s linear infinite", display: spinning ? "inline-block" : "none" }}>⟳</span>
          <span className="font-display font-black" style={{ display: spinning ? "none" : "inline" }}>SPIN</span>
          <span style={{ fontSize: "2rem", display: spinning ? "none" : "inline-block" }}>⟳</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className="w-14 h-14 rounded-xl shrink-0 transition-all flex items-center justify-center"
          style={{
            background: soundMuted ? "linear-gradient(180deg, #2a0000, #1a0000)" : "linear-gradient(180deg, #1a1a2a, #0d0d1a)",
            border: `2px solid ${soundMuted ? "#FF6B6B" : "#D4AF37"}`,
            color: soundMuted ? "#FF6B6B" : "#FFD700",
            boxShadow: `0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: "1.5rem" }}>{soundMuted ? "🔇" : "🔊"}</span>
        </button>
      </div>

      {/* Cabinet base - bill validator / ticket printer simulation */}
      <div className="w-full mt-4 flex items-center justify-center gap-8 px-2" style={{ opacity: 0.6 }}>
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

  // Sync external triggers
  useEffect(() => { if (externalShowDeals) setShowDealsModal(true); }, [externalShowDeals]);
  useEffect(() => { if (externalShowScratch) setShowScratchGame(true); }, [externalShowScratch]);

  // Listen for reel slam events
  useEffect(() => {
    const handleReelSlam = (event: CustomEvent<{ reelIndex: number }>) => {
      const { reelIndex } = event.detail;
      if (!soundEnabled) return;
      
      const shakeIntensity: 'light' | 'medium' | 'heavy' = reelIndex >= 3 ? 'heavy' : reelIndex >= 2 ? 'medium' : 'light';
      setShakeIntensity(shakeIntensity);
      const shakeDuration = shakeIntensity === 'heavy' ? 400 : shakeIntensity === 'medium' ? 300 : 200;
      setTimeout(() => setShakeIntensity('none'), shakeDuration);
      playSound("reel_stop");
    };
    
    window.addEventListener('reel-slam', handleReelSlam as EventListener);
    return () => window.removeEventListener('reel-slam', handleReelSlam as EventListener);
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
            setCascadeLevel(prev => prev + 1);
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
              if (soundEnabled) playSound("wild_lock");
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

          if (!soundMuted) {
            const winLineCount = winLines.length;
            if (lastWinType === "JACKPOT") { playSound("jackpot"); soundManager.playJackpot(); }
            else if (lastWinType === "MEGA_WIN") { playSound("mega_win"); soundManager.playBigWin(); if (winLineCount >= 3) setTimeout(() => playSound("multi_win"), 400); }
            else if (lastWinType === "BIG_WIN") { playSound("big_win"); soundManager.playBigWin(); if (winLineCount >= 2) setTimeout(() => playSound("multi_win"), 400); }
            else { playWinSound(winLines.length); soundManager.playSmallWin(); }
          }

          if (winLines.length > 0) startCascade(reels, winLines);
        } else {
          const misses = findNearMiss(reels, []);
          if (misses.length > 0 && !spinning) {
            setNearMissCells(new Set(misses.map(m => `${m.reelIdx}-${m.rowIdx}`)));
            setNearMissAnimating(true);
            setTimeout(() => { setNearMissAnimating(false); setTimeout(() => setNearMissCells(new Set()), 300); }, 800);
          }
        }
      }, 400);
    }
  }, [spinning, spinCount, winAmount, lastWinType, soundEnabled, reels, winLines, startCascade, soundMuted]);

  const canSpin = !spinning && !cascadeActive && (coins >= bet || freeSpins > 0);
  const totalBet = bet * (paylines || 1);

  return (
    <div 
      className={`w-full max-w-3xl mx-auto flex flex-col items-center gap-0 pb-0 ${shakeIntensity !== 'none' ? `screen-shake-${shakeIntensity}` : ''}`}
      style={{ minHeight: "450px" }}
    >
      {/* Win Particle Animations */}
      <WinParticles trigger={particleTrigger} winAmount={winAmount} isJackpot={lastWinType === "JACKPOT" } />

      {/* Big Win Overlay */}
      {showBigWin && (lastWinType === "BIG_WIN" || lastWinType === "MEGA_WIN" || lastWinType === "JACKPOT") && (
        <BigWinOverlay winType={lastWinType} winAmount={winAmount} onDismiss={() => setShowBigWin(false)} />
      )}

      {/* ── Physical Cabinet Structure ── */}
      <div className="w-full relative" style={{
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
      }}>
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
        <CabinetTopGlass freeSpins={freeSpins} />

        {/* ── Jackpot Meters ── */}
        <div className="w-full px-4 mb-3">
          <CabinetJackpotMeters jackpotPool={jackpotPool} />
        </div>

        {/* ── Game Info Panel ── */}
        <div className="w-full px-4 mb-2">
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

        {/* ── Reel Window ── */}
        <div className="w-full px-4 mb-3">
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

        {/* ── Button Panel ── */}
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
        />
      </div>

      {/* Global styles */}
      <style>{`
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
        .screen-shake-light { animation: screenShakeLight 0.3s ease-out; }
        @keyframes screenShakeLight { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        .screen-shake-medium { animation: screenShakeMedium 0.5s ease-out; }
        @keyframes screenShakeMedium { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-5px, -3px); } 40% { transform: translate(5px, 3px); } 60% { transform: translate(-4px, 2px); } 80% { transform: translate(4px, -2px); } }
        .screen-shake-heavy { animation: screenShakeHeavy 0.8s ease-out; }
        @keyframes screenShakeHeavy { 0%, 100% { transform: translate(0, 0); } 15% { transform: translate(-8px, -5px) rotate(-1deg); } 30% { transform: translate(8px, 5px) rotate(1deg); } 45% { transform: translate(-6px, 3px) rotate(-1deg); } 60% { transform: translate(6px, -3px) rotate(1deg); } 75% { transform: translate(-4px, 2px) rotate(-1deg); } 90% { transform: translate(4px, -2px) rotate(0deg); } }
        .marquee-text { display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite; }
        @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
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