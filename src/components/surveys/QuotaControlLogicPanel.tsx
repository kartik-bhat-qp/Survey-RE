'use client';

import type { ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  findBranchTargetOption,
  QUOTA_OVER_LIMIT_ACTION_OPTIONS,
  type QuotaControlState,
  type QuotaOverLimitAction,
} from '@/data/mock-question-logic';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import styles from './QuotaControlLogicPanel.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface QuotaControlLogicPanelProps {
  question: SurveyQuestion;
  state: QuotaControlState;
  onChange: (next: QuotaControlState) => void;
}

function parseQuotaLimit(value: string): number {
  const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function QuotaControlLogicPanel({
  question,
  state,
  onChange,
}: QuotaControlLogicPanelProps) {
  function updateOption(
    optionId: string,
    patch: Partial<{ quotaLimit: number; overLimitAction: QuotaOverLimitAction }>
  ) {
    const current = state.byOptionId[optionId] ?? {
      quotaLimit: 0,
      overLimitAction: 'none' as QuotaOverLimitAction,
    };
    onChange({
      byOptionId: {
        ...state.byOptionId,
        [optionId]: { ...current, ...patch },
      },
    });
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Answer options</th>
            <th>Quota Limit</th>
            <th>If over limit: jump to</th>
          </tr>
        </thead>
        <tbody>
          {question.options.map((option) => {
            const row = state.byOptionId[option.id] ?? {
              quotaLimit: 0,
              overLimitAction: 'none' as QuotaOverLimitAction,
            };
            const selectedAction =
              findBranchTargetOption(QUOTA_OVER_LIMIT_ACTION_OPTIONS, row.overLimitAction) ??
              QUOTA_OVER_LIMIT_ACTION_OPTIONS[0];

            return (
              <tr key={option.id}>
                <td>
                  <span className={styles.optionLabel}>
                    {plainTextFromRichValue(option.label)}
                  </span>
                </td>
                <td>
                  <WuInput
                    variant="outlined"
                    value={String(row.quotaLimit)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateOption(option.id, {
                        quotaLimit: parseQuotaLimit(event.target.value),
                      })
                    }
                    className={styles.quotaInput}
                    aria-label={`Quota limit for ${plainTextFromRichValue(option.label)}`}
                  />
                </td>
                <td>
                  <div className={styles.actionSelect}>
                    <WuSelect
                      data={QUOTA_OVER_LIMIT_ACTION_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedAction}
                      onSelect={(item) => {
                        const next = item as { value: string; label: string } | null;
                        if (!next) return;
                        updateOption(option.id, {
                          overLimitAction: next.value as QuotaOverLimitAction,
                        });
                      }}
                      variant="outlined"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
