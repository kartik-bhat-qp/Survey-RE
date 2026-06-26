'use client';

import { useEffect, useState } from 'react';

export type WickUILib = typeof import('@npm-questionpro/wick-ui-lib');

/**
 * Loads WickUI on the client in one chunk so modal header (Dialog.Title) and
 * content mount together — avoids Radix "DialogContent requires DialogTitle" warnings.
 */
export function useWickUILib(): WickUILib | null {
  const [lib, setLib] = useState<WickUILib | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@npm-questionpro/wick-ui-lib').then((module) => {
      if (!cancelled) setLib(module);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return lib;
}
