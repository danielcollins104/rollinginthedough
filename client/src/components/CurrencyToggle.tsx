/**
 * Currency Toggle Component
 * Compact tab-style toggle for switching between Gold Coins (free play) and Green Coins (premium)
 */

import { Coins } from "lucide-react";

export type CurrencyType = "gold" | "green";

interface CurrencyToggleProps {
  selectedCurrency: CurrencyType;
  goldCoins: number;
  greenCoins: number;
  onCurrencyChange: (currency: CurrencyType) => void;
}

export default function CurrencyToggle({
  selectedCurrency,
  goldCoins,
  greenCoins,
  onCurrencyChange,
}: CurrencyToggleProps) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {/* Gold Coins Tab */}
      <button
        onClick={() => onCurrencyChange("gold")}
        className="px-3 py-2 rounded-lg font-bold transition text-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
        style={{
          background:
            selectedCurrency === "gold"
              ? "linear-gradient(135deg, #FFD700, #FFA500)"
              : "rgba(255, 215, 0, 0.1)",
          border:
            selectedCurrency === "gold"
              ? "1.5px solid #FFD700"
              : "1.5px solid rgba(255, 215, 0, 0.3)",
          color: selectedCurrency === "gold" ? "#000" : "#FFD700",
          boxShadow:
            selectedCurrency === "gold"
              ? "0 0 12px rgba(255, 215, 0, 0.4)"
              : "none",
        }}
      >
        <Coins size={16} />
        <span>Gold {goldCoins.toLocaleString()}</span>
      </button>

      {/* Green Coins Tab */}
      <button
        onClick={() => onCurrencyChange("green")}
        className="px-3 py-2 rounded-lg font-bold transition text-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
        style={{
          background:
            selectedCurrency === "green"
              ? "linear-gradient(135deg, #00FF00, #00CC00)"
              : "rgba(0, 255, 0, 0.1)",
          border:
            selectedCurrency === "green"
              ? "1.5px solid #00FF00"
              : "1.5px solid rgba(0, 255, 0, 0.3)",
          color: selectedCurrency === "green" ? "#000" : "#00FF00",
          boxShadow:
            selectedCurrency === "green"
              ? "0 0 12px rgba(0, 255, 0, 0.4)"
              : "none",
        }}
      >
        <Coins size={16} />
        <span>Sweeps {greenCoins.toLocaleString()}</span>
      </button>
    </div>
  );
}
