'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  DEFAULT_TEXT_AI_OUTPUT_LANGUAGE,
  TEXT_AI_CODEBOOK_OPTIONS,
  TEXT_AI_CODEBOOK_TEMPLATE_DOWNLOAD_LABEL,
  TEXT_AI_CODEBOOK_TEMPLATE_SUPPORTED_FILES,
  TEXT_AI_CODEBOOK_TEMPLATE_UPLOAD_LABEL,
  TEXT_AI_EXPERT_REVIEW_DESCRIPTION,
  TEXT_AI_EXPERT_REVIEW_TITLE,
  TEXT_AI_MODELING_GOAL_PLACEHOLDER,
  TEXT_AI_OUTPUT_LANGUAGES,
  TEXT_AI_REPORT_CODEBOOKS,
  type TextAiCodebookSource,
  type TextAiLanguageOption,
  type TextAiReportCodebookOption,
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
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false }
);

export interface TextAiModelSetupValues {
  name: string;
  outputLanguage: TextAiLanguageOption;
  modelingGoal: string;
  codebookSource: TextAiCodebookSource;
  reportCodebook: TextAiReportCodebookOption | null;
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
  const { showToast } = useWuShowToast();
  const templateFileInputRef = useRef<HTMLInputElement>(null);

  function patch(partial: Partial<TextAiModelSetupValues>): void {
    onChange({ ...values, ...partial });
  }

  function handleTemplateDownload(): void {
    showToast({ message: 'Template file downloaded', variant: 'success' });
  }

  function handleTemplateFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    showToast({ message: `Uploaded "${file.name}"`, variant: 'success' });
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
                  onChange={() =>
                    patch({
                      codebookSource: option.value,
                      reportCodebook:
                        option.value === 'report' ? values.reportCodebook : null,
                    })
                  }
                  className={styles.codebookRadio}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

        {values.codebookSource === 'template' ? (
          <div className={styles.templatePanel}>
            <div className={styles.downloadRow}>
              <span className={styles.downloadLabel}>
                {TEXT_AI_CODEBOOK_TEMPLATE_DOWNLOAD_LABEL}
              </span>
              <WuButton
                size="sm"
                Icon={<span className="wm-download" />}
                onClick={handleTemplateDownload}
              >
                Download
              </WuButton>
            </div>
            <input
              ref={templateFileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className={styles.hiddenFileInput}
              onChange={handleTemplateFileChange}
            />
            <button
              type="button"
              className={styles.uploadZone}
              onClick={() => templateFileInputRef.current?.click()}
            >
              <span className={styles.uploadIcon} aria-hidden>
                <svg viewBox="0 0 24 24" className={styles.uploadIconSvg} focusable="false">
                  <path
                    d="M12 4v10M8.5 10.5 12 7l3.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M5 18h14"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.75"
                  />
                </svg>
              </span>
              {TEXT_AI_CODEBOOK_TEMPLATE_UPLOAD_LABEL}
            </button>
            <p className={styles.supportedFiles}>{TEXT_AI_CODEBOOK_TEMPLATE_SUPPORTED_FILES}</p>
          </div>
        ) : null}

        {values.codebookSource === 'report' ? (
          <div className={styles.reportCodebookSelect}>
            <WuCombobox
              data={TEXT_AI_REPORT_CODEBOOKS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={values.reportCodebook}
              placeholder="Select a report"
              variant="outlined"
              enableSearch
              maxHeight={220}
              aria-label="Select a report codebook"
              onSelect={(option) =>
                patch({ reportCodebook: option as TextAiReportCodebookOption })
              }
            />
          </div>
        ) : null}
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
    reportCodebook: null,
    expertReviewRequested: false,
  };
}
