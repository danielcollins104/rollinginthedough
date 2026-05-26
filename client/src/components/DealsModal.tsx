import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DealsModalProps {
  onClose: () => void;
}

const deals = [
  {
    title: '🎁 WELCOME BONUS',
    description: 'Get 500 bonus coins on your first spin!',
    bonus: '+500 coins',
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: '⭐ DAILY MULTIPLIER',
    description: 'Spin today and get 2x winnings!',
    bonus: '2X WINS',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    title: '💎 VIP REWARDS',
    description: 'Earn points with every spin and redeem for coins',
    bonus: '+100 POINTS',
    color: 'from-purple-500 to-pink-600',
  },
  {
    title: '🏆 JACKPOT SURGE',
    description: 'Progressive jackpot increases by 5% this hour!',
    bonus: '+5% JACKPOT',
    color: 'from-red-500 to-pink-600',
  },
  {
    title: '🎰 LUCKY HOUR',
    description: 'Next 60 minutes: Free spins on every 5th spin!',
    bonus: 'FREE SPINS',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: '💰 CASHBACK',
    description: 'Get 10% cashback on all losses today',
    bonus: '10% BACK',
    color: 'from-indigo-500 to-blue-600',
  },
];

export default function DealsModal({ onClose }: DealsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-cyan-400 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-blue-900 p-6 border-b-2 border-cyan-400 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-cyan-400 drop-shadow-lg">
            🎁 SPECIAL DEALS & OFFERS 🎁
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-cyan-400 transition"
          >
            <X size={28} />
          </button>
        </div>

        {/* Deals Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${deal.color} rounded-lg p-4 border-2 border-yellow-400 shadow-lg hover:shadow-xl transition transform hover:scale-105`}
            >
              <h3 className="text-lg font-bold text-white mb-2">{deal.title}</h3>
              <p className="text-sm text-gray-100 mb-3">{deal.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-yellow-300">{deal.bonus}</span>
                <Button
                  onClick={onClose}
                  className="bg-white hover:bg-gray-200 text-gray-900 font-bold px-4 py-2 rounded border-2 border-yellow-400"
                >
                  CLAIM
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 border-t-2 border-cyan-400 text-center">
          <p className="text-cyan-300 text-sm font-bold">
            ✨ New deals added daily! Check back tomorrow for more offers ✨
          </p>
        </div>
      </div>
    </div>
  );
}
