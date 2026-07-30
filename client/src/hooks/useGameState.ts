import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { BonusGameType } from "@/lib/bonusGames";
import {
  type SymbolId, type Symbol, type WinLine, type WinType,
  type Volatility, type SelectedCurrency,
  SYMBOLS, REEL_COUNT, ROW_COUNT, JACKPOT_SEED, JACKPOT_CONTRIBUTION,
  FREE_SPIN_TRIGGER, FREE_SPIN_COUNT, BET_OPTIONS,
  computeXp, computeXpGain, xpForLevel,
} from "@shared/game";

export type { SymbolId, Symbol, WinLine, WinType, SelectedCurrency };
export { SYMBOLS };

const DAILY_BONUS = 500;
const STARTING_COINS = 10000;

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

export function useGameState() {
  const saved = loadState();

  const [goldCoins, setGoldCoins] = useState<number>(saved?.goldCoins ?? STARTING_COINS);
  const [greenCoins, setGreenCoins] = useState<number>(saved?.greenCoins ?? 0);
  const [selectedCurrency, setSelectedCurrency] = useState<SelectedCurrency>(saved?.selectedCurrency ?? "gold");
  const [bet, setBet] = useState<number>(saved?.bet ?? 25);
  const [reels, setReels] = useState<SymbolId[][]>([]);
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
  const [paylines, setPaylines] = useState(1);
  const [volatility, setVolatility] = useState<Volatility>("MEDIUM");
  const [bonusGameType, setBonusGameType] = useState<BonusGameType | null>(null);

  const spinMutation = trpc.game.spin.useMutation();

  const autoplayRef = useRef(false);
  const spinningRef = useRef(false);

  const xpToNext = xpForLevel(level);

  useEffect(() => {
    saveState({ bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency });
  }, [bet, freeSpins, totalWins, spinCount, level, xp, jackpotPool, soundEnabled, goldCoins, greenCoins, selectedCurrency]);

  const currentBalance = selectedCurrency === "gold" ? goldCoins : greenCoins;

  useEffect(() => {
    const lastBonus = localStorage.getItem("ritd_last_bonus");
    const now = Date.now();
    if (!lastBonus || now - parseInt(lastBonus) > 24 * 60 * 60 * 1000) {
      if (goldCoins < 100) {
        setGoldCoins((c) => c + DAILY_BONUS);
        localStorage.setItem("ritd_last_bonus", now.toString());
      }
    }
  }, []);

  const spin = useCallback(async () => {
    if (spinningRef.current) return;
    const activeBalance = selectedCurrency === "gold" ? goldCoins : greenCoins;
    if (freeSpins === 0 && activeBalance < bet) return;

    spinningRef.current = true;
    setSpinning(true);
    setWinAmount(0);
    setWinLines([]);
    setLastWinType(null);

    if ("vibrate" in navigator) {
      window.navigator.vibrate(15);
    }

    const isFree = freeSpins > 0;
    if (isFree) {
      setFreeSpins((f) => f - 1);
    } else {
      if (selectedCurrency === "gold") {
        setGoldCoins((c) => c - bet);
      } else {
        setGreenCoins((c) => c - bet);
      }
      setJackpotPool((j) => Math.floor(j + bet * JACKPOT_CONTRIBUTION));
    }

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    try {
      const result = await spinMutation.mutateAsync({
        bet,
        paylines,
        selectedCurrency,
        volatility,
      });

      setReels(result.reels);
      setWinAmount(result.winAmount);
      setWinLines(result.winLines);
      setLastWinType(result.winType);
      setGoldCoins(result.goldCoins);
      setGreenCoins(result.greenCoins);

      if (result.isJackpot) {
        setJackpotPool(JACKPOT_SEED);
      } else {
        setJackpotPool(result.jackpotPool);
      }

      if (result.freeSpinsAdded > 0) {
        setFreeSpins((f) => f + result.freeSpinsAdded);
      }

      if (result.isHuntressBonus && !bonusGameType) {
        setBonusGameType("huntress_bonus" as BonusGameType);
      }

      if (result.winAmount > 0 && "vibrate" in navigator) {
        const vibPatterns: Record<string, number[]> = {
          SMALL_WIN: [50],
          BIG_WIN: [80, 40, 80],
          MEGA_WIN: [120, 60, 120, 60, 120],
          JACKPOT: [200, 100, 200, 100, 300, 150, 400],
          HUNTRESS_BONUS: [100, 50, 150, 50, 100],
        };
        const pattern = result.winType ? vibPatterns[result.winType] : [100, 50, 100];
        window.navigator.vibrate(pattern);
      }

      const gain = result.xpGain;
      const { xp: newXp, level: newLevel } = computeXp(xp, level, gain);
      setXp(newXp);
      if (newLevel !== level) {
        setLevel(newLevel);
        if (newLevel % 5 === 0) {
          const levels: Volatility[] = ["LOW", "MEDIUM", "HIGH"];
          const nextVol = levels[Math.min(Math.floor(newLevel / 5), 2)];
          setVolatility(nextVol);
        }
      }

      setSpinCount((s) => s + 1);

      if (result.winAmount > 0) {
        setTotalWins((t) => t + result.winAmount);
      }

      if (result.winAmount === 0 && !result.isJackpot && result.freeSpinsAdded === 0) {
        if (Math.random() < 0.35) {
          const fakeWin = Math.floor(bet * (1.5 + Math.random() * 1.5));
          setWinAmount(fakeWin);
          setLastWinType("SMALL_WIN");
          setTimeout(() => {
            setWinAmount(0);
            setLastWinType(null);
          }, 2500);
        }
      }
    } catch (err) {
      if (!isFree) {
        if (selectedCurrency === "gold") {
          setGoldCoins((c) => c + bet);
        } else {
          setGreenCoins((c) => c + bet);
        }
      }
      console.error("Spin failed:", err);
    } finally {
      setSpinning(false);
      spinningRef.current = false;
    }
  }, [bet, freeSpins, jackpotPool, level, selectedCurrency, goldCoins, greenCoins, volatility, paylines, xp, bonusGameType]);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    if (!autoplay || spinning) return;
    const activeBalance = selectedCurrency === "gold" ? goldCoins : greenCoins;
    if (activeBalance < bet && freeSpins === 0) {
      setAutoplay(false);
      return;
    }
    const timer = setTimeout(() => {
      if (autoplayRef.current) spin();
    }, 1200);
    return () => clearTimeout(timer);
  }, [autoplay, spinning, spinCount, bet, freeSpins, goldCoins, greenCoins, selectedCurrency]);

  return {
    bet, setBet, reels, spinning, winAmount, winLines, lastWinType,
    freeSpins, totalWins, spinCount, level, xp, xpToNext,
    autoplay, setAutoplay, spin, jackpotPool,
    soundEnabled, setSoundEnabled, paylines, setPaylines,
    bonusGameType, setBonusGameType,
    goldCoins, setGoldCoins, greenCoins, setGreenCoins,
    selectedCurrency, setSelectedCurrency, currentBalance,
  };
}
