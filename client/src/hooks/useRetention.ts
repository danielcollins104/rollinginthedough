/**
 * useRetention - Hook for managing all retention mechanics
 * Daily streaks, login bonuses, missions, level-up XP, session rewards
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface StreakDay {
  day: number;
  date: string; // ISO date string
  claimed: boolean;
  reward: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  type: "spin" | "win" | "bonus" | "coins_one_spin" | "scatter";
}

export interface RetentionState {
  // Daily login streak
  streakDays: StreakDay[];
  currentStreak: number;
  lastLoginDate: string | null;
  lastClaimDate: string | null;
  
  // Level & XP
  level: number;
  xp: number;
  xpToNext: number;
  lifetimeXp: number;
  
  // Missions
  missions: Mission[];
  lastMissionReset: string | null;
  
  // Session tracking
  sessionStartTime: number | null;
  lastSessionRewardTime: number | null;
  hasShown30MinReward: boolean;
}

// ─── Streak reward table ──────────────────────────────────────────────────────
export const STREAK_REWARDS: Record<number, number> = {
  1: 100,
  2: 150,
  3: 200,
  4: 300,
  5: 500,
  6: 750,
  7: 1500,
};

export const STREAK_MILESTONES = [3, 7, 14, 30];

// ─── Default missions ─────────────────────────────────────────────────────────
function generateDailyMissions(): Mission[] {
  return [
    {
      id: "spin_50",
      title: "Spin Master",
      description: "Spin the reels 50 times",
      target: 50,
      progress: 0,
      reward: 100,
      completed: false,
      type: "spin",
    },
    {
      id: "bonus_3",
      title: "Bonus Hunter",
      description: "Trigger 3 bonus rounds",
      target: 3,
      progress: 0,
      reward: 200,
      completed: false,
      type: "bonus",
    },
    {
      id: "win_500_one",
      title: "Big Winner",
      description: "Win 500 coins in a single spin",
      target: 500,
      progress: 0,
      reward: 150,
      completed: false,
      type: "coins_one_spin",
    },
  ];
}

// ─── Level XP curve ──────────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// ─── Local storage ───────────────────────────────────────────────────────────
const STORAGE_KEY = "ritd_retention";

function loadRetention(): RetentionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRetention(state: RetentionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Get today's date string ─────────────────────────────────────────────────
function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Get yesterday's date string ───────────────────────────────────────────────
function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useRetention() {
  const saved = loadRetention();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  
  // Determine if missions need reset (new day)
  const needsMissionReset = saved?.lastMissionReset !== today;
  
  const [state, setState] = useState<RetentionState>(() => {
    if (!saved) {
      return {
        streakDays: [],
        currentStreak: 0,
        lastLoginDate: null,
        lastClaimDate: null,
        level: 1,
        xp: 0,
        xpToNext: xpForLevel(1),
        lifetimeXp: 0,
        missions: generateDailyMissions(),
        lastMissionReset: today,
        sessionStartTime: Date.now(),
        lastSessionRewardTime: null,
        hasShown30MinReward: false,
      };
    }
    
    // Check streak continuity
    let currentStreak = saved.currentStreak ?? 0;
    let streakDays = saved.streakDays ?? [];
    
    if (saved.lastLoginDate === yesterday) {
      // User was here yesterday, streak continues
    } else if (saved.lastLoginDate !== today) {
      // Missed a day - reset streak
      currentStreak = 0;
      streakDays = [];
    }
    
    // Ensure all required fields have default values to prevent undefined errors
    return {
      streakDays,
      currentStreak,
      lastLoginDate: saved.lastLoginDate ?? null,
      lastClaimDate: saved.lastClaimDate ?? null,
      level: saved.level ?? 1,
      xp: saved.xp ?? 0,
      xpToNext: saved.xpToNext ?? xpForLevel(saved.level ?? 1),
      lifetimeXp: saved.lifetimeXp ?? 0,
      missions: needsMissionReset ? generateDailyMissions() : (saved.missions ?? generateDailyMissions()),
      lastMissionReset: needsMissionReset ? today : (saved.lastMissionReset ?? today),
      sessionStartTime: saved.sessionStartTime ?? Date.now(),
      lastSessionRewardTime: saved.lastSessionRewardTime ?? null,
      hasShown30MinReward: saved.hasShown30MinReward ?? false,
    };
  });
  
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ from: number; to: number } | null>(null);
  
  // Track if today's bonus was claimed
  const todayClaimed = state.lastClaimDate === today;
  
  // Save on state changes
  useEffect(() => {
    saveRetention(state);
  }, [state]);
  
  // ─── Claim daily login bonus ────────────────────────────────────────────────
  const claimDailyBonus = useCallback(() => {
    const newStreak = state.currentStreak + 1;
    const reward = STREAK_REWARDS[newStreak] || STREAK_REWARDS[7];
    
    const newStreakDay: StreakDay = {
      day: newStreak,
      date: today,
      claimed: true,
      reward,
    };
    
    const newStreakDays = [...state.streakDays, newStreakDay].slice(-7); // Keep last 7
    
    // Check for milestone
    const isMilestone = STREAK_MILESTONES.includes(newStreak);
    if (isMilestone) {
      setShowCelebration(`streak_${newStreak}`);
      setTimeout(() => setShowCelebration(null), 4000);
    }
    
    setState((prev) => ({
      ...prev,
      currentStreak: newStreak,
      lastLoginDate: today,
      lastClaimDate: today,
      streakDays: newStreakDays,
    }));
    
    return reward;
  }, [state.currentStreak, today]);
  
  // ─── Record a spin ──────────────────────────────────────────────────────────
  const recordSpin = useCallback(() => {
    setState((prev) => {
      const missions = prev.missions.map((m) => {
        if (m.type === "spin" && !m.completed) {
          const newProgress = m.progress + 1;
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.target,
          };
        }
        if (m.type === "scatter" && !m.completed) {
          const newProgress = m.progress + 1;
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.target,
          };
        }
        return m;
      });
      return { ...prev, missions };
    });
  }, []);
  
  // ─── Record bonus round triggered ───────────────────────────────────────────
  const recordBonus = useCallback(() => {
    setState((prev) => {
      const missions = prev.missions.map((m) => {
        if (m.type === "bonus" && !m.completed) {
          const newProgress = m.progress + 1;
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.target,
          };
        }
        return m;
      });
      return { ...prev, missions };
    });
  }, []);
  
  // ─── Record coins won in a single spin ─────────────────────────────────────
  const recordSpinWin = useCallback((coins: number) => {
    setState((prev) => {
      const missions = prev.missions.map((m) => {
        if (m.type === "coins_one_spin" && !m.completed) {
          const newProgress = Math.max(m.progress, coins);
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.target,
          };
        }
        return m;
      });
      return { ...prev, missions };
    });
  }, []);
  
  // ─── Add XP and check level up ──────────────────────────────────────────────
  const addXp = useCallback((amount: number) => {
    setState((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const newLifetime = prev.lifetimeXp + amount;
      
      while (newXp >= xpForLevel(newLevel)) {
        newXp -= xpForLevel(newLevel);
        newLevel++;
      }
      
      if (newLevel > prev.level) {
        setLevelUpData({ from: prev.level, to: newLevel });
        setTimeout(() => setLevelUpData(null), 5000);
      }
      
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNext: xpForLevel(newLevel),
        lifetimeXp: newLifetime,
      };
    });
  }, []);
  
  // ─── Claim mission reward ────────────────────────────────────────────────────
  const claimMissionReward = useCallback((missionId: string): number => {
    let reward = 0;
    setState((prev) => {
      const missions = prev.missions.map((m) => {
        if (m.id === missionId && m.completed) {
          reward = m.reward;
          return { ...m, completed: true }; // Keep as completed
        }
        return m;
      });
      return { ...prev, missions };
    });
    return reward;
  }, []);
  
  // ─── Session time reward ─────────────────────────────────────────────────────
  const checkSessionReward = useCallback((): boolean => {
    if (state.hasShown30MinReward) return false;
    
    const sessionStart = state.sessionStartTime;
    if (!sessionStart) return false;
    
    const elapsed = Date.now() - sessionStart;
    const thirtyMin = 30 * 60 * 1000;
    
    if (elapsed >= thirtyMin) {
      setState((prev) => ({
        ...prev,
        hasShown30MinReward: true,
        lastSessionRewardTime: Date.now(),
      }));
      return true;
    }
    return false;
  }, [state.hasShown30MinReward, state.sessionStartTime]);
  
  // ─── Get countdown to tomorrow ──────────────────────────────────────────────
  const getCountdownToTomorrow = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }, []);
  
  // ─── Check if user should see daily login modal ─────────────────────────────
  const shouldShowDailyLogin = !todayClaimed;
  
  return {
    // State
    ...state,
    todayClaimed,
    showCelebration,
    levelUpData,
    shouldShowDailyLogin,
    
    // Actions
    claimDailyBonus,
    recordSpin,
    recordBonus,
    recordSpinWin,
    addXp,
    claimMissionReward,
    checkSessionReward,
    getCountdownToTomorrow,
  };
}