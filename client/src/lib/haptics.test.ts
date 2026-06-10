/**
 * Haptics helper tests
 *
 * The helper is a thin wrapper around navigator.vibrate()
 * with feature detection and a toggle. The behavior we
 * need to lock in:
 *   - When navigator.vibrate doesn't exist (iOS, desktop):
 *     the helper is a no-op, no errors
 *   - When enabled=false: the helper is a no-op, no errors
 *   - When supported: the helper calls navigator.vibrate
 *     with the resolved pattern
 *   - Named patterns resolve to the right pulse train
 *   - Raw number/array patterns are passed through
 *   - Errors thrown by the platform's vibrate() are caught
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  HAPTIC_PATTERNS,
  hapticsAvailable,
  setHapticsEnabled,
  vibrate,
} from "./haptics";

describe("haptics", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    // Reset module state between tests
    setHapticsEnabled(true);
    // Make navigator.vibrate exist by default
    Object.defineProperty(globalThis, "navigator", {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("vibrate (named patterns)", () => {
    it("resolves 'tap' to a 10ms pulse", () => {
      vibrate("tap");
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it("resolves 'small' to a 30ms pulse", () => {
      vibrate("small");
      expect(vibrateMock).toHaveBeenCalledWith(30);
    });

    it("resolves 'medium' to a 50ms pulse", () => {
      vibrate("medium");
      expect(vibrateMock).toHaveBeenCalledWith(50);
    });

    it("resolves 'large' to a 3-pulse crescendo", () => {
      vibrate("large");
      expect(vibrateMock).toHaveBeenCalledWith([60, 40, 60, 40, 100]);
    });

    it("resolves 'jackpot' to a 5-pulse celebration", () => {
      vibrate("jackpot");
      expect(vibrateMock).toHaveBeenCalledWith([80, 50, 80, 50, 120, 50, 200]);
    });
  });

  describe("vibrate (raw patterns)", () => {
    it("passes through a raw number", () => {
      vibrate(200);
      expect(vibrateMock).toHaveBeenCalledWith(200);
    });

    it("passes through a raw array", () => {
      vibrate([100, 50, 100]);
      expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
    });
  });

  describe("hapticsAvailable", () => {
    it("returns true when navigator.vibrate exists and enabled", () => {
      expect(hapticsAvailable()).toBe(true);
    });

    it("returns false when haptics are disabled", () => {
      setHapticsEnabled(false);
      expect(hapticsAvailable()).toBe(false);
    });

    it("returns false when navigator.vibrate is missing (iOS / desktop)", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });
      expect(hapticsAvailable()).toBe(false);
    });

    it("returns false when navigator is undefined (SSR)", () => {
      const originalNavigator = (globalThis as any).navigator;
      // @ts-expect-error -- intentionally delete for test
      delete (globalThis as any).navigator;
      try {
        expect(hapticsAvailable()).toBe(false);
      } finally {
        Object.defineProperty(globalThis, "navigator", {
          value: originalNavigator,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  describe("no-op safety", () => {
    it("does not call navigator.vibrate when disabled", () => {
      setHapticsEnabled(false);
      vibrate("large");
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it("does not call navigator.vibrate when platform doesn't support it", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });
      vibrate("jackpot");
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it("swallows errors thrown by navigator.vibrate (e.g. invalid pattern)", () => {
      vibrateMock.mockImplementation(() => {
        throw new Error("Invalid vibration pattern");
      });
      // Should not throw
      expect(() => vibrate("tap")).not.toThrow();
    });

    it("does not throw when the named pattern is not in the table", () => {
      // Cast to bypass the type system — the runtime should
      // be defensive against bad inputs
      expect(() => vibrate("nonsense" as any)).not.toThrow();
      expect(vibrateMock).not.toHaveBeenCalled();
    });
  });

  describe("HAPTIC_PATTERNS", () => {
    it("exposes the 5 named patterns", () => {
      expect(Object.keys(HAPTIC_PATTERNS).sort()).toEqual([
        "jackpot",
        "large",
        "medium",
        "small",
        "tap",
      ]);
    });
  });
});
