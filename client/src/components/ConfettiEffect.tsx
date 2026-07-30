/**
 * ConfettiEffect - Celebration confetti animation
 * Used for purchase success and special events
 */

import { useEffect, useMemo, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  type: "circle" | "square" | "strip";
}

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
  intensity?: "low" | "medium" | "high";
  onComplete?: () => void;
}

const COLORS = [
  "#D4AF37", // Gold
  "#F5E6C8", // Cream
  "#FFD700", // Bright gold
  "#FFA500", // Orange
  "#FF6B6B", // Coral
  "#4ADE80", // Green
  "#60A5FA", // Blue
  "#A78BFA", // Purple
  "#F472B6", // Pink
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function ConfettiEffect({ 
  active, 
  duration = 3000, 
  intensity = "medium",
  onComplete 
}: ConfettiEffectProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const count = intensity === "low" ? 50 : intensity === "high" ? 150 : 100;

  const generatedPieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: getRandomColor(),
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      type: ["circle", "square", "strip"][Math.floor(Math.random() * 3)] as ConfettiPiece["type"],
    }));
  }, [active]); // Regenerate on each activation

  useEffect(() => {
    if (active) {
      setPieces(generatedPieces);
      
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, generatedPieces, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: piece.size,
              height: piece.type === "strip" ? piece.size * 3 : piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.type === "circle" ? "50%" : piece.type === "square" ? "2px" : "1px",
              transform: `rotate(${piece.rotation}deg)`,
              boxShadow: `0 0 ${piece.size}px ${piece.color}`,
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * CoinFlyAnimation - Flying coin particles effect
 * Used when coins are added to balance
 */
export function CoinFlyAnimation({ 
  active, 
  startX = "50%", 
  startY = "50%",
  targetRef,
  onComplete 
}: {
  active: boolean;
  startX?: string;
  startY?: string;
  targetRef?: React.RefObject<HTMLElement>;
  onComplete?: () => void;
}) {
  const [coins, setCoins] = useState<{id: number; x: number; y: number}[]>([]);

  useEffect(() => {
    if (active) {
      // Generate 20 coins flying outward
      const newCoins = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      }));
      setCoins(newCoins);

      const timer = setTimeout(() => {
        setCoins([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active || coins.length === 0) return null;

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: startX, top: startY }}
    >
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute"
          style={{
            animation: "coin-fly 1.5s ease-out forwards",
            "--tx": `${coin.x}px`,
            "--ty": `${coin.y}px`,
          } as React.CSSProperties}
        >
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg"
            style={{
              boxShadow: "0 0 10px #FFD700, 0 0 20px #D4AF37",
            }}
          >
            <span className="text-lg">🪙</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes coin-fly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(var(--tx), var(--ty)) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--tx) * 2), calc(var(--ty) * 2 - 100px)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ConfettiEffect;