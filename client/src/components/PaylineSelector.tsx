/**
 * Rolling in the Dough — Payline Selector
 * Let players choose how many paylines to play
 */

import { Zap } from "lucide-react";

interface PaylineSelectorProps {
  paylines: number;
  onPaylineChange: (lines: number) => void;
  disabled?: boolean;
}

const PAYLINE_OPTIONS = [1, 5, 10, 15, 20, 25];

export default function PaylineSelector({ paylines, onPaylineChange, disabled }: PaylineSelectorProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
        border: "1px solid #D4AF37",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-300" />
        <label className="text-sm font-bold text-yellow-300">Paylines</label>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {PAYLINE_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onPaylineChange(option)}
            disabled={disabled}
            className="py-2 px-3 rounded-lg font-bold text-sm transition-all"
            style={{
              background: paylines === option ? "#D4AF37" : "rgba(212,175,55,0.2)",
              color: paylines === option ? "#000" : "#D4AF37",
              border: paylines === option ? "2px solid #FFD700" : "1px solid #D4AF37",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {option}
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        <p>More lines = more chances to win, but costs more coins per spin</p>
      </div>
    </div>
  );
}
