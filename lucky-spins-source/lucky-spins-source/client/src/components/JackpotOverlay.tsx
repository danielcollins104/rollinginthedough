/**
 * Rolling in the Dough — Jackpot Overlay
 * Full-screen celebration overlay for jackpot wins
 */

import { useEffect, useState } from "react";

interface Props {
  amount: number;
  onClose: () => void;
}

export default function JackpotOverlay({ amount, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);

    // Count up animation
    const target = amount;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let count = 0;
    const interval = setInterval(() => {
      current += increment;
      count++;
      setDisplayAmount(Math.round(current));
      if (count >= steps) {
        setDisplayAmount(target);
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [amount]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center jackpot-overlay"
      style={{
        zIndex: 900,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663349960110/ayNoVaN9cNAqmUHUzZ966J/ritd-jackpot-bg-Jwm6bJppmYiyNvP8NZwvkd.webp)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(5,5,16,0.75)" }} />

      {/* Content */}
      <div
        className="relative z-10 text-center px-8 py-10 rounded-lg max-w-md mx-4"
        style={{
          background: "linear-gradient(135deg, rgba(5,5,16,0.95), rgba(13,10,0,0.95))",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Art Deco top ornament */}
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />

        {/* Stars */}
        <div className="text-4xl mb-2 animate-bounce">⭐</div>

        <div
          className="font-display font-black text-4xl sm:text-5xl mb-2"
          style={{
            background: "linear-gradient(135deg, #C8860A, #D4AF37, #F5E6C8, #D4AF37, #C8860A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer 1s ease-in-out infinite",
          }}
        >
          JACKPOT!
        </div>

        <div
          className="font-display text-lg mb-4 opacity-80"
          style={{ color: "#F5E6C8" }}
        >
          Rolling in the Dough!
        </div>

        {/* Amount */}
        <div
          className="font-numbers font-bold text-5xl sm:text-6xl mb-6"
          style={{
            color: "#FFD700",
            textShadow: "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)",
          }}
        >
          {displayAmount.toLocaleString()}
          <span className="text-3xl ml-2">🪙</span>
        </div>

        {/* Deco divider */}
        <div className="deco-divider mb-4">
          <span className="text-xs font-numbers" style={{ color: "#D4AF37" }}>◆ ◆ ◆</span>
        </div>

        <div className="text-sm font-body mb-6" style={{ color: "#C8860A" }}>
          You hit the jackpot! All those virtual coins are yours!
        </div>

        <button
          onClick={onClose}
          className="spin-btn px-8 py-3 rounded text-base font-bold tracking-widest"
        >
          COLLECT WINNINGS
        </button>

        {/* Art Deco bottom ornament */}
        <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      </div>

      {/* Floating emoji coins */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-40px",
            animation: `coinFall ${1.5 + Math.random() * 2}s linear ${Math.random() * 3}s infinite`,
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
}
