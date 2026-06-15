'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  buildExtractionOptionTargets,
  EXTRACTION_SOURCE_OPTIONS,
  findBranchTargetOption,
  type ExtractionLogicState,
  type ExtractionSource,
} from '@/data/mock-question-logic';
import { ExtractionQuestionTypeSelect } from '@/components/surveys/ExtractionQuestionTypeSelect';
import { OptionMultiSelect } from '@/components/surveys/OptionMultiSelect';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import styles from './ExtractionLogicPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

interface ExtractionLogicPanelProps {
  question: SurveyQuestion;
  state: ExtractionLogicState;
  onChange: (next: ExtractionLogicState) => void;
}

export function ExtractionLogicPanel({
  question,
  state,
  onChange,
}: ExtractionLogicPanelProps) {
  const optionTargets = useMemo(
    () =>
      buildExtractionOptionTargets(
        question.options.map((option) => ({
          id: option.id,
          label: plainTextFromRichValue(option.label),
        }))
      ),
    [question.options]
  );

  const selectedExtractSource =
    findBranchTargetOption(EXTRACTION_SOURCE_OPTIONS, state.extractSource) ??
    EXTRACTION_SOURCE_OPTIONS[0];

  return (
    <div className={styles.panel}>
      <div className={styles.extractRow}>
        <span className={styles.rowLabel}>Extract</span>
        <div className={styles.selectField}>
          <WuSelect
            data={EXTRACTION_SOURCE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedExtractSource}
            onSelect={(item) => {
              const next = item as { value: string; label: string } | null;
              if (!next) return;
              onChange({ ...state, extractSource: next.value as ExtractionSource });
            }}
            variant="outlined"
          />
        </div>
        <span className={styles.rowLabel}>to question type</span>
        <div className={styles.selectField}>
          <ExtractionQuestionTypeSelect
            value={state.questionType}
            onChange={(questionType) => onChange({ ...state, questionType })}
          />
        </div>
        <p className={styles.hint}>
          The extracted question type will be automatically added
        </p>
      </div>

      <div className={styles.choiceRow}>
        <div className={styles.choiceField}>
          <span className={styles.rowLabel}>Always Extract:</span>
          <div className={styles.selectFieldWide}>
            <OptionMultiSelect
              options={optionTargets}
              value={state.alwaysExtractOptionId}
              onChange={(alwaysExtractOptionId) =>
                onChange({ ...state, alwaysExtractOptionId })
              }
              triggerClassName={styles.menuTrigger}
              placeholder="- Select -"
            />
          </div>
        </div>
        <div className={styles.choiceField}>
          <span className={styles.rowLabel}>Never Extract:</span>
          <div className={styles.selectFieldWide}>
            <OptionMultiSelect
              options={optionTargets}
              value={state.neverExtractOptionId}
              onChange={(neverExtractOptionId) =>
                onChange({ ...state, neverExtractOptionId })
              }
              triggerClassName={styles.menuTrigger}
              placeholder="- Select -"
            />
          </div>
        </div>
      </div>

      <div className={styles.lockedRow}>
        <WuToggle
          Label="Locked Extraction"
          labelPosition="left"
          checked={state.lockedExtraction}
          onChange={(checked) => onChange({ ...state, lockedExtraction: checked })}
        />
      </div>
    </div>
  );
}
