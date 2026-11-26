'use client';

import { useEffect, useState } from 'react';
import {
  PHISHING_HOLD_CHANGED,
  PHISHING_SCAN_REVIEWING_CHANGED,
  getHeldCase,
  isAccountSuspended,
  isPublishSendPaused,
  isSurveyOnHold,
  listActiveHoldCases,
  readPhishingHoldState,
  readPhishingScanReviewing,
  type HeldSurveyCase,
  type PhishingPublishHoldState,
} from '@/data/mock-phishing-publish-hold';
import { SURVEY_FOOTER_BRAND_CHANGED } from '@/lib/survey-suite-footer-brand';

function subscribeHold(onChange: () => void): () => void {
  window.addEventListener(PHISHING_HOLD_CHANGED, onChange);
  window.addEventListener(SURVEY_FOOTER_BRAND_CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(PHISHING_HOLD_CHANGED, onChange);
    window.removeEventListener(SURVEY_FOOTER_BRAND_CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function usePhishingHoldState(): PhishingPublishHoldState {
  const [state, setState] = useState<PhishingPublishHoldState>(() => readPhishingHoldState());
  useEffect(() => {
    function sync(): void {
      setState(readPhishingHoldState());
    }
    sync();
    return subscribeHold(sync);
  }, []);
  return state;
}

export function usePublishSendPaused(): boolean {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    function sync(): void {
      setPaused(isPublishSendPaused());
    }
    sync();
    return subscribeHold(sync);
  }, []);
  return paused;
}

export function useAccountSuspended(): boolean {
  const [suspended, setSuspended] = useState(false);
  useEffect(() => {
    function sync(): void {
      setSuspended(isAccountSuspended());
    }
    sync();
    return subscribeHold(sync);
  }, []);
  return suspended;
}

export function useSurveyOnHold(surveyId: number): boolean {
  const [onHold, setOnHold] = useState(false);
  useEffect(() => {
    function sync(): void {
      setOnHold(isSurveyOnHold(surveyId));
    }
    sync();
    return subscribeHold(sync);
  }, [surveyId]);
  return onHold;
}

export function useHeldCase(surveyId: number): HeldSurveyCase | undefined {
  const [held, setHeld] = useState<HeldSurveyCase | undefined>(undefined);
  useEffect(() => {
    function sync(): void {
      setHeld(getHeldCase(surveyId));
    }
    sync();
    return subscribeHold(sync);
  }, [surveyId]);
  return held;
}

export function useActiveHoldCases(): HeldSurveyCase[] {
  const [cases, setCases] = useState<HeldSurveyCase[]>([]);
  useEffect(() => {
    function sync(): void {
      setCases(listActiveHoldCases());
    }
    sync();
    return subscribeHold(sync);
  }, []);
  return cases;
}

export function usePhishingScanReviewing(): boolean {
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    function sync(): void {
      setReviewing(readPhishingScanReviewing());
    }
    sync();
    window.addEventListener(PHISHING_SCAN_REVIEWING_CHANGED, sync);
    return () => window.removeEventListener(PHISHING_SCAN_REVIEWING_CHANGED, sync);
  }, []);
  return reviewing;
}
