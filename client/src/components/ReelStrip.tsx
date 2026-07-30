import { useEffect, useState } from "react";
import { SYMBOLS, type SymbolId } from "@shared/game";
import { getSymbol } from "@/lib/reelHelpers";
import SymbolIcon from "./SymbolIcon";

interface ReelStripProps {
  symbols: SymbolId[];
  spinning: boolean;
  done: boolean;
  size?: number;
}

export default function ReelStrip({ symbols, spinning, done, size = 36 }: ReelStripProps) {
  const [blurSymbols, setBlurSymbols] = useState<SymbolId[]>([]);

  useEffect(() => {
    if (spinning && !done) {
      const interval = setInterval(() => {
        setBlurSymbols(
          Array.from({ length: 5 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id)
        );
      }, 60);
      return () => clearInterval(interval);
    }
  }, [spinning, done]);

  if (spinning && !done) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "rgba(5,5,16,0.05)" }}>
        {blurSymbols.map((symId, i) => {
          const sym = getSymbol(symId);
          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center"
              style={{ filter: "blur(2px)", opacity: 0.5 }}
            >
              <SymbolIcon symbolId={sym.id} size={Math.floor(size * 0.55)} />
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}
