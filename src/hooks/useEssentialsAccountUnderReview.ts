'use client';

import { usePhishingScanReviewing } from '@/hooks/usePhishingPublishHold';

/** @deprecated Building is never blocked — always false. */
export function useEssentialsAccountActionsLocked(): boolean {
  return false;
}

/** True while a publish-time phishing scan is running. */
export function useEssentialsSurveyReviewing(): boolean {
  return usePhishingScanReviewing();
}
