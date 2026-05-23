/**
 * Bonus Game Overlay Component
 * Displays mini-games triggered by special symbol combinations
 */

import { useState, useEffect } from "react";
import { BonusGameType, playBonusGame, BONUS_GAMES } from "@/lib/bonusGames";
import { playBonusAlert } from "@/lib/soundsPsychology";

interface Props {
  gameType: BonusGameType;
  onClose: (reward: number) => void;
}

export default function BonusGameOverlay({ gameType, onClose }: Props) {
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [result, setResult] = useState<ReturnType<typeof playBonusGame> | null>(null);
  const game = BONUS_GAMES[gameType];

  useEffect(() => {
    playBonusAlert();

    // Auto-start game after intro
    const timer = setTimeout(() => {
      setGameState("playing");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handlePlayGame = () => {
    const gameResult = playBonusGame(gameType);
    setResult(gameResult);
    setGameState("result");

    // Auto-close after showing result
    setTimeout(() => {
      onClose(gameResult.reward);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div
        className="relative w-full max-w-md mx-4 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "3px solid #D4AF37",
          boxShadow: "0 0 40px rgba(212,175,55,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 text-center"
          style={{
            background: "linear-gradient(90deg, #D4AF37, #F5E6C8, #D4AF37)",
            color: "#0a0a1a",
          }}
        >
          <h2 className="font-display font-black text-2xl tracking-wider">
            🎁 BONUS GAME 🎁
          </h2>
          <p className="text-sm font-bold mt-1">{game.name}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {gameState === "intro" && (
            <div className="animate-pulse">
              <div className="text-6xl mb-4">
                {gameType === "coin_flip" && "🪙"}
                {gameType === "lucky_spin" && "🎡"}
                {gameType === "treasure_hunt" && "🏆"}
              </div>
              <p className="text-yellow-300 font-bold text-lg mb-4">
                {game.description}
              </p>
              <p className="text-amber-200 text-sm">
                Base Reward: {game.baseReward} coins
                <br />
                Max Multiplier: {game.maxMultiplier}x
              </p>
            </div>
          )}

          {gameState === "playing" && (
            <div className="space-y-6">
              <div className="text-6xl animate-bounce">
                {gameType === "coin_flip" && "🪙"}
                {gameType === "lucky_spin" && "🎡"}
                {gameType === "treasure_hunt" && "🏆"}
              </div>
              <button
                onClick={handlePlayGame}
                className="w-full py-3 px-4 rounded font-bold text-lg tracking-wider transition-all"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
                  color: "#0a0a1a",
                  boxShadow: "0 0 20px rgba(212,175,55,0.4)",
                }}
              >
                ✦ PLAY NOW ✦
              </button>
            </div>
          )}

          {gameState === "result" && result && (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">
                {result.won ? "🎉" : "✨"}
              </div>
              <p className="text-yellow-300 font-bold text-lg">
                {result.message}
              </p>
              <div
                className="py-4 px-6 rounded-lg"
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "2px solid #D4AF37",
                }}
              >
                <p className="text-amber-200 text-sm mb-2">Total Reward</p>
                <p className="text-4xl font-bold text-yellow-300">
                  +{result.reward} 🪙
                </p>
                <p className="text-amber-200 text-xs mt-2">
                  ({result.multiplier}x multiplier)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="h-0.5"
          style={{
            background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          }}
        />
      </div>
    </div>
  );
}
