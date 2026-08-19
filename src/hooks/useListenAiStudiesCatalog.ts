'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
import {
  getListenAiStudiesCatalog,
  getSeedListenAiStudies,
  refreshListenAiStudiesCatalog,
  subscribeListenAiStudiesCatalog,
} from '@/data/listenai-study-catalog';

export function useListenAiStudiesCatalog(): {
  studies: ListenAiStudy[];
  isRefreshing: boolean;
  refresh: () => Promise<ListenAiStudy[]>;
} {
  const [studies, setStudies] = useState<ListenAiStudy[]>(getSeedListenAiStudies);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await refreshListenAiStudiesCatalog();
      setStudies(next);
      return next;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setStudies(getListenAiStudiesCatalog());
    const unsubscribe = subscribeListenAiStudiesCatalog((next) => {
      setStudies(next);
    });
    return unsubscribe;
  }, []);

  return { studies, isRefreshing, refresh };
}
