/**
 * Optional haptic feedback wrapper using the Vibration API.
 * Falls back silently when not supported or disabled.
 */

const HAPTICS_ENABLED_KEY = "ritd_haptics_enabled";

export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function getHapticsEnabled(): boolean {
  if (!isHapticsSupported()) return false;
  try {
    return localStorage.getItem(HAPTICS_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
  } catch {}
}

export function haptic(pattern: number | number[]): void {
  if (!isHapticsSupported()) return;
  if (!getHapticsEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported edge cases.
  }
}

export const haptics = {
  spin: () => haptic(15),
  stop: () => haptic([20, 30, 20]),
  win: () => haptic([10, 50, 20, 50, 10]),
  bigWin: () => haptic([20, 30, 40, 30, 20, 30, 60]),
  nearMiss: () => haptic([10, 20, 10]),
  coinLock: () => haptic([10, 10, 10, 10]),
};
