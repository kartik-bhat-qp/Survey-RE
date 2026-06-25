'use client';

import dynamic from 'next/dynamic';
import {
  DEFAULT_TEXT_AI_OUTPUT_LANGUAGE,
  TEXT_AI_CODEBOOK_OPTIONS,
  TEXT_AI_EXPERT_REVIEW_DESCRIPTION,
  TEXT_AI_EXPERT_REVIEW_TITLE,
  TEXT_AI_MODELING_GOAL_PLACEHOLDER,
  TEXT_AI_OUTPUT_LANGUAGES,
  type TextAiCodebookSource,
  type TextAiLanguageOption,
} from '@/data/mock-text-ai-model-setup';
import styles from './TextAiModelSetupForm.module.css';

const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);

export interface TextAiModelSetupValues {
  name: string;
  outputLanguage: TextAiLanguageOption;
  modelingGoal: string;
  codebookSource: TextAiCodebookSource;
  expertReviewRequested: boolean;
}

interface TextAiModelSetupFormProps {
  values: TextAiModelSetupValues;
  namePlaceholder: string;
  nameError?: boolean;
  onChange: (values: TextAiModelSetupValues) => void;
}

export function TextAiModelSetupForm({
  values,
  namePlaceholder,
  nameError = false,
  onChange,
}: TextAiModelSetupFormProps) {
  function patch(partial: Partial<TextAiModelSetupValues>): void {
    onChange({ ...values, ...partial });
  }

  return (
    <div className={styles.form}>
      <WuFormGroup
        Label={<WuLabel>Name</WuLabel>}
        Error={nameError ? 'Dashboard name is required' : undefined}
        Input={
          <WuInput
            variant="outlined"
            placeholder={namePlaceholder}
            value={values.name}
            maxLength={100}
            autoFocus
            onChange={(e) => patch({ name: e.target.value })}
          />
        }
      />

      <div className={styles.fieldBlock}>
        <WuLabel className={styles.fieldLabel}>Output language</WuLabel>
        <div className={styles.languageSelect}>
          <WuSelect
            data={TEXT_AI_OUTPUT_LANGUAGES}
            accessorKey={{ value: 'value', label: 'label' }}
            value={values.outputLanguage}
            onSelect={(option) => {
              if (!option) return;
              patch({ outputLanguage: option as TextAiLanguageOption });
            }}
            variant="outlined"
          />
        </div>
      </div>

      <div className={styles.fieldBlock}>
        <WuLabel className={styles.fieldLabel}>
          What is the goal of this topic modeling?
        </WuLabel>
        <WuTextarea
          variant="outlined"
          placeholder={TEXT_AI_MODELING_GOAL_PLACEHOLDER}
          value={values.modelingGoal}
          onChange={(e) => patch({ modelingGoal: e.target.value })}
          className={styles.goalTextarea}
        />
      </div>

      <fieldset className={styles.codebookFieldset}>
        <legend className={styles.fieldLabel}>Codebook</legend>
        <div className={styles.codebookOptions}>
          {TEXT_AI_CODEBOOK_OPTIONS.map((option) => {
            const checked = values.codebookSource === option.value;
            return (
              <label key={option.value} className={styles.codebookOption}>
                <input
                  type="radio"
                  name="text-ai-codebook"
                  value={option.value}
                  checked={checked}
                  onChange={() => patch({ codebookSource: option.value })}
                  className={styles.codebookRadio}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.expertReviewOption}>
        <label className={styles.expertReviewLabel}>
          <WuCheckbox
            checked={values.expertReviewRequested}
            onChange={(checked) => patch({ expertReviewRequested: checked })}
            aria-label={TEXT_AI_EXPERT_REVIEW_TITLE}
          />
          <span className={styles.expertReviewText}>
            <span className={styles.expertReviewTitle}>{TEXT_AI_EXPERT_REVIEW_TITLE}</span>
            <span className={styles.expertReviewDescription}>
              {TEXT_AI_EXPERT_REVIEW_DESCRIPTION}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export function createDefaultModelSetupValues(defaultName: string): TextAiModelSetupValues {
  return {
    name: defaultName,
    outputLanguage: DEFAULT_TEXT_AI_OUTPUT_LANGUAGE,
    modelingGoal: '',
    codebookSource: 'none',
    expertReviewRequested: false,
  };
}
