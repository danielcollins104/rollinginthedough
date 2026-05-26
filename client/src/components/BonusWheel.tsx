/**
 * Enhanced Bonus Wheel Spin Game Component
 * Spinning fortune wheel with realistic physics, tick sounds, and dramatic reveals
 * 
 * Features:
 * - 10 segments with varied coin amounts
 * - Realistic physics with bounce at end
 * - Tick sounds as wheel passes segments
 * - Animated pointer that bounces on stop
 * - Dramatic win celebration
 */

import { useState, useEffect, useRef, useCallback } from "react";
import BonusEntrance from "./BonusEntrance";

interface Props {
  baseReward: number;
  maxMultiplier: number;
  onWin: (multiplier: number) => void;
  onTriggerBonus?: (bonusType: "legendary") => void;
}

interface WheelSegment {
  label: string;
  value: number;
  color: string;
  isLegendary?: boolean;
}

// 10-segment wheel with better variety and legendary tier
const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: "1x", value: 1, color: "#2D3748" },
  { label: "1x", value: 1, color: "#1A202C" },
  { label: "2x", value: 2, color: "#4A5568" },
  { label: "2x", value: 2, color: "#2D3748" },
  { label: "3x", value: 3, color: "#2C5282" },
  { label: "3x", value: 3, color: "#1A365D" },
  { label: "4x", value: 4, color: "#276749" },
  { label: "5x", value: 5, color: "#C53030" },
  { label: "5x", value: 5, color: "#9C4221" },
  { label: "10x", value: 10, color: "#D69E2E", isLegendary: true },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const TOTAL_ROTATIONS = 5; // Minimum rotations before stopping
const SPIN_DURATION_BASE = 4000; // Base spin duration
const TICK_INTERVAL_DEGREES = SEGMENT_ANGLE; // Tick every segment

// Play wheel tick sound
function playWheelTick(pitch: number = 1) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = 800 * pitch;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Silently fail
  }
}

// Play win fanfare
function playWheelWin(isHigh: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    if (isHigh) {
      // Epic win sound for high multipliers
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } else {
      // Standard win sound
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const startTime = now + i * 0.12;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    }
  } catch (e) {
    // Silently fail
  }
}

export default function BonusWheel({ baseReward, maxMultiplier, onWin, onTriggerBonus }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ segment: WheelSegment; multiplier: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showEntrance, setShowEntrance] = useState(true);
  const [pointerBounce, setPointerBounce] = useState(false);
  const [coinShower, setCoinShower] = useState(false);
  const [totalFlying, setTotalFlying] = useState(false);
  const [finalZoom, setFinalZoom] = useState(false);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastTickRotation = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Handle entrance complete
  const handleEntranceComplete = useCallback(() => {
    setShowEntrance(false);
    // Auto-start spin after entrance
    setTimeout(() => {
      spinWheel();
    }, 500);
  }, []);

  // Main spin function
  const spinWheel = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);
    setCoinShower(false);
    setTotalFlying(false);
    setFinalZoom(false);

    // Pick winning segment (weighted toward middle-high values)
    const weights = WHEEL_SEGMENTS.map((s, i) => {
      // Higher weight for better segments (but not 10x always)
      const baseWeight = s.value;
      // Middle segments get slight bonus for excitement
      const middleBonus = i >= 3 && i <= 7 ? 1.3 : 1;
      // Legendary has lower probability
      const legendaryPenalty = s.isLegendary ? 0.3 : 1;
      return baseWeight * middleBonus * legendaryPenalty;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const selectedSegment = WHEEL_SEGMENTS[selectedIndex];

    // Calculate final rotation
    // Pointer is at top (180 degrees from start, since SVG starts at -90deg which is actually 270deg)
    // We need the segment center to be at top (pointer position)
    // Segment center = index * angle + angle / 2
    // Pointer at top means rotation = 360 - segmentCenter + 180
    const segmentCenter = selectedIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraRotations = TOTAL_ROTATIONS * 360;
    
    // Target: segment center should be at top (pointer position)
    // If segment center is at 90deg (right side), we need to rotate so it moves to top (180deg)
    // So target = extraRotations + (180 - segmentCenter) + some offset for pointer alignment
    const targetRotation = extraRotations + (180 - segmentCenter) + (SEGMENT_ANGLE / 2);

    const startRotation = rotation;
    const startTime = Date.now();
    const duration = SPIN_DURATION_BASE + Math.random() * 500; // Slight variation

    let lastSegmentIndex = -1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic with bounce effect at the end
      let eased: number;
      if (progress < 0.85) {
        // Main deceleration
        eased = 1 - Math.pow(1 - progress / 0.85, 3);
      } else {
        // Bounce effect in last 15%
        const bounceProgress = (progress - 0.85) / 0.15;
        eased = 1 - Math.pow(1 - 0.85, 3) - (1 - Math.pow(1 - bounceProgress, 2)) * 0.03 * Math.sin(bounceProgress * Math.PI * 3);
      }

      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      setRotation(currentRotation);

      // Play tick sounds when crossing segment boundaries
      const currentSegmentIndex = Math.floor((currentRotation % 360) / SEGMENT_ANGLE);
      if (currentSegmentIndex !== lastSegmentIndex && spinning) {
        const rotationDelta = Math.abs(currentRotation - lastTickRotation.current);
        if (rotationDelta >= TICK_INTERVAL_DEGREES * 0.8) {
          // Vary pitch based on speed (higher pitch = faster rotation)
          const speedFactor = Math.min(1, Math.abs(targetRotation - currentRotation) / 1000);
          playWheelTick(0.8 + speedFactor * 0.4);
          lastTickRotation.current = currentRotation;
        }
        lastSegmentIndex = currentSegmentIndex;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(targetRotation);
        setSpinning(false);
        setResult({ segment: selectedSegment, multiplier: selectedSegment.value });
        
        // Pointer bounce animation
        setTimeout(() => setPointerBounce(true), 100);
        setTimeout(() => setPointerBounce(false), 400);

        // Play appropriate win sound
        playWheelWin(selectedSegment.value >= 5);

        // Show result after pause
        setTimeout(() => setShowResult(true), 500);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [rotation, spinning]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleCollect = () => {
    if (result) {
      // Trigger coin shower animation before closing
      setCoinShower(true);
      
      // After shower, show total flying up
      setTimeout(() => {
        setTotalFlying(true);
      }, 1500);

      // After flying, dramatic pause then zoom
      setTimeout(() => {
        setFinalZoom(true);
      }, 2500);

      // Finally close with reward
      setTimeout(() => {
        onWin(result.multiplier);
      }, 3500);
    }
  };

  // Calculate reward display
  const totalReward = result ? baseReward * result.multiplier : 0;

  return (
    <>
      {/* Bonus Entrance Animation */}
      {showEntrance && <BonusEntrance onComplete={handleEntranceComplete} bonusType="wheel" />}

      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur">
        {/* Header */}
        <div className="text-center mb-4 px-4">
          <div
            className="font-display font-black text-2xl sm:text-3xl mb-1"
            style={{
              background: "linear-gradient(135deg, #C8860A, #D4AF37, #F5E6C8, #D4AF37, #C8860A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🎡 LUCKY WHEEL 🎡
          </div>
          <p className="text-yellow-200/80 text-sm">Spin to multiply your reward!</p>
          <p className="text-amber-300 text-xs mt-1">
            Base: {baseReward.toLocaleString()} × Multiplier = Total
          </p>
        </div>

        {/* Wheel container */}
        <div className="relative">
          {/* Pointer */}
          <div
            className="absolute left-1/2 z-10"
            style={{
              top: "-16px",
              transform: `translateX(-50%) ${pointerBounce ? "translateY(-4px)" : "translateY(0)"}`,
              transition: pointerBounce ? "transform 0.1s ease-out" : "transform 0.15s ease-out",
            }}
          >
            {/* Pointer arrow */}
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "28px solid #FFD700",
                filter: "drop-shadow(0 4px 12px rgba(255,215,0,0.8))",
              }}
            />
            {/* Pointer base circle */}
            <div
              className="w-5 h-5 rounded-full mx-auto -mt-1"
              style={{
                background: "linear-gradient(180deg, #FFD700, #C8860A)",
                boxShadow: "0 0 10px rgba(255,215,0,0.6)",
              }}
            />
          </div>

          {/* Wheel outer glow */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,215,0,0.25) 0%, transparent 70%)",
              transform: "scale(1.12)",
              animation: spinning ? "wheelGlow 1s ease-in-out infinite" : "none",
            }}
          />

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="relative w-72 h-72 sm:w-80 sm:h-80"
            style={{
              transition: spinning ? "none" : "transform 0.05s ease-out",
              transform: `rotate(${rotation}deg)`,
              filter: spinning ? "drop-shadow(0 0 20px rgba(255,215,0,0.4))" : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                {/* Outer gold ring gradient */}
                <radialGradient id="wheelGoldOuter" cx="50%" cy="50%" r="50%">
                  <stop offset="80%" stopColor="#1a1200" />
                  <stop offset="88%" stopColor="#D4AF37" />
                  <stop offset="94%" stopColor="#F5E6C8" />
                  <stop offset="100%" stopColor="#8B6914" />
                </radialGradient>
                {/* Center gold gradient */}
                <radialGradient id="wheelGoldCenter" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF8DC" />
                  <stop offset="40%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#B8860B" />
                </radialGradient>
                {/* Legendary glow */}
                <filter id="legendaryGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer decorative ring */}
              <circle cx="100" cy="100" r="98" fill="url(#wheelGoldOuter)" />

              {/* Wheel segments */}
              {WHEEL_SEGMENTS.map((segment, i) => {
                const startAngle = i * SEGMENT_ANGLE - 90; // Start from top
                const endAngle = startAngle + SEGMENT_ANGLE;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                // Calculate arc path
                const x1 = 100 + 88 * Math.cos(startRad);
                const y1 = 100 + 88 * Math.sin(startRad);
                const x2 = 100 + 88 * Math.cos(endRad);
                const y2 = 100 + 88 * Math.sin(endRad);

                // Text position (middle of segment)
                const midAngle = (startAngle + endAngle) / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const textX = 100 + 58 * Math.cos(midRad);
                const textY = 100 + 58 * Math.sin(midRad);

                // Rotation for text (keep upright)
                const textRotation = midAngle + 90;

                return (
                  <g key={i} filter={segment.isLegendary ? "url(#legendaryGlow)" : undefined}>
                    {/* Segment fill */}
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 88 88 0 0 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                    />

                    {/* Segment border highlight */}
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 88 88 0 0 1 ${x2} ${y2} Z`}
                      fill="none"
                      stroke={segment.isLegendary ? "#FFD700" : "rgba(255,255,255,0.1)"}
                      strokeWidth={segment.isLegendary ? "2" : "0.5"}
                    />

                    {/* Label */}
                    <text
                      x={textX}
                      y={textY}
                      fill={segment.isLegendary ? "#FFD700" : segment.color === "#D69E2E" ? "#1a1200" : "#E2E8F0"}
                      fontSize={segment.isLegendary ? "16" : "13"}
                      fontWeight={segment.isLegendary ? "900" : "bold"}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        textShadow: segment.isLegendary 
                          ? "0 0 8px rgba(255,215,0,0.8)" 
                          : "0 1px 3px rgba(0,0,0,0.9)",
                        transform: `rotate(${textRotation}, ${textX}px, ${textY}px)`,
                      }}
                    >
                      {segment.label}
                    </text>

                    {/* Legendary star indicator */}
                    {segment.isLegendary && (
                      <text
                        x={textX}
                        y={textY - 12}
                        fill="#FFD700"
                        fontSize="8"
                        textAnchor="middle"
                        style={{
                          transform: `rotate(${textRotation}, ${textX}px, ${textY - 12}px)`,
                        }}
                      >
                        ★
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Inner decorative ring */}
              <circle cx="100" cy="100" r="20" fill="url(#wheelGoldCenter)" />
              <circle cx="100" cy="100" r="17" fill="#1a1200" />
              <circle cx="100" cy="100" r="15" fill="url(#wheelGoldCenter)" />
              
              {/* Center decoration */}
              <text
                x="100"
                y="100"
                fill="#1a1200"
                fontSize="10"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ✦
              </text>
            </svg>
          </div>

          {/* Spin button overlay when not spinning and no result */}
          {!spinning && !showResult && !showEntrance && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={spinWheel}
                className="w-16 h-16 rounded-full font-display font-black text-lg shadow-xl transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6C8, #D4AF37)",
                  boxShadow: "0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(212,175,55,0.4)",
                  color: "#1a1200",
                }}
              >
                SPIN
              </button>
            </div>
          )}
        </div>

        {/* Coin shower effect */}
        {coinShower && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-3xl"
                style={{
                  left: `${10 + (i * 5) % 80}%`,
                  top: "-10%",
                  animation: `coinShower ${1.5 + (i % 3) * 0.2}s ease-in ${i * 0.08}s forwards`,
                }}
              >
                🪙
              </div>
            ))}
          </div>
        )}

        {/* Flying numbers effect */}
        {totalFlying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-4xl font-bold text-yellow-300"
              style={{
                animation: "flyUp 1s ease-out forwards",
                textShadow: "0 0 20px rgba(255,215,0,0.8)",
              }}
            >
              +{totalReward.toLocaleString()}
            </div>
          </div>
        )}

        {/* Final zoom result */}
        {showResult && result && (
          <div
            className="mt-6 text-center"
            style={{
              animation: finalZoom 
                ? "finalZoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                : "winBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
              transform: finalZoom ? "scale(1.3)" : "scale(1)",
            }}
          >
            <div
              className="text-5xl sm:text-6xl mb-2"
              style={{
                animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both",
              }}
            >
              {result.segment.isLegendary ? "🌟" : result.multiplier >= 5 ? "🎉" : "✨"}
            </div>

            <div
              className="font-display font-black text-2xl sm:text-3xl mb-1"
              style={{
                color: result.segment.isLegendary 
                  ? "#FFD700" 
                  : result.multiplier >= 4 
                    ? "#FF6B6B" 
                    : result.multiplier >= 3 
                      ? "#90EE90" 
                      : "#D4AF37",
                textShadow: result.segment.isLegendary 
                  ? "0 0 30px rgba(255,215,0,0.8)" 
                  : "none",
              }}
            >
              {result.segment.label} MULTIPLER!
              {result.segment.isLegendary && (
                <span className="ml-2 text-lg">★ LEGENDARY ★</span>
              )}
            </div>

            <div
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{
                color: "#FFD700",
                textShadow: "0 0 20px rgba(255,215,0,0.8)",
                animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both",
              }}
            >
              +{totalReward.toLocaleString()} 🪙
            </div>

            {!finalZoom && (
              <button
                onClick={handleCollect}
                className="px-8 py-3 rounded-full font-display font-black text-lg tracking-wider shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
                  color: "#1a1200",
                  boxShadow: "0 0 30px rgba(212,175,55,0.6)",
                  animation: "winBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.5s both",
                }}
              >
                COLLECT WINNINGS
              </button>
            )}
          </div>
        )}

        <style>{`
          @keyframes winBounce {
            0% { opacity: 0; transform: scale(0.5) translateY(-20px); }
            40% { opacity: 1; transform: scale(1.15) translateY(0); }
            65% { transform: scale(0.97); }
            80% { transform: scale(1.04); }
            100% { transform: scale(1); }
          }
          @keyframes finalZoomIn {
            0% { transform: scale(1); }
            50% { transform: scale(1.5); filter: brightness(1.5); }
            100% { transform: scale(1.3); filter: brightness(1.2); }
          }
          @keyframes coinShower {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
          }
          @keyframes flyUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
          }
          @keyframes wheelGlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </>
  );
}