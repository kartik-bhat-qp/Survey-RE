'use client';

import { useEffect, useState } from 'react';
import {
  ESSENTIALS_ACCOUNT_REVIEW_CHANGED,
  ESSENTIALS_SURVEY_REVIEWING_CHANGED,
  essentialsAccountActionsLocked,
  readEssentialsSurveyReviewing,
} from '@/data/mock-essentials-phishing-review';
import { SURVEY_FOOTER_BRAND_CHANGED } from '@/lib/survey-suite-footer-brand';

export function useEssentialsAccountActionsLocked(): boolean {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    function sync(): void {
      setLocked(essentialsAccountActionsLocked());
    }

    sync();
    window.addEventListener(ESSENTIALS_ACCOUNT_REVIEW_CHANGED, sync);
    window.addEventListener(SURVEY_FOOTER_BRAND_CHANGED, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ESSENTIALS_ACCOUNT_REVIEW_CHANGED, sync);
      window.removeEventListener(SURVEY_FOOTER_BRAND_CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return locked;
}

/** True while Essentials phishing review is running (Preview loader state). */
export function useEssentialsSurveyReviewing(): boolean {
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    function sync(): void {
      setReviewing(readEssentialsSurveyReviewing());
    }

    sync();
    window.addEventListener(ESSENTIALS_SURVEY_REVIEWING_CHANGED, sync);
    return () => {
      window.removeEventListener(ESSENTIALS_SURVEY_REVIEWING_CHANGED, sync);
    };
  }, []);

  return reviewing;
}
