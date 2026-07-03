import { useCallback, useReducer, useRef } from "react";

interface CommitOptions {
  /** Skip debounce coalescing — always record a separate history step (for discrete actions like delete/reorder). */
  immediate?: boolean;
}

/**
 * Wraps a controlled value + its onChange setter with undo/redo history.
 * Rapid successive commits (e.g. keystrokes in the same field) within
 * `debounceMs` are coalesced into a single history step; pass
 * `{ immediate: true }` for discrete actions that should always be their
 * own step.
 */
export function useUndoRedo<T>(value: T, onChange: (next: T) => void, debounceMs = 600) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastCommitAt = useRef(0);
  const [, bump] = useReducer((c: number) => c + 1, 0);

  const commit = useCallback(
    (next: T, opts?: CommitOptions) => {
      const now = Date.now();
      const coalesce =
        !opts?.immediate && past.current.length > 0 && now - lastCommitAt.current < debounceMs;
      if (!coalesce) {
        past.current.push(valueRef.current);
        if (past.current.length > 100) past.current.shift();
      }
      lastCommitAt.current = now;
      future.current = [];
      onChange(next);
      bump();
    },
    [onChange, debounceMs]
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop()!;
    future.current.push(valueRef.current);
    onChange(prev);
    bump();
  }, [onChange]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop()!;
    past.current.push(valueRef.current);
    onChange(next);
    bump();
  }, [onChange]);

  return {
    commit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
