/**
 * CabinetScene
 * ─────────────
 * Wide environmental scene used as the cabinet backdrop, replacing the
 * generic webp hero overlay. Same painterly stack: night sky, distant
 * horizon fire, moon haze, mid-ground silhouette of tipis, foreground
 * grass. Pure SVG so it rasterizes crisply at any size and adds zero
 * LCP penalty vs. the network-loaded webp it replaces.
 *
 * Drop behind the reels via <div style={{backgroundImage}}> or fullscreen
 * absolute layer at opacity 0.5+ behind the cabinet.
 */
import * as React from "react";

export function CabinetScene({
  className,
  opacity = 1,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1600 900"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="bgSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#04030c" />
            <stop offset="35%" stopColor="#0a0820" />
            <stop offset="60%" stopColor="#1a0f30" />
            <stop offset="80%" stopColor="#3a1a3a" />
            <stop offset="100%" stopColor="#1c081a" />
          </linearGradient>
          <radialGradient id="moonHalo" cx="78%" cy="22%" r="20%">
            <stop offset="0%" stopColor="#fff4c2" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#ffd58e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffd58e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="campfire" cx="50%" cy="100%" r="50%">
            <stop offset="0%" stopColor="#ff8a25" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#cc4214" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5c1e0a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="horizon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0a2e" />
            <stop offset="100%" stopColor="#080418" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>

          {/* Tipi silhouette (small, used many times in the village) */}
          <symbol id="tipi" viewBox="0 0 60 80">
            <path
              d="M 30 0 L 0 78 L 60 78 Z"
              fill="#07050f"
              stroke="#1a0e2a"
              strokeWidth="1"
            />
            {/* poles at the top */}
            <line x1="30" y1="0" x2="22" y2="-12" stroke="#1a0e2a" strokeWidth="1" />
            <line x1="30" y1="0" x2="30" y2="-15" stroke="#1a0e2a" strokeWidth="1" />
            <line x1="30" y1="0" x2="38" y2="-12" stroke="#1a0e2a" strokeWidth="1" />
            {/* glowing entrance flap */}
            <path d="M 22 78 L 22 60 L 30 50 L 38 60 L 38 78 Z" fill="#ff7a1a" opacity="0.55" />
          </symbol>

          {/* Lone wolf silhouette on a ridge */}
          <symbol id="wolf" viewBox="0 0 60 30">
            <path
              d="M 5 30 Q 8 22 12 22 L 14 16 L 16 22 Q 22 20 28 22 L 30 18 L 32 22 Q 38 22 42 26 Q 50 28 55 30 Z"
              fill="#02020a"
            />
            {/* glowing eye */}
            <circle cx="55" cy="25" r="0.9" fill="#ffd070" />
          </symbol>
        </defs>

        {/* Sky base */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#bgSky)" />

        {/* Faint nebula bands */}
        <ellipse cx="600" cy="180" rx="500" ry="60" fill="#2a1244" opacity="0.35" />
        <ellipse cx="1100" cy="280" rx="400" ry="50" fill="#3a1844" opacity="0.3" />

        {/* Milky-way streak of stars */}
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 71 + 23) % 1600;
          const y = (i * 13 + 5) % 220;
          const r = (i % 5 === 0 ? 1.4 : i % 3 === 0 ? 1 : 0.6);
          const op = 0.4 + ((i % 7) / 10);
          return (
            <circle
              key={`star-${i}`}
              cx={x}
              cy={y}
              r={r}
              fill="#fff4d2"
              opacity={op}
            />
          );
        })}

        {/* Moon + halo */}
        <circle cx="1250" cy="200" r="160" fill="url(#moonHalo)" />
        <circle cx="1250" cy="200" r="62" fill="#fff4d2" />
        <circle cx="1250" cy="200" r="56" fill="#f8deb4" opacity="0.9" />
        <circle cx="1238" cy="190" r="6" fill="#c69a4c" opacity="0.35" />
        <circle cx="1262" cy="212" r="4" fill="#c69a4c" opacity="0.35" />
        <circle cx="1260" cy="186" r="3" fill="#c69a4c" opacity="0.35" />

        {/* Distant blue ridge */}
        <path
          d="M 0 580 L 120 540 L 260 580 L 380 510 L 520 580 L 680 520 L 820 580 L 980 510 L 1140 580 L 1280 540 L 1440 580 L 1600 540 L 1600 620 L 0 620 Z"
          fill="#0a0a26"
          opacity="0.95"
        />

        {/* Warm orange rim on the horizon */}
        <ellipse cx="900" cy="610" rx="700" ry="40" fill="#cc4214" opacity="0.45" />

        {/* Mid-ground ridge */}
        <path
          d="M 0 720 Q 200 700 400 715 Q 700 695 1000 720 Q 1200 705 1400 720 Q 1500 712 1600 720 L 1600 780 L 0 780 Z"
          fill="#0c0420"
        />

        {/* Foreground prairie hill */}
        <path
          d="M 0 800 Q 400 770 800 790 Q 1200 805 1600 780 L 1600 900 L 0 900 Z"
          fill="#04020c"
        />

        {/* Tipi village — across mid-ground */}
        <use href="#tipi" x="320" y="640" width="80" height="100" />
        <use href="#tipi" x="430" y="635" width="64" height="80" />
        <use href="#tipi" x="510" y="640" width="72" height="90" />
        <use href="#tipi" x="610" y="645" width="58" height="74" />
        <use href="#tipi" x="1180" y="640" width="80" height="100" />
        <use href="#tipi" x="1290" y="650" width="60" height="78" />
        <use href="#tipi" x="1380" y="640" width="70" height="88" />

        {/* Lone wolves on the distant ridge */}
        <use href="#wolf" x="780" y="690" width="60" height="30" />
        <use href="#wolf" x="860" y="694" width="48" height="24" />
        <use href="#wolf" x="1000" y="688" width="58" height="28" />

        {/* Campfire mid-left */}
        <ellipse cx="240" cy="800" rx="180" ry="60" fill="url(#campfire)" />
        {/* Fire sticks */}
        <path d="M 230 800 L 232 770 L 240 800 Z" fill="#3d2614" />
        <path d="M 246 798 L 248 770 L 240 800 Z" fill="#3d2614" />
        <path d="M 234 798 L 244 776 L 252 798 Z" fill="#3d2614" />
        {/* Fire flame */}
        <path d="M 240 798 Q 230 786 238 770 Q 245 780 246 770 Q 252 786 240 798 Z" fill="#ff7a1a" />
        <path d="M 240 794 Q 233 786 240 778 Q 246 786 240 794 Z" fill="#ffd070" />
        {/* Fire sparks */}
        {[
          [220, 770], [255, 760], [240, 750], [228, 758], [248, 750],
          [232, 740], [252, 738], [220, 752], [260, 758],
        ].map(([x, y], i) => (
          <circle
            key={`bg-spark-${i}`}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 1.6 : 1.1}
            fill={i % 2 === 0 ? "#ffd070" : "#ff8a25"}
            opacity="0.95"
          />
        ))}

        {/* Foreground silhouettes — distant horizon line of grass */}
        <path
          d="M 0 830 Q 200 820 400 830 Q 600 820 800 830 Q 1000 820 1200 830 Q 1400 820 1600 830 L 1600 900 L 0 900 Z"
          fill="#000"
          opacity="0.9"
        />
        {Array.from({ length: 40 }).map((_, i) => {
          const x = i * 42 + (i % 2) * 20;
          return (
            <path
              key={`bg-grass-${i}`}
              d={`M ${x} 830 L ${x - 3} 822 L ${x + 3} 822 L ${x + 3} 830 Z`}
              fill="#000"
              opacity="0.8"
            />
          );
        })}

        {/* Top gold rim */}
        <rect x="0" y="0" width="1600" height="2" fill="#d4af37" opacity="0.4" />
        {/* Vignette overlay */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#vignette)" />
      </svg>
    </div>
  );
}
