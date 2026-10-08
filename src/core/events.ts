export type Listener<T> = (event: T) => void;

export interface Emitter<T> {
  /** Subscribes and returns an unsubscribe function. */
  on(listener: Listener<T>): () => void;
  emit(event: T): void;
}

export function createEmitter<T = void>(): Emitter<T> {
  const listeners = new Set<Listener<T>>();
  return {
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      for (const l of Array.from(listeners)) l(event);
    },
  };
}

// Fired when local data that should be mirrored to the cloud (stats records,
// synced preferences) changes. Domain modules emit it; the cloud layer
// subscribes — so the domain never depends on Firebase.
export const syncedDataChanged = createEmitter<void>();
