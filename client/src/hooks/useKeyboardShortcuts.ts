/**
 * useKeyboardShortcuts — global keyboard shortcuts for the
 * slot-machine game.
 *
 * Listens to `window` keydown and dispatches to a set of
 * named handlers. Designed to be unobtrusive:
 *
 *   - Suppresses ALL shortcuts when an editable element
 *     (input, textarea, [contenteditable]) is focused. This
 *     is the most important rule: typing "m" into the chat
 *     box must not mute the game.
 *
 *   - Suppresses the Space/Enter spin shortcut when ANY
 *     focusable interactive element is focused (button, link,
 *     [role="button"], [tabindex]). The focused element gets
 *     the keypress naturally. This is the same as the browser
 *     default behavior, made explicit.
 *
 *   - Letter shortcuts (M, P) match case-insensitively and
 *     ignore modifier keys (Ctrl/Cmd/Alt) so they don't
 *     conflict with browser shortcuts like Ctrl+M (mute tab).
 *
 *   - Cleanup: removes the listener on unmount. Safe to
 *     re-mount: handlers are read from a ref so identity
 *     changes don't re-bind the listener.
 *
 * Public API:
 *   useKeyboardShortcuts({ spin, toggleSound, togglePaytable,
 *                           increaseBet, decreaseBet, enabled })
 *
 * All handlers are optional. The hook does nothing if
 * `enabled` is false (defaults to true).
 *
 * The dispatch logic is extracted into `dispatchShortcut` so
 * it can be unit-tested in a node environment (no React, no
 * jsdom required). The hook is a thin wrapper that wires
 * `window.addEventListener` to `dispatchShortcut`.
 *
 * See docs/PHASE_5_STATUS.md Gap D.
 */

import { useEffect, useRef } from "react";

export interface KeyboardShortcutHandlers {
  /** Spin the reels. Fires on Space or Enter (when no button is focused). */
  spin?: () => void;
  /** Toggle sound on/off. Fires on "M" / "m". */
  toggleSound?: () => void;
  /** Toggle the paytable/rules panel. Fires on "P" / "p". */
  togglePaytable?: () => void;
  /** Increase bet by one step. Fires on "+" or "=". */
  increaseBet?: () => void;
  /** Decrease bet by one step. Fires on "-" or "_". */
  decreaseBet?: () => void;
}

export interface KeyboardShortcutOptions {
  /**
   * Set to false to disable all shortcuts without
   * unmounting. Useful for disabling when a modal that
   * captures keyboard is open.
   */
  enabled?: boolean;
}

/**
 * Minimal subset of KeyboardEvent needed by `dispatchShortcut`.
 * Lets us test the dispatcher without constructing real DOM
 * events.
 */
export interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
}

/**
 * The focus state of the document, computed by the caller
 * and passed in. The dispatcher itself doesn't touch the
 * DOM so it stays testable in node.
 */
export interface FocusState {
  /** Is the active element an editable text field? */
  editable: boolean;
  /** Is the active element a focusable interactive control? */
  interactive: boolean;
}

/**
 * Pure dispatcher — given a key event, the current focus
 * state, and a set of handlers, call the appropriate handler
 * (and optionally preventDefault). Returns true if a handler
 * fired (so the caller can know to do bookkeeping).
 *
 * The `preventDefault` callback is injected so the dispatcher
 * doesn't need a real event object. Tests pass a no-op;
 * production passes `(e) => e.preventDefault()`.
 */
export function dispatchShortcut(
  event: ShortcutEvent,
  focus: FocusState,
  handlers: KeyboardShortcutHandlers,
  preventDefault: () => void
): boolean {
  // Editable element: defer completely so the user can type
  // "m" or "p" into a text field.
  if (focus.editable) return false;
  // Skip if the user is holding a modifier — these are
  // browser/OS shortcuts, not game controls.
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  // Skip auto-repeat: holding "M" should not toggle sound
  // repeatedly.
  if (event.repeat) return false;

  const key = event.key;

  // Letter shortcuts: match case-insensitively.
  if (key.length === 1) {
    const lower = key.toLowerCase();
    if (lower === "m" && handlers.toggleSound) {
      preventDefault();
      handlers.toggleSound();
      return true;
    }
    if (lower === "p" && handlers.togglePaytable) {
      preventDefault();
      handlers.togglePaytable();
      return true;
    }
  }

  // Space / Enter spins the reels — but only when no
  // interactive control is focused (so the focused button
  // gets the keypress).
  if ((key === " " || key === "Spacebar" || key === "Enter") && handlers.spin) {
    if (focus.interactive) return false;
    preventDefault();
    handlers.spin();
    return true;
  }

  // Bet adjustment. "=" shares the "+" key on US keyboards
  // without Shift, so we accept both.
  if ((key === "+" || key === "=") && handlers.increaseBet) {
    preventDefault();
    handlers.increaseBet();
    return true;
  }
  if ((key === "-" || key === "_") && handlers.decreaseBet) {
    preventDefault();
    handlers.decreaseBet();
    return true;
  }

  return false;
}

/**
 * Compute the FocusState from a real DOM document. Used by
 * the hook; tests use `dispatchShortcut` directly with a
 * synthetic focus state.
 */
function readFocusState(doc: Document): FocusState {
  const el = doc.activeElement as HTMLElement | null;
  if (!el) return { editable: false, interactive: false };
  const tag = el.tagName;
  const editable =
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  let interactive = tag === "BUTTON" || tag === "A" || tag === "SUMMARY";
  if (!interactive) {
    const role = el.getAttribute("role");
    if (
      role === "button" ||
      role === "link" ||
      role === "checkbox" ||
      role === "switch"
    ) {
      interactive = true;
    }
  }
  if (!interactive) {
    if (el.hasAttribute("tabindex") && el.tabIndex >= 0) interactive = true;
  }
  return { editable, interactive };
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options: KeyboardShortcutOptions = {}
): void {
  // Read handlers from a ref so the listener never re-binds
  // when an upstream prop changes identity.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const enabledRef = useRef(options.enabled !== false);
  enabledRef.current = options.enabled !== false;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!enabledRef.current) return;
      const focus = readFocusState(document);
      dispatchShortcut(
        {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          repeat: event.repeat,
        },
        focus,
        handlersRef.current,
        () => event.preventDefault()
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Bind once; read latest handlers via ref.
}
