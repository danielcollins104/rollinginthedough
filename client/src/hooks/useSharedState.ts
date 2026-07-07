/**
 * createSharedState - Module-level state shared across all hook instances.
 *
 * Solves the "two hooks in different components, each with their own state,
 * last-write-wins on the same localStorage key" problem.
 *
 * Usage:
 *   const counterStore = createSharedState({ count: 0 });
 *   // In any component:
 *   const [count, setCount] = useSharedState(counterStore);
 *
 * All callers see the same state and the same updates.
 *
 * Implementation: a module-level value plus a Set of listeners. Components
 * subscribe on mount and unsubscribe on unmount; useSyncExternalStore
 * guarantees consistent snapshots during concurrent renders.
 */
import { useCallback, useSyncExternalStore } from "react";

export interface SharedStore<T> {
  getSnapshot: () => T;
  setState: (updater: (prev: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createSharedState<T>(initial: T): SharedStore<T> {
  let current: T = initial;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => current;

  const setState = (updater: (prev: T) => T) => {
    const next = updater(current);
    if (Object.is(next, current)) return;
    current = next;
    listeners.forEach((l) => l());
  };

  return { getSnapshot, setState, subscribe };
}

/**
 * Hook form — reads the shared state and re-renders when it changes.
 * Uses useSyncExternalStore for concurrent-safe tearing protection.
 */
export function useSharedState<T>(store: SharedStore<T>): [T, (updater: (prev: T) => T) => void] {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  // setState is stable across renders (closure on module), so wrap once.
  const setValue = useCallback((updater: (prev: T) => T) => store.setState(updater), [store]);
  return [value, setValue];
}