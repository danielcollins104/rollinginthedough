/**
 * Rolling in the Dough — Coin Particles
 * Animated gold coins that rain down on wins
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
}

export default function CoinParticles({ count = 20 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.2 + Math.random() * 1.6,
      size: 14 + Math.random() * 18,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, [count]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 55 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-40px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animation: `coinRain ${p.duration}s linear ${p.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            }}
          >
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <defs>
                <radialGradient id={`coinFace-${p.id}`} cx="0.4" cy="0.4" r="0.6">
                  <stop offset="0%" stopColor="#FFF8DC" />
                  <stop offset="40%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </radialGradient>
                <radialGradient id={`coinRim-${p.id}`} cx="0.5" cy="0.5" r="0.5">
                  <stop offset="70%" stopColor="#FFD700" stopOpacity="0" />
                  <stop offset="100%" stopColor="#B8860B" />
                </radialGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill={`url(#coinFace-${p.id})`} stroke="#B8860B" strokeWidth="1.2" />
              <circle cx="16" cy="16" r="15" fill={`url(#coinRim-${p.id})`} />
              <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="900" fill="#996515">$</text>
            </svg>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes coinRain {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
