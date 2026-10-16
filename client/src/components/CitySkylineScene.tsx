/**
 * CitySkylineScene — "Pirate's Gold" neon night-city backdrop.
 *
 * Procedural SVG (no asset downloads): deep purple-black sky, two skyline
 * silhouette layers with neon-lit windows, and glowing vertical reflections
 * on the water beneath the skyline. Sits behind the whole game screen.
 */

interface Props {
  opacity?: number;
  className?: string;
}

// Distant skyline silhouette (blurred, purple haze layer).
const FAR_BUILDINGS: { x: number; w: number; h: number }[] = [
  { x: 0, w: 70, h: 120 },
  { x: 76, w: 44, h: 165 },
  { x: 126, w: 60, h: 96 },
  { x: 192, w: 38, h: 190 },
  { x: 236, w: 66, h: 130 },
  { x: 308, w: 50, h: 172 },
  { x: 364, w: 40, h: 108 },
  { x: 410, w: 58, h: 150 },
  { x: 474, w: 44, h: 118 },
  { x: 524, w: 62, h: 178 },
  { x: 592, w: 48, h: 126 },
  { x: 646, w: 68, h: 158 },
  { x: 720, w: 52, h: 104 },
  { x: 778, w: 60, h: 148 },
  { x: 844, w: 56, h: 122 },
  { x: 906, w: 54, h: 168 },
];

// Near skyline silhouette (taller, crisper, neon window lights).
const NEAR_BUILDINGS: { x: number; w: number; h: number; windows: string }[] = [
  { x: -20, w: 96, h: 210, windows: "magenta" },
  { x: 92, w: 70, h: 260, windows: "purple" },
  { x: 178, w: 110, h: 178, windows: "gold" },
  { x: 304, w: 64, h: 300, windows: "cyan" },
  { x: 384, w: 96, h: 230, windows: "magenta" },
  { x: 496, w: 72, h: 196, windows: "purple" },
  { x: 584, w: 104, h: 268, windows: "gold" },
  { x: 704, w: 60, h: 212, windows: "purple" },
  { x: 780, w: 92, h: 244, windows: "magenta" },
  { x: 888, w: 92, h: 186, windows: "cyan" },
];

const WINDOW_COLORS: Record<string, string> = {
  magenta: "#FF4FD8",
  purple: "#A855F7",
  gold: "#FFC94D",
  cyan: "#41E3FF",
};

function Windows({ x, w, h, color }: { x: number; w: number; h: number; color: string }) {
  // Deterministic pseudo-random lit windows so re-renders don't reshuffle.
  const cells: React.ReactNode[] = [];
  const cols = Math.max(2, Math.floor(w / 18));
  const rows = Math.max(4, Math.floor(h / 26));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (x * 31 + r * 17 + c * 13) % 10;
      if (seed < 5) continue; // ~half the windows are dark
      const wx = x + 8 + c * ((w - 16) / Math.max(1, cols - 1)) - 3;
      const wy = 320 - h + 12 + r * ((h - 24) / Math.max(1, rows - 1)) - 5;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={wx}
          y={wy}
          width={6}
          height={8}
          rx={1}
          fill={color}
          opacity={0.35 + (seed % 5) * 0.12}
        />
      );
    }
  }
  return <g filter="url(#cityGlow)">{cells}</g>;
}

export function CitySkylineScene({ opacity = 1, className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ opacity, position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base night gradient — deep purple-black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #07030f 0%, #0d0518 18%, #180a2e 38%, #12061f 60%, #08030f 100%)",
        }}
      />
      {/* Subtle parallax: skyline drifts slowly, water drifts slower still,
          ambient foreground glow drifts fastest — depth without distraction.
          Honors prefers-reduced-motion. */}
      <style>{`
        @keyframes pgSkyDrift {
          0%   { transform: translateX(0)     scale(1.04); }
          100% { transform: translateX(-12px) scale(1.07); }
        }
        @keyframes pgWaterDrift {
          0%   { transform: translateX(0)    scale(1.02); }
          100% { transform: translateX(7px)  scale(1.04); }
        }
        @keyframes pgGlowDrift {
          0%   { transform: translateX(-24px); opacity: 0.8; }
          100% { transform: translateX(24px);  opacity: 1; }
        }
        .pg-sky   { animation: pgSkyDrift   55s ease-in-out infinite alternate; }
        .pg-water { animation: pgWaterDrift 44s ease-in-out infinite alternate; }
        .pg-glow  { animation: pgGlowDrift  26s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) {
          .pg-sky, .pg-water, .pg-glow { animation: none !important; }
        }
      `}</style>

      {/* Real key-art backdrop on desktop (lg+): the owned mockup's skyline
          strip across the top and reflective water along the bottom edge.
          Mobile keeps the procedural SVG (the band crops poorly at phone
          widths — the gold logo sits in its center). */}
      <img
        src="/pg/bg-skyline.png"
        alt=""
        aria-hidden="true"
        className="pg-sky hidden lg:block absolute top-0 left-0 right-0"
        style={{
          height: "19%",
          width: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
          WebkitMaskImage: "linear-gradient(180deg, black 40%, transparent 100%)",
          maskImage: "linear-gradient(180deg, black 40%, transparent 100%)",
        }}
        draggable={false}
      />
      <img
        src="/pg/bg-water.png"
        alt=""
        aria-hidden="true"
        className="pg-water hidden lg:block absolute bottom-0 left-0 right-0"
        style={{
          height: "15%",
          width: "100%",
          objectFit: "cover",
          objectPosition: "center 70%",
          WebkitMaskImage: "linear-gradient(0deg, black 55%, transparent 100%)",
          maskImage: "linear-gradient(0deg, black 55%, transparent 100%)",
          opacity: 0.85,
        }}
        draggable={false}
      />

      {/* Procedural skyline (mobile / small windows) */}
      <div className="lg:hidden absolute top-0 left-0 right-0" style={{ height: "46%" }}>
      <svg
        viewBox="0 0 960 400"
        preserveAspectRatio="xMidYMin slice"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1052" />
            <stop offset="40%" stopColor="#170a30" />
            <stop offset="100%" stopColor="#07030f" />
          </linearGradient>
          <linearGradient id="reflectionFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft purple moon haze */}
        <circle cx="760" cy="60" r="90" fill="#7C3AED" opacity="0.10" filter="url(#cityGlow)" />
        <circle cx="760" cy="60" r="34" fill="#C4B5FD" opacity="0.14" filter="url(#cityGlow)" />

        {/* Far skyline (hazier) */}
        <g opacity="0.55" filter="url(#cityGlow)">
          {FAR_BUILDINGS.map((b, i) => (
            <rect key={i} x={b.x} y={320 - b.h} width={b.w} height={b.h} fill="#1d0b33" />
          ))}
        </g>

        {/* Near skyline + lit windows */}
        {NEAR_BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={320 - b.h} width={b.w} height={b.h} fill="#12061f" />
            <rect
              x={b.x}
              y={320 - b.h}
              width={b.w}
              height={2.5}
              fill={WINDOW_COLORS[b.windows]}
              opacity={0.7}
              filter="url(#cityGlow)"
            />
            <Windows x={b.x} w={b.w} h={b.h} color={WINDOW_COLORS[b.windows]} />
          </g>
        ))}

        {/* Water band beneath the skyline with vertical neon reflections */}
        <rect x="0" y="320" width="960" height="80" fill="url(#waterGrad)" />
        <g>
          {NEAR_BUILDINGS.map((b, i) => (
            <rect
              key={`ref-${i}`}
              x={b.x + b.w * 0.2}
              y="322"
              width={b.w * 0.6}
              height={72}
              fill={WINDOW_COLORS[b.windows]}
              opacity={0.12}
              filter="url(#cityGlow)"
              style={{ mixBlendMode: "screen" }}
            />
          ))}
          {/* Shimmer lines on the water */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect
              key={`sh-${i}`}
              x={(i * 71 + 23) % 940}
              y={332 + (i % 6) * 10}
              width={34 + ((i * 29) % 40)}
              height={1.6}
              rx={0.8}
              fill="#B794F6"
              opacity={0.18}
            >
              <animate
                attributeName="opacity"
                values="0.08;0.3;0.08"
                dur={`${3 + (i % 5)}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>

        {/* Fade the water into the page background */}
        <rect x="0" y="320" width="960" height="80" fill="url(#reflectionFade)" opacity="0" />
      </svg>
      </div>

      {/* Ambient purple glow where skyline meets the play area — the fast
          parallax layer (foreground drifts most) */}
      <div
        className="pg-glow"
        style={{
          position: "absolute",
          top: "30%",
          left: "-10%",
          right: "-10%",
          height: "22%",
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(168,85,247,0.14) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export default CitySkylineScene;
