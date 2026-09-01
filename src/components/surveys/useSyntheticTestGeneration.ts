'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatGenerationTimeRemaining,
  getSyntheticGenerationDurationMs,
  getSyntheticGenerationStep,
  parseTestResponseCount,
} from '@/data/mock-test-responses';
import type { SyntheticTestGenerationRequest } from '@/components/surveys/TestResponsesModal';

export interface SyntheticGenerationProgress {
  total: number;
  generatedCount: number;
  progress: number;
  remainingMs: number;
  step: string;
  eta: string;
}

export function useSyntheticTestGeneration(
  job: SyntheticTestGenerationRequest | null,
  onComplete: (count: string) => void
): SyntheticGenerationProgress | null {
  const total = job ? Math.max(1, parseTestResponseCount(job.count)) : 0;
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const jobKey = job ? `${job.count}:${job.panelLabel}` : null;

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!jobKey) {
      setProgress(0);
      setGeneratedCount(0);
      setRemainingMs(0);
      return;
    }

    const count = jobKey.split(':')[0];
    const durationMs = getSyntheticGenerationDurationMs(count);
    const jobTotal = Math.max(1, parseTestResponseCount(count));
    const startedAt = Date.now();
    let completed = false;

    setProgress(0);
    setGeneratedCount(0);
    setRemainingMs(durationMs);

    const finish = (): void => {
      if (completed) return;
      completed = true;
      setGeneratedCount(jobTotal);
      setProgress(100);
      setRemainingMs(0);
      onCompleteRef.current(String(jobTotal));
    };

    const tick = (): void => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / durationMs);
      const eased = ratio >= 1 ? 1 : 1 - Math.pow(1 - ratio, 1.08);
      setProgress(Math.round(eased * 100));
      setGeneratedCount(
        eased >= 1 ? jobTotal : Math.max(0, Math.min(jobTotal - 1, Math.floor(eased * jobTotal)))
      );
      setRemainingMs(Math.max(0, durationMs - elapsed));
      if (ratio >= 1) finish();
    };

    tick();
    const intervalId = window.setInterval(tick, 200);
    return () => {
      completed = true;
      window.clearInterval(intervalId);
    };
  }, [jobKey]);

  if (!job) return null;

  return {
    total,
    generatedCount,
    progress,
    remainingMs,
    step: getSyntheticGenerationStep(progress),
    eta: formatGenerationTimeRemaining(remainingMs),
  };
}
