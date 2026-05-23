/**
 * Near-Miss Mechanics System
 * Creates exciting "almost won" moments that trigger dopamine response
 * and encourage continued play (psychological principle: near-miss effect)
 */

export interface NearMissEvent {
  type: "one_away" | "two_away" | "almost_jackpot" | "almost_bonus";
  message: string;
  excitement: number; // 1-10 scale
}

/**
 * Detects near-miss conditions on the reels
 * Returns an array of near-miss events that occurred
 */
export function detectNearMisses(reels: string[][]): NearMissEvent[] {
  const nearMisses: NearMissEvent[] = [];

  // Check for one symbol away from winning combinations
  const oneAwayWins = checkOneSymbolAway(reels);
  if (oneAwayWins.length > 0) {
    nearMisses.push({
      type: "one_away",
      message: "SO CLOSE! One more symbol away from a big win!",
      excitement: 7,
    });
  }

  // Check for two symbols away from jackpot
  const almostJackpot = checkAlmostJackpot(reels);
  if (almostJackpot) {
    nearMisses.push({
      type: "almost_jackpot",
      message: "NEARLY THERE! Just one more scatter for the jackpot!",
      excitement: 9,
    });
  }

  // Check for almost triggering bonus
  const almostBonus = checkAlmostBonus(reels);
  if (almostBonus) {
    nearMisses.push({
      type: "almost_bonus",
      message: "SO CLOSE to a bonus game!",
      excitement: 8,
    });
  }

  return nearMisses;
}

/**
 * Checks if player was one symbol away from a winning line
 */
function checkOneSymbolAway(reels: string[][]): string[] {
  const matches: string[] = [];

  // Check horizontal lines
  for (let row = 0; row < reels[0].length; row++) {
    const line = reels.map((reel) => reel[row]);

    // Check for 2 matching symbols with 1 different
    for (let i = 0; i < line.length - 2; i++) {
      const sym1 = line[i];
      const sym2 = line[i + 1];
      const sym3 = line[i + 2];

      // Two match, one different
      if (sym1 === sym2 && sym1 !== sym3 && sym1 !== "dough") {
        matches.push(`${sym1} at row ${row}`);
      }
      if (sym1 === sym3 && sym1 !== sym2 && sym1 !== "dough") {
        matches.push(`${sym1} at row ${row}`);
      }
      if (sym2 === sym3 && sym2 !== sym1 && sym2 !== "dough") {
        matches.push(`${sym2} at row ${row}`);
      }
    }
  }

  return matches;
}

/**
 * Checks if player was one scatter away from jackpot
 * (4 scatters when 5 are needed)
 */
function checkAlmostJackpot(reels: string[][]): boolean {
  const scatterCount = reels.flat().filter((s) => s === "dough").length;
  return scatterCount === 4; // One away from 5
}

/**
 * Checks if player was close to triggering bonus
 * (2 matching symbols when 3 are needed)
 */
function checkAlmostBonus(reels: string[][]): boolean {
  const symbols = reels.flat();
  const symbolCounts: Record<string, number> = {};

  symbols.forEach((sym) => {
    if (sym !== "dough" && sym !== "clover") {
      symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
    }
  });

  // Check if any symbol has exactly 2 matches (one away from 3)
  return Object.values(symbolCounts).some((count) => count === 2);
}

/**
 * Plays a near-miss sound effect
 * Creates anticipation and excitement
 */
export function playNearMissSound(nearMiss: NearMissEvent): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sine";
    const now = audioCtx.currentTime;

    if (nearMiss.type === "one_away") {
      // Ascending tones that stop just short of resolution
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    } else if (nearMiss.type === "almost_jackpot") {
      // Dramatic ascending sweep
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    } else if (nearMiss.type === "almost_bonus") {
      // Quick ascending progression
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.linearRampToValueAtTime(784, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    }

    osc.start(now);
    osc.stop(now + (nearMiss.type === "almost_jackpot" ? 0.4 : 0.3));
  } catch (e) {
    console.warn("Near-miss sound failed:", e);
  }
}
