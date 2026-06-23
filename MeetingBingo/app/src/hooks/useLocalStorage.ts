// src/hooks/useLocalStorage.ts
import { useCallback, useState } from 'react';

/** Safe JSON read — never throws on corrupt/missing data (plan M2). */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Safe JSON write — swallows quota/serialization errors. */
export function writeJSON(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Safe key removal. */
export function removeKey(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Generic localStorage-backed state. (The in-progress game persistence in
 * App.tsx uses the read/write helpers above directly, since it spans two
 * pieces of state; this hook is here for any single-value needs.)
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON(key, initial));
  const set = useCallback(
    (next: T) => {
      setValue(next);
      writeJSON(key, next);
    },
    [key],
  );
  return [value, set];
}
