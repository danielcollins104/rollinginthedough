/**
 * BigWinOverlay — Professional casino-style win celebration overlay
 * Matches Jackpot Party / Chumba Casino win screen standards
 * Shows for BIG_WIN, MEGA_WIN, and JACKPOT wins
 *
 * Visual Upgrades: Progressive accelerating-then-decelerating coin counter
 */

import { useEffect, useRef, useState } from "react";
import type { WinType } from "@/hooks/useGameState";

interface Props {
  winType: WinType;
  winAmount: number;
  onDismiss: () => void;
}

const WIN_CONFIG = {
  BIG_WIN: {
    label: "BIG WIN",
    subLabel: "Nice!",
    primaryColor: "#FFD700",
    secondaryColor: "#FFA500",
    glowColor: "rgba(255,215,0,0.8)",
    bgGradient: "radial-gradient(ellipse at center, rgba(30,20,0,0.97) 0%, rgba(10,10,5,0.99) 100%)",
    borderColor: "#FFD700",
    fontSize: "clamp(3rem, 12vw, 7rem)",
    autoClose: 3000,
  },
  MEGA_WIN: {
    label: "MEGA WIN",
    subLabel: "Incredible!",
    primaryColor: "#FF6B35",
    secondaryColor: "#FF4500",
    glowColor: "rgba(255,107,53,0.9)",
    bgGradient: "radial-gradient(ellipse at center, rgba(30,10,0,0.97) 0%, rgba(10,5,0,0.99) 100%)",
    borderColor: "#FF6B35",
    fontSize: "clamp(3.5rem, 14vw, 8rem)",
    autoClose: 4000,
  },
  JACKPOT: {
    label: "JACKPOT!",
    subLabel: "You Hit the Jackpot!",
    primaryColor: "#FFD700",
    secondaryColor: "#FFF8DC",
    glowColor: "rgba(255,215,0,1)",
    bgGradient: "radial-gradient(ellipse at center, rgba(40,30,0,0.98) 0%, rgba(10,8,0,0.99) 100%)",
    borderColor: "#FFD700",
    fontSize: "clamp(4rem, 16vw, 9rem)",
    autoClose: 6000,
  },
};

// Progressive coin counter with accelerating-then-decelerating animation
// Starts fast (100ms ticks), slows as it approaches final value
function ProgressiveCoinCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const [phase, setPhase] = useState<'fast' | 'slow' | 'final'>('fast');
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    setDisplay(0);
    setPhase('fast');

    // Tick rate: fast at first (every 50ms), progressively slower
    const tickInterval = 50;
    let lastTick = 0;
    let currentValue = 0;

    const animate = (timestamp: number) => {
      const elapsed = Date.now() - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) {
        setDisplay(target);
        setPhase('final');
        return;
      }

      // Progress through phases:
      // 0-50%: fast ticks (50ms intervals)
      // 50-80%: medium ticks (100ms intervals)
      // 80-95%: slow ticks (200ms intervals)
      // 95-100%: very slow ticks (400ms intervals)

      let tickRate: number;
      if (progress < 0.5) {
        tickRate = 50;
        setPhase('fast');
      } else if (progress < 0.8) {
        tickRate = 100;
        setPhase('slow');
      } else if (progress < 0.95) {
        tickRate = 200;
        setPhase('slow');
      } else {
        tickRate = 400;
        setPhase('slow');
      }

      if (timestamp - lastTick >= tickRate) {
        lastTick = timestamp;

        // Use easeOutExpo for fast phase, easeOutCubic for slow phase
        let eased: number;
        if (progress < 0.5) {
          // Fast: exponential ease-out
          eased = 1 - Math.pow(1 - progress * 2, 3);
        } else if (progress < 0.8) {
          // Medium: smooth ease-out
          eased = 1 - Math.pow(1 - (progress - 0.5) / 0.3, 2);
        } else if (progress < 0.95) {
          // Slow: gentler ease-out
          eased = 1 - Math.pow(1 - (progress - 0.8) / 0.15, 3);
        } else {
          // Very slow: smooth deceleration to final
          eased = 1 - Math.pow(1 - (progress - 0.95) / 0.05, 3);
        }

        // Quantize to meaningful increments based on phase
        let increment: number;
        const remaining = target - currentValue;

        if (phase === 'fast') {
          // Take big chunks at the start
          increment = Math.max(1, Math.floor(target * 0.08));
        } else if (phase === 'slow') {
          // Take smaller chunks as we approach target
          increment = Math.max(1, Math.floor(remaining * 0.12));
        } else {
          increment = Math.max(1, Math.floor(remaining * 0.2));
        }

        currentValue = Math.min(target, currentValue + increment);
        setDisplay(currentValue);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  // Format with commas and ensure minimum display
  const formattedDisplay = Math.max(display, Math.floor(target * 0.01)).toLocaleString();

  return (
    <span>
      {phase === 'fast' && display === 0 ? (
        <span className="opacity-80">{formattedDisplay}</span>
      ) : (
        <span className={phase === 'slow' ? 'counter-slow' : ''}>{formattedDisplay}</span>
      )}
    </span>
  );
}

// Starburst rays
function StarburstRays({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: "2px",
            height: "50vmax",
            background: `linear-gradient(to bottom, ${color}88, transparent)`,
            transform: `rotate(${i * 30}deg) translateX(-50%)`,
            transformOrigin: "top center",
            animation: `rayRotate 8s linear infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Confetti particles
function Confetti({ color }: { color: string }) {
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            background: p.id % 3 === 0 ? color : p.id % 3 === 1 ? "#FFFFFF" : "#FF6B35",
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Coin icon SVG
function CoinIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block align-middle">
      <circle cx="12" cy="12" r="10" fill="#FFD700" />
      <circle cx="12" cy="12" r="8" fill="#F5E040" />
      <circle cx="12" cy="12" r="6" fill="#FFD700" stroke="#D4AF37" strokeWidth="0.8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#B8860A">$</text>
    </svg>
  );
}

export default function BigWinOverlay({ winType, winAmount, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (!winType || winType === "SMALL_WIN" || winType === "HUNTRESS_BONUS") return null;

  const config = WIN_CONFIG[winType as keyof typeof WIN_CONFIG];
  if (!config) return null;

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 400);
  };

  // Duration scales with win amount for big wins
  const counterDuration = winType === "JACKPOT"
    ? Math.min(4000, 2000 + winAmount / 500)
    : winType === "MEGA_WIN"
    ? Math.min(3000, 1500 + winAmount / 1000)
    : Math.min(2000, 800 + winAmount / 2000);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
      onClick={handleDismiss}
      style={{
        background: config.bgGradient,
        animation: exiting ? "bigWinFadeOut 0.4s ease-out forwards" : "bigWinFadeIn 0.3s ease-out forwards",
      }}
    >
      {/* Starburst rays */}
      <StarburstRays color={config.primaryColor} />

      {/* Confetti */}
      <Confetti color={config.primaryColor} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center select-none">
        {/* Sub-label */}
        <div
          className="font-numbers tracking-[0.3em] uppercase text-sm sm:text-base"
          style={{
            color: config.secondaryColor,
            textShadow: `0 0 20px ${config.glowColor}`,
            animation: exiting ? "none" : "bigWinSlideDown 0.4s ease-out 0.1s both",
          }}
        >
          {config.subLabel}
        </div>

        {/* Main win label */}
        <div
          className="font-display font-black leading-none"
          style={{
            fontSize: config.fontSize,
            color: config.primaryColor,
            textShadow: `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}, 0 0 120px ${config.glowColor}`,
            animation: exiting ? "none" : "bigWinLabelPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both",
            WebkitTextStroke: `2px ${config.borderColor}`,
          }}
        >
          {config.label}
        </div>

        {/* Win amount with progressive counter */}
        <div
          className="font-numbers font-bold flex items-baseline gap-2"
          style={{
            fontSize: "clamp(2rem, 8vw, 4.5rem)",
            color: "#FFFFFF",
            textShadow: `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`,
            animation: exiting ? "none" : "bigWinSlideUp 0.4s ease-out 0.4s both",
          }}
        >
          <span style={{ color: "#FFD700" }}>+</span>
          <ProgressiveCoinCounter target={winAmount} duration={counterDuration} />
          <CoinIcon size={32} />
        </div>

        {/* Decorative divider */}
        <div
          className="flex items-center gap-4 w-full max-w-xs"
          style={{ animation: exiting ? "none" : "bigWinSlideUp 0.4s ease-out 0.5s both" }}
        >
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${config.primaryColor})` }} />
          <div style={{ color: config.primaryColor, fontSize: "1.2rem" }}>◆</div>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${config.primaryColor}, transparent)` }} />
        </div>

        {/* Tap to continue */}
        <div
          className="font-numbers text-sm tracking-widest uppercase"
          style={{
            color: "rgba(255,255,255,0.5)",
            animation: exiting ? "none" : "bigWinTapPulse 1.5s ease-in-out 1s infinite",
          }}
        >
          Tap to continue
        </div>
      </div>

      <style>{`
        @keyframes bigWinFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bigWinFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes bigWinLabelPop {
          from { opacity: 0; transform: scale(0.3) rotate(-5deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes bigWinSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bigWinSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bigWinTapPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes rayRotate {
          from { transform: rotate(0deg) translateX(-50%); }
          to { transform: rotate(360deg) translateX(-50%); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .counter-slow {
          animation: counterPulse 0.2s ease-out;
        }
        @keyframes counterPulse {
          0% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}