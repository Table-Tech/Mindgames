import AsyncStorage from '@react-native-async-storage/async-storage';

// Minimal key/value contract the app depends on. AsyncStorage is the default
// implementation; tests or other platforms can inject their own.
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

let store: KeyValueStore = AsyncStorage;

export function configureStorage(next: KeyValueStore): void {
  store = next;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await store.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}

export async function remove(key: string): Promise<void> {
  await store.removeItem(key);
}

export async function clearAll(): Promise<void> {
  await store.clear();
}
