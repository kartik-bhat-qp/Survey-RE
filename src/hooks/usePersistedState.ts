'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = 'survey-re:';

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* localStorage may be unavailable (quota, private mode); ignore. */
  }
}

/**
 * Persists state to localStorage under `survey-re:<key>`.
 * Initial render returns `initialValue` to avoid SSR/CSR hydration mismatches,
 * then hydrates from storage on mount.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const stored = readFromStorage<T>(key, initialValue);
    setValue(stored);
    hydratedRef.current = true;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

/**
 * Same as `usePersistedState` but stores a `Set<string>` as an array.
 */
export function usePersistedStringSet(
  key: string,
  initialValue: ReadonlySet<string> = new Set()
): [Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>] {
  const [array, setArray] = usePersistedState<string[]>(key, Array.from(initialValue));

  const setValue = useCallback<React.Dispatch<React.SetStateAction<Set<string>>>>(
    (next) => {
      setArray((prevArray) => {
        const prevSet = new Set(prevArray);
        const resolved = typeof next === 'function' ? (next as (s: Set<string>) => Set<string>)(prevSet) : next;
        return Array.from(resolved);
      });
    },
    [setArray]
  );

  const set = useMemo(() => new Set(array), [array]);

  return [set, setValue];
}
