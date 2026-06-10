/**
 * Haptic feedback helper.
 *
 * Wraps `navigator.vibrate()` with feature detection, an
 * opt-out toggle, and a small library of named patterns
 * matching game events. Designed to be fire-and-forget —
 * never throws, never blocks, no-op on platforms that
 * don't support the Vibration API (iOS Safari, desktop
 * browsers, locked-down webviews).
 *
 * Spec coverage: the Web Vibration API is supported in
 * Android Chrome / Edge / Firefox / Samsung Internet. It
 * is NOT supported in iOS Safari (any version), iOS WKWebView,
 * or desktop browsers. On unsupported platforms the helper
 * is a no-op.
 *
 * Toggle: the helper exposes `setHapticsEnabled()` mirroring
 * the sound-system pattern. A no-UI variable is the minimum
 * viable version — the user can wire a settings toggle later
 * the same way the sound mute button is wired (Gap B from
 * Phase 3).
 *
 * Battery: the Vibration API has no documented power cost
 * guidance but pattern-based calls fire one pulse train and
 * then stop. We don't use any continuous or repeating
 * patterns, so this is conservative on battery.
 *
 * See docs/PHASE_5_STATUS.md Gap B.
 */

/** Haptic patterns in milliseconds. Single number = single pulse, array = pulse/pause/pulse/... */
export const HAPTIC_PATTERNS = {
  /** 10ms tap — button press feedback. */
  tap: 10,
  /** 30ms — scatter / small event. */
  small: 30,
  /** 50ms — single big win. */
  medium: 50,
  /** Triple pulse — mega win. */
  large: [60, 40, 60, 40, 100],
  /** Crescendo — jackpot. */
  jackpot: [80, 50, 80, 50, 120, 50, 200],
} as const;

export type HapticPatternName = keyof typeof HAPTIC_PATTERNS;

let enabled = true;

/**
 * Enable or disable haptic feedback. When disabled, the
 * helper is a complete no-op (no calls into the API).
 */
export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Returns true if the runtime supports the Vibration API
 * AND the user has not disabled haptics. Useful for tests
 * and for the "should I show a haptics toggle in settings?"
 * UI question.
 */
export function hapticsAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!enabled) return false;
  return typeof navigator.vibrate === "function";
}

/**
 * Fire a haptic pattern. Safe to call from anywhere — never
 * throws, never blocks. If the platform doesn't support the
 * Vibration API or haptics are disabled, the call is dropped
 * silently.
 *
 * Accepts either a named pattern from HAPTIC_PATTERNS or a
 * raw number/array matching the Vibration API spec.
 */
export function vibrate(
  pattern: HapticPatternName | number | readonly number[]
): void {
  if (!hapticsAvailable()) return;
  const resolved =
    typeof pattern === "string" ? HAPTIC_PATTERNS[pattern] : pattern;
  // Defensive: if the named pattern lookup returned undefined
  // for any reason, drop the call.
  if (resolved === undefined) return;
  try {
    // The Vibration API takes a number or a mutable number[].
    // readonly arrays are accepted at runtime in every browser
    // that supports the API, so the cast is safe.
    navigator.vibrate(resolved as number | number[]);
  } catch {
    // Some browsers throw on invalid patterns (e.g. negative
    // durations). Swallow — haptics must never break the app.
  }
}
