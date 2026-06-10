/**
 * useKeyboardShortcuts — dispatchShortcut unit tests.
 *
 * The dispatcher is a pure function: (event, focus, handlers,
 * preventDefault) => boolean. Tests target the pure function
 * directly so we can run in a node environment (no jsdom,
 * no React render).
 *
 * Coverage:
 *  - Letter shortcuts: M/m, P/p (case-insensitive)
 *  - Space and Enter spin (only when no interactive is focused)
 *  - Bet adjustment: +, =, -, _
 *  - Focus suppression: editable (input/textarea/contenteditable)
 *  - Focus suppression: interactive (button/role=button/tabindex)
 *  - Modifier suppression: Ctrl/Cmd/Alt
 *  - Auto-repeat suppression
 *  - preventDefault is called only when a handler fires
 *  - Unrecognized keys return false silently
 */
import { describe, expect, it, vi } from "vitest";
import {
  dispatchShortcut,
  type ShortcutEvent,
  type FocusState,
  type KeyboardShortcutHandlers,
} from "./useKeyboardShortcuts";

const NEUTRAL_FOCUS: FocusState = { editable: false, interactive: false };

function makeEvent(overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}

function makeHandlers(
  overrides: Partial<KeyboardShortcutHandlers> = {}
): KeyboardShortcutHandlers {
  return {
    spin: vi.fn(),
    toggleSound: vi.fn(),
    togglePaytable: vi.fn(),
    increaseBet: vi.fn(),
    decreaseBet: vi.fn(),
    ...overrides,
  };
}

describe("dispatchShortcut", () => {
  describe("letter shortcuts", () => {
    it("fires toggleSound on lowercase 'm'", () => {
      const h = makeHandlers();
      const fired = dispatchShortcut(
        makeEvent({ key: "m" }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(true);
      expect(h.toggleSound).toHaveBeenCalledTimes(1);
    });

    it("fires toggleSound on uppercase 'M'", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "M" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.toggleSound).toHaveBeenCalledTimes(1);
    });

    it("fires togglePaytable on 'P' and 'p'", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "p" }), NEUTRAL_FOCUS, h, vi.fn());
      dispatchShortcut(makeEvent({ key: "P" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.togglePaytable).toHaveBeenCalledTimes(2);
    });

    it("ignores unrelated letters", () => {
      const h = makeHandlers();
      const fired = dispatchShortcut(
        makeEvent({ key: "x" }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(false);
      expect(h.toggleSound).not.toHaveBeenCalled();
      expect(h.togglePaytable).not.toHaveBeenCalled();
    });

    it("does not fire toggleSound when handler is undefined", () => {
      const h = makeHandlers({ toggleSound: undefined });
      // Should not throw
      const fired = dispatchShortcut(
        makeEvent({ key: "m" }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(false);
    });
  });

  describe("spin shortcuts (Space / Enter)", () => {
    it("fires spin on Space when no interactive is focused", () => {
      const h = makeHandlers();
      const fired = dispatchShortcut(
        makeEvent({ key: " " }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(true);
      expect(h.spin).toHaveBeenCalledTimes(1);
    });

    it("fires spin on Enter when no interactive is focused", () => {
      const h = makeHandlers();
      const fired = dispatchShortcut(
        makeEvent({ key: "Enter" }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(true);
      expect(h.spin).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire spin when a button is focused", () => {
      const h = makeHandlers();
      const focus: FocusState = { editable: false, interactive: true };
      const fired = dispatchShortcut(
        makeEvent({ key: " " }),
        focus,
        h,
        vi.fn()
      );
      expect(fired).toBe(false);
      expect(h.spin).not.toHaveBeenCalled();
    });

    it("does not throw if spin handler is undefined", () => {
      const h = makeHandlers({ spin: undefined });
      const fired = dispatchShortcut(
        makeEvent({ key: " " }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(fired).toBe(false);
    });
  });

  describe("bet adjustment", () => {
    it("fires increaseBet on '+'", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "+" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.increaseBet).toHaveBeenCalledTimes(1);
    });

    it("fires increaseBet on '=' (US unshifted +)", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "=" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.increaseBet).toHaveBeenCalledTimes(1);
    });

    it("fires decreaseBet on '-'", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "-" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.decreaseBet).toHaveBeenCalledTimes(1);
    });

    it("fires decreaseBet on '_' (US shifted -)", () => {
      const h = makeHandlers();
      dispatchShortcut(makeEvent({ key: "_" }), NEUTRAL_FOCUS, h, vi.fn());
      expect(h.decreaseBet).toHaveBeenCalledTimes(1);
    });
  });

  describe("focus suppression", () => {
    it("suppresses ALL shortcuts when an editable is focused", () => {
      const h = makeHandlers();
      const focus: FocusState = { editable: true, interactive: false };
      dispatchShortcut(makeEvent({ key: "m" }), focus, h, vi.fn());
      dispatchShortcut(makeEvent({ key: "p" }), focus, h, vi.fn());
      dispatchShortcut(makeEvent({ key: " " }), focus, h, vi.fn());
      dispatchShortcut(makeEvent({ key: "+" }), focus, h, vi.fn());
      expect(h.toggleSound).not.toHaveBeenCalled();
      expect(h.togglePaytable).not.toHaveBeenCalled();
      expect(h.spin).not.toHaveBeenCalled();
      expect(h.increaseBet).not.toHaveBeenCalled();
    });

    it("suppresses only spin when an interactive is focused", () => {
      const h = makeHandlers();
      const focus: FocusState = { editable: false, interactive: true };
      // Letters and +/- still work
      dispatchShortcut(makeEvent({ key: "m" }), focus, h, vi.fn());
      dispatchShortcut(makeEvent({ key: "+" }), focus, h, vi.fn());
      // Spin is suppressed
      dispatchShortcut(makeEvent({ key: " " }), focus, h, vi.fn());
      expect(h.toggleSound).toHaveBeenCalledTimes(1);
      expect(h.increaseBet).toHaveBeenCalledTimes(1);
      expect(h.spin).not.toHaveBeenCalled();
    });
  });

  describe("modifier suppression", () => {
    it("does not fire M with Ctrl", () => {
      const h = makeHandlers();
      dispatchShortcut(
        makeEvent({ key: "m", ctrlKey: true }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(h.toggleSound).not.toHaveBeenCalled();
    });

    it("does not fire M with Meta (Cmd on macOS)", () => {
      const h = makeHandlers();
      dispatchShortcut(
        makeEvent({ key: "m", metaKey: true }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(h.toggleSound).not.toHaveBeenCalled();
    });

    it("does not fire Space with Alt", () => {
      const h = makeHandlers();
      dispatchShortcut(
        makeEvent({ key: " ", altKey: true }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(h.spin).not.toHaveBeenCalled();
    });
  });

  describe("auto-repeat suppression", () => {
    it("does not fire on a repeat keydown", () => {
      const h = makeHandlers();
      dispatchShortcut(
        makeEvent({ key: "m", repeat: true }),
        NEUTRAL_FOCUS,
        h,
        vi.fn()
      );
      expect(h.toggleSound).not.toHaveBeenCalled();
    });
  });

  describe("preventDefault", () => {
    it("calls preventDefault when a handler fires", () => {
      const h = makeHandlers();
      const pd = vi.fn();
      dispatchShortcut(makeEvent({ key: "m" }), NEUTRAL_FOCUS, h, pd);
      expect(pd).toHaveBeenCalledTimes(1);
    });

    it("does NOT call preventDefault when no handler fires", () => {
      const h = makeHandlers();
      const pd = vi.fn();
      dispatchShortcut(
        makeEvent({ key: "m", ctrlKey: true }),
        NEUTRAL_FOCUS,
        h,
        pd
      );
      expect(pd).not.toHaveBeenCalled();
    });

    it("does NOT call preventDefault for unrecognized keys", () => {
      const h = makeHandlers();
      const pd = vi.fn();
      dispatchShortcut(makeEvent({ key: "z" }), NEUTRAL_FOCUS, h, pd);
      expect(pd).not.toHaveBeenCalled();
    });
  });

  describe("return value", () => {
    it("returns true when a handler fires", () => {
      const h = makeHandlers();
      expect(
        dispatchShortcut(makeEvent({ key: "m" }), NEUTRAL_FOCUS, h, vi.fn())
      ).toBe(true);
    });

    it("returns false for unrecognized keys", () => {
      const h = makeHandlers();
      expect(
        dispatchShortcut(makeEvent({ key: "z" }), NEUTRAL_FOCUS, h, vi.fn())
      ).toBe(false);
    });
  });
});
