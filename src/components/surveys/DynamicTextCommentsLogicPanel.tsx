'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  DYNAMIC_TEXT_BOX_STATUS_OPTIONS,
  findBranchTargetOption,
  type DynamicTextCommentsState,
  type DynamicTextBoxStatus,
} from '@/data/mock-question-logic';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
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
}

export function DynamicTextCommentsLogicPanel({
  question,
  state,
  onChange,
  onReset,
  canReset,
}: DynamicTextCommentsLogicPanelProps) {
  const { showToast } = useWuShowToast();

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

  return (
    <div className={styles.panel}>
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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Answer options</th>
              <th>Dynamic Text Box</th>
            </tr>
          </thead>
          <tbody>
            {question.options.map((option) => {
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
                    <span className={styles.optionLabel}>
                      {plainTextFromRichValue(option.label)}
                    </span>
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
                          placeholder="Please enter a label name"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            updateOption(option.id, { labelName: event.target.value })
                          }
                          className={styles.labelInput}
                          aria-label={`Label name for ${plainTextFromRichValue(option.label)}`}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
