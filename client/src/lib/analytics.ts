/**
 * analytics.ts — privacy-respecting, local-only gameplay analytics.
 *
 * No third-party SDK, no network calls, no PII. Events are stored in
 * localStorage (capped ring buffer) so the operator can inspect game
 * health via `getAnalyticsSummary()` and a future dashboard can read
 * the same store. This satisfies the "Analytics" improvement item
 * without introducing a data-egress surface.
 */

const KEY = "ritd_analytics_events";
const MAX_EVENTS = 500;

export type AnalyticsEvent =
  | "spin"
  | "win"
  | "big_win"
  | "mega_win"
  | "jackpot"
  | "near_miss"
  | "bonus_enter"
  | "free_spin"
  | "coin_bonus"
  | "rescue_offered"
  | "coin_shop_open"
  | "scratch_open"
  | "deals_open";

export interface AnalyticsRecord {
  event: AnalyticsEvent;
  at: number;
  bet?: number;
  win?: number;
}

function read(): AnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalyticsRecord[]) : [];
  } catch {
    return [];
  }
}

function write(events: AnalyticsRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Storage full / disabled — analytics is best-effort, never fatal.
  }
}

/** Record one gameplay event. Fire-and-forget, never throws. */
export function track(event: AnalyticsEvent, data?: { bet?: number; win?: number }): void {
  if (typeof window === "undefined") return;
  const events = read();
  events.push({ event, at: Date.now(), ...data });
  write(events);
}

/** Aggregate counts + win rate + RTP proxy for the operator. */
export function getAnalyticsSummary(): {
  total: number;
  counts: Record<string, number>;
  spins: number;
  wins: number;
  winRate: number;
  totalBet: number;
  totalWon: number;
  rtp: number;
} {
  const events = read();
  const counts: Record<string, number> = {};
  let totalBet = 0;
  let totalWon = 0;
  for (const e of events) {
    counts[e.event] = (counts[e.event] ?? 0) + 1;
    if (e.event === "spin" && e.bet) totalBet += e.bet;
    if (e.event === "win" && e.win) totalWon += e.win;
  }
  const spins = counts["spin"] ?? 0;
  const wins = counts["win"] ?? 0;
  return {
    total: events.length,
    counts,
    spins,
    wins,
    winRate: spins > 0 ? wins / spins : 0,
    totalBet,
    totalWon,
    rtp: totalBet > 0 ? totalWon / totalBet : 0,
  };
}

/** Wipe stored events (operator/debug use). */
export function clearAnalytics(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
