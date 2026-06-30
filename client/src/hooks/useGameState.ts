/**
 * Rolling in the Dough — Core Game State Hook
 * Manages all slot machine game logic: reels, wins, coins, levels, free spins
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BonusGameType } from "@/lib/bonusGames";

// ─── Symbol definitions ───────────────────────────────────────────────────────
export type SymbolId =
  | "bread"      // 🍞 Fresh Bread — low value
  | "rolling"    // 🥖 Baguette — low value
  | "pretzel"    // 🥨 Soft Pretzel — medium value
  | "croissant"  // 🥐 Butter Croissant — medium value
  | "cookie"     // 🍪 Chocolate Chip Cookie — medium-high value
  | "cupcake"    // 🧁 Pink Cupcake — high value
  | "cake"       // 🎂 Celebration Cake — high value
  | "muffin"     // 🧁 Blueberry Muffin — medium-high value
  | "bun"        // 🫓 Sweet Bun — high value (wild)
  | "huntress"   // 👑 Bakery Queen — bonus trigger (scatter)
  | "dough"      // 🍞 Rolling in the Dough — JACKPOT (scatter)
  | "empty"      // Empty cell for cascade system

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
    emoji: "🌾",
    name: "Sacred Sage",
    color: "#88CC88",
    bgColor: "#0a1a0a",
    payouts: [2, 5, 12],
    weight: 30,
  },
  {
    id: "rolling",
    emoji: "🏹",
    name: "Warrior Bow",
    color: "#C8860A",
    bgColor: "#1a0e00",
    payouts: [3, 8, 22],
    weight: 26,
  },
  {
    id: "pretzel",
    emoji: "🕸️",
    name: "Dream Catcher",
    color: "#9C7CF4",
    bgColor: "#150a2a",
    payouts: [6, 18, 45],
    weight: 24,
  },
  {
    id: "croissant",
    emoji: "🪶",
    name: "Eagle Feathers",
    color: "#D4AF37",
    bgColor: "#1a1200",
    payouts: [10, 25, 60],
    weight: 20,
  },
  {
    id: "cookie",
    emoji: "🎯",
    name: "Spirit Arrows",
    color: "#FF6B6B",
    bgColor: "#1a0808",
    payouts: [15, 40, 90],
    weight: 16,
  },
  {
    id: "cupcake",
    emoji: "🐺",
    name: "Spirit Wolf",
    color: "#88AACC",
    bgColor: "#0a1525",
    payouts: [25, 75, 180],
    weight: 14,
  },
  {
    id: "cake",
    emoji: "🥁",
    name: "War Drum",
    color: "#A8482A",
    bgColor: "#1a0808",
    payouts: [40, 125, 300],
    weight: 9,
  },
  {
    id: "muffin",
    emoji: "💎",
    name: "Sunstones",
    color: "#FF6BAA",
    bgColor: "#250a1a",
    payouts: [20, 50, 120],
    weight: 14,
  },
  {
    id: "bun",
    emoji: "🔥",
    name: "Sacred Fire",
    color: "#FF6B1A",
    bgColor: "#1a0500",
    payouts: [60, 180, 450],
    weight: 8,
    isWild: true,
  },
  {
    id: "huntress",
    emoji: "⚔️",
    name: "Huntress Warrior",
    color: "#FF6BAA",
    bgColor: "#250a1a",
    payouts: [100, 350, 1500],
    weight: 6,
    isScatter: true,
  },
  {
    id: "dough",
    emoji: "🌟",
    name: "Spirit Arrow",
    color: "#FFD700",
    bgColor: "#1a1500",
    payouts: [150, 750, 3000],
    weight: 4,
    isScatter: true,
  },
];

export type WinType = "SMALL_WIN" | "BIG_WIN" | "MEGA_WIN" | "JACKPOT" | "HUNTRESS_BONUS" | null;

export interface WinLine {
  row: number;
  symbols: SymbolId[];
  amount: number;
  count: number;
  cells?: { reelIdx: number; rowIdx: number }[]; // Optional cell positions for highlights
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

  // Check only active paylines (1, 5, 10, 15, 20, 25)
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
  const wildId: SymbolId = "bun";
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

/**
 * Loss-back rescue trigger: should we offer a guaranteed half-bet spin
 * after a losing spin? Pure function so it's unit-testable.
 *
 *   postSpinBalance < bet * 5   → player is "about to bust"
 *   freeSpins === 0             → skip during free-spin mode (no real loss)
 *   bonusGameType == null       → skip during bonus round (no real loss)
 */
export function shouldOfferRescue(
  postSpinBalance: number,
  bet: number,
  freeSpins: number,
  bonusGameType: BonusGameType | null
): boolean {
  if (freeSpins > 0) return false;
  if (bonusGameType) return false;
  return postSpinBalance < bet * 5;
}

/** Minimum guaranteed return for a consumed rescue spin (50% of bet). */
export function rescueMinPayout(bet: number): number {
  return Math.floor(bet * 0.5);
}

/**
 * Pure claim helper for missions. Returns the updated mission + the reward
 * to credit, or { mission: existing, reward: 0 } if the mission can't be
 * claimed (not complete, or already claimed).
 *
 * Extracted so the claim-once semantics can be unit-tested without rendering
 * the React tree.
 */
export function applyMissionClaim(
  mission: { completed: boolean; claimed: boolean; reward: number }
): { mission: { completed: boolean; claimed: boolean; reward: number }; reward: number } {
  if (!mission.completed || mission.claimed) {
    return { mission, reward: 0 };
  }
  return {
    mission: { ...mission, claimed: true },
    reward: mission.reward,
  };
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
  const [consecutiveWins, setConsecutiveWins] = useState<number>(saved?.consecutiveWins ?? 0);
  const [maxStreak, setMaxStreak] = useState<number>(saved?.maxStreak ?? 0);
  // Loss-back rescue: when the player is running low and just lost, offer one
  // guaranteed half-bet win on the next spin. Vegas "save the player" mechanic.
  const [rescueOffered, setRescueOffered] = useState<boolean>(false);
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
    saveState({ coins, bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency, consecutiveWins, maxStreak });
  }, [coins, bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency, consecutiveWins, maxStreak]);
  
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

  const spin = useCallback(async (isDemo = false) => {
    if (spinningRef.current) return;
    // Check balance using the active currency (demo always passes)
    const activeBalance = selectedCurrency === 'gold' ? goldCoins : greenCoins;
    if (!isDemo && freeSpins === 0 && activeBalance < bet) return;

    spinningRef.current = true;
    setSpinning(true);
    setWinAmount(0);
    setWinLines([]);
    setLastWinType(null);

    // Deduct bet from the active currency (unless free spin or demo)
    const isFree = freeSpins > 0;
    if (isDemo) {
      // Demo (idle attract mode): no bet deduction, no jackpot contribution.
    } else if (isFree) {
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

    // ─── Loss-back rescue (Vegas "save the player" mechanic) ───────────────
    // If the rescue was offered (player ran low and lost), force the next
    // spin to return at least 50% of the bet. Skipped on demo (no real
    // player to save) and on jackpot (already a huge win, no rescue needed).
    // The flag is consumed here regardless of outcome so the offer is one-shot.
    if (!isDemo && rescueOffered && !isJackpot) {
      const rescueMin = rescueMinPayout(bet);
      if (finalWin < rescueMin) finalWin = rescueMin;
      setRescueOffered(false);
      window.dispatchEvent(new CustomEvent("toast", {
        detail: { kind: "secondChance", message: `🎟️ RESCUE SPIN! +${rescueMin}` },
      }));
    }

    // Free spins trigger
    if (!isDemo && scatters >= FREE_SPIN_TRIGGER) {
      setFreeSpins((f) => f + FREE_SPIN_COUNT);
      // Toast for retrigger case (player already had free spins and got more).
      // Fresh free spins are implied by the scatter fanfare so don't double-toast.
      window.dispatchEvent(new CustomEvent("toast", {
        detail: { kind: "retrigger", message: `+${FREE_SPIN_COUNT} FREE SPINS!` },
      }));
    }

    // Scatter bonus trigger: 4+ scatters trigger lucky wheel bonus (in addition to any free spins)
    if (!isDemo && scatters >= 4) {
      // 30% chance of bonus game on 4 scatters, guaranteed on 5+
      if (scatters >= 5 || Math.random() < 0.3) {
        setBonusGameType('lucky_spin' as BonusGameType);
      }
    }

    // Huntress bonus trigger (takes precedence if both trigger)
    if (!isDemo && isHuntressBonus && !bonusGameType) {
      setBonusGameType('huntress_bonus' as BonusGameType);
    }

    // Update coins in the active currency
    if (!isDemo && finalWin > 0) {
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

    // ─── LDW (Loss Disguised as Win) ────────────────────────────────────────────
    // On genuinely empty spins, ~35% chance to briefly show a small fake win
    // (1.5–3x bet) to maintain excitement. Cleared after 2.5s. No real coins awarded.
    if (finalWin === 0 && !isJackpot && scatters < FREE_SPIN_TRIGGER && !bonusGameType) {
      if (Math.random() < 0.35) {
        const fakeWin = Math.floor(bet * (1.5 + Math.random() * 1.5));
        setWinAmount(fakeWin);
        setLastWinType("SMALL_WIN");
        // Notify the toast stack so the player sees the "second chance" beat.
        // Done via window event so this file stays decoupled from Toasts.tsx.
        window.dispatchEvent(new CustomEvent("toast", {
          detail: { kind: "secondChance", message: "🍀 SECOND CHANCE — BONUS WIN!" },
        }));
        setTimeout(() => {
          setWinAmount(0);
          setLastWinType(null);
        }, 2500);
      }
    }

    // XP gain (skipped on demo — would inflate XP without play)
    if (!isDemo) {
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
    }

    setSpinCount((s) => isDemo ? s : s + 1);

    // Streak tracking: increment on real wins (not LDW, not demo), reset on losses.
    // Done after the spin resolves so the LDW fake-win doesn't count as a
    // streak win (that would defeat the purpose of streaks being rare).
    if (!isDemo && finalWin > 0) {
      setConsecutiveWins(prev => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        // Streak milestone toasts at 3, 5, 10
        if (next === 3 || next === 5 || next === 10) {
          window.dispatchEvent(new CustomEvent("toast", {
            detail: { kind: "streak", message: `🔥 ${next}x WIN STREAK!` },
          }));
        }
        return next;
      });
    } else if (!isDemo && !isJackpot) {
      // Genuine loss — reset streak. (Jackpot loss isn't possible but guard anyway.)
      setConsecutiveWins(0);

      // Loss-back rescue offer: if the player is now running low (active
      // currency < 6× bet after this losing spin = <5× bet going forward)
      // AND they're not in a bonus or free-spin mode, offer a rescue spin
      // for their next attempt. Threshold of 5× bet matches industry norms
      // for "about to bust" detection on sweepstakes/credit-based cabinets.
      // Note: goldCoins/greenCoins here is the pre-deduction value because
      // state updates are batched — pre - bet gives the post-spin balance.
      const preSpinBalance = selectedCurrency === 'gold' ? goldCoins : greenCoins;
      const postSpinBalance = preSpinBalance - bet;
      if (
        shouldOfferRescue(postSpinBalance, bet, freeSpins, bonusGameType)
      ) {
        setRescueOffered(true);
        window.dispatchEvent(new CustomEvent("toast", {
          detail: { kind: "secondChance", message: "🎟️ RESCUE SPIN OFFERED!" },
        }));
      }
    }

    setSpinning(false);
    spinningRef.current = false;
  }, [coins, bet, freeSpins, jackpotPool, level, selectedCurrency, goldCoins, greenCoins, maxStreak]);

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
    consecutiveWins,
    maxStreak,
    rescueOffered,
    autoplay,
    setAutoplay,
    spin,
    triggerDemoSpin: () => spin(true),
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