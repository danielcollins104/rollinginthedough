import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TopWinsTickerProps {
  className?: string;
}

export default function TopWinsTicker({ className }: TopWinsTickerProps) {
  const [topWins, setTopWins] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data } = trpc.game.getTopWins.useQuery();

  useEffect(() => {
    if (data) {
      setTopWins(data);
    }
  }, [data]);

  useEffect(() => {
    if (topWins.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topWins.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [topWins.length]);

  if (topWins.length === 0) return null;

  return (
    <div
      className={`flex items-center justify-center gap-3 px-4 py-1 transition-all duration-500 ${className}`}
      style={{
        background: "rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(212,175,55,0.2)",
        fontSize: "0.75rem",
        fontFamily: "'Oswald', sans-serif",
        color: "#D4AF37"
      }}
    >
      <Trophy size={14} className="text-yellow-500 animate-bounce" />
      <div className="flex items-center gap-2 overflow-hidden relative w-64 h-5">
        <div 
          className="absolute inset-0 transition-all duration-500 ease-in-out"
          style={{ 
            transform: `translateY(${currentIndex * -20}px)`, // Assuming 20px height per row
          }}
        >
          {topWins.map((win, i) => (
            <div key={win.id} className="h-5 flex items-center gap-2 whitespace-nowrap" style={{ height: '20px' }}>
              <span className="font-bold text-yellow-400">{win.userName}</span>
              <span className="text-gray-400">won</span>
              <span className="font-black text-white">{win.winAmount.toLocaleString()}</span>
              <span className="text-yellow-500">🪙</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
