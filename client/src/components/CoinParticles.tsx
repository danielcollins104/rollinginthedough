/**
 * Rolling in the Dough — Coin Particles
 * Animated gold coins that rain down on wins
 * Uses SVG gold-coin graphics (no emoji) for crisp rendering at any scale
 */

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  scale: number;
  rotationSpeed: number;
  sway: number;
  swaySpeed: number;
}

interface CoinParticlesProps {
  count?: number;
  /** Optional seed for deterministic variation (e.g., winAmount) */
  seed?: number;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function CoinParticles({ count = 20, seed = Date.now() }: CoinParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const rand = seededRandom(seed);
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + rand() * 90, // 5-95% to keep away from edges
      delay: rand() * 0.8, // tighter delay window for more cohesive "shower"
      duration: 1.5 + rand() * 1.0, // 1.5-2.5s
      size: 18 + rand() * 14, // 18-32px
      rotation: rand() * 360,
      scale: 0.7 + rand() * 0.5, // 0.7-1.2
      rotationSpeed: (rand() - 0.5) * 720, // -360 to +360 deg/s
      sway: 15 + rand() * 25, // 15-40px horizontal sway
      swaySpeed: 0.5 + rand() * 1.0, // 0.5-1.5 cycles/sec
    }));
    setParticles(newParticles);
  }, [count, seed]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {particles.map((p) => (
        <CoinParticle key={p.id} particle={p} />
      ))}
      <style>{`
        @keyframes coinFall {
          0% {
            transform: translateY(-40px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(var(--sway)) rotate(var(--end-rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function CoinParticle({ particle }: { particle: Particle }) {
  const endRotation = particle.rotation + particle.rotationSpeed * particle.duration;
  const swayDistance = particle.sway * (Math.random() > 0.5 ? 1 : -1);

  return (
    <div
      className="absolute"
      style={{
        left: `${particle.x}%`,
        top: "-40px",
        animationDelay: `${particle.delay}s`,
        animationDuration: `${particle.duration}s`,
        animation: `coinFall ${particle.duration}s ease-in ${particle.delay}s forwards`,
        // CSS custom properties for the keyframe
        '--sway': `${swayDistance}px`,
        '--end-rot': `${endRotation}deg`,
      } as React.CSSProperties}
    >
      <div
        style={{
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          transformOrigin: "center center",
        }}
      >
        <svg viewBox="0 0 32 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`coinFace-${particle.id}`} cx="0.35" cy="0.35" r="0.65">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="35%" stopColor="#FFD700" />
              <stop offset="70%" stopColor="#F5E6C8" />
              <stop offset="100%" stopColor="#D4AF37" />
            </radialGradient>
            <radialGradient id={`coinRim-${particle.id}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="65%" stopColor="#FFD700" stopOpacity="0.1" />
              <stop offset="85%" stopColor="#FFD700" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#B8860B" />
            </radialGradient>
            <linearGradient id={`coinEdge-${particle.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>
          {/* Coin body with metallic gradient */}
          <circle cx="16" cy="16" r="15" fill={`url(#coinFace-${particle.id})`} />
          {/* Outer rim highlight */}
          <circle cx="16" cy="16" r="15" fill="none" stroke={`url(#coinRim-${particle.id})`} strokeWidth="1.5" />
          {/* Inner detail ring */}
          <circle cx="16" cy="16" r="11" fill="none" stroke={`url(#coinEdge-${particle.id})`} strokeWidth="0.8" opacity="0.6" />
          {/* Center emblem */}
          <circle cx="16" cy="16" r="7" fill={`url(#coinFace-${particle.id})`} opacity="0.9" />
          <circle cx="16" cy="16" r="7" fill="none" stroke="#B8860B" strokeWidth="0.6" />
          {/* Dollar sign */}
          <text
            x="16"
            y="20.5"
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            fill="#8B6914"
            stroke="#FFD700"
            strokeWidth="0.3"
            paintOrder="stroke fill"
          >
            $
          </text>
        </svg>
      </div>
    </div>
  );
}