import { useEffect, useState, useRef } from "react";

type ParticleType = "goldCoin" | "gem" | "star";

interface Physics {
  gravity: number;   // per-frame downward acceleration
  drag: number;      // per-frame velocity multiplier (1 = no drag)
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;       // 1 → 0 over lifetime
  type: ParticleType;
  rotation: number;
  rotationSpeed: number;
  scale: number;      // base scale (random per particle for visual variety)
  birthTime: number;  // ms timestamp — used to derive the visual scale envelope
}

// Per-type physics. Coins flutter like real tumbling metal (high drag, low
// gravity). Gems fall cleanly (medium drag, low gravity — they don't tumble).
// Stars radiate outward with no gravity and no drag — pure radial burst.
const PHYSICS: Record<ParticleType, Physics> = {
  goldCoin: { gravity: 0.06, drag: 0.96 },
  gem:      { gravity: 0.10, drag: 0.985 },
  star:     { gravity: 0.00, drag: 0.999 },
};

interface WinParticlesProps {
  trigger: number; // trigger animation when this changes
  winAmount: number;
  isJackpot?: boolean;
}

// Visual scale envelope: grow 0→1 in 150ms, hold until 60% of life, then
// shrink back to 0. Returning 0 lets opacity (driven by life) handle the
// final fade so the two don't fight each other.
function scaleEnvelope(elapsedMs: number, life: number): number {
  if (life <= 0) return 0;
  const ageMs = elapsedMs;
  if (ageMs < 150) return ageMs / 150;                            // grow
  if (life > 0.4) return 1;                                        // hold
  return Math.max(0, life / 0.4);                                 // shrink with life
}

export function WinParticles({ trigger, winAmount, isJackpot }: WinParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (trigger === 0) return;

    const now = performance.now();
    const newParticles: Particle[] = [];
    const baseCount = isJackpot ? 80 : 40;
    const amountMultiplier = Math.min(2, 1 + winAmount / 5000);
    const particleCount = Math.floor(baseCount * amountMultiplier);

    // Create particles with varied types for luxury feel
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.2;
      const speed = isJackpot ? 4 + Math.random() * 5 : 3 + Math.random() * 4;
      const rand = Math.random();

      let type: ParticleType;
      if (isJackpot) {
        type = rand < 0.25 ? "star" : rand < 0.45 ? "gem" : "goldCoin";
      } else {
        type = rand < 0.15 ? "star" : rand < 0.35 ? "gem" : "goldCoin";
      }

      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 8,
        y: 45 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
        vy: Math.sin(angle) * speed - (isJackpot ? 3 + Math.random() * 2 : 2 + Math.random() * 1.5),
        life: 1,
        type,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        scale: 0.8 + Math.random() * 0.6,
        birthTime: now,
      });
    }

    setParticles(newParticles);
    setAnimationKey(prev => prev + 1);
    setFlashKey(prev => prev + 1);

    // Animate particles with requestAnimationFrame for smooth 60fps
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = performance.now();

      setParticles(prev =>
        prev
          .map(p => {
            const phys = PHYSICS[p.type];
            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy + phys.gravity,
              vx: p.vx * phys.drag,
              vy: p.vy * phys.drag + phys.gravity,
              rotation: p.rotation + p.rotationSpeed,
              life: p.life - (isJackpot ? 0.012 : 0.018),
            };
          })
          .filter(p => p.life > 0 && p.y < 110 && p.x > -10 && p.x < 110)
      );
      // touch `t` so TS doesn't flag the unused-var lint
      void t;
    };

    frameRef.current = requestAnimationFrame(animate);

    // Auto-cleanup after particles die
    const cleanupTimeout = setTimeout(() => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      setParticles([]);
    }, isJackpot ? 6000 : 4000);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      clearTimeout(cleanupTimeout);
    };
  }, [trigger, winAmount, isJackpot]);

  // Render particle based on type
  const renderParticle = (p: Particle) => {
    const icons: Record<ParticleType, string> = {
      goldCoin: "🪙",
      // Vary gem appearance by id modulo so adjacent gems look different
      gem: (["💎", "💍", "🔮"] as const)[p.id % 3],
      star: "⭐",
    };

    const icon = icons[p.type];
    const baseSize = p.type === "star" ? 32 : p.type === "gem" ? 24 : 28;
    const envelope = scaleEnvelope(performance.now() - p.birthTime, p.life);
    const visualScale = p.scale * envelope;

    return (
      <div
        key={p.id}
        className="fixed pointer-events-none font-bold select-none"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          opacity: Math.max(0, p.life),
          transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${visualScale})`,
          fontSize: `${baseSize}px`,
          filter: p.type === "goldCoin"
            ? "drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 16px #D4AF37)"
            : p.type === "gem"
            ? "drop-shadow(0 0 6px #FF6B35) drop-shadow(0 0 12px #FFD700)"
            : "drop-shadow(0 0 10px #FFFFFF) drop-shadow(0 0 20px #FFD700)",
          zIndex: p.type === "star" ? 100 : p.type === "gem" ? 90 : 50,
        }}
      >
        {icon}
      </div>
    );
  };

  if (particles.length === 0 && flashKey === 0) return null;

  return (
    <>
      {/* Cabinet brightness flash — 200ms peak, 400ms decay. Sells the "hit". */}
      {flashKey > 0 && (
        <div
          key={flashKey}
          className="fixed inset-0 pointer-events-none z-[60]"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0) 60%)",
            animation: "winFlash 400ms ease-out forwards",
          }}
        />
      )}
      {particles.length > 0 && (
        <div key={animationKey} className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {particles.map(renderParticle)}
        </div>
      )}
    </>
  );
}
