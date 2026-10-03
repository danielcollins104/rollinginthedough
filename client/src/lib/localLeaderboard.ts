/**
 * localLeaderboard.ts — local-only, honestly-labelled practice board.
 *
 * There is no backend for multiplayer. This is a SOLO practice board: it
 * ranks the player against synthetic "rival" pacesetters whose scores are
 * derived from the player's own progress, so the board always contains a
 * mix of targets slightly above and slightly below the player. It is NOT a
 * live multiplayer ranking and must be presented as "Practice Board" /
 * "Rivals to beat" — never as real other players.
 *
 * No network, no PII.
 */

const STATS_KEY = "***";

export interface BoardEntry {
  name: string;
  score: number;
  isYou?: boolean;
}

export interface LocalStats {
  totalWins: number;
  biggestWin: number;
  level: number;
  streak: number;
}

/** Seeded practice rivals. Scores are generated RELATIVE to the player's
 *  own score so a newcomer lands mid-table (motivating) instead of dead
 *  last (demoralising). Deterministic per ISO week. */
const RIVAL_NAMES = [
  "Blackbeard",
  "Morgan",
  "Bonny",
  "Kidd",
  "Rackham",
  "Anne",
  "Drake",
  "Teach",
];

/** Multipliers spread around the player's score: some just ahead, some
 *  behind, so there is always a next target and a sense of climbing. */
const RIVAL_SPREAD = [1.45, 1.28, 1.12, 1.04, 0.94, 0.82, 0.66, 0.5];

function isoWeek(now = new Date()): number {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function readLocalStats(): LocalStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as LocalStats;
  } catch {
    /* ignore */
  }
  return { totalWins: 0, biggestWin: 0, level: 1, streak: 0 };
}

/** Persist the player's lifetime stats (call on win/resolution). */
export function saveLocalStats(stats: LocalStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/** Composite score so the board rewards wins, big hits, level, streaks. */
export function scoreOf(s: LocalStats): number {
  return s.totalWins * 10 + s.biggestWin + s.level * 250 + s.streak * 100;
}

/** Build the current week's practice board, sorted descending, with the
 *  player in it. Rival scores pivot around the player's own score so the
 *  board is always competitive rather than hopeless. */
export function buildLeaderboard(youName = "You", stats?: LocalStats): BoardEntry[] {
  const me = stats ?? readLocalStats();
  const week = isoWeek();
  const myScore = scoreOf(me);
  // Floor the pivot so a brand-new player still sees a reachable board
  // rather than a row of zeroes.
  const pivot = Math.max(myScore, 400);
  const rivals: BoardEntry[] = RIVAL_NAMES.map((name, i) => {
    const seed = hash(`${name}:week${week}`);
    // Small per-rival jitter (±6%) so identical spread slots don't look canned.
    const jitter = 1 + ((seed % 1200) - 600) / 10000;
    return { name, score: Math.round(pivot * RIVAL_SPREAD[i] * jitter) };
  });
  const entries = [...rivals, { name: youName, score: myScore, isYou: true }];
  return entries.sort((a, b) => b.score - a.score);
}

/** 1-based rank of the player on the current board. */
export function yourRank(stats?: LocalStats): number {
  const board = buildLeaderboard("You", stats);
  return board.findIndex((e) => e.isYou) + 1;
}
