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
}

export default function CoinParticles({ count = 20 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      size: 12 + Math.random() * 16,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 500 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute coin-particle"
          style={{
            left: `${p.x}%`,
            top: "-30px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          <span style={{ fontSize: `${p.size}px`, lineHeight: 1 }}>🪙</span>
        </div>
      ))}
    </div>
  );
}
