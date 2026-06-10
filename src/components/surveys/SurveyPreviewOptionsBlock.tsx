'use client';

import { useEffect, useState } from 'react';
import type { SurveyQuestionInputKind } from '@/data/mock-survey-detail';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { useSurveyPreviewAnswers } from '@/components/surveys/SurveyPreviewAnswerContext';
import { labelsForOptionIds } from '@/data/evaluate-preview-criteria';
import styles from './SurveyPreviewOptionsBlock.module.css';

export interface SurveyPreviewOptionsBlockProps {
  questionCode: string;
  options: { id: string; label: string }[];
  inputKind: SurveyQuestionInputKind;
  groupName?: string;
}

export function SurveyPreviewOptionsBlock({
  questionCode,
  options,
  inputKind,
  groupName,
}: SurveyPreviewOptionsBlockProps) {
  const { setAnswer } = useSurveyPreviewAnswers();
  const isMultiSelect = inputKind === 'checkbox';
  const inputType = isMultiSelect ? 'checkbox' : 'radio';
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

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

  function handleChange(optionId: string): void {
    if (isMultiSelect) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
      return;
    }

    setSelectedOptionId(optionId);
  }

  return (
    <ul className={styles.optionList}>
      {options.map((option) => (
        <li key={option.id} className={styles.optionItem}>
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
      ))}
    </ul>
  );
}
