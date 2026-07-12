/**
 * SymbolIcon — Rich inline SVG icons for slot machine symbols
 *
 * Theme: NATIVE AMERICAN HUNTRESS (warrior / shaman / spirit world)
 *  - bread    → Sacred Sage       (dried sage bundle with smoldering tip)
 *  - rolling  → Warrior Bow       (recurve bow with eagle feathers)
 *  - pretzel  → Dream Catcher     (web hoop with feathers hanging down)
 *  - croissant→ Eagle Feathers    (3 eagle feathers fanned out)
 *  - cookie   → Spirit Arrows     (flint arrowhead trio)
 *  - cupcake  → Spirit Wolf       (howling wolf with spirit glow)
 *  - cake     → War Drum          (ceremonial drum on stand)
 *  - muffin   → Sunstones         (3 crystal/gem stones)
 *  - bun      → Sacred Fire       (WILD — tribal fire on stone)
 *  - huntress → Huntress Warrior  (SCATTER — silhouette + bow)
 *  - dough    → Spirit Arrow      (SCATTER — energy/lightning arrow)
 *
 * Every icon is a custom SVG so the design is owned by us. Each uses the
 * project's "Gilded Sunset" palette: deep purple backgrounds, gold/copper
 * linework, accent reds/ambers.
 */

import { type SymbolId } from "@/hooks/useGameState";

interface Props {
  symbolId?: SymbolId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SymbolIcon({ symbolId, size = 48, className, style }: Props) {
  switch (symbolId) {
    case "bread": return <SageIcon        size={size} className={className} style={style} />;
    case "rolling": return <BowIcon       size={size} className={className} style={style} />;
    case "pretzel": return <DreamCatcher  size={size} className={className} style={style} />;
    case "croissant": return <FeathersIcon size={size} className={className} style={style} />;
    case "cookie": return <ArrowsIcon      size={size} className={className} style={style} />;
    case "cupcake": return <WolfIcon       size={size} className={className} style={style} />;
    case "cake": return <DrumIcon           size={size} className={className} style={style} />;
    case "muffin": return <SunstonesIcon   size={size} className={className} style={style} />;
    case "bun": return <FireIcon           size={size} className={className} style={style} />;
    case "huntress": return <HuntressPhoto size={size} className={className} style={style} />;
    case "dough": return <SpiritArrowIcon  size={size} className={className} style={style} />;
    case "greenCoin": return <GreenCoinIcon size={size} className={className} style={style} />;
    case "goldCoin": return <GoldCoinIcon  size={size} className={className} style={style} />;
    default: return <HuntressPhoto         size={size} className={className} style={style} />;
  }
}

// ─── Shared sub-elements ─────────────────────────────────────────────────────
// These show up across many icons. Drawing them inline avoids React
// fragment soup in every icon component.

function GlowRing({
  cx = 24,
  cy = 24,
  r = 22,
  color = "#D4AF37",
  opacity = 0.45,
}: {
  cx?: number;
  cy?: number;
  r?: number;
  color?: string;
  opacity?: number;
}) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="0.6" opacity={opacity} />;
}

function CoinHighlight({ cx = 24, cy = 24, r = 14, color = "#FFE6B0", opacity = 0.25 }) {
  return <ellipse cx={cx} cy={cy - 4} rx={r} ry={r * 0.5} fill={color} opacity={opacity} />;
}

// ─── Individual SVG icons ───────────────────────────────────────────────────

/** Sacred Sage — wrapped dried sage bundle with smoldering embers at the tip. */
function SageIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="sage-bundle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9CCB7C" />
          <stop offset="100%" stopColor="#4F7B3A" />
        </linearGradient>
      </defs>
      <GlowRing color="#9CCB7C" />
      {/* Bundle body */}
      <path
        d="M14 18 Q24 12 34 18 L36 38 Q24 44 12 38 Z"
        fill="url(#sage-bundle)"
        stroke="#2D4A20"
        strokeWidth="0.8"
      />
      {/* Stem leaves (vertical lines) */}
      <line x1="18" y1="14" x2="16" y2="40" stroke="#6B9B4F" strokeWidth="0.5" opacity="0.6" />
      <line x1="24" y1="12" x2="24" y2="42" stroke="#6B9B4F" strokeWidth="0.5" opacity="0.6" />
      <line x1="30" y1="14" x2="32" y2="40" stroke="#6B9B4F" strokeWidth="0.5" opacity="0.6" />
      {/* Binding twine */}
      <ellipse cx="24" cy="20" rx="13" ry="2" fill="#8B5E1F" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="#5C3A0E" strokeWidth="0.5" />
      {/* Smoldering embers at top */}
      <circle cx="22" cy="11" r="1.2" fill="#FF8C42" opacity="0.9" />
      <circle cx="26" cy="10" r="1" fill="#FFB347" opacity="0.8" />
      <circle cx="24" cy="9" r="0.8" fill="#FFD700" opacity="0.7" />
      {/* Smoke wisps */}
      <path d="M24 8 Q22 4 24 2 Q26 4 24 8" fill="none" stroke="#FFFFFF" strokeWidth="0.4" opacity="0.5" />
      <CoinHighlight color="#C8E8AC" />
    </svg>
  );
}

/** Warrior Bow — recurve bow with feather-fletched arrow nocked. */
function BowIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <GlowRing color="#C8860A" />
      {/* Bow stave (recurve shape) */}
      <path
        d="M8 24 Q4 8 14 8 Q24 12 24 24 Q24 36 14 40 Q4 40 8 24"
        fill="none"
        stroke="#8B5E0A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M8 24 Q4 8 14 8 Q24 12 24 24 Q24 36 14 40 Q4 40 8 24"
        fill="none"
        stroke="#C8860A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Bowstring */}
      <line x1="8" y1="24" x2="36" y2="20" stroke="#F5E6C8" strokeWidth="0.6" />
      <line x1="8" y1="24" x2="36" y2="28" stroke="#F5E6C8" strokeWidth="0.6" />
      {/* Arrow shaft — running through middle of bow */}
      <line x1="36" y1="20" x2="48" y2="14" stroke="#C8860A" strokeWidth="1.2" />
      {/* Arrowhead */}
      <path d="M48 14 L42 12 L45 17 Z" fill="#E8A020" stroke="#8B5E0A" strokeWidth="0.4" />
      {/* Arrow nock feathers — three feathers */}
      <path d="M36 20 L31 17 L33 21 Z" fill="#D4AF37" />
      <path d="M34 21 L29 22 L33 24 Z" fill="#C8860A" />
      <path d="M36 22 L31 25 L35 27 Z" fill="#FF8C42" />
      {/* Grip wrap */}
      <rect x="22" y="22" width="2" height="4" fill="#5C3A0E" rx="0.5" />
    </svg>
  );
}

/** Dream Catcher — web hoop with hanging feathers. */
function DreamCatcherIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <GlowRing color="#9C7CF4" />
      {/* Outer hoop */}
      <circle cx="24" cy="22" r="13" fill="none" stroke="#D4AF37" strokeWidth="2.2" />
      <circle cx="24" cy="22" r="11" fill="none" stroke="#8B6914" strokeWidth="0.8" />
      {/* Webbing — diamond pattern */}
      <line x1="11" y1="22" x2="37" y2="22" stroke="#9C7CF4" strokeWidth="0.5" opacity="0.7" />
      <line x1="24" y1="9"  x2="24" y2="35" stroke="#9C7CF4" strokeWidth="0.5" opacity="0.7" />
      <line x1="14" y1="13" x2="34" y2="31" stroke="#9C7CF4" strokeWidth="0.5" opacity="0.7" />
      <line x1="14" y1="31" x2="34" y2="13" stroke="#9C7CF4" strokeWidth="0.5" opacity="0.7" />
      {/* Center bead */}
      <circle cx="24" cy="22" r="1.4" fill="#D4AF37" />
      <circle cx="24" cy="22" r="0.7" fill="#9C7CF4" />
      {/* Hanging feathers */}
      <line x1="20" y1="35" x2="18" y2="42" stroke="#8B5E0A" strokeWidth="0.6" />
      <path d="M16 42 L20 42 L18 46 Z" fill="#D4AF37" />
      <line x1="24" y1="35" x2="24" y2="44" stroke="#8B5E0A" strokeWidth="0.6" />
      <path d="M22 44 L26 44 L24 48 L23 44 Z" fill="#C8860A" />
      <line x1="28" y1="35" x2="30" y2="42" stroke="#8B5E0A" strokeWidth="0.6" />
      <path d="M28 42 L32 42 L30 46 Z" fill="#FF8C42" />
    </svg>
  );
}

/** Eagle Feathers — three feathers fanned out. */
function FeathersIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <GlowRing color="#D4AF37" />
      <defs>
        <linearGradient id="feather-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE89A" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      {/* Center feather */}
      <path
        d="M24 6 Q21 24 23 42 L25 42 Q27 24 24 6"
        fill="url(#feather-gold)"
        stroke="#5C3A0E"
        strokeWidth="0.4"
      />
      <line x1="24" y1="8" x2="24" y2="40" stroke="#5C3A0E" strokeWidth="0.3" opacity="0.6" />
      {/* Left feather (leaning back) */}
      <path
        d="M16 8 Q12 26 14 42 L16 42 Q20 26 16 8"
        fill="url(#feather-gold)"
        stroke="#5C3A0E"
        strokeWidth="0.4"
        opacity="0.85"
      />
      {/* Right feather */}
      <path
        d="M32 8 Q36 26 34 42 L32 42 Q28 26 32 8"
        fill="url(#feather-gold)"
        stroke="#5C3A0E"
        strokeWidth="0.4"
        opacity="0.85"
      />
      {/* Quill wraps at base */}
      <ellipse cx="24" cy="42" rx="6" ry="1.5" fill="#5C3A0E" />
      <line x1="18" y1="42" x2="30" y2="42" stroke="#FFE89A" strokeWidth="0.4" />
      {/* Tiny accent feathers on left/right */}
      <path d="M8 16 L11 38 L13 38 L11 16 Z" fill="#A8482A" opacity="0.7" />
      <path d="M40 16 L37 38 L35 38 L37 16 Z" fill="#A8482A" opacity="0.7" />
    </svg>
  );
}

/** Spirit Arrows — three flint arrowheads in a fan. */
function ArrowsIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <GlowRing color="#FF6B6B" />
      {/* Center arrow — pointing up */}
      <path
        d="M24 5 L28 18 L24 16 L20 18 Z"
        fill="#E8A020"
        stroke="#8B3A0A"
        strokeWidth="0.6"
      />
      <rect x="22.5" y="16" width="3" height="22" fill="#8B5E0A" />
      <line x1="22.5" y1="20" x2="25.5" y2="20" stroke="#5C3A0E" strokeWidth="0.3" />
      {/* Left arrow — tilted left */}
      <g transform="rotate(-25 24 24)">
        <path d="M24 8 L27 19 L24 17 L21 19 Z" fill="#D4AF37" stroke="#8B3A0A" strokeWidth="0.6" />
        <rect x="22.5" y="17" width="3" height="20" fill="#8B5E0A" />
      </g>
      {/* Right arrow — tilted right */}
      <g transform="rotate(25 24 24)">
        <path d="M24 8 L27 19 L24 17 L21 19 Z" fill="#D4AF37" stroke="#8B3A0A" strokeWidth="0.6" />
        <rect x="22.5" y="17" width="3" height="20" fill="#8B5E0A" />
      </g>
      {/* Tie wrap at base */}
      <ellipse cx="24" cy="40" rx="8" ry="1.5" fill="#5C3A0E" />
      <line x1="16" y1="40" x2="32" y2="40" stroke="#FFE89A" strokeWidth="0.4" />
    </svg>
  );
}

/** Spirit Wolf — howling wolf silhouette with spirit glow. */
function WolfIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id="wolf-glow" cx="0.5" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#A8C8E0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a1525" stopOpacity="0" />
        </radialGradient>
      </defs>
      <GlowRing color="#88AACC" />
      <circle cx="24" cy="20" r="14" fill="url(#wolf-glow)" />
      {/* Moon behind wolf */}
      <circle cx="36" cy="12" r="3" fill="#F5E6C8" opacity="0.7" />
      {/* Wolf body — stylized silhouette howling up at moon */}
      <g transform="translate(2 0)">
        {/* Head tilted up */}
        <path
          d="M18 38 Q14 28 18 18 Q22 14 24 14 L26 18 Q30 22 30 28 L32 32 Q30 36 26 38 Z"
          fill="#2A3A4A"
          stroke="#88AACC"
          strokeWidth="0.8"
        />
        {/* Ear */}
        <path d="M21 14 L19 8 L23 12 Z" fill="#2A3A4A" stroke="#88AACC" strokeWidth="0.6" />
        {/* Inner ear glow */}
        <path d="M21 12 L20 10 L22 11 Z" fill="#FF8C42" opacity="0.6" />
        {/* Eye glint */}
        <circle cx="24" cy="20" r="0.8" fill="#FFD700" />
        {/* Snout / howling mouth */}
        <path d="M28 22 L34 20 L32 24 Z" fill="#1A2530" />
        {/* Chest fur tuft */}
        <path d="M22 30 L24 34 L26 30" fill="#3A4A5A" opacity="0.7" />
        {/* Front legs */}
        <rect x="22" y="36" width="2" height="6" fill="#2A3A4A" />
        <rect x="28" y="36" width="2" height="6" fill="#2A3A4A" />
      </g>
    </svg>
  );
}

/** War Drum — ceremonial drum on a tripod stand. */
function DrumIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="drum-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8860A" />
          <stop offset="100%" stopColor="#5C3A0E" />
        </linearGradient>
      </defs>
      <GlowRing color="#A8482A" />
      {/* Drum body (side view: ellipse + side) */}
      <ellipse cx="24" cy="20" rx="14" ry="5" fill="url(#drum-skin)" stroke="#5C3A0E" strokeWidth="0.6" />
      <rect x="10" y="20" width="28" height="14" fill="#8B3A1A" />
      <ellipse cx="24" cy="34" rx="14" ry="5" fill="#5C3A0E" />
      {/* Lacing — X pattern on side */}
      <line x1="11" y1="22" x2="13" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="13" y1="22" x2="11" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="16" y1="22" x2="18" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="18" y1="22" x2="16" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="21" y1="22" x2="23" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="23" y1="22" x2="21" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="26" y1="22" x2="28" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="28" y1="22" x2="26" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="31" y1="22" x2="33" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="33" y1="22" x2="31" y2="32" stroke="#D4AF37" strokeWidth="0.5" />
      {/* Triangular totem symbol on top */}
      <path d="M22 17 L26 17 L24 21 Z" fill="#8B3A0A" stroke="#D4AF37" strokeWidth="0.4" />
      {/* Drumstick */}
      <line x1="34" y1="36" x2="44" y2="30" stroke="#5C3A0E" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="44" cy="30" r="1.6" fill="#D4AF37" />
      {/* Decorative fringe at bottom */}
      <line x1="12" y1="38" x2="12" y2="40" stroke="#D4AF37" strokeWidth="0.6" />
      <line x1="18" y1="38" x2="18" y2="40" stroke="#D4AF37" strokeWidth="0.6" />
      <line x1="24" y1="38" x2="24" y2="40" stroke="#D4AF37" strokeWidth="0.6" />
      <line x1="30" y1="38" x2="30" y2="40" stroke="#D4AF37" strokeWidth="0.6" />
      <line x1="36" y1="38" x2="36" y2="40" stroke="#D4AF37" strokeWidth="0.6" />
    </svg>
  );
}

/** Sunstones — three crystal/gem stones. */
function SunstonesIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id="sunstone-pink" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFD0E8" />
          <stop offset="60%" stopColor="#FF6BAA" />
          <stop offset="100%" stopColor="#A02A6A" />
        </radialGradient>
      </defs>
      <GlowRing color="#FF6BAA" />
      {/* Center stone */}
      <path d="M24 8 L30 18 L24 30 L18 18 Z" fill="url(#sunstone-pink)" stroke="#A02A6A" strokeWidth="0.6" />
      <path d="M24 8 L24 30 M18 18 L30 18" stroke="#FFD0E8" strokeWidth="0.4" opacity="0.6" />
      {/* Left stone */}
      <path d="M12 22 L17 28 L12 36 L7 28 Z" fill="url(#sunstone-pink)" stroke="#A02A6A" strokeWidth="0.5" opacity="0.85" />
      {/* Right stone */}
      <path d="M36 22 L41 28 L36 36 L31 28 Z" fill="url(#sunstone-pink)" stroke="#A02A6A" strokeWidth="0.5" opacity="0.85" />
      {/* Sparkle on center */}
      <path d="M24 11 L25 14 L28 14 L26 16 L27 19 L24 17 L21 19 L22 16 L20 14 L23 14 Z" fill="#FFFFFF" opacity="0.7" />
      {/* Tiny additional sparkles */}
      <circle cx="9" cy="24" r="0.8" fill="#FFFFFF" opacity="0.7" />
      <circle cx="39" cy="24" r="0.8" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

/** Sacred Fire (WILD) — tribal fire burning on a stone. */
function FireIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id="fire-gradient" cx="0.5" cy="0.7" r="0.5">
          <stop offset="0%"   stopColor="#FFE89A" />
          <stop offset="30%"  stopColor="#FF8C42" />
          <stop offset="70%"  stopColor="#CC2210" />
          <stop offset="100%" stopColor="#5C0A00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <GlowRing color="#FF6B1A" opacity={0.6} />
      {/* Outer flame glow halo */}
      <circle cx="24" cy="22" r="14" fill="url(#fire-gradient)" />
      {/* Flame body — layered tongues */}
      <path
        d="M24 6 Q18 14 18 22 Q18 30 24 36 Q30 30 30 22 Q30 14 24 6 Z"
        fill="#FF6B1A"
        opacity="0.6"
      />
      <path
        d="M24 12 Q21 18 21 24 Q21 30 24 34 Q27 30 27 24 Q27 18 24 12 Z"
        fill="#FF8C42"
      />
      <path
        d="M24 18 Q22.5 22 22.5 26 Q22.5 30 24 32 Q25.5 30 25.5 26 Q25.5 22 24 18 Z"
        fill="#FFD700"
      />
      <path
        d="M24 22 Q23.5 25 23.5 27 Q23.5 29 24 30 Q24.5 29 24.5 27 Q24.5 25 24 22 Z"
        fill="#FFFFFF"
        opacity="0.7"
      />
      {/* Stone base */}
      <ellipse cx="24" cy="40" rx="12" ry="4" fill="#3A3A4A" stroke="#1A1A2A" strokeWidth="0.5" />
      <ellipse cx="20" cy="39" rx="2"   ry="1" fill="#5A5A6A" />
      <ellipse cx="28" cy="39" rx="2"   ry="1" fill="#5A5A6A" />
      <ellipse cx="24" cy="38" rx="2"   ry="1" fill="#5A5A6A" />
      {/* WILD banner chip */}
      <rect x="14" y="42" width="20" height="4" rx="1" fill="#1A0A2A" stroke="#D4AF37" strokeWidth="0.4" />
      <text x="24" y="45.5" fontSize="3.4" fontWeight="900" fill="#D4AF37" textAnchor="middle" fontFamily="sans-serif">WILD</text>
    </svg>
  );
}

/** Huntress Warrior (SCATTER) — silhouette of a warrior holding a bow. */
function HuntressPhoto({ size, className, style }: Props) {
  // Real illustration used as the SCATTER symbol on the reels.
  // Source: /client/public/huntress-warrior-square.png (1086x1086,
  // upward-biased crop from 1086x1448 portrait to preserve headdress
  // + moon). Painted for the cabinet by the user; replaces the old
  // SVG silhouette (HuntressIcon below) which the user said looked
  // "like a 5-year-old drew it".
  //
  // The 1:1 source is composited with a soft amber glow ring behind
  // the figure (matching the candle-bloom cabinet language) so the
  // tile reads as "lit by candle" rather than pasted-on photograph.
  // The amber glow uses her actual palette: copper #B87333, ember
  // orange #FF8A3C, plum #5A1F4E.
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: 4,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 38%, rgba(255,194,71,0.45) 0%, rgba(255,138,60,0.2) 35%, rgba(90,31,78,0.0) 65%)",
        ...style,
      }}
    >
      <img
        src="/huntress-warrior-square.png"
        alt="Huntress Warrior scatter"
        width={size}
        height={size}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 30%",
          // Slight contrast/saturation boost so the image reads crisply
          // at 72px and integrates with the cabinet's candle-lit palette.
          filter: "contrast(1.08) saturate(1.12) drop-shadow(0 0 6px rgba(255,194,71,0.35))",
        }}
      />
    </div>
  );
}

function HuntressIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="huntress-armor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD0E8" />
          <stop offset="50%" stopColor="#C8860A" />
          <stop offset="100%" stopColor="#5C3A0E" />
        </linearGradient>
      </defs>
      <GlowRing color="#FF6BAA" opacity={0.7} />
      {/* Spirit rays behind */}
      <g opacity="0.3">
        <line x1="24" y1="0" x2="24" y2="48" stroke="#FF6BAA" strokeWidth="0.6" />
        <line x1="0" y1="24" x2="48" y2="24" stroke="#FF6BAA" strokeWidth="0.6" />
        <line x1="6" y1="6" x2="42" y2="42" stroke="#FF6BAA" strokeWidth="0.6" />
        <line x1="42" y1="6" x2="6" y2="42" stroke="#FF6BAA" strokeWidth="0.6" />
      </g>
      {/* Head profile */}
      <ellipse cx="22" cy="13" rx="5" ry="6" fill="#E8A878" stroke="#5C3A0E" strokeWidth="0.5" />
      {/* Hair / headdress feathers */}
      <path d="M18 11 Q14 8 12 4 Q15 5 17 8" fill="#3A1A0A" />
      <path d="M26 11 L30 6 L33 8 L29 12 Z" fill="#D4AF37" />
      <path d="M27 10 L34 4 L36 6 L31 11 Z" fill="#C8860A" />
      <path d="M28 9 L36 2 L37 4 L31 9 Z" fill="#FF6BAA" />
      {/* Eye */}
      <circle cx="23" cy="13" r="0.6" fill="#1A1A2A" />
      {/* Body/torso in armor */}
      <path
        d="M16 22 Q14 30 18 38 L30 38 Q34 30 32 22 Q30 20 24 20 Q18 20 16 22 Z"
        fill="url(#huntress-armor)"
        stroke="#5C3A0E"
        strokeWidth="0.6"
      />
      {/* Chest amulet */}
      <circle cx="24" cy="28" r="2" fill="#5C3A0E" stroke="#D4AF37" strokeWidth="0.3" />
      <circle cx="24" cy="28" r="1" fill="#FF6BAA" />
      {/* Bow held in left hand */}
      <path
        d="M36 14 Q34 22 36 30 Q38 32 38 30 Q40 22 38 14"
        fill="none"
        stroke="#8B5E0A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line x1="36" y1="14" x2="36" y2="30" stroke="#F5E6C8" strokeWidth="0.3" />
      {/* Arrow nocked */}
      <line x1="36" y1="22" x2="46" y2="20" stroke="#5C3A0E" strokeWidth="0.6" />
      <path d="M46 20 L42 18 L45 22 Z" fill="#E8A020" />
    </svg>
  );
}

/** Spirit Arrow (SCATTER) — glowing energy arrow / lightning bolt. */
function SpiritArrowIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="arrow-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#C8860A" />
        </linearGradient>
        <radialGradient id="arrow-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
      </defs>
      <GlowRing color="#FFD700" opacity={0.7} />
      <circle cx="24" cy="24" r="14" fill="url(#arrow-glow)" />
      {/* Stylized arrow pointing down-right (energy direction) */}
      <path
        d="M12 12 L18 14 L16 20 L22 22 L20 28 L34 36 L36 32 L40 36 L36 40 L28 34 L26 30 L20 32 L18 26 L12 28 L10 22 L4 16 Z"
        fill="url(#arrow-grad)"
        stroke="#8B6914"
        strokeWidth="0.6"
      />
      {/* Highlight */}
      <path
        d="M14 14 L17 15 L16 18 Z"
        fill="#FFFFFF"
        opacity="0.7"
      />
      <path
        d="M30 34 L33 36 L31 38 Z"
        fill="#FFFFFF"
        opacity="0.7"
      />
      {/* Energy sparks */}
      <circle cx="6"  cy="18" r="0.8" fill="#FFD700" opacity="0.7" />
      <circle cx="42" cy="30" r="0.8" fill="#FFD700" opacity="0.7" />
      <circle cx="38" cy="6"  r="0.8" fill="#FFD700" opacity="0.7" />
    </svg>
  );
}

// Re-export typing-aware alias — keeps lint happy if a name differs
function DreamCatcher({ size, className, style }: Props) { return <DreamCatcherIcon size={size} className={className} style={style} />; }

/** Green Coin — Vegas Hold & Win sticky coin. */
function GreenCoinIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id="greenCoinGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#7CFC00" />
          <stop offset="100%" stopColor="#006400" />
        </radialGradient>
      </defs>
      <GlowRing color="#32CD32" />
      <circle cx="24" cy="24" r="18" fill="url(#greenCoinGrad)" stroke="#228B22" strokeWidth="2" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#ADFF2F" strokeWidth="1" opacity="0.6" />
      <text x="24" y="29" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#003300">$</text>
      <ellipse cx="20" cy="16" rx="4" ry="2" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}

/** Gold Coin — Vegas Hold & Win sticky coin. */
function GoldCoinIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <defs>
        <radialGradient id="goldCoinGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFACD" />
          <stop offset="100%" stopColor="#B8860B" />
        </radialGradient>
      </defs>
      <GlowRing color="#FFD700" />
      <circle cx="24" cy="24" r="18" fill="url(#goldCoinGrad)" stroke="#DAA520" strokeWidth="2" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.6" />
      <text x="24" y="29" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#5C3A0E">$</text>
      <ellipse cx="20" cy="16" rx="4" ry="2" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}
