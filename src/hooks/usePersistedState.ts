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
 * Initial render always uses `initialValue` so server HTML matches the client.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const setPersistedValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (next) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (current: T) => T)(prev) : next;
        writeToStorage(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  useEffect(() => {
    setValue(readFromStorage(key, initialValueRef.current));
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage(key, value);
  }, [hydrated, key, value]);

  return [value, setPersistedValue];
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
