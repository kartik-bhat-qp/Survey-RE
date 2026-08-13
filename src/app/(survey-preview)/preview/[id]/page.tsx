'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaptchaSurveyQuestionPreview } from '@/components/surveys/CaptchaSurveyQuestionPreview';
import { ConjointSurveyQuestionPreview } from '@/components/surveys/ConjointSurveyQuestionPreview';
import { MultiPointCardsCarouselPreview } from '@/components/surveys/MultiPointCardsCarouselPreview';
import { DeepDiveQuestionPreview } from '@/components/surveys/DeepDiveQuestionPreview';
import { OpenEndedQuestionPreview } from '@/components/surveys/OpenEndedQuestionPreview';
import { SelectManyQuestionPreview } from '@/components/surveys/SelectManyQuestionPreview';
import { SelectOneQuestionPreview } from '@/components/surveys/SelectOneQuestionPreview';
import { SurveyPreviewAnswerProvider } from '@/components/surveys/SurveyPreviewAnswerContext';
import { SurveyQuestionPreviewChrome } from '@/components/surveys/SurveyQuestionPreviewChrome';
import { EmptyState } from '@/components/ui/EmptyState';
import { DEFAULT_MULTI_POINT_SETTINGS } from '@/data/mock-multi-point-settings';
import {
  captchaPreviewStorageKey,
  conjointPreviewStorageKey,
  deepDivePreviewStorageKey,
  multiPointPreviewStorageKey,
  openEndedPreviewStorageKey,
  readCaptchaQuestionPreviewSession,
  readConjointQuestionPreviewSession,
  readDeepDiveQuestionPreviewSession,
  readMultiPointQuestionPreviewSession,
  readOpenEndedQuestionPreviewSession,
  readSelectManyQuestionPreviewSession,
  readSelectOneQuestionPreviewSession,
  selectManyPreviewStorageKey,
  selectOnePreviewStorageKey,
  type CaptchaQuestionPreviewSession,
  type ConjointQuestionPreviewSession,
  type DeepDiveQuestionPreviewSession,
  type MultiPointQuestionPreviewSession,
  type OpenEndedQuestionPreviewSession,
  type SelectManyQuestionPreviewSession,
  type SelectOneQuestionPreviewSession,
  type SurveyQuestionPreviewKind,
} from '@/data/survey-question-preview-session';
import styles from './SurveyQuestionPreviewPage.module.css';

export default function SurveyQuestionPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const surveyId = Number(params.id);
  const previewKind = (searchParams.get('kind') ?? 'multi-point') as SurveyQuestionPreviewKind;
  const [multiPointPayload, setMultiPointPayload] =
    useState<MultiPointQuestionPreviewSession | null>(null);
  const [selectManyPayload, setSelectManyPayload] =
    useState<SelectManyQuestionPreviewSession | null>(null);
  const [selectOnePayload, setSelectOnePayload] =
    useState<SelectOneQuestionPreviewSession | null>(null);
  const [captchaPayload, setCaptchaPayload] =
    useState<CaptchaQuestionPreviewSession | null>(null);
  const [openEndedPayload, setOpenEndedPayload] =
    useState<OpenEndedQuestionPreviewSession | null>(null);
  const [deepDivePayload, setDeepDivePayload] =
    useState<DeepDiveQuestionPreviewSession | null>(null);
  const [conjointPayload, setConjointPayload] =
    useState<ConjointQuestionPreviewSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(surveyId)) {
      setReady(true);
      return;
    }

    function loadPayload(): void {
      if (previewKind === 'select-many') {
        setSelectManyPayload(readSelectManyQuestionPreviewSession(surveyId));
        setSelectOnePayload(null);
        setMultiPointPayload(null);
        setCaptchaPayload(null);
        setOpenEndedPayload(null);
      } else if (previewKind === 'select-one') {
        setSelectOnePayload(readSelectOneQuestionPreviewSession(surveyId));
        setSelectManyPayload(null);
        setMultiPointPayload(null);
        setCaptchaPayload(null);
        setOpenEndedPayload(null);
      } else if (previewKind === 'captcha') {
        setCaptchaPayload(readCaptchaQuestionPreviewSession(surveyId));
        setSelectManyPayload(null);
        setSelectOnePayload(null);
        setMultiPointPayload(null);
        setOpenEndedPayload(null);
      } else if (previewKind === 'open-ended') {
        setOpenEndedPayload(readOpenEndedQuestionPreviewSession(surveyId));
        setSelectManyPayload(null);
        setSelectOnePayload(null);
        setMultiPointPayload(null);
        setCaptchaPayload(null);
        setDeepDivePayload(null);
      } else if (previewKind === 'deepdive') {
        setDeepDivePayload(readDeepDiveQuestionPreviewSession(surveyId));
        setOpenEndedPayload(null);
        setSelectManyPayload(null);
        setSelectOnePayload(null);
        setMultiPointPayload(null);
        setCaptchaPayload(null);
        setConjointPayload(null);
      } else if (previewKind === 'conjoint') {
        setConjointPayload(readConjointQuestionPreviewSession(surveyId));
        setSelectManyPayload(null);
        setSelectOnePayload(null);
        setMultiPointPayload(null);
        setCaptchaPayload(null);
        setOpenEndedPayload(null);
        setDeepDivePayload(null);
      } else {
        setMultiPointPayload(readMultiPointQuestionPreviewSession(surveyId));
        setSelectManyPayload(null);
        setSelectOnePayload(null);
        setCaptchaPayload(null);
        setOpenEndedPayload(null);
        setDeepDivePayload(null);
        setConjointPayload(null);
      }
      setReady(true);
    }

    loadPayload();

    function onStorage(event: StorageEvent): void {
      const key =
        previewKind === 'select-many'
          ? selectManyPreviewStorageKey(surveyId)
          : previewKind === 'select-one'
            ? selectOnePreviewStorageKey(surveyId)
            : previewKind === 'captcha'
              ? captchaPreviewStorageKey(surveyId)
              : previewKind === 'open-ended'
                ? openEndedPreviewStorageKey(surveyId)
                : previewKind === 'deepdive'
                  ? deepDivePreviewStorageKey(surveyId)
                  : previewKind === 'conjoint'
                    ? conjointPreviewStorageKey(surveyId)
                    : multiPointPreviewStorageKey(surveyId);
      if (
        event.key === key ||
        event.key?.startsWith(`survey-deepdive-live-${surveyId}-`)
      ) {
        loadPayload();
      }
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', loadPayload);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', loadPayload);
    };
  }, [previewKind, surveyId]);

  if (!ready) {
    return null;
  }

  if (previewKind === 'select-many') {
    if (!selectManyPayload) {
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
        <SurveyPreviewAnswerProvider>
          <SelectManyQuestionPreview
            surveyId={selectManyPayload.surveyId}
            surveyTitle={selectManyPayload.surveyTitle}
            questionCode={selectManyPayload.questionCode ?? 'Q'}
            questionText={selectManyPayload.questionText}
            required={selectManyPayload.required}
            options={selectManyPayload.options}
            answerDisplayOrder={selectManyPayload.answerDisplayOrder}
            randomizeAnswerCount={selectManyPayload.randomizeAnswerCount}
            alternateFlipReversed={selectManyPayload.alternateFlipReversed}
            showHideOptions={selectManyPayload.showHideOptions ?? null}
            deepDiveFollowUpSettings={selectManyPayload.deepDiveFollowUpSettings ?? null}
            samePageFollowUps={selectManyPayload.samePageFollowUps ?? []}
            nextPages={selectManyPayload.nextPages ?? []}
            onDone={() => window.close()}
            onClose={() => window.close()}
          />
        </SurveyPreviewAnswerProvider>
      </SurveyQuestionPreviewChrome>
    );
  }

  if (previewKind === 'select-one') {
    if (!selectOnePayload) {
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
        <SurveyPreviewAnswerProvider>
          <SelectOneQuestionPreview
            surveyId={selectOnePayload.surveyId}
            surveyTitle={selectOnePayload.surveyTitle}
            questionCode={selectOnePayload.questionCode ?? 'Q'}
            questionText={selectOnePayload.questionText}
            required={selectOnePayload.required}
            options={selectOnePayload.options}
            answerDisplayOrder={selectOnePayload.answerDisplayOrder}
            randomizeAnswerCount={selectOnePayload.randomizeAnswerCount}
            alternateFlipReversed={selectOnePayload.alternateFlipReversed}
            showHideOptions={selectOnePayload.showHideOptions ?? null}
            deepDiveFollowUpSettings={selectOnePayload.deepDiveFollowUpSettings ?? null}
            isFirstQuestion={selectOnePayload.isFirstQuestion}
            samePageFollowUps={selectOnePayload.samePageFollowUps ?? []}
            nextPages={selectOnePayload.nextPages ?? []}
            onDone={() => window.close()}
            onClose={() => window.close()}
          />
        </SurveyPreviewAnswerProvider>
      </SurveyQuestionPreviewChrome>
    );
  }

  if (previewKind === 'captcha') {
    if (!captchaPayload) {
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
        <SurveyPreviewAnswerProvider>
          <CaptchaSurveyQuestionPreview
            surveyId={captchaPayload.surveyId}
            surveyTitle={captchaPayload.surveyTitle}
            questionCode={captchaPayload.questionCode ?? 'Q'}
            questionText={captchaPayload.questionText}
            required={captchaPayload.required}
            captchaSettings={captchaPayload.captchaSettings}
            isFirstQuestion={captchaPayload.isFirstQuestion}
            samePageFollowUps={captchaPayload.samePageFollowUps ?? []}
            nextPages={captchaPayload.nextPages ?? []}
            onDone={() => window.close()}
            onClose={() => window.close()}
          />
        </SurveyPreviewAnswerProvider>
      </SurveyQuestionPreviewChrome>
    );
  }

  if (previewKind === 'open-ended') {
    if (!openEndedPayload) {
      return (
        <div className={styles.emptyWrap}>
          <EmptyState
            icon="wm-mic"
            title="No preview available"
            description="Open preview from the question menu in the survey editor."
          />
        </div>
      );
    }

    return (
      <SurveyQuestionPreviewChrome onClose={() => window.close()}>
        <OpenEndedQuestionPreview
          session={openEndedPayload}
          onClose={() => window.close()}
        />
      </SurveyQuestionPreviewChrome>
    );
  }

  if (previewKind === 'deepdive') {
    if (!deepDivePayload) {
      return (
        <div className={styles.emptyWrap}>
          <EmptyState
            icon="wm-psychology"
            title="No DeepDive preview available"
            description="Open preview from the DeepDive question menu in the survey editor."
          />
        </div>
      );
    }

    return (
      <DeepDiveQuestionPreview
        session={deepDivePayload}
        onClose={() => window.close()}
      />
    );
  }

  if (previewKind === 'conjoint') {
    if (!conjointPayload) {
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
        <ConjointSurveyQuestionPreview
          session={conjointPayload}
          onDone={() => window.close()}
          onClose={() => window.close()}
        />
      </SurveyQuestionPreviewChrome>
    );
  }

  if (!multiPointPayload) {
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
      <SurveyPreviewAnswerProvider>
        <MultiPointCardsCarouselPreview
          surveyId={multiPointPayload.surveyId}
          surveyTitle={multiPointPayload.surveyTitle}
          questionText={multiPointPayload.questionText}
          required={multiPointPayload.required}
          matrix={multiPointPayload.matrix}
          questionWidthPercent={multiPointPayload.settings.questionWidthPercent}
          answerType={multiPointPayload.settings.answerType}
          responseLayout={
            multiPointPayload.settings.cardsCarouselResponseLayout ??
            DEFAULT_MULTI_POINT_SETTINGS.cardsCarouselResponseLayout
          }
          samePageFollowUps={multiPointPayload.samePageFollowUps ?? []}
          nextPages={multiPointPayload.nextPages ?? []}
          onDone={() => window.close()}
          onClose={() => window.close()}
        />
      </SurveyPreviewAnswerProvider>
    </SurveyQuestionPreviewChrome>
  );
}
