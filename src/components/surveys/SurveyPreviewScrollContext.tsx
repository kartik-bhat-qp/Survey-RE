'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

type ScrollToTopFn = (behavior?: ScrollBehavior) => void;

interface SurveyPreviewScrollContextValue {
  setScrollContainer: (node: HTMLDivElement | null) => void;
  scrollToTop: ScrollToTopFn;
}

const SurveyPreviewScrollContext = createContext<SurveyPreviewScrollContextValue | null>(null);

export function SurveyPreviewScrollProvider({ children }: { children: ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const setScrollContainer = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
  }, []);

  const scrollToTop = useCallback<ScrollToTopFn>((behavior = 'smooth') => {
    const node = scrollContainerRef.current;
    if (!node) return;

    node.scrollTo({ top: 0, behavior });
    window.requestAnimationFrame(() => {
      node.scrollTop = 0;
    });
  }, []);

  const value = useMemo(
    () => ({ setScrollContainer, scrollToTop }),
    [scrollToTop, setScrollContainer]
  );

  return (
    <SurveyPreviewScrollContext.Provider value={value}>
      {children}
    </SurveyPreviewScrollContext.Provider>
  );
}

export function useSurveyPreviewScroll(): SurveyPreviewScrollContextValue | null {
  return useContext(SurveyPreviewScrollContext);
}
