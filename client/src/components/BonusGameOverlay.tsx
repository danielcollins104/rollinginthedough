/**
 * Enhanced Bonus Game Overlay Component
 * Features: pick-more mechanics, escalating reveals, multi-stage bonus with legendary tier
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { BonusGameType, playBonusGame, BONUS_GAMES } from "@/lib/bonusGames";
import { playBonusAlert, playWinMusic } from "@/lib/soundsPsychology";
import BonusWheel from "./BonusWheel";
import BonusEntrance from "./BonusEntrance";

interface Props {
  gameType: BonusGameType;
  onClose: (reward: number) => void;
}

interface PickItem {
  id: number;
  type: "reward" | "pick_again" | "legendary" | "empty";
  value: number;
  revealed: boolean;
  glowing: boolean;
}

// Pick game items for treasure hunt style bonus
const PICK_ITEMS: Record<BonusGameType, { rewards: number[]; pickAgainCount: number; legendaryChance: number }> = {
  coin_flip: { rewards: [50, 75, 100, 150, 200], pickAgainCount: 0, legendaryChance: 0 },
  lucky_spin: { rewards: [100, 150, 200, 300, 500], pickAgainCount: 1, legendaryChance: 0.05 },
  treasure_hunt: { rewards: [150, 200, 300, 500, 750], pickAgainCount: 1, legendaryChance: 0.1 },
  huntress_bonus: { rewards: [200, 300, 400, 600, 800], pickAgainCount: 2, legendaryChance: 0.15 },
};

// Generate pick items for a game
function generatePickItems(gameType: BonusGameType, difficulty: number = 1): PickItem[] {
  const config = PICK_ITEMS[gameType];
  const itemCount = 9;
  const items: PickItem[] = [];

  // Fill with rewards
  for (let i = 0; i < itemCount; i++) {
    const rewardIndex = Math.floor(Math.random() * config.rewards.length);
    let type: PickItem["type"] = "reward";
    let value = config.rewards[rewardIndex] * difficulty;

    // Add pick again
    if (i === Math.floor(itemCount / 2) && config.pickAgainCount > 0) {
      type = "pick_again";
      value = 0;
    }

    // Add legendary chance
    if (Math.random() < config.legendaryChance * difficulty) {
      type = "legendary";
      value = config.rewards[config.rewards.length - 1] * 3 * difficulty;
    }

    // Some empty ones
    if (Math.random() < 0.1) {
      type = "empty";
      value = 0;
    }

    items.push({
      id: i,
      type,
      value,
      revealed: false,
      glowing: false,
    });
  }

  // Shuffle
  return items.sort(() => Math.random() - 0.5);
}

export default function BonusGameOverlay({ gameType, onClose }: Props) {
  const [gameState, setGameState] = useState<"entrance" | "intro" | "picking" | "revealing" | "pick_again" | "legendary_wait" | "result" | "wheel">("entrance");
  const [pickItems, setPickItems] = useState<PickItem[]>([]);
  const [picksRemaining, setPicksRemaining] = useState(3);
  const [totalReward, setTotalReward] = useState(0);
  const [result, setResult] = useState<{ reward: number; multiplier: number; message: string } | null>(null);
  const [pickDelay, setPickDelay] = useState(false);
  const [coinShower, setCoinShower] = useState(false);
  const [flyingNumbers, setFlyingNumbers] = useState(false);
  const [finalZoom, setFinalZoom] = useState(false);
  const [legendaryTriggered, setLegendaryTriggered] = useState(false);
  const [legendaryPending, setLegendaryPending] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [wheelPending, setWheelPending] = useState(false);

  const game = BONUS_GAMES[gameType];
  const pickingRef = useRef(false);

  // Handle entrance complete
  const handleEntranceComplete = useCallback(() => {
    setGameState("intro");
    playBonusAlert();

    // Auto-start after intro
    setTimeout(() => {
      if (gameType === "lucky_spin") {
        setGameState("wheel");
      } else {
        // Initialize pick items for other game types
        setPickItems(generatePickItems(gameType, 1));
        setPicksRemaining(3);
        setGameState("picking");
      }
    }, 1200);
  }, [gameType]);

  // Handle wheel win
  const handleWheelWin = useCallback((multiplier: number) => {
    const reward = game.baseReward * multiplier;
    setTotalReward(prev => prev + reward);
    setResult({
      reward,
      multiplier,
      message: `Wheel landed on ${multiplier}x!`,
    });
    setWheelPending(false);

    // Trigger coin shower sequence
    setTimeout(() => setCoinShower(true), 300);
    setTimeout(() => setFlyingNumbers(true), 1500);
    setTimeout(() => {
      setFinalZoom(true);
      playWinMusic(false);
    }, 2500);
    setTimeout(() => setGameState("result"), 3000);
  }, [game.baseReward]);

  // Handle item pick
  const handlePick = useCallback((itemId: number) => {
    if (pickingRef.current || pickDelay) return;
    pickingRef.current = true;

    // Find the item
    const itemIndex = pickItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1 || pickItems[itemIndex].revealed) {
      pickingRef.current = false;
      return;
    }

    // Mark as revealed with delay
    setPickItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, revealed: true } : i
    ));
    setRevealedCount(prev => prev + 1);

    // Suspense delay before reveal
    setPickDelay(true);
    setTimeout(() => {
      const pickedItem = pickItems[itemIndex];

      if (pickedItem.type === "pick_again") {
        // Pick again! Glow remaining items
        setPickDelay(false);
        setGameState("pick_again");

        // Glow all unrevealed items
        setPickItems(prev => prev.map(i => ({
          ...i,
          glowing: !i.revealed,
        })));

        // Play sound
        playBonusAlert();

        // Give extra pick after brief glow
        setTimeout(() => {
          setPickItems(prev => prev.map(i => ({ ...i, glowing: false })));
          setPicksRemaining(prev => prev + 1);
          setGameState("picking");
          pickingRef.current = false;
        }, 800);

      } else if (pickedItem.type === "legendary") {
        // Legendary pick! Trigger second bonus round
        setPickDelay(false);
        setTotalReward(prev => prev + pickedItem.value);
        setLegendaryTriggered(true);
        setLegendaryPending(true);

        playWinMusic(false);

        // Dramatic pause then wheel
        setTimeout(() => {
          setCoinShower(true);
        }, 500);
        setTimeout(() => {
          setFlyingNumbers(true);
        }, 1800);
        setTimeout(() => {
          setFinalZoom(true);
        }, 2800);
        setTimeout(() => {
          setCoinShower(false);
          setFlyingNumbers(false);
          setFinalZoom(false);
          setGameState("wheel");
          setLegendaryPending(false);
        }, 3800);

        pickingRef.current = false;

      } else if (pickedItem.type === "reward") {
        // Normal reward
        setTotalReward(prev => prev + pickedItem.value);
        setPickDelay(false);

        playWinMusic(pickedItem.value < 200);

        pickingRef.current = false;

        // Check if game should end
        const newPicksRemaining = picksRemaining - 1;

        if (newPicksRemaining <= 0) {
          // Last pick - trigger ending sequence
          setTimeout(() => {
            setCoinShower(true);
          }, 300);
          setTimeout(() => {
            setFlyingNumbers(true);
          }, 1500);
          setTimeout(() => {
            setFinalZoom(true);
            setResult({
              reward: totalReward + pickedItem.value,
              multiplier: 1,
              message: `You collected ${totalReward + pickedItem.value} coins!`,
            });
            setGameState("result");
          }, 2500);
        } else {
          setPicksRemaining(newPicksRemaining);
        }

      } else {
        // Empty
        setPickDelay(false);
        pickingRef.current = false;

        const newPicksRemaining = picksRemaining - 1;
        if (newPicksRemaining <= 0) {
          setTimeout(() => {
            setResult({
              reward: totalReward,
              multiplier: 1,
              message: "Better luck next time!",
            });
            setGameState("result");
          }, 800);
        } else {
          setPicksRemaining(newPicksRemaining);
        }
      }
    }, 400); // Suspense delay

  }, [pickItems, pickDelay, picksRemaining, totalReward]);

  // Handle final collect
  const handleCollect = () => {
    // Make sure we have a totalReward even if result is null
    const finalReward = result?.reward ?? totalReward;
    onClose(finalReward);
  };

  // Show wheel for lucky_spin
  if (gameState === "wheel" || wheelPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
        <BonusWheel
          baseReward={game.baseReward}
          maxMultiplier={game.maxMultiplier}
          onWin={handleWheelWin}
          onTriggerBonus={legendaryTriggered ? () => {} : undefined}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      {/* Bonus Entrance Animation */}
      {gameState === "entrance" && (
        <BonusEntrance 
          onComplete={handleEntranceComplete} 
          bonusType={gameType === "treasure_hunt" ? "pick" : gameType === "huntress_bonus" ? "legendary" : "wheel"} 
        />
      )}

      <div
        className="relative w-full max-w-md mx-4 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
          border: "3px solid #D4AF37",
          boxShadow: "0 0 40px rgba(212,175,55,0.5)",
        }}
      >
        {/* Coin shower effect */}
        {coinShower && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${5 + (i * 4) % 90}%`,
                  top: "-10%",
                  animation: `bonusCoinShower ${1.8 + (i % 4) * 0.3}s ease-in ${i * 0.07}s forwards`,
                }}
              >
                🪙
              </div>
            ))}
          </div>
        )}

        {/* Flying numbers effect */}
        {flyingNumbers && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div
              className="text-5xl font-bold text-yellow-300"
              style={{
                animation: "flyUpBonus 1.2s ease-out forwards",
                textShadow: "0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.5)",
              }}
            >
              +{totalReward.toLocaleString()}
            </div>
          </div>
        )}

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
        <div className="px-6 py-6 text-center">
          {/* Intro state */}
          {gameState === "intro" && (
            <div className="animate-pulse">
              <div className="text-6xl mb-4">
                {gameType === "coin_flip" && "🪙"}
                {gameType === "lucky_spin" && "🎡"}
                {gameType === "treasure_hunt" && "🏆"}
                {gameType === "huntress_bonus" && "👑"}
              </div>
              <p className="text-yellow-300 font-bold text-lg mb-4">
                {game.description}
              </p>
              <p className="text-amber-200 text-sm">
                Base Reward: {game.baseReward} coins
                <br />
                Max Multiplier: {game.maxMultiplier}x
              </p>
              <p className="text-cyan-300 text-xs mt-2">
                Loading bonus round...
              </p>
            </div>
          )}

          {/* Picking state - Treasure Hunt style */}
          {(gameState === "picking" || gameState === "pick_again") && (
            <div className="space-y-4">
              {/* Picks remaining */}
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{
                      background: i < picksRemaining
                        ? "linear-gradient(135deg, #D4AF37, #F5E6C8)"
                        : "rgba(100,100,100,0.3)",
                      border: "2px solid #D4AF37",
                      opacity: i < picksRemaining ? 1 : 0.4,
                    }}
                  >
                    {i < picksRemaining ? "⭐" : "✗"}
                  </div>
                ))}
              </div>

              {/* Pick instruction */}
              {gameState === "pick_again" && (
                <div
                  className="text-xl font-bold text-yellow-300 animate-pulse mb-2"
                >
                  🎉 PICK AGAIN! 🎉
                </div>
              )}
              <p className="text-amber-200 text-sm">
                {gameState === "pick_again" 
                  ? "Choose any item to reveal your prize!" 
                  : "Pick items to reveal your bonus rewards!"}
              </p>

              {/* Pick grid */}
              <div className="grid grid-cols-3 gap-3">
                {pickItems.map((item) => {
                  const isClickable = !item.revealed && gameState === "picking" && !pickDelay;
                  const isGlowing = item.glowing;

                  return (
                    <button
                      key={item.id}
                      onClick={() => isClickable && handlePick(item.id)}
                      disabled={!isClickable}
                      className={`
                        relative h-20 rounded-lg font-bold text-lg transition-all
                        ${isClickable ? "hover:scale-105 cursor-pointer" : "cursor-default"}
                        ${isGlowing ? "animate-pulse ring-2 ring-yellow-400 ring-offset-2 ring-offset-black" : ""}
                        ${pickDelay && !item.revealed ? "animate-pulse opacity-50" : ""}
                      `}
                      style={{
                        background: item.revealed
                          ? item.type === "legendary"
                            ? "linear-gradient(135deg, #FFD700, #FFA500)"
                            : item.type === "pick_again"
                            ? "linear-gradient(135deg, #00CED1, #20B2AA)"
                            : item.type === "reward"
                            ? "linear-gradient(135deg, #228B22, #32CD32)"
                            : "linear-gradient(135deg, #4a4a4a, #6a6a6a)"
                          : "linear-gradient(135deg, #1a1a3a, #2a2a5a)",
                        border: item.revealed
                          ? "2px solid #FFD700"
                          : "2px solid rgba(212,175,55,0.4)",
                        boxShadow: isGlowing
                          ? "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)"
                          : "none",
                        transform: isGlowing ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {/* Hidden state */}
                      {!item.revealed && (
                        <span className="text-2xl opacity-60">❓</span>
                      )}

                      {/* Revealed states */}
                      {item.revealed && (
                        <div className="flex flex-col items-center justify-center">
                          {item.type === "pick_again" && (
                            <>
                              <span className="text-xl">🔄</span>
                              <span className="text-xs">Pick Again!</span>
                            </>
                          )}
                          {item.type === "legendary" && (
                            <>
                              <span className="text-xl">🌟</span>
                              <span className="text-xs">Legendary!</span>
                            </>
                          )}
                          {item.type === "reward" && (
                            <>
                              <span className="text-lg">💰</span>
                              <span className="text-sm">+{item.value}</span>
                            </>
                          )}
                          {item.type === "empty" && (
                            <>
                              <span className="text-xl">❌</span>
                              <span className="text-xs">Empty</span>
                            </>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <p className="text-amber-200 text-xs mt-2">
                {pickItems.filter(i => i.revealed).length} of {pickItems.length} revealed
              </p>
            </div>
          )}

          {/* Result state */}
          {gameState === "result" && result && (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">
                {legendaryTriggered ? "🌟" : totalReward > 500 ? "🎉" : "✨"}
              </div>

              {legendaryTriggered && (
                <div
                  className="text-2xl font-bold text-yellow-300"
                  style={{
                    animation: "legendaryPulse 0.8s ease-in-out infinite",
                    textShadow: "0 0 30px rgba(255,215,0,0.9)",
                  }}
                >
                  ★ LEGENDARY WIN ★
                </div>
              )}

              <p className="text-yellow-300 font-bold text-lg">
                {result.message}
              </p>

              <div
                className="py-4 px-6 rounded-lg"
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "2px solid #D4AF37",
                  animation: finalZoom ? "finalBonusZoom 0.5s ease-out forwards" : "winBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
                  transform: finalZoom ? "scale(1.3)" : "scale(1)",
                }}
              >
                <p className="text-amber-200 text-sm mb-2">Total Reward</p>
                <p
                  className="text-5xl font-bold text-yellow-300"
                  style={{
                    textShadow: "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)",
                  }}
                >
                  +{result.reward.toLocaleString()}
                </p>
                <p className="text-amber-200 text-xs mt-2">🪙 coins</p>
                {result.multiplier > 1 && (
                  <p className="text-yellow-200 text-sm mt-1">
                    ({result.multiplier}x multiplier)
                  </p>
                )}
              </div>

              <button
                onClick={handleCollect}
                className="w-full py-3 px-4 rounded font-bold text-lg tracking-wider transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
                  color: "#0a0a1a",
                  boxShadow: "0 0 20px rgba(212,175,55,0.4)",
                }}
              >
                ✦ COLLECT ✦
              </button>
            </div>
          )}

          {/* Legendary pending state */}
          {legendaryPending && (
            <div className="space-y-4 py-8">
              <div
                className="text-6xl"
                style={{
                  animation: "legendarySpin 1s ease-in-out infinite",
                }}
              >
                🌟
              </div>
              <p className="text-yellow-300 font-bold text-2xl animate-pulse">
                LEGENDARY REWARD!
              </p>
              <p className="text-amber-200 text-lg">
                Preparing bonus wheel...
              </p>
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

      <style>{`
        @keyframes winBounce {
          0% { opacity: 0; transform: scale(0.5) translateY(-20px); }
          40% { opacity: 1; transform: scale(1.15) translateY(0); }
          65% { transform: scale(0.97); }
          80% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes finalBonusZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); filter: brightness(1.5); }
          100% { transform: scale(1.3); filter: brightness(1.2); }
        }
        @keyframes bonusCoinShower {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
        @keyframes flyUpBonus {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-50px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-100px) scale(1.6); opacity: 0; }
        }
        @keyframes legendaryPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.8); }
          50% { text-shadow: 0 0 40px rgba(255,215,0,1), 0 0 60px rgba(255,215,0,0.8); }
        }
        @keyframes legendarySpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}