/**
 * FreeSpinsDisplay — Prominent free spins counter overlay
 * Shows remaining free spins like professional casino apps
 */

interface Props {
  freeSpins: number;
}

export default function FreeSpinsDisplay({ freeSpins }: Props) {
  if (freeSpins <= 0) return null;

  return (
    <div
      className="absolute top-2 right-2 z-30 px-3 py-1.5 rounded-full flex items-center gap-2"
      style={{
        background: "linear-gradient(135deg, #0a2a0a, #1a4a1a)",
        border: "2px solid #4CAF50",
        boxShadow: "0 0 15px rgba(76,175,80,0.6), 0 0 30px rgba(76,175,80,0.3)",
        animation: "freeSpinPulse 1.5s ease-in-out infinite",
      }}
    >
      <span style={{ fontSize: "1rem" }}>🎁</span>
      <div className="text-center">
        <div
          className="font-numbers font-bold leading-none"
          style={{
            fontSize: "1.2rem",
            color: "#90EE90",
            textShadow: "0 0 10px rgba(144,238,144,0.8)",
          }}
        >
          {freeSpins}
        </div>
        <div
          className="font-numbers uppercase tracking-widest"
          style={{ fontSize: "0.55rem", color: "rgba(144,238,144,0.7)" }}
        >
          Free Spins
        </div>
      </div>

      <style>{`
        @keyframes freeSpinPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(76,175,80,0.6), 0 0 30px rgba(76,175,80,0.3); }
          50% { box-shadow: 0 0 25px rgba(76,175,80,0.9), 0 0 50px rgba(76,175,80,0.5); }
        }
      `}</style>
    </div>
  );
}
