'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setSurveyFooterBrand } from '@/lib/survey-suite-footer-brand';

/** Applies product-switcher entry from URL, then strips the query param from the address bar. */
export function SurveyFooterBrandSync() {
  const searchParams = useSearchParams();
  const fromProductSwitcher = searchParams.get('from') === 'product-switcher';

  useEffect(() => {
    if (!fromProductSwitcher) return;

    setSurveyFooterBrand('research');

    const url = new URL(window.location.href);
    url.searchParams.delete('from');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', next);
  }, [fromProductSwitcher]);

  return null;
}
