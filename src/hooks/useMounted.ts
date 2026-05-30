'use client';

import { useEffect, useState } from 'react';

/** True after the first client effect — use to avoid SSR/client HTML mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
