import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  type: "coin" | "confetti" | "star";
}

interface WinParticlesProps {
  trigger: number; // trigger animation when this changes
  winAmount: number;
  isJackpot?: boolean;
}

export function WinParticles({ trigger, winAmount, isJackpot }: WinParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;

    const newParticles: Particle[] = [];
    const particleCount = isJackpot ? 50 : Math.min(30, Math.floor(winAmount / 100));

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 3 + Math.random() * 4;
      const type = isJackpot ? "star" : i % 3 === 0 ? "confetti" : "coin";

      newParticles.push({
        id: i,
        x: 50,
        y: 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        type,
      });
    }

    setParticles(newParticles);
    setAnimationKey(prev => prev + 1);

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy + 0.2, // gravity
            vy: p.vy + 0.1, // gravity acceleration
            life: p.life - 0.02,
          }))
          .filter(p => p.life > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [trigger, winAmount, isJackpot]);

  return (
    <div key={animationKey} className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => {
        let icon = "🪙";
        if (p.type === "confetti") {
          icon = ["🎉", "✨", "🎊"][Math.floor(Math.random() * 3)];
        } else if (p.type === "star") {
          icon = "⭐";
        }

        return (
          <div
            key={p.id}
            className="fixed text-2xl font-bold"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.life,
              transform: `translate(-50%, -50%) scale(${p.life})`,
              transition: "none",
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
}
