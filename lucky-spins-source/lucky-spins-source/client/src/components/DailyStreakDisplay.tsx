import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export function DailyStreakDisplay() {
  const { data: stats } = trpc.game.getStats.useQuery();
  const { data: achievements } = trpc.game.getAchievements.useQuery();

  if (!stats) return null;

  const levelBonusMap: Record<number, number> = {
    1: 100,
    5: 300,
    10: 500,
    15: 1000,
    20: 3000,
    30: 10000,
    50: 50000,
  };

  const nextLevel = Object.keys(levelBonusMap)
    .map(Number)
    .find(level => level > (stats.level || 1)) || 50;

  const nextBonus = levelBonusMap[nextLevel] || 50000;

  return (
    <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4">
        {/* Current Level */}
        <div className="text-center">
          <div className="text-sm text-yellow-300 font-semibold">⭐ LEVEL</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.level || 1}</div>
          <div className="text-xs text-yellow-200">Rank</div>
        </div>

        {/* Next Level */}
        <div className="text-center">
          <div className="text-sm text-green-300 font-semibold">🎁 NEXT REWARD</div>
          <div className="text-2xl font-bold text-green-400">Lvl {nextLevel}</div>
          <div className="text-xs text-green-200">+{nextBonus.toLocaleString()} coins</div>
        </div>

        {/* Progress Bar */}
        <div className="col-span-2">
          <div className="w-full bg-black/40 rounded-full h-2 border border-yellow-600/30">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((stats.level || 1) / nextLevel) * 100)}%`,
              }}
            />
          </div>
          <div className="text-xs text-yellow-200 mt-1 text-center">
            {stats.level || 1} / {nextLevel} levels
          </div>
        </div>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div className="col-span-2">
            <div className="text-xs text-purple-300 font-semibold mb-2">🏆 ACHIEVEMENTS ({achievements.length})</div>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(-5).map((ach: any) => (
                <div
                  key={ach.id}
                  className="bg-purple-900/40 border border-purple-500/50 rounded px-2 py-1 text-xs text-purple-200"
                  title={ach.achievementType}
                >
                  ⭐
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
