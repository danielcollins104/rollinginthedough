/**
 * ab.ts — local-only A/B testing framework for game mechanics.
 *
 * Assigns each visitor a stable variant per experiment (hashed from a
 * persistent random id), records exposure + conversion into the existing
 * analytics store, and exposes a summary so the operator can compare
 * variants without any backend. No network, no PII.
 */

import { track } from "./analytics";

const CLIENT_ID_KEY = "ritd_client_id";
const EXPOSURE_KEY = "ritd_ab_exposures";

export interface Experiment {
  /** Stable experiment id, e.g. "win_threshold". */
  id: string;
  /** Variant names to split traffic across (>= 2). */
  variants: string[];
  /** Percentage of traffic enrolled (0-100). Non-enrolled get variants[0]. */
  traffic?: number;
}

/** Declared experiments + which variant the player got. */
export const EXPERIMENTS: Experiment[] = [
  // Candidate: lower vs default win-celebration thresholds.
  { id: "win_threshold", variants: ["default", "lowered"], traffic: 100 },
  // Candidate: spin button pulse speed (visual arousal).
  { id: "spin_pulse", variants: ["normal", "fast"], traffic: 50 },
];

function clientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Deterministic 32-bit hash so the same client+experiment always maps to
 *  the same variant (no flicker across reloads). */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable variant assignment for an experiment. */
export function getVariant(exp: Experiment): string {
  const enrollment = exp.traffic ?? 100;
  const seed = hash(`${clientId()}:${exp.id}`);
  if ((seed % 100) >= enrollment) return exp.variants[0];
  return exp.variants[seed % exp.variants.length];
}

/** Variant lookup by id, convenience for call sites. */
export function variantOf(id: string): string {
  const exp = EXPERIMENTS.find((e) => e.id === id);
  return exp ? getVariant(exp) : "default";
}

/**
 * Record that the player encountered an experiment, and whether they
 * converted on it. Writes into the shared analytics ring buffer as
 * `ab_exposure` / `ab_convert` events (cast through unknown so the
 * analytics event union stays source-of-truth for game events).
 */
export function recordExposure(expId: string, converted = false): void {
  const variant = variantOf(expId);
  try {
    const raw = localStorage.getItem(EXPOSURE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[expId] = variant;
    localStorage.setItem(EXPOSURE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  track(`ab_exposure:${expId}:${variant}` as unknown as Parameters<typeof track>[0]);
  if (converted) {
    track(`ab_convert:${expId}:${variant}` as unknown as Parameters<typeof track>[0]);
  }
}

/** All exposures this client has seen, keyed by experiment id. */
export function getExposures(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EXPOSURE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
