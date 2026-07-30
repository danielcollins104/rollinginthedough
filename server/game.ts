import { randomInt } from "crypto";
import {
  type SymbolId, type Symbol, type Volatility, type SpinResult,
  type WinLine, type WinType,
  SYMBOLS, REEL_COUNT, ROW_COUNT, JACKPOT_SEED, JACKPOT_CONTRIBUTION,
  FREE_SPIN_TRIGGER, FREE_SPIN_COUNT, HUNTRESS_BONUS_TRIGGER,
  getPaylinePath, evaluateWins, countScatters, getWinType,
} from "../shared/game";

function weightedPick(volatility: Volatility): SymbolId {
  const adjustedSymbols = SYMBOLS.map(s => {
    let weight = s.weight;
    if (volatility === "LOW") {
      if (s.payouts[0] <= 10) weight *= 1.2;
      if (s.payouts[0] >= 100) weight *= 0.7;
    } else if (volatility === "HIGH") {
      if (s.payouts[0] <= 10) weight *= 0.8;
      if (s.payouts[0] >= 100) weight *= 1.3;
    }
    return { ...s, weight };
  });

  const totalWeight = adjustedSymbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = randomInt(totalWeight);
  for (const sym of adjustedSymbols) {
    rand -= sym.weight;
    if (rand <= 0) return sym.id;
  }
  return SYMBOLS[0].id;
}

function generateReels(volatility: Volatility): SymbolId[][] {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => weightedPick(volatility))
  );
}

function applyNearMiss(reels: SymbolId[][]): SymbolId[][] {
  const newReels = reels.map(r => [...r]);
  const paylineIdx = randomInt(25);
  const path = getPaylinePath(paylineIdx);
  const highValueSymbols = SYMBOLS.filter(s => s.payouts[0] >= 20);
  const target = highValueSymbols[randomInt(highValueSymbols.length)];

  newReels[0][path[0]] = target.id;
  newReels[1][path[1]] = target.id;
  if (newReels[2][path[2]] === target.id) {
    newReels[2][path[2]] = SYMBOLS[0].id;
  }

  return newReels;
}

export interface ServerSpinInput {
  bet: number
  paylines: number
  volatility: Volatility
  jackpotPool: number
  freeSpinsRemaining: number
}

export interface ServerSpinOutput {
  reels: SymbolId[][]
  winAmount: number
  winLines: WinLine[]
  winType: WinType
  freeSpinsAdded: number
  freeSpinsRemaining: number
  isJackpot: boolean
  isHuntressBonus: boolean
  jackpotPool: number
  xpGain: number
}

export function executeSpin(input: ServerSpinInput): ServerSpinOutput {
  let reels = generateReels(input.volatility);
  let jackpotPool = input.jackpotPool;

  const { winLines: potentialWins, totalWin: potentialTotal } = evaluateWins(reels, input.bet, input.paylines);
  if (potentialTotal === 0 && randomInt(4) === 0) {
    reels = applyNearMiss(reels);
  }

  const { winLines, totalWin } = evaluateWins(reels, input.bet, input.paylines);
  const scatters = countScatters(reels);
  const doughCount = reels.flat().filter(s => s === "dough").length;
  const isJackpot = doughCount >= 5;
  const huntressCount = reels.flat().filter(s => s === "huntress").length;
  const isHuntressBonus = huntressCount >= HUNTRESS_BONUS_TRIGGER;

  let winAmount = totalWin;
  if (isJackpot) {
    winAmount = jackpotPool;
    jackpotPool = JACKPOT_SEED;
  }

  let freeSpinsAdded = 0;
  if (scatters >= FREE_SPIN_TRIGGER) {
    freeSpinsAdded = FREE_SPIN_COUNT;
  }

  const winType = getWinType(winAmount, input.bet, isJackpot);

  const xpGain = Math.floor(input.bet / 10) + (winAmount > 0 ? Math.floor(winAmount / 20) : 0);

  return {
    reels,
    winAmount,
    winLines,
    winType,
    freeSpinsAdded,
    freeSpinsRemaining: input.freeSpinsRemaining + freeSpinsAdded,
    isJackpot,
    isHuntressBonus,
    jackpotPool,
    xpGain,
  };
}
