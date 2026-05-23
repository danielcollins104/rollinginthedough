/**
 * Rolling in the Dough — Core Game State Hook
 * Manages all slot machine game logic: reels, wins, coins, levels, free spins
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BonusGameType } from "@/lib/bonusGames";

// ─── Symbol definitions ───────────────────────────────────────────────────────
export type SymbolId =
  | "bread"      // 🍞 Bread loaf — low value
  | "rolling"    // 🎲 Rolling pin — low value
  | "pretzel"    // 🥨 Pretzel — medium value
  | "croissant"  // 🥐 Croissant — medium value
  | "coin"       // 💰 Gold coin — medium-high value
  | "diamond"    // 💎 Diamond — high value
  | "crown"      // 👑 Crown — high value
  | "clover"     // 🍀 Lucky clover — high value (wild)
  | "huntress"   // 🗡️ Huntress warrior — bonus trigger (scatter)
  | "dough"      // ⭐ Rolling in the Dough logo — JACKPOT (scatter)

export interface Symbol {
  id: SymbolId;
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  payouts: [number, number, number]; // 3-of-a-kind, 4-of-a-kind, 5-of-a-kind
  weight: number; // Probability weight (lower = rarer)
  isWild?: boolean;
  isScatter?: boolean;
}

export const SYMBOLS: Symbol[] = [
  {
    id: "bread",
    emoji: "🏹",
    name: "Arrowhead",
    color: "#D4AF37",
    bgColor: "#1a1200",
    payouts: [2, 5, 10],
    weight: 35,
  },
  {
    id: "rolling",
    emoji: "🪶",
    name: "Sacred Feather",
    color: "#C8860A",
    bgColor: "#1a0e00",
    payouts: [3, 8, 20],
    weight: 32,
  },
  {
    id: "pretzel",
    emoji: "⛺",
    name: "Teepee",
    color: "#E8A020",
    bgColor: "#1a1000",
    payouts: [5, 15, 40],
    weight: 28,
  },
  {
    id: "croissant",
    emoji: "🦅",
    name: "Eagle",
    color: "#D4AF37",
    bgColor: "#1a1200",
    payouts: [8, 20, 50],
    weight: 22,
  },
  {
    id: "coin",
    emoji: "🪙",
    name: "Gold Coin",
    color: "#F5E6C8",
    bgColor: "#1a1500",
    payouts: [12, 35, 80],
    weight: 18,
  },
  {
    id: "diamond",
    emoji: "💎",
    name: "Crystal Gem",
    color: "#88CCFF",
    bgColor: "#001a2a",
    payouts: [20, 60, 150],
    weight: 14,
  },
  {
    id: "crown",
    emoji: "👸",
    name: "Huntress Queen",
    color: "#FFD700",
    bgColor: "#1a1000",
    payouts: [30, 100, 250],
    weight: 10,
  },
  {
    id: "clover",
    emoji: "🌿",
    name: "Sacred Herb",
    color: "#90EE90",
    bgColor: "#001a00",
    payouts: [50, 150, 400],
    weight: 8,
    isWild: true,
  },
  {
    id: "huntress",
    emoji: "🗡️",
    name: "Huntress Warrior",
    color: "#FF6B6B",
    bgColor: "#2a0a0a",
    payouts: [75, 250, 1000],
    weight: 5,
    isScatter: true,
  },
  {
    id: "dough",
    emoji: "⭐",
    name: "Rolling in the Dough",
    color: "#FFD700",
    bgColor: "#1a1000",
    payouts: [100, 500, 2000],
    weight: 3,
    isScatter: true,
  },
];

export type WinType = "SMALL_WIN" | "BIG_WIN" | "MEGA_WIN" | "JACKPOT" | "HUNTRESS_BONUS" | null;

export interface WinLine {
  row: number;
  symbols: SymbolId[];
  amount: number;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const REEL_COUNT = 5;
const ROW_COUNT = 3;
const STARTING_COINS = 10000; // Test: Increased from 1000 for testing
const DAILY_BONUS = 500;
const JACKPOT_SEED = 5000;
const JACKPOT_CONTRIBUTION = 0.02; // 2% of each bet goes to jackpot
const FREE_SPIN_TRIGGER = 3; // 3 scatters = free spins
const FREE_SPIN_COUNT = 10;
const HUNTRESS_BONUS_TRIGGER = 3; // 3 huntress symbols = bonus round
const BET_OPTIONS = [10, 25, 50, 100, 200];

// ─── Weighted random symbol picker ───────────────────────────────────────────
function pickSymbol(): SymbolId {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const sym of SYMBOLS) {
    rand -= sym.weight;
    if (rand <= 0) return sym.id;
  }
  return SYMBOLS[0].id;
}

// ─── Generate a full reel grid ────────────────────────────────────────────────
function generateReels(): SymbolId[][] {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => pickSymbol())
  );
}

// ─── Define all 25 paylines (distinct paths across 5 reels) ──────────────────
function getPaylinePath(paylineIndex: number): number[] {
  // Each payline is a path across 5 reels, with row indices for each reel
  // Rows: 0=top, 1=middle, 2=bottom
  const paylines: number[][] = [
    // Rows (5 paylines)
    [0, 0, 0, 0, 0], // Top row
    [1, 1, 1, 1, 1], // Middle row
    [2, 2, 2, 2, 2], // Bottom row
    [0, 0, 1, 0, 0], // Top with dip
    [2, 2, 1, 2, 2], // Bottom with dip
    
    // Upper diagonals (5 paylines)
    [0, 0, 0, 1, 1], // Top-left to middle-right
    [0, 1, 0, 1, 0], // Zigzag top
    [0, 0, 1, 1, 1], // Top to bottom-right
    [1, 0, 0, 0, 1], // V-shape top
    [0, 1, 1, 1, 0], // Wave top
    
    // Lower diagonals (5 paylines)
    [2, 2, 2, 1, 1], // Bottom-left to middle-right
    [2, 1, 2, 1, 2], // Zigzag bottom
    [2, 2, 1, 1, 1], // Bottom to top-right
    [1, 2, 2, 2, 1], // V-shape bottom
    [2, 1, 1, 1, 2], // Wave bottom
    
    // Mixed diagonals (5 paylines)
    [0, 1, 2, 1, 0], // Diamond
    [1, 0, 1, 2, 1], // Mountain
    [1, 2, 1, 0, 1], // Valley
    [0, 2, 0, 2, 0], // Checkerboard
    [2, 0, 2, 0, 2], // Checkerboard reverse
    
    // Additional mixed paths (5 paylines)
    [0, 1, 0, 1, 0], // Alternating top-middle
    [2, 1, 2, 1, 2], // Alternating bottom-middle
    [1, 0, 2, 0, 1], // Complex wave
    [1, 2, 0, 2, 1], // Reverse complex wave
    [0, 0, 2, 2, 2], // Staircase down
  ];
  
  return paylines[paylineIndex % paylines.length];
}

// ─── Evaluate wins with paylines support ──────────────────────────────────────
function evaluateWins(reels: SymbolId[][], bet: number, paylines: number): { winLines: WinLine[]; totalWin: number } {
  const winLines: WinLine[] = [];
  let totalWin = 0;
  const betPerLine = bet / paylines; // Distribute bet across paylines

  // Check only active paylines (1, 5, 10, 15, 20, or 25)
  for (let i = 0; i < paylines; i++) {
    const path = getPaylinePath(i);
    const pathSymbols = path.map((rowIdx, reelIdx) => reels[reelIdx][rowIdx]);
    const result = checkLine(pathSymbols, betPerLine);
    if (result) {
      winLines.push({ row: i, symbols: pathSymbols, amount: result.amount, count: result.count });
      totalWin += result.amount;
    }
  }

  return { winLines, totalWin };
}

function checkLine(symbols: SymbolId[], bet: number): { amount: number; count: number } | null {
  const wildId: SymbolId = "clover";
  const scatterId: SymbolId = "dough";

  // Count leading matches (with wild substitution)
  const firstNonWild = symbols.find((s) => s !== wildId && s !== scatterId) ?? symbols[0];
  let count = 0;
  for (const sym of symbols) {
    if (sym === firstNonWild || sym === wildId) {
      count++;
    } else {
      break;
    }
  }

  if (count < 3) return null;

  const symDef = SYMBOLS.find((s) => s.id === firstNonWild);
  if (!symDef) return null;

  const payoutIndex = count === 3 ? 0 : count === 4 ? 1 : 2;
  const multiplier = symDef.payouts[payoutIndex];
  const amount = Math.floor(bet * multiplier);
  // bet is already betPerLine (bet / paylines), so multiply directly by multiplier

  return { amount, count };
}

// ─── Count scatter symbols ────────────────────────────────────────────────────
function countScatters(reels: SymbolId[][]): number {
  return reels.flat().filter((s) => s === "dough").length;
}

// ─── Determine win type ───────────────────────────────────────────────────────
function getWinType(amount: number, bet: number, isJackpot: boolean): WinType {
  if (isJackpot) return "JACKPOT";
  if (amount === 0) return null;
  const multiplier = amount / bet;
  if (multiplier >= 20) return "MEGA_WIN";
  if (multiplier >= 8) return "BIG_WIN";
  return "SMALL_WIN";
}

// ─── XP & Level system ───────────────────────────────────────────────────────
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

// ─── Local storage helpers ────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem("ritd_state");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state: object) {
  try {
    localStorage.setItem("ritd_state", JSON.stringify(state));
  } catch {}
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useGameState() {
  const saved = loadState();

  // Dual currency system
  const [goldCoins, setGoldCoins] = useState<number>(saved?.goldCoins ?? 10000);
  const [greenCoins, setGreenCoins] = useState<number>(saved?.greenCoins ?? 0);
  const [selectedCurrency, setSelectedCurrency] = useState<'gold' | 'green'>(saved?.selectedCurrency ?? 'gold');
  
  // Legacy coins - maps to selected currency
  const [coins, setCoins] = useState<number>(saved?.coins ?? STARTING_COINS);
  const [bet, setBet] = useState<number>(saved?.bet ?? 25);
  const [reels, setReels] = useState<SymbolId[][]>(generateReels());
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winLines, setWinLines] = useState<WinLine[]>([]);
  const [lastWinType, setLastWinType] = useState<WinType>(null);
  const [freeSpins, setFreeSpins] = useState<number>(saved?.freeSpins ?? 0);
  const [totalWins, setTotalWins] = useState<number>(saved?.totalWins ?? 0);
  const [spinCount, setSpinCount] = useState<number>(saved?.spinCount ?? 0);
  const [level, setLevel] = useState<number>(saved?.level ?? 1);
  const [xp, setXp] = useState<number>(saved?.xp ?? 0);
  const [autoplay, setAutoplay] = useState(false);
  const [jackpotPool, setJackpotPool] = useState<number>(saved?.jackpotPool ?? JACKPOT_SEED);
  const [soundEnabled, setSoundEnabled] = useState(saved?.soundEnabled ?? true);
  const [paylines, setPaylines] = useState(1); // 1, 5, 10, 15, 20, 25 - start with 1 for testing
  const [cascadeCount, setCascadeCount] = useState(0);
  const [bonusGameType, setBonusGameType] = useState<BonusGameType | null>(null);

  const autoplayRef = useRef(false);
  const spinningRef = useRef(false);

  // XP to next level
  const xpToNext = xpForLevel(level);

  // Save state on changes
  useEffect(() => {
    saveState({ coins, bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency });
  }, [coins, bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency]);
  
  // Get current currency balance
  const currentBalance = selectedCurrency === 'gold' ? goldCoins : greenCoins;

  // Daily bonus check
  useEffect(() => {
    const lastBonus = localStorage.getItem("ritd_last_bonus");
    const now = Date.now();
    if (!lastBonus || now - parseInt(lastBonus) > 24 * 60 * 60 * 1000) {
      if (coins < 100) {
        setCoins((c) => c + DAILY_BONUS);
        localStorage.setItem("ritd_last_bonus", now.toString());
      }
    }
  }, []);

  const spin = useCallback(async () => {
    if (spinningRef.current) return;
    // Check balance using the active currency
    const activeBalance = selectedCurrency === 'gold' ? goldCoins : greenCoins;
    if (freeSpins === 0 && activeBalance < bet) return;

    spinningRef.current = true;
    setSpinning(true);
    setWinAmount(0);
    setWinLines([]);
    setLastWinType(null);

    // Deduct bet from the active currency (unless free spin)
    const isFree = freeSpins > 0;
    if (isFree) {
      setFreeSpins((f) => f - 1);
    } else {
      if (selectedCurrency === 'gold') {
        setGoldCoins((c) => c - bet);
      } else {
        setGreenCoins((c) => c - bet);
      }
      // Also keep legacy coins in sync
      setCoins((c) => c - bet);
      // Contribute to jackpot
      setJackpotPool((j) => Math.floor(j + bet * JACKPOT_CONTRIBUTION));
    }

    // Simulate reel spin delay (staggered)
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    // Generate new reels
    const newReels = generateReels();
    setReels(newReels);

    // Small delay before evaluating (let animation settle)
    await new Promise((r) => setTimeout(r, 200));

    // Evaluate wins
    const { winLines: lines, totalWin } = evaluateWins(newReels, bet, paylines);
    const scatters = countScatters(newReels);

    // Check jackpot: 5 dough symbols anywhere
    const doughCount = newReels.flat().filter((s) => s === "dough").length;
    const isJackpot = doughCount >= 5;

    // Check huntress bonus: 3+ huntress symbols anywhere
    const huntressCount = newReels.flat().filter((s) => s === "huntress").length;
    const isHuntressBonus = huntressCount >= HUNTRESS_BONUS_TRIGGER;

    let finalWin = totalWin;
    if (isJackpot) {
      finalWin = jackpotPool;
      setJackpotPool(JACKPOT_SEED);
    }

    // Free spins trigger
    if (scatters >= FREE_SPIN_TRIGGER) {
      setFreeSpins((f) => f + FREE_SPIN_COUNT);
    }

    // Huntress bonus trigger
    if (isHuntressBonus) {
      setBonusGameType('huntress_bonus' as BonusGameType);
    }

    // Update coins in the active currency
    if (finalWin > 0) {
      if (selectedCurrency === 'gold') {
        setGoldCoins((c) => c + finalWin);
      } else {
        setGreenCoins((c) => c + finalWin);
      }
      // Also keep legacy coins in sync
      setCoins((c) => c + finalWin);
      setTotalWins((t) => t + finalWin);
    }

    setWinAmount(finalWin);
    setWinLines(lines);
    setLastWinType(isHuntressBonus ? "HUNTRESS_BONUS" : getWinType(finalWin, bet, isJackpot));

    // XP gain
    const xpGain = Math.floor(bet / 10) + (finalWin > 0 ? Math.floor(finalWin / 20) : 0);
    setXp((currentXp) => {
      let newXp = currentXp + xpGain;
      let newLevel = level;
      while (newXp >= xpForLevel(newLevel)) {
        newXp -= xpForLevel(newLevel);
        newLevel++;
      }
      if (newLevel !== level) setLevel(newLevel);
      return newXp;
    });

    setSpinCount((s) => s + 1);
    setSpinning(false);
    spinningRef.current = false;
  }, [coins, bet, freeSpins, jackpotPool, level, selectedCurrency, goldCoins, greenCoins]);

  // Autoplay logic
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    if (!autoplay || spinning) return;
    const activeBalance = selectedCurrency === 'gold' ? goldCoins : greenCoins;
    if (activeBalance < bet && freeSpins === 0) {
      setAutoplay(false);
      return;
    }
    const timer = setTimeout(() => {
      if (autoplayRef.current) spin();
    }, 1200);
    return () => clearTimeout(timer);
  }, [autoplay, spinning, spinCount, coins, bet, freeSpins, goldCoins, greenCoins, selectedCurrency]);

  return {
    coins,
    bet,
    setBet,
    reels,
    spinning,
    winAmount,
    winLines,
    lastWinType,
    freeSpins,
    totalWins,
    spinCount,
    level,
    xp,
    xpToNext,
    autoplay,
    setAutoplay,
    spin,
    jackpotPool,
    soundEnabled,
    setSoundEnabled,
    paylines,
    setPaylines,
    cascadeCount,
    setCascadeCount,
    bonusGameType,
    setBonusGameType,
    // Dual currency
    goldCoins,
    setGoldCoins,
    greenCoins,
    setGreenCoins,
    selectedCurrency,
    setSelectedCurrency,
    currentBalance,
  };
}
