/**
 * Bonus Mini-Games System
 * Triggered by 4+ matching symbols or special bonus combinations
 */

export type BonusGameType = "coin_flip" | "lucky_spin" | "treasure_hunt" | "huntress_bonus";

export interface BonusGame {
  type: BonusGameType;
  name: string;
  description: string;
  baseReward: number;
  maxMultiplier: number;
}

export interface BonusGameResult {
  gameType: BonusGameType;
  won: boolean;
  reward: number;
  multiplier: number;
  message: string;
}

export const BONUS_GAMES: Record<BonusGameType, BonusGame> = {
  coin_flip: {
    type: "coin_flip",
    name: "Lucky Coin Flip",
    description: "Flip a golden coin — heads you win, tails you double win!",
    baseReward: 100,
    maxMultiplier: 3,
  },
  lucky_spin: {
    type: "lucky_spin",
    name: "Lucky Spin",
    description: "Spin the wheel of fortune for a chance to multiply your winnings!",
    baseReward: 150,
    maxMultiplier: 5,
  },
  treasure_hunt: {
    type: "treasure_hunt",
    name: "Treasure Hunt",
    description: "Find 3 matching treasures to unlock the jackpot bonus!",
    baseReward: 200,
    maxMultiplier: 10,
  },
  huntress_bonus: {
    type: "huntress_bonus",
    name: "Huntress Warrior Bonus",
    description: "The huntress warrior appears! Defeat enemies to multiply your winnings!",
    baseReward: 250,
    maxMultiplier: 8,
  },
};

/**
 * Determines if a bonus game should be triggered
 * Triggered by: 4+ matching symbols, 5 scatters, or special combinations
 */
export function shouldTriggerBonus(
  matchCount: number,
  scatterCount: number
): BonusGameType | null {
  if (scatterCount >= 5) {
    return "treasure_hunt"; // 5 scatters = treasure hunt
  }

  if (scatterCount >= 4) {
    // 4 scatters = 50% chance for treasure hunt
    if (Math.random() > 0.5) {
      return "treasure_hunt";
    }
  }

  if (matchCount >= 3) {
    // Lowered from 4 to 3: Random bonus game for 3+ matches (more frequent)
    const games: BonusGameType[] = ["coin_flip", "lucky_spin"];
    return games[Math.floor(Math.random() * games.length)];
  }

  return null;
}

/**
 * Plays the Coin Flip bonus game
 */
export function playCoinFlip(): BonusGameResult {
  const won = Math.random() > 0.5;
  const multiplier = won ? 2 : 1;
  const baseReward = BONUS_GAMES.coin_flip.baseReward;
  const reward = baseReward * multiplier;

  return {
    gameType: "coin_flip",
    won,
    reward,
    multiplier,
    message: won
      ? `🪙 HEADS! You won ${reward} coins!`
      : `🪙 TAILS! You won ${reward} coins anyway!`,
  };
}

/**
 * Plays the Lucky Spin bonus game
 */
export function playLuckySpin(): BonusGameResult {
  const multipliers = [1, 2, 2, 3, 3, 4, 5];
  const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
  const baseReward = BONUS_GAMES.lucky_spin.baseReward;
  const reward = baseReward * multiplier;

  return {
    gameType: "lucky_spin",
    won: true,
    reward,
    multiplier,
    message: `🎡 SPIN! ${multiplier}x multiplier! You won ${reward} coins!`,
  };
}

/**
 * Plays the Treasure Hunt bonus game
 */
export function playTreasureHunt(): BonusGameResult {
  const treasures = ["💎", "👑", "🏆"];
  const selected = [
    treasures[Math.floor(Math.random() * treasures.length)],
    treasures[Math.floor(Math.random() * treasures.length)],
    treasures[Math.floor(Math.random() * treasures.length)],
  ];

  const allMatch = selected[0] === selected[1] && selected[1] === selected[2];
  const multiplier = allMatch ? 10 : 3;
  const baseReward = BONUS_GAMES.treasure_hunt.baseReward;
  const reward = baseReward * multiplier;

  return {
    gameType: "treasure_hunt",
    won: allMatch,
    reward,
    multiplier,
    message: allMatch
      ? `🏆 JACKPOT! All treasures match! You won ${reward} coins!`
      : `💎 You found treasures: ${selected.join(" ")}. You won ${reward} coins!`,
  };
}

/**
 * Huntress Warrior Bonus Game
 * Player defeats enemies to multiply winnings
 */
function playHuntressBonus(): BonusGameResult {
  const baseReward = BONUS_GAMES.huntress_bonus.baseReward;
  const multiplier = Math.floor(Math.random() * BONUS_GAMES.huntress_bonus.maxMultiplier) + 1;
  const reward = baseReward * multiplier;
  const won = multiplier >= 2; // Win if multiplier is 2 or higher
  
  const messages = [
    `⚔️ The huntress strikes! ${multiplier}x multiplier! You won ${reward} coins!`,
    `🗡️ Huntress victory! Enemies defeated for ${multiplier}x your winnings!`,
    `💪 The warrior triumphs! ${multiplier}x multiplier earned!`,
  ];
  
  return {
    gameType: "huntress_bonus",
    won,
    reward,
    multiplier,
    message: messages[Math.floor(Math.random() * messages.length)],
  };
}

/**
 * Plays a bonus game based on type
 */
export function playBonusGame(gameType: BonusGameType): BonusGameResult {
  switch (gameType) {
    case "coin_flip":
      return playCoinFlip();
    case "lucky_spin":
      return playLuckySpin();
    case "treasure_hunt":
      return playTreasureHunt();
    case "huntress_bonus":
      return playHuntressBonus();
    default:
      return playCoinFlip();
  }
}
