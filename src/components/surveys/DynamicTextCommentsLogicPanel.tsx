'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  DYNAMIC_TEXT_BOX_STATUS_OPTIONS,
  DYNAMIC_TEXT_MATRIX_LABEL_PLACEHOLDER,
  findBranchTargetOption,
  getDynamicTextTargetGroups,
  isMatrixDynamicTextQuestion,
  type DynamicTextCommentsState,
  type DynamicTextBoxStatus,
} from '@/data/mock-question-logic';
import {
  DYNAMIC_TEXT_CARDS_CAROUSEL_CONFLICT_MESSAGE,
  DYNAMIC_TEXT_SWITCH_TO_MATRIX_LABEL,
} from '@/data/mock-multi-point-settings';
import styles from './DynamicTextCommentsLogicPanel.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface DynamicTextCommentsLogicPanelProps {
  question: SurveyQuestion;
  state: DynamicTextCommentsState;
  onChange: (next: DynamicTextCommentsState) => void;
  onReset: () => void;
  canReset: boolean;
  /** When true, Save is gated until layout is Matrix (mutual with Cards carousel). */
  cardsCarouselEnabled?: boolean;
  onSwitchToMatrixLayout?: () => void;
}

export function DynamicTextCommentsLogicPanel({
  question,
  state,
  onChange,
  onReset,
  canReset,
  cardsCarouselEnabled = false,
  onSwitchToMatrixLayout,
}: DynamicTextCommentsLogicPanelProps) {
  const { showToast } = useWuShowToast();
  const isMatrix = isMatrixDynamicTextQuestion(question);
  const groups = getDynamicTextTargetGroups(question);
  const labelPlaceholder = isMatrix
    ? DYNAMIC_TEXT_MATRIX_LABEL_PLACEHOLDER
    : 'Please enter a label name';

  function updateOption(
    optionId: string,
    patch: Partial<{ status: DynamicTextBoxStatus; labelName: string }>
  ) {
    const current = state.byOptionId[optionId] ?? { status: 'disabled' as const, labelName: '' };
    onChange({
      ...state,
      byOptionId: {
        ...state.byOptionId,
        [optionId]: { ...current, ...patch },
      },
    });
  }

  function handleAiSubmit() {
    const prompt = state.aiPrompt.trim();
    if (!prompt) return;
    showToast({
      message: 'QuestionPro AI logic generation is not available in this prototype',
      variant: 'info',
    });
  }

  function handleAiPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAiSubmit();
    }
  }

  function renderOptionRow(option: { id: string; label: string }) {
    const row = state.byOptionId[option.id] ?? {
      status: 'disabled' as DynamicTextBoxStatus,
      labelName: '',
    };
    const selectedStatus =
      findBranchTargetOption(DYNAMIC_TEXT_BOX_STATUS_OPTIONS, row.status) ??
      DYNAMIC_TEXT_BOX_STATUS_OPTIONS[1];
    const isEnabled = row.status === 'enabled';

    return (
      <tr key={option.id}>
        <td>
          <span className={styles.optionLabel}>{option.label}</span>
        </td>
        <td>
          <div className={styles.dynamicTextCell}>
            <div className={styles.statusSelect}>
              <WuSelect
                data={DYNAMIC_TEXT_BOX_STATUS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedStatus}
                onSelect={(item) => {
                  const next = item as { value: string; label: string } | null;
                  if (!next) return;
                  updateOption(option.id, {
                    status: next.value as DynamicTextBoxStatus,
                  });
                }}
                variant="outlined"
              />
            </div>
            {isEnabled ? (
              <WuInput
                variant="outlined"
                value={row.labelName}
                placeholder={labelPlaceholder}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateOption(option.id, { labelName: event.target.value })
                }
                className={styles.labelInput}
                aria-label={`Label name for ${option.label}`}
              />
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className={styles.panel}>
      {cardsCarouselEnabled ? (
        <div className={styles.conflictBanner} role="status">
          {DYNAMIC_TEXT_CARDS_CAROUSEL_CONFLICT_MESSAGE}{' '}
          {onSwitchToMatrixLayout ? (
            <button
              type="button"
              className={styles.conflictLink}
              onClick={onSwitchToMatrixLayout}
            >
              {DYNAMIC_TEXT_SWITCH_TO_MATRIX_LABEL}
            </button>
          ) : (
            <span>{DYNAMIC_TEXT_SWITCH_TO_MATRIX_LABEL}</span>
          )}
          .
        </div>
      ) : null}

      {!isMatrix ? (
        <div className={styles.aiSection}>
          <div className={styles.aiInputWrap}>
            <textarea
              className={styles.aiInput}
              rows={3}
              value={state.aiPrompt}
              placeholder="Type in your logic and run QuestionPro AI magic!"
              aria-label="Type in your logic and run QuestionPro AI magic"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                onChange({ ...state, aiPrompt: event.target.value })
              }
              onKeyDown={handleAiPromptKeyDown}
            />
            <button
              type="button"
              className={styles.aiSendBtn}
              aria-label="Run QuestionPro AI"
              title="Run QuestionPro AI"
              disabled={!state.aiPrompt.trim()}
              onClick={handleAiSubmit}
            >
              <span className="wm-send" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        {isMatrix ? (
          <div className={styles.matrixGroups}>
            {groups.map((group) => (
              <table key={group.id} className={styles.table}>
                <thead>
                  <tr>
                    <th>Answer options {group.label}</th>
                    <th>Dynamic Text Box</th>
                  </tr>
                </thead>
                <tbody>{group.options.map((option) => renderOptionRow(option))}</tbody>
              </table>
            ))}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Answer options</th>
                <th>Dynamic Text Box</th>
              </tr>
            </thead>
            <tbody>
              {groups[0]?.options.map((option) => renderOptionRow(option))}
            </tbody>
          </table>
        )}
      </div>

      {canReset ? (
        <div className={styles.resetRow}>
          <button type="button" className={styles.resetLink} onClick={onReset}>
            Reset Logic
          </button>
        </div>
      ) : null}
    </div>
  );
}
