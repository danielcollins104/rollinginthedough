import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ScratchGameProps {
  onClose: () => void;
  onWin: (amount: number) => void;
}

// Generate a stable set of win amounts for a scratch game session
function generateWinAmounts(): number[] {
  const amounts = [];
  for (let i = 0; i < 9; i++) {
    // Mix of small and large wins with some zeros
    const roll = Math.random();
    if (roll < 0.3) {
      amounts.push(0); // 30% chance of no win
    } else if (roll < 0.6) {
      amounts.push(Math.floor(Math.random() * 200) + 50); // 30% small win 50-250
    } else if (roll < 0.85) {
      amounts.push(Math.floor(Math.random() * 800) + 200); // 25% medium win 200-1000
    } else if (roll < 0.97) {
      amounts.push(Math.floor(Math.random() * 2000) + 1000); // 12% big win 1000-3000
    } else {
      amounts.push(Math.floor(Math.random() * 5000) + 3000); // 3% jackpot 3000-8000
    }
  }
  return amounts;
}

export default function ScratchGame({ onClose, onWin }: ScratchGameProps) {
  const [scratchedPanels, setScratchedPanels] = useState<boolean[]>(Array(9).fill(false));
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Stable win amounts for this session — only regenerated when sessionKey changes
  const winAmounts = useMemo(() => generateWinAmounts(), [sessionKey]);

  const scratchedCount = scratchedPanels.filter(Boolean).length;

  const handleScratch = (index: number) => {
    if (scratchedPanels[index] || revealed) return;

    const newScratched = [...scratchedPanels];
    newScratched[index] = true;
    setScratchedPanels(newScratched);

    // Check if all panels are scratched
    if (newScratched.every(s => s)) {
      const total = winAmounts.reduce((a, b) => a + b, 0);
      setWinAmount(total);
      setRevealed(true);
    }
  };

  const handleRevealAll = () => {
    setScratchedPanels(Array(9).fill(true));
    const total = winAmounts.reduce((a, b) => a + b, 0);
    setWinAmount(total);
    setRevealed(true);
  };

  const handlePlayAgain = () => {
    setScratchedPanels(Array(9).fill(false));
    setWinAmount(null);
    setRevealed(false);
    setSessionKey(k => k + 1); // Regenerate win amounts
  };

  const handleCollect = () => {
    if (winAmount && winAmount > 0) {
      onWin(winAmount);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 rounded-lg p-6 max-w-md w-full border-4 border-cyan-400 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-cyan-400 transition z-10"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-cyan-400 mb-1 drop-shadow-lg">
          🎰 SCRATCH GAME 🎰
        </h2>
        <p className="text-center text-sm text-gray-300 mb-4">
          {revealed
            ? '🎉 All panels revealed!'
            : `Scratch all panels to reveal your prize! (${scratchedCount}/9)`}
        </p>

        {/* Game Grid */}
        {!revealed && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Array(9)
              .fill(null)
              .map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleScratch(index)}
                  disabled={scratchedPanels[index]}
                  className={`
                    h-20 rounded-lg font-bold text-lg transition-all transform
                    ${scratchedPanels[index]
                      ? winAmounts[index] > 0
                        ? 'bg-green-500 text-white scale-95 shadow-lg cursor-default'
                        : 'bg-gray-600 text-gray-300 scale-95 cursor-default'
                      : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-yellow-900 hover:scale-105 cursor-pointer shadow-lg active:scale-95'
                    }
                  `}
                >
                  {scratchedPanels[index]
                    ? winAmounts[index] > 0
                      ? `💰 ${winAmounts[index]}`
                      : '❌ 0'
                    : '?'}
                </button>
              ))}
          </div>
        )}

        {/* Revealed all panels view */}
        {revealed && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {winAmounts.map((amount, index) => (
              <div
                key={index}
                className={`
                  h-20 rounded-lg font-bold text-lg flex items-center justify-center
                  ${amount > 0 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-600 text-gray-300'}
                `}
              >
                {amount > 0 ? `💰 ${amount}` : '❌ 0'}
              </div>
            ))}
          </div>
        )}

        {/* Win Display */}
        {revealed && (
          <div className="text-center mb-4">
            <div className={`rounded-lg p-4 mb-4 border-4 shadow-lg ${
              (winAmount ?? 0) > 0
                ? 'bg-green-500 border-yellow-400'
                : 'bg-gray-700 border-gray-500'
            }`}>
              {(winAmount ?? 0) > 0 ? (
                <>
                  <p className="text-white text-sm font-bold mb-1">🎉 YOU WON! 🎉</p>
                  <p className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
                    +{winAmount?.toLocaleString()}
                  </p>
                  <p className="text-white text-xs mt-1">COINS</p>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-sm font-bold mb-1">Better luck next time!</p>
                  <p className="text-3xl font-bold text-gray-400">No Win</p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handlePlayAgain}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg border-2 border-cyan-400"
              >
                PLAY AGAIN
              </Button>
              <Button
                onClick={handleCollect}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg border-2 border-yellow-400"
              >
                {(winAmount ?? 0) > 0 ? 'COLLECT' : 'CLOSE'}
              </Button>
            </div>
          </div>
        )}

        {/* Reveal All button when partially scratched */}
        {!revealed && scratchedCount > 0 && scratchedCount < 9 && (
          <div className="flex gap-3">
            <Button
              onClick={handleRevealAll}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg border-2 border-cyan-400 text-sm"
            >
              REVEAL ALL
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!revealed && scratchedCount === 0 && (
          <p className="text-center text-cyan-300 text-sm font-bold">
            👆 Click any panel to start scratching!
          </p>
        )}
      </div>
    </div>
  );
}
