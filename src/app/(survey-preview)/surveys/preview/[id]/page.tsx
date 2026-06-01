'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MultiPointCardsCarouselPreview } from '@/components/surveys/MultiPointCardsCarouselPreview';
import { SurveyQuestionPreviewChrome } from '@/components/surveys/SurveyQuestionPreviewChrome';
import { EmptyState } from '@/components/ui/EmptyState';
import { DEFAULT_MULTI_POINT_SETTINGS } from '@/data/mock-multi-point-settings';
import {
  multiPointPreviewStorageKey,
  readMultiPointQuestionPreviewSession,
  type MultiPointQuestionPreviewSession,
} from '@/data/survey-question-preview-session';
import styles from './SurveyQuestionPreviewPage.module.css';

export default function SurveyQuestionPreviewPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const [payload, setPayload] = useState<MultiPointQuestionPreviewSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(surveyId)) {
      setReady(true);
      return;
    }

    function loadPayload(): void {
      setPayload(readMultiPointQuestionPreviewSession(surveyId));
      setReady(true);
    }

    loadPayload();

    function onStorage(event: StorageEvent): void {
      if (event.key === multiPointPreviewStorageKey(surveyId)) {
        loadPayload();
      }
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', loadPayload);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', loadPayload);
    };
  }, [surveyId]);

  if (!ready) {
    return null;
  }

  if (!payload) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          icon="wm-visibility"
          title="No preview available"
          description="Open preview from the question menu in the survey editor."
        />
      </div>
    );
  }

  return (
    <SurveyQuestionPreviewChrome onClose={() => window.close()}>
      <MultiPointCardsCarouselPreview
        surveyTitle={payload.surveyTitle}
        questionText={payload.questionText}
        required={payload.required}
        matrix={payload.matrix}
        questionWidthPercent={payload.settings.questionWidthPercent}
        answerType={payload.settings.answerType}
        responseLayout={
          payload.settings.cardsCarouselResponseLayout ??
          DEFAULT_MULTI_POINT_SETTINGS.cardsCarouselResponseLayout
        }
        questionBelow={payload.questionBelow ?? null}
        onDone={() => window.close()}
        onClose={() => window.close()}
      />
    </SurveyQuestionPreviewChrome>
  );
}
