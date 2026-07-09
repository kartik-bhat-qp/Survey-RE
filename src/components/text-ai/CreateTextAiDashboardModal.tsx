'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  TextAiCreateDashboardStepBreadcrumb,
  type TextAiCreateStep,
} from '@/components/text-ai/TextAiCreateDashboardStepBreadcrumb';
import {
  TextAiModelSetupForm,
  createDefaultModelSetupValues,
  type TextAiModelSetupValues,
} from '@/components/text-ai/TextAiModelSetupForm';
import { TextAiQuestionSelection } from '@/components/text-ai/TextAiQuestionSelection';
import { TextAiSegmentFilterForm } from '@/components/text-ai/TextAiSegmentFilterForm';
import { TextAiSurveySelection } from '@/components/text-ai/TextAiSurveySelection';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getDefaultSelectedTextAiQuestionIds } from '@/data/mock-text-ai-questions';
import {
  createDefaultSegmentFilterState,
  type TextAiSegmentFilterState,
} from '@/data/mock-text-ai-segment-filters';
import type { TextAiDashboardCreatePayload } from '@/data/text-ai-dashboard-create';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import modalStyles from '@/components/dashboards/CreateDashboardModal.module.css';
import styles from './CreateTextAiDashboardModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const TEXT_AI_CREATE_STEP_ORDER: TextAiCreateStep[] = [
  'survey',
  'model-setup',
  'segment',
  'select-questions',
];

interface CreateTextAiDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onCreate: (payload: TextAiDashboardCreatePayload) => void;
}

export function CreateTextAiDashboardModal({
  open,
  onOpenChange,
  defaultName,
  onCreate,
}: CreateTextAiDashboardModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<TextAiCreateStep>('survey');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);
  const [modelSetup, setModelSetup] = useState<TextAiModelSetupValues>(() =>
    createDefaultModelSetupValues(defaultName)
  );
  const [nameError, setNameError] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(() =>
    getDefaultSelectedTextAiQuestionIds()
  );
  const [separateDashboardPerQuestion, setSeparateDashboardPerQuestion] = useState(false);
  const [segmentFilters, setSegmentFilters] = useState<TextAiSegmentFilterState>(() =>
    createDefaultSegmentFilterState()
  );

  const resetWizard = useCallback(() => {
    setStep('survey');
    setSelectedSurvey(null);
    setModelSetup(createDefaultModelSetupValues(defaultName));
    setNameError(false);
    setSelectedQuestionIds(getDefaultSelectedTextAiQuestionIds());
    setSeparateDashboardPerQuestion(false);
    setSegmentFilters(createDefaultSegmentFilterState());
  }, [defaultName]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetWizard();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetWizard]
  );

  function getTrimmedName(): string {
    return modelSetup.name.trim();
  }

  function handleModelSetupNext(): void {
    if (!getTrimmedName()) {
      setNameError(true);
      showToast({ message: 'Dashboard name is required', variant: 'error' });
      return;
    }
    setNameError(false);
    setStep('segment');
  }

  function handleSegmentNext(): void {
    setStep('select-questions');
  }

  function handleFinish(): void {
    if (!selectedSurvey || !getTrimmedName()) return;
    if (selectedQuestionIds.length === 0) {
      showToast({ message: 'Select at least one question', variant: 'error' });
      return;
    }
    onCreate({
      name: getTrimmedName(),
      survey: selectedSurvey,
      questionIds: selectedQuestionIds,
      separateDashboardPerQuestion:
        separateDashboardPerQuestion && selectedQuestionIds.length > 1,
      expertReviewRequested: modelSetup.expertReviewRequested,
      segmentFilters,
    });
    handleOpenChange(false);
  }

  function handleBack(): void {
    if (step === 'survey') {
      handleOpenChange(false);
      return;
    }
    if (step === 'model-setup') {
      setStep('survey');
      return;
    }
    if (step === 'segment') {
      setStep('model-setup');
      return;
    }
    if (step === 'select-questions') {
      setStep('segment');
    }
  }

  function handleBreadcrumbClick(target: TextAiCreateStep): void {
    const currentIndex = TEXT_AI_CREATE_STEP_ORDER.indexOf(step);
    const targetIndex = TEXT_AI_CREATE_STEP_ORDER.indexOf(target);
    if (targetIndex >= 0 && targetIndex < currentIndex) {
      setStep(target);
    }
  }

  function handleSurveySelect(survey: SurveyListItem): void {
    setSelectedSurvey(survey);
    setModelSetup((prev) =>
      prev.name.trim() ? prev : createDefaultModelSetupValues(defaultName)
    );
    setStep('model-setup');
  }

  const createDashboardCount =
    separateDashboardPerQuestion && selectedQuestionIds.length > 1
      ? selectedQuestionIds.length
      : 1;
  const createButtonLabel =
    createDashboardCount > 1 ? `Create ${createDashboardCount} dashboards` : 'Create';

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const modalTitle =
    step === 'segment'
      ? 'Filter the data you want to analyze'
      : step === 'model-setup' || step === 'select-questions'
        ? 'Create TextAI dashboard'
        : 'Create dashboard';

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={modalStyles.modalWide}
      variant="action"
    >
      <WuModalHeader className={modalStyles.modalTitle}>{modalTitle}</WuModalHeader>

      {step === 'survey' && (
        <WuModalContent className={modalStyles.surveyContent}>
          <TextAiSurveySelection
            selectedSurveyId={selectedSurvey?.id ?? null}
            onSelectSurvey={handleSurveySelect}
          />
        </WuModalContent>
      )}

      {step === 'model-setup' && (
        <WuModalContent className={styles.modelSetupContent}>
          <TextAiModelSetupForm
            values={modelSetup}
            namePlaceholder={defaultName}
            nameError={nameError}
            onChange={(values) => {
              if (nameError && values.name.trim()) setNameError(false);
              setModelSetup(values);
            }}
          />
        </WuModalContent>
      )}

      {step === 'select-questions' && (
        <WuModalContent className={styles.questionSelectionContent}>
          <TextAiQuestionSelection
            selectedQuestionIds={selectedQuestionIds}
            onSelectionChange={setSelectedQuestionIds}
            separateDashboardPerQuestion={separateDashboardPerQuestion}
            onSeparateDashboardPerQuestionChange={setSeparateDashboardPerQuestion}
          />
        </WuModalContent>
      )}

      {step === 'segment' && (
        <WuModalContent className={styles.segmentFilterContent}>
          <TextAiSegmentFilterForm values={segmentFilters} onChange={setSegmentFilters} />
        </WuModalContent>
      )}

      <WuModalFooter>
        <div className={modalStyles.wizardFooter}>
          <TextAiCreateDashboardStepBreadcrumb
            currentStep={step}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={modalStyles.wizardActions}>
            {step !== 'survey' || selectedSurvey ? (
              <>
                <WuButton
                  variant="secondary"
                  onClick={handleBack}
                  className={styles.backBtn}
                >
                  Back
                </WuButton>
                {step === 'model-setup' && (
                  <WuButton onClick={handleModelSetupNext}>Next</WuButton>
                )}
                {step === 'segment' && (
                  <WuButton onClick={handleSegmentNext}>Next</WuButton>
                )}
                {step === 'select-questions' && (
                  <WuButton onClick={handleFinish}>{createButtonLabel}</WuButton>
                )}
              </>
            ) : (
              <WuButton variant="secondary" onClick={handleBack} className={styles.backBtn}>
                Back
              </WuButton>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
