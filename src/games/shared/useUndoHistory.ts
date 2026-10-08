import { useCallback, useState } from 'react';

// A stack of snapshots for undo. Generic so every game can reuse it.
export function useUndoHistory<T>() {
  const [stack, setStack] = useState<T[]>([]);

  const push = useCallback((snapshot: T) => setStack(s => [...s, snapshot]), []);
  const clear = useCallback(() => setStack([]), []);
  /** Removes and returns the latest snapshot, if any. */
  const pop = useCallback((): T | undefined => {
    const last = stack[stack.length - 1];
    if (last !== undefined) setStack(s => s.slice(0, -1));
    return last;
  }, [stack]);

  return { push, pop, clear, canUndo: stack.length > 0 };
}
