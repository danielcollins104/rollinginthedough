/**
 * SymbolIcon — Rich inline SVG icons for slot machine symbols
 * Replaces emoji with polished vector graphics
 */

import { type SymbolId } from "@/hooks/useGameState";

interface Props {
  symbolId: SymbolId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SymbolIcon({ symbolId, size = 48, className, style }: Props) {
  switch (symbolId) {
    case "bread":
      return <BreadIcon size={size} className={className} style={style} />;
    case "rolling":
      return <RollingIcon size={size} className={className} style={style} />;
    case "pretzel":
      return <PretzelIcon size={size} className={className} style={style} />;
    case "croissant":
      return <CroissantIcon size={size} className={className} style={style} />;
    case "cookie":
      return <CookieIcon size={size} className={className} style={style} />;
    case "cupcake":
      return <CupcakeIcon size={size} className={className} style={style} />;
    case "cake":
      return <CakeIcon size={size} className={className} style={style} />;
    case "muffin":
      return <MuffinIcon size={size} className={className} style={style} />;
    case "bun":
      return <BunIcon size={size} className={className} style={style} />;
    case "huntress":
      return <HuntressIcon size={size} className={className} style={style} />;
    case "dough":
      return <DoughIcon size={size} className={className} style={style} />;
    default:
      return <BreadIcon size={size} className={className} style={style} />;
  }
}

// ─── Individual SVG icons ─────────────────────────────────────────────────────

function BreadIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Bread loaf */}
      <ellipse cx="24" cy="26" rx="18" ry="12" fill="#E8A020" />
      <ellipse cx="24" cy="24" rx="16" ry="10" fill="#F5B841" />
      {/* Top crust highlight */}
      <ellipse cx="24" cy="20" rx="12" ry="6" fill="#D49020" opacity="0.6" />
      {/* Score marks */}
      <path d="M16 22 Q20 18 24 22" stroke="#C87818" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M22 20 Q26 16 30 20" stroke="#C87818" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Glow */}
      <ellipse cx="24" cy="26" rx="18" ry="12" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

function RollingIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Roller body */}
      <rect x="6" y="18" width="36" height="12" rx="6" fill="#C8860A" />
      <rect x="8" y="20" width="32" height="8" rx="4" fill="#E8A020" />
      {/* Handles */}
      <rect x="2" y="20" width="6" height="8" rx="3" fill="#8B5E0A" />
      <rect x="40" y="20" width="6" height="8" rx="3" fill="#8B5E0A" />
      {/* Highlight */}
      <rect x="10" y="21" width="28" height="3" rx="1.5" fill="#F5D080" opacity="0.5" />
      {/* Wood grain lines */}
      <line x1="14" y1="24" x2="34" y2="24" stroke="#B87820" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function PretzelIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Pretzel twist */}
      <path d="M14 14 C8 14 6 22 12 26 C6 30 8 38 16 38 C22 38 26 30 20 26 C26 22 22 14 14 14 Z"
        fill="none" stroke="#D49020" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Lighter center */}
      <path d="M14 14 C8 14 6 22 12 26 C6 30 8 38 16 38 C22 38 26 30 20 26 C26 22 22 14 14 14 Z"
        fill="none" stroke="#E8A830" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Salt crystals */}
      <circle cx="13" cy="18" r="1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="16" cy="22" r="0.8" fill="#FFFFFF" opacity="0.7" />
      <circle cx="11" cy="28" r="0.9" fill="#FFFFFF" opacity="0.75" />
      <circle cx="15" cy="33" r="0.8" fill="#FFFFFF" opacity="0.65" />
    </svg>
  );
}

function CroissantIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Croissant body */}
      <path d="M6 30 Q12 18 24 14 Q36 18 42 30 Q36 34 24 36 Q12 34 6 30 Z" fill="#E8A020" />
      <path d="M8 29 Q13 19 24 16 Q35 19 40 29 Q35 33 24 35 Q13 33 8 29 Z" fill="#F5C842" />
      {/* Layered pastry lines */}
      <path d="M10 28 Q16 20 24 17" stroke="#D49020" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M38 28 Q32 20 24 17" stroke="#D49020" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M12 29 Q17 23 24 20" stroke="#D49020" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M36 29 Q31 23 24 20" stroke="#D49020" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Highlight */}
      <path d="M14 26 Q20 20 24 18" stroke="#FFF0A0" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function CookieIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Cookie base */}
      <circle cx="24" cy="24" r="16" fill="#D49020" />
      <circle cx="24" cy="24" r="14" fill="#E8A830" />
      {/* Chocolate chips */}
      <ellipse cx="18" cy="20" rx="2.5" ry="2" fill="#4A2C0A" />
      <ellipse cx="28" cy="18" rx="2" ry="1.8" fill="#4A2C0A" />
      <ellipse cx="30" cy="28" rx="2.2" ry="1.8" fill="#4A2C0A" />
      <ellipse cx="20" cy="30" rx="2" ry="1.6" fill="#4A2C0A" />
      <ellipse cx="24" cy="24" rx="2.5" ry="2" fill="#4A2C0A" />
      <ellipse cx="14" cy="26" rx="1.5" ry="1.2" fill="#4A2C0A" />
      <ellipse cx="26" cy="32" rx="1.5" ry="1.2" fill="#4A2C0A" />
      {/* Chip highlights */}
      <ellipse cx="17.5" cy="19.5" rx="1" ry="0.7" fill="#6A3C14" />
      <ellipse cx="27.5" cy="17.5" rx="0.8" ry="0.6" fill="#6A3C14" />
      {/* Cookie edge shadow */}
      <circle cx="24" cy="24" r="16" fill="none" stroke="#C07810" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

function CupcakeIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Cupcake base / liner */}
      <path d="M12 28 L14 42 L34 42 L36 28 Z" fill="#E8A020" />
      <path d="M13 28 L15 41 L33 41 L35 28 Z" fill="#D49020" />
      {/* Liner ridges */}
      <line x1="17" y1="28" x2="18" y2="41" stroke="#C07810" strokeWidth="0.8" opacity="0.5" />
      <line x1="22" y1="28" x2="22.5" y2="41" stroke="#C07810" strokeWidth="0.8" opacity="0.5" />
      <line x1="27" y1="28" x2="26.5" y2="41" stroke="#C07810" strokeWidth="0.8" opacity="0.5" />
      <line x1="32" y1="28" x2="31" y2="41" stroke="#C07810" strokeWidth="0.8" opacity="0.5" />
      {/* Pink frosting swirl */}
      <path d="M10 28 Q10 18 24 16 Q38 18 38 28 Q36 22 24 20 Q12 22 10 28 Z" fill="#FF6B8A" />
      <path d="M12 27 Q13 20 24 18 Q35 20 36 27 Q34 23 24 21 Q14 23 12 27 Z" fill="#FF85A0" />
      {/* Frosting swirl top */}
      <ellipse cx="24" cy="16" rx="4" ry="3" fill="#FFB6C8" />
      {/* Cherry on top */}
      <circle cx="24" cy="12" r="4" fill="#E82020" />
      <circle cx="22.5" cy="10.5" r="1.2" fill="#FF5050" />
      {/* Cherry stem */}
      <path d="M24 8 Q26 5 28 6" stroke="#2D8A20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CakeIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Cake base */}
      <rect x="8" y="26" width="32" height="14" rx="2" fill="#E8A830" />
      <rect x="10" y="28" width="28" height="10" rx="1" fill="#F5D060" />
      {/* Top frosted layer */}
      <rect x="8" y="22" width="32" height="6" rx="2" fill="#FF85A0" />
      <rect x="10" y="24" width="28" height="3" rx="1" fill="#FFB6C8" />
      {/* Candles */}
      <rect x="14" y="14" width="3" height="10" rx="1" fill="#FFD700" />
      <rect x="22" y="12" width="3" height="12" rx="1" fill="#FF6B35" />
      <rect x="30" y="14" width="3" height="10" rx="1" fill="#FFD700" />
      {/* Flames */}
      <ellipse cx="15.5" cy="12" rx="2" ry="3.5" fill="#FF6B35" />
      <ellipse cx="15.5" cy="11" rx="1" ry="2" fill="#FFD700" />
      <ellipse cx="23.5" cy="10" rx="2" ry="3.5" fill="#FF6B35" />
      <ellipse cx="23.5" cy="9" rx="1" ry="2" fill="#FFD700" />
      <ellipse cx="31.5" cy="12" rx="2" ry="3.5" fill="#FF6B35" />
      <ellipse cx="31.5" cy="11" rx="1" ry="2" fill="#FFD700" />
      {/* Happy face on cake */}
      <circle cx="19" cy="33" r="1.5" fill="#C07810" />
      <circle cx="29" cy="33" r="1.5" fill="#C07810" />
      <path d="M17 36 Q24 40 31 36" stroke="#C07810" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Cherry on top */}
      <circle cx="24" cy="22" r="3" fill="#E82020" />
      <circle cx="22.8" cy="20.8" r="0.9" fill="#FF5050" />
    </svg>
  );
}

function MuffinIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Muffin base / liner */}
      <path d="M12 26 L14 42 L34 42 L36 26 Z" fill="#88CCFF" />
      <path d="M13" y1="26" L15" y1="41" L33" y1="41" L35" y1="26 Z" fill="#5599DD" opacity="0.4" />
      {/* Paper liner texture */}
      <path d="M12 26 L14 42" stroke="#88CCFF" strokeWidth="1.5" />
      <path d="M16 26 L16.5 42" stroke="#88CCFF" strokeWidth="1" opacity="0.5" />
      <path d="M21 26 L21.5 42" stroke="#88CCFF" strokeWidth="1" opacity="0.5" />
      <path d="M26 26 L25.5 42" stroke="#88CCFF" strokeWidth="1" opacity="0.5" />
      <path d="M31 26 L30 42" stroke="#88CCFF" strokeWidth="1.5" />
      <path d="M36 26 L34 42" stroke="#88CCFF" strokeWidth="1.5" />
      {/* Muffin top dome */}
      <path d="M8 26 Q10 16 24 14 Q38 16 40 26 Z" fill="#E8A030" />
      <path d="M10 25 Q12 17 24 15 Q36 17 38 25 Z" fill="#F5B848" />
      {/* Blueberry topping dots */}
      <circle cx="18" cy="21" r="2.5" fill="#2244AA" />
      <circle cx="28" cy="19" r="2" fill="#2244AA" />
      <circle cx="24" cy="24" r="2.2" fill="#2244AA" />
      <circle cx="15" cy="24" r="1.8" fill="#2244AA" />
      <circle cx="32" cy="22" r="2" fill="#2244AA" />
      {/* Blueberry highlights */}
      <circle cx="17.2" cy="20.2" r="0.8" fill="#4477DD" />
      <circle cx="27.2" cy="18.2" r="0.6" fill="#4477DD" />
    </svg>
  );
}

function BunIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Outer bun ring */}
      <circle cx="24" cy="24" r="17" fill="#2D8A20" />
      <circle cx="24" cy="24" r="15" fill="#3DA828" />
      {/* Clover leaves */}
      <ellipse cx="24" cy="14" rx="5" ry="6" fill="#4DC83A" />
      <ellipse cx="14" cy="24" rx="6" ry="5" fill="#4DC83A" />
      <ellipse cx="34" cy="24" rx="6" ry="5" fill="#4DC83A" />
      <ellipse cx="24" cy="34" rx="5" ry="6" fill="#4DC83A" />
      {/* Inner highlights */}
      <ellipse cx="24" cy="13" rx="3" ry="3.5" fill="#6ADE5A" opacity="0.6" />
      <ellipse cx="13" cy="24" rx="3.5" ry="3" fill="#6ADE5A" opacity="0.6" />
      <ellipse cx="35" cy="24" rx="3.5" ry="3" fill="#6ADE5A" opacity="0.6" />
      <ellipse cx="24" cy="35" rx="3" ry="3.5" fill="#6ADE5A" opacity="0.6" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="5" fill="#2D8A20" />
      <circle cx="24" cy="24" r="3.5" fill="#3DA828" />
      <circle cx="22.5" cy="22.5" r="1.2" fill="#6ADE5A" opacity="0.7" />
      {/* Glow ring */}
      <circle cx="24" cy="24" r="17" fill="none" stroke="#90EE90" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function HuntressIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Crown body */}
      <path d="M6 32 L10 16 L18 22 L24 10 L30 22 L38 16 L42 32 Z" fill="#FFD700" />
      <path d="M8 31 L11 18 L18 23 L24 12 L30 23 L37 18 L40 31 Z" fill="#F5E040" />
      {/* Crown points */}
      <circle cx="10" cy="16" r="2" fill="#FFD700" />
      <circle cx="24" cy="10" r="2.5" fill="#FFD700" />
      <circle cx="38" cy="16" r="2" fill="#FFD700" />
      {/* Crown base band */}
      <rect x="6" y="30" width="36" height="5" rx="1" fill="#D4AF37" />
      <rect x="8" y="31" width="32" height="3" rx="0.5" fill="#F5E6C8" opacity="0.4" />
      {/* Jewels on band */}
      <circle cx="14" cy="32.5" r="2" fill="#FF3366" />
      <circle cx="24" cy="32.5" r="2.5" fill="#FF3366" />
      <circle cx="34" cy="32.5" r="2" fill="#FF3366" />
      {/* Jewel highlights */}
      <circle cx="13.2" cy="31.8" r="0.7" fill="#FF88AA" />
      <circle cx="23.2" cy="31.8" r="0.8" fill="#FF88AA" />
      <circle cx="33.2" cy="31.8" r="0.7" fill="#FF88AA" />
      {/* Crown rim */}
      <rect x="6" y="30" width="36" height="5" rx="1" fill="none" stroke="#C8860A" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

function DoughIcon({ size, className, style }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
      {/* Dollar coin */}
      <circle cx="24" cy="24" r="17" fill="#FFD700" />
      <circle cx="24" cy="24" r="15" fill="#F5E040" />
      <circle cx="24" cy="24" r="13" fill="#FFD700" stroke="#D4AF37" strokeWidth="1" />
      {/* Dollar sign */}
      <path d="M24 14 L24 34 M20 18 Q24 16 28 18 Q24 21 20 22 Q24 24 28 24 Q24 27 20 28 Q24 30 28 30"
        stroke="#B8860A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Inner ring details */}
      <circle cx="24" cy="24" r="11" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5" />
      {/* Star sparkles */}
      <path d="M8 12 L9 14 L11 14 L9.5 15.5 L10 17.5 L8 16 L6 17.5 L6.5 15.5 L5 14 L7 14 Z"
        fill="#FFF0A0" opacity="0.8" />
      <path d="M38 34 L39 36 L41 36 L39.5 37.5 L40 39.5 L38 38 L36 39.5 L36.5 37.5 L35 36 L37 36 Z"
        fill="#FFF0A0" opacity="0.7" />
      <path d="M40 10 L41 12 L43 12 L41.5 13.5 L42 15.5 L40 14 L38 15.5 L38.5 13.5 L37 12 L39 12 Z"
        fill="#FFF0A0" opacity="0.6" />
      {/* Outer glow */}
      <circle cx="24" cy="24" r="17" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}