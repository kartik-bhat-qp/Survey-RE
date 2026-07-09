'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import type { SurveyQuestionInputKind } from '@/data/mock-survey-detail';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { useSurveyPreviewAnswers } from '@/components/surveys/SurveyPreviewAnswerContext';
import {
  DeepDiveFollowUpCardActive,
  DeepDiveFollowUpCardSummary,
} from '@/components/surveys/DeepDiveFollowUpCard';
import { useDeepDiveFollowUpThread } from '@/components/surveys/useDeepDiveFollowUpThread';
import type { DeepDiveFollowUpSettings } from '@/data/mock-deepdive-question-settings';
import { labelsForOptionIds } from '@/data/evaluate-preview-criteria';
import styles from './SurveyPreviewOptionsBlock.module.css';

export interface SurveyPreviewOptionsBlockProps {
  questionCode: string;
  options: { id: string; label: string }[];
  inputKind: SurveyQuestionInputKind;
  groupName?: string;
  deepDiveFollowUpSettings?: DeepDiveFollowUpSettings | null;
}

export function SurveyPreviewOptionsBlock({
  questionCode,
  options,
  inputKind,
  groupName,
  deepDiveFollowUpSettings = null,
}: SurveyPreviewOptionsBlockProps) {
  const { setAnswer } = useSurveyPreviewAnswers();
  const isMultiSelect = inputKind === 'checkbox';
  const inputType = isMultiSelect ? 'checkbox' : 'radio';
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const deepDiveEnabled = Boolean(deepDiveFollowUpSettings?.enabled);
  const { state, startThread, resetThread, submitReply, skipThread, toggleExpanded } =
    useDeepDiveFollowUpThread(deepDiveFollowUpSettings);

  useEffect(() => {
    const nextSelectedIds = isMultiSelect
      ? selectedOptionIds
      : selectedOptionId
        ? [selectedOptionId]
        : [];

    setAnswer(questionCode, {
      selectedOptionIds: nextSelectedIds,
      selectedLabels: labelsForOptionIds(options, nextSelectedIds),
    });
  }, [isMultiSelect, options, questionCode, selectedOptionId, selectedOptionIds, setAnswer]);

  function isChecked(optionId: string): boolean {
    return isMultiSelect
      ? selectedOptionIds.includes(optionId)
      : selectedOptionId === optionId;
  }

  function optionLabel(optionId: string): string {
    const option = options.find((item) => item.id === optionId);
    return option ? plainTextFromRichValue(option.label) : '';
  }

  function handleDeepDiveTrigger(optionId: string, nextChecked: boolean): void {
    if (!deepDiveEnabled) return;

    if (!nextChecked) {
      if (state.triggerOptionId === optionId) {
        resetThread();
      }
      return;
    }

    if (state.triggerOptionId === optionId && state.phase !== 'idle') {
      return;
    }

    startThread(optionId, optionLabel(optionId));
  }

  function handleChange(optionId: string): void {
    if (isMultiSelect) {
      const wasChecked = selectedOptionIds.includes(optionId);
      const nextChecked = !wasChecked;

      setSelectedOptionIds((prev) =>
        wasChecked ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
      handleDeepDiveTrigger(optionId, nextChecked);
      return;
    }

    setSelectedOptionId(optionId);
    handleDeepDiveTrigger(optionId, true);
  }

  function renderDeepDiveAfterOption(optionId: string): ReactNode {
    if (state.triggerOptionId !== optionId) return null;

    if (state.phase === 'active' && state.currentQuestion && state.progressTotal > 0) {
      return (
        <li className={styles.deepDiveSlot} aria-live="polite">
          <DeepDiveFollowUpCardActive
            progressCurrent={state.progressCurrent}
            progressTotal={state.progressTotal}
            priorAnswerQuote={state.priorAnswerQuote}
            questionText={state.currentQuestion}
            onSubmit={submitReply}
            onSkip={skipThread}
          />
        </li>
      );
    }

    if (state.phase === 'collapsed' && state.summaryLabel) {
      return (
        <li className={styles.deepDiveSlot}>
          <DeepDiveFollowUpCardSummary
            summaryLabel={state.summaryLabel}
            replies={state.replies}
            isExpanded={state.isExpanded}
            onToggle={toggleExpanded}
          />
        </li>
      );
    }

    return null;
  }

  return (
    <ul className={styles.optionList}>
      {options.map((option) => (
        <Fragment key={option.id}>
          <li className={styles.optionItem}>
            <label className={styles.optionLabel}>
              <input
                type={inputType}
                className={styles.optionInput}
                {...(isMultiSelect || !groupName ? {} : { name: groupName })}
                checked={isChecked(option.id)}
                onChange={() => handleChange(option.id)}
              />
              <span>{plainTextFromRichValue(option.label)}</span>
            </label>
          </li>
          {renderDeepDiveAfterOption(option.id)}
        </Fragment>
      ))}
    </ul>
  );
}
