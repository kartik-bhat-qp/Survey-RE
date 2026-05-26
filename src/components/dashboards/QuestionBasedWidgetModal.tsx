'use client';

import { useCallback, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { WickUILib } from '@/components/ui/useWickUILib';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import {
  AddWidgetStepBreadcrumb,
  type AddWidgetStep,
} from '@/components/dashboards/AddWidgetStepBreadcrumb';
import { QuestionBasedChartSelect } from '@/components/dashboards/QuestionBasedChartSelect';
import { QuestionBasedMatrixChartSelect } from '@/components/dashboards/QuestionBasedMatrixChartSelect';
import { WidgetQuestionSelection } from '@/components/dashboards/WidgetQuestionSelection';
import {
  DEFAULT_MATRIX_CHART_TYPE_ID,
  MATRIX_CHART_TYPES,
  type MatrixChartTypeId,
} from '@/data/mock-matrix-chart-types';
import {
  DEFAULT_SINGLE_SELECT_CHART_TYPE_ID,
  SINGLE_SELECT_CHART_TYPES,
  type SingleSelectChartTypeId,
} from '@/data/mock-single-select-chart-types';
import {
  resolvePickerSelection,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './QuestionBasedWidgetModal.module.css';

type ModalStep = 'survey' | 'question' | 'chart';

function usesMatrixWholeChartStep(
  question: SurveyQuestion,
  rowLabel: string | null | undefined
): boolean {
  return question.type === 'Matrix Uni choice' && !rowLabel;
}

function usesSingleSelectChartStep(
  question: SurveyQuestion,
  rowLabel: string | null | undefined
): boolean {
  return (
    question.type === 'Single Select' ||
    (question.type === 'Matrix Uni choice' && Boolean(rowLabel))
  );
}

interface QuestionBasedWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, opens directly on the question list for this survey. */
  presetSurvey?: SurveyListItem | null;
  onAddWidget?: (survey: SurveyListItem, question: SurveyQuestion) => void;
}

interface QuestionBasedWidgetModalBodyProps {
  wick: WickUILib;
  presetSurvey: SurveyListItem | null;
  startAtQuestionStep: boolean;
  onClose: () => void;
  onAddWidget?: (survey: SurveyListItem, question: SurveyQuestion) => void;
}

function QuestionBasedWidgetModalBody({
  wick,
  presetSurvey,
  startAtQuestionStep,
  onClose,
  onAddWidget,
}: QuestionBasedWidgetModalBodyProps) {
  const { WuModalContent, WuModalFooter, WuButton } = wick;
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<ModalStep>(
    startAtQuestionStep && presetSurvey ? 'question' : 'survey'
  );
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(
    startAtQuestionStep ? presetSurvey : null
  );
  const [selectedQuestion, setSelectedQuestion] = useState<SurveyQuestion | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [selectedChartTypeId, setSelectedChartTypeId] = useState<SingleSelectChartTypeId>(
    DEFAULT_SINGLE_SELECT_CHART_TYPE_ID
  );
  const [selectedMatrixChartTypeId, setSelectedMatrixChartTypeId] =
    useState<MatrixChartTypeId>(DEFAULT_MATRIX_CHART_TYPE_ID);
  const [selectedMatrixRowLabel, setSelectedMatrixRowLabel] = useState<string | null>(null);

  function handleSurveySelect(survey: SurveyListItem): void {
    setSelectedSurvey(survey);
    setSelectedQuestion(null);
    setStep('question');
  }

  function handleQuestionSelect(question: SurveyQuestion): void {
    if (!selectedSurvey) return;

    const { question: resolved, rowLabel } = resolvePickerSelection(question);

    if (usesMatrixWholeChartStep(resolved, rowLabel)) {
      setSelectedQuestion(resolved);
      setSelectedMatrixRowLabel(null);
      setWidgetName(resolved.text);
      setSelectedMatrixChartTypeId(DEFAULT_MATRIX_CHART_TYPE_ID);
      setStep('chart');
      return;
    }

    if (usesSingleSelectChartStep(resolved, rowLabel)) {
      setSelectedQuestion(resolved);
      setSelectedMatrixRowLabel(rowLabel ?? null);
      setWidgetName(rowLabel ?? resolved.text);
      setSelectedChartTypeId(DEFAULT_SINGLE_SELECT_CHART_TYPE_ID);
      setStep('chart');
      return;
    }

    setSelectedQuestion(resolved);
    const label = rowLabel
      ? `${resolved.code}: ${resolved.text} (${rowLabel})`
      : `${resolved.code}: ${resolved.text}`;
    onAddWidget?.(selectedSurvey, resolved);
    showToast({
      message: `Selected ${label}`,
      variant: 'success',
    });
  }

  function handleAddWidget(): void {
    if (!selectedSurvey || !selectedQuestion) return;
    const name = widgetName.trim() || selectedMatrixRowLabel || selectedQuestion.text;
    const isMatrixWhole =
      selectedQuestion.type === 'Matrix Uni choice' && !selectedMatrixRowLabel;
    const chartName = isMatrixWhole
      ? (MATRIX_CHART_TYPES.find((t) => t.id === selectedMatrixChartTypeId)?.name ??
        'Matrix stackbar')
      : (SINGLE_SELECT_CHART_TYPES.find((t) => t.id === selectedChartTypeId)?.name ?? 'Bar');
    onAddWidget?.(selectedSurvey, selectedQuestion);
    showToast({
      message: `Widget "${name}" (${chartName}) added to dashboard`,
      variant: 'success',
    });
    onClose();
  }

  function handleBreadcrumbClick(target: AddWidgetStep): void {
    if (target === 'widget') {
      onClose();
      return;
    }
    if (target === 'survey') {
      setStep('survey');
      setSelectedQuestion(null);
      setSelectedMatrixRowLabel(null);
    }
    if (target === 'question') {
      setStep('question');
      setSelectedMatrixRowLabel(null);
    }
  }

  const breadcrumbStep: AddWidgetStep =
    step === 'survey' ? 'survey' : step === 'question' ? 'question' : 'chart';
  const cameFromPresetSurvey = startAtQuestionStep && presetSurvey !== null;
  const showMatrixChartStep =
    step === 'chart' &&
    selectedQuestion?.type === 'Matrix Uni choice' &&
    !selectedMatrixRowLabel;

  return (
    <>
      <WuModalContent className={styles.stepContent}>
        {step === 'survey' && (
          <AiDataSourceSelection
            selectedSurveyId={selectedSurvey?.id ?? null}
            onSelectSurvey={handleSurveySelect}
          />
        )}
        {step === 'question' && selectedSurvey && (
          <WidgetQuestionSelection
            surveyId={selectedSurvey.id}
            selectedQuestionId={selectedQuestion?.id ?? null}
            onSelectQuestion={handleQuestionSelect}
          />
        )}
        {step === 'chart' && selectedQuestion && showMatrixChartStep ? (
          <QuestionBasedMatrixChartSelect
            question={selectedQuestion}
            widgetName={widgetName}
            selectedChartTypeId={selectedMatrixChartTypeId}
            onWidgetNameChange={setWidgetName}
            onSelectChartType={setSelectedMatrixChartTypeId}
          />
        ) : null}
        {step === 'chart' && selectedQuestion && !showMatrixChartStep ? (
          <QuestionBasedChartSelect
            question={selectedQuestion}
            matrixRowLabel={selectedMatrixRowLabel}
            widgetName={widgetName}
            selectedChartTypeId={selectedChartTypeId}
            onWidgetNameChange={setWidgetName}
            onSelectChartType={setSelectedChartTypeId}
          />
        ) : null}
      </WuModalContent>

      <WuModalFooter>
        <div className={styles.wizardFooter}>
          <AddWidgetStepBreadcrumb
            currentStep={breadcrumbStep}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.wizardActions}>
            {step === 'chart' ? (
              <>
                <WuButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedMatrixRowLabel(null);
                    setStep('question');
                  }}
                >
                  Back
                </WuButton>
                <WuButton onClick={handleAddWidget}>Add widget</WuButton>
              </>
            ) : step === 'question' ? (
              <WuButton
                variant="secondary"
                onClick={() => {
                  if (cameFromPresetSurvey) {
                    onClose();
                  } else {
                    setStep('survey');
                  }
                }}
              >
                Back
              </WuButton>
            ) : (
              <WuButton variant="secondary" onClick={onClose}>
                Cancel
              </WuButton>
            )}
          </div>
        </div>
      </WuModalFooter>
    </>
  );
}

export function QuestionBasedWidgetModal({
  open,
  onOpenChange,
  presetSurvey = null,
  onAddWidget,
}: QuestionBasedWidgetModalProps) {
  const wick = useWickUILib();
  const startAtQuestionStep = presetSurvey !== null;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  function handleClose(): void {
    handleOpenChange(false);
  }

  const bodyKey = startAtQuestionStep
    ? `questions-${presetSurvey?.id ?? 'preset'}`
    : 'survey-picker';

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modalWide}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Add widget</WuModalHeader>

      <QuestionBasedWidgetModalBody
        key={bodyKey}
        wick={wick}
        presetSurvey={presetSurvey}
        startAtQuestionStep={startAtQuestionStep}
        onClose={handleClose}
        onAddWidget={onAddWidget}
      />
    </WuModal>
  );
}
