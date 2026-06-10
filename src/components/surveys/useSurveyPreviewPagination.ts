'use client';

import { useCallback, useState } from 'react';

export function useSurveyPreviewPagination(totalPages: number, initialPageIndex = 0) {
  const safeTotalPages = Math.max(1, totalPages);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const isLastPage = pageIndex >= safeTotalPages - 1;

  const goToNextPage = useCallback(() => {
    setPageIndex((current) => Math.min(current + 1, safeTotalPages - 1));
  }, [safeTotalPages]);

  const getFooterLabel = useCallback(
    (isFirstSurveyPage: boolean) => {
      if (pageIndex === 0 && isFirstSurveyPage) return 'Start';
      if (!isLastPage) return 'Next';
      return 'Done';
    },
    [isLastPage, pageIndex]
  );

  const handleFooterAction = useCallback(
    (onDone?: () => void) => {
      if (!isLastPage) {
        goToNextPage();
        return;
      }
      onDone?.();
    },
    [goToNextPage, isLastPage]
  );

  return {
    pageIndex,
    totalPages: safeTotalPages,
    isLastPage,
    getFooterLabel,
    handleFooterAction,
  };
}
