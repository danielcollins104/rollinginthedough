import { useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGameState } from "@/hooks/useGameState";
import { useRetention } from "@/hooks/useRetention";

export type AchievementType =
  | "first_spin"
  | "first_win"
  | "first_big_win"
  | "jackpot"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "streak_100"
  | "level_5"
  | "level_10"
  | "level_25"
  | "total_spins_100"
  | "total_spins_1000"
  | "total_wins_50"
  | "total_wins_500";

export interface Achievement {
  id: number;
  achievementType: AchievementType;
  unlockedAt: Date; // timestamp
}

export function useAchievements() {
  const utils = trpc.useUtils();
  const gameState = useGameState();
  const retentionState = useRetention();

  // Fetch achievements from the server (tRPC v11: data/error via returned tuple, callbacks go on useQuery options for side effects)
  const {
    data: serverAchievements,
    isLoading,
    refetch,
  } = trpc.achievements.getForUser.useQuery(undefined, {
    retry: false,
  });

  // Unlock mutation (use useMutation so we can call .mutate())
  const unlockMutation = trpc.achievements.unlock.useMutation({
    onSuccess: () => {
      utils.achievements.getForUser.invalidate();
    },
    onError: (err) => {
      console.error("Failed to unlock achievement:", err);
    },
  });

  const unlockAchievement = useCallback(
    async (achievementType: AchievementType) => {
      try {
        await unlockMutation.mutateAsync({ achievementType });
      } catch (error) {
        console.error("Failed to unlock achievement:", error);
      }
    },
    [unlockMutation]
  );

  // Check for new achievements based on current game and retention state
  const checkForNewAchievements = useCallback(() => {
    if (!serverAchievements) return;

    const conditions: Record<AchievementType, () => boolean> = {
      first_spin: () => gameState.spinCount >= 1,
      first_win: () => gameState.totalWins > 0,
      first_big_win: () => {
        const bigWinTypes = ["BIG_WIN", "MEGA_WIN", "JACKPOT", "HUNTRESS_BONUS"];
        return bigWinTypes.includes(gameState.lastWinType ?? "");
      },
      jackpot: () => gameState.lastWinType === "JACKPOT",
      streak_7: () => retentionState.currentStreak >= 7,
      streak_14: () => retentionState.currentStreak >= 14,
      streak_30: () => retentionState.currentStreak >= 30,
      streak_100: () => false, // Not tracked in retention yet; implement later if needed
      level_5: () => gameState.level >= 5,
      level_10: () => gameState.level >= 10,
      level_25: () => gameState.level >= 25,
      total_spins_100: () => gameState.spinCount >= 100,
      total_spins_1000: () => gameState.spinCount >= 1000,
      total_wins_50: () => gameState.totalWins >= 50,
      total_wins_500: () => gameState.totalWins >= 500,
    };

    Object.entries(conditions).forEach(([type, condition]) => {
      const achievementType = type as AchievementType;
      const alreadyUnlocked = serverAchievements.some(
        (a) => a.achievementType === achievementType
      );
      if (!alreadyUnlocked && condition()) {
        unlockAchievement(achievementType);
      }
    });
  }, [serverAchievements, gameState, retentionState, unlockAchievement]);

  // Run the check whenever the dependencies change
  useEffect(() => {
    checkForNewAchievements();
  }, [checkForNewAchievements]);

  return {
    achievements: (serverAchievements ?? []) as Achievement[],
    loading: isLoading,
    unlockAchievement,
    refetch,
  };
}