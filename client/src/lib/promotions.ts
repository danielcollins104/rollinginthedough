/**
 * promotions.ts — local, client-side promotion notification scheduler.
 *
 * Fires tasteful, non-repeating promos to the player via the existing
 * toast API (window "toast" CustomEvent). No backend, no push service,
 * no PII — everything is derived from local time and localStorage so a
 * future server-driven feed can replace SCHEDULE without touching the
 * delivery path.
 */

import { toast } from "@/components/Toasts";

const SEEN_KEY = "***";
const LAST_FIRE_KEY = "***";

export interface Promotion {
  id: string;
  message: string;
  /** Which toast visual to use. */
  kind: "info" | "bigWin" | "streak" | "levelUp";
  /** Only fire within this local hour range [start, end). */
  hourRange?: [number, number];
  /** Minimum gap between repeats of this promo, in ms. */
  cooldownMs: number;
}

/**
 * Promo catalog. Kept small and non-spammy: one greeting, one
 * happy-hour, one late-night nudge. A real deployment would hydrate
 * this from the server; the delivery + de-dupe logic is identical.
 */
export const SCHEDULE: Promotion[] = [
  {
    id: "happy_hour",
    message: "⚡ HAPPY HOUR — extra coins on every spin!",
    kind: "streak",
    hourRange: [17, 20],
    cooldownMs: 4 * 60 * 60 * 1000,
  },
  {
    id: "daily_refill",
    message: "🎁 Your daily bonus is ready — come claim it!",
    kind: "levelUp",
    cooldownMs: 20 * 60 * 60 * 1000,
  },
  {
    id: "late_night",
    message: "🌙 Night owl bonus active — good luck out there.",
    kind: "info",
    hourRange: [22, 24],
    cooldownMs: 12 * 60 * 60 * 1000,
  },
];

function readMap(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, number>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function inHourRange(hour: number, range?: [number, number]): boolean {
  if (!range) return true;
  // Support wrapping windows like [22, 2) would need special-casing;
  // our catalog only uses non-wrapping [start, end) ranges.
  return hour >= range[0] && hour < range[1];
}

/**
 * Evaluate the schedule and fire at most `limit` eligible promos.
 * De-dupes with a per-promo cooldown so a player never sees the same
 * promo twice in its window.
 */
export function runPromotions(limit = 1): number {
  if (typeof window === "undefined") return 0;
  const seen = readMap(SEEN_KEY);
  const lastFired = readMap(LAST_FIRE_KEY);
  const now = Date.now();
  const hour = new Date().getHours();

  let fired = 0;
  // Stagger: fire after a short delay so it doesn't collide with the
  // onboarding/daily-bonus modals on a cold load.
  for (const promo of SCHEDULE) {
    if (fired >= limit) break;
    if (!inHourRange(hour, promo.hourRange)) continue;
    const last = lastFired[promo.id] ?? 0;
    if (now - last < promo.cooldownMs) continue;

    setTimeout(() => toast[promo.kind](promo.message), 2500 + fired * 1200);
    lastFired[promo.id] = now;
    seen[promo.id] = (seen[promo.id] ?? 0) + 1;
    fired++;
  }

  if (fired > 0) {
    writeMap(LAST_FIRE_KEY, lastFired);
    writeMap(SEEN_KEY, seen);
  }
  return fired;
}

/** Count of times each promo has fired (operator/debug use). */
export function getPromotionStats(): Record<string, number> {
  return readMap(SEEN_KEY);
}
