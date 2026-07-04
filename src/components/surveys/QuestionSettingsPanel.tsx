'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  ANSWER_DISPLAY_ORDER_OPTIONS,
  buildRandomizeAnswerCountOptions,
  getQuestionDisplayOptions,
  getQuestionTypeLabel,
  normalizeRandomizeAnswerCount,
  SCALE_TYPE_OPTIONS,
  VIDEO_OPTIONS,
  type AnswerDisplayOrder,
  type AnswerType,
  type QuestionDisplayMode,
  type QuestionLayout,
  type QuestionSettings,
  type RandomizeAnswerCount,
  type VideoOption,
} from '@/data/mock-question-settings';
import styles from './QuestionSettingsPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const AUTO_SELECT_SHOWN_OPTION_HELP =
  'If multiple options are displayed, the first option will be selected by default.';

type SettingsTab = 'metadata' | 'communities';

const ANSWER_TYPE_OPTIONS: { value: AnswerType; label: string }[] = [
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'select-list', label: 'Select List' },
];

const LAYOUT_OPTIONS: { value: QuestionLayout; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

function ToggleButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.toggleGroup} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.toggleBtn} ${
              value === option.value ? styles.toggleBtnActive : ''
            }`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface QuestionSettingsPanelProps {
  question: SurveyQuestion;
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
  onClose: () => void;
}

export function QuestionSettingsPanel({
  question,
  settings,
  onChange,
  onClose,
}: QuestionSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('metadata');
  const panelTitle = getQuestionTypeLabel(question.inputKind);

  function patch(partial: Partial<QuestionSettings>): void {
    onChange({ ...settings, ...partial });
  }

  const displayOrderValue =
    ANSWER_DISPLAY_ORDER_OPTIONS.find((o) => o.value === settings.answerDisplayOrder) ?? null;
  const randomizeAnswerCountOptions = useMemo(
    () => buildRandomizeAnswerCountOptions(question.options.length),
    [question.options.length]
  );
  const normalizedRandomizeAnswerCount = normalizeRandomizeAnswerCount(
    settings.randomizeAnswerCount,
    question.options.length
  );
  const randomizeAnswerCountValue =
    randomizeAnswerCountOptions.find((o) => o.value === normalizedRandomizeAnswerCount) ??
    randomizeAnswerCountOptions[0] ??
    null;
  const questionDisplayOptions = useMemo(
    () => getQuestionDisplayOptions(settings.answerType),
    [settings.answerType]
  );
  const questionDisplayValue =
    questionDisplayOptions.find((o) => o.value === settings.questionDisplay) ??
    questionDisplayOptions[0] ??
    null;
  const videoValue = VIDEO_OPTIONS.find((o) => o.value === settings.video) ?? null;
  const isSelectOne = question.inputKind === 'radio';
  const isSelectMany = question.inputKind === 'checkbox';
  const showAutoSelectOption = isSelectOne && settings.answerType !== 'dropdown';

  return (
    <aside className={styles.panel} aria-label="Question settings">
      <header className={styles.header}>
        <h2 className={styles.title}>{panelTitle}</h2>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={styles.body}>
        <ToggleButtonGroup
          label="Answer Type"
          options={ANSWER_TYPE_OPTIONS}
          value={settings.answerType}
          onChange={(answerType) =>
            patch({
              answerType,
              ...(answerType !== 'radio' && settings.questionDisplay === 'hide-after-answering'
                ? { questionDisplay: 'show-question' }
                : {}),
              ...(answerType === 'dropdown' ? { autoSelectShownOptions: false } : {}),
            })
          }
        />

        <ToggleButtonGroup
          label="Question Layout"
          options={LAYOUT_OPTIONS}
          value={settings.questionLayout}
          onChange={(questionLayout) => patch({ questionLayout })}
        />

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="question-settings-columns">
            Columns
          </label>
          <input
            id="question-settings-columns"
            type="number"
            className={styles.numberInput}
            min={1}
            max={6}
            value={settings.columns}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(next) && next >= 1) {
                patch({ columns: Math.min(6, next) });
              }
            }}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Answer Display Order</span>
          <div className={styles.selectWrap}>
            <WuSelect
              data={ANSWER_DISPLAY_ORDER_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={displayOrderValue}
              onSelect={(item) =>
                patch({ answerDisplayOrder: (item as { value: AnswerDisplayOrder }).value })
              }
              variant="outlined"
            />
          </div>
        </div>

        {settings.answerDisplayOrder === 'random' ? (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Number of Answers to Randomize</span>
            <div className={styles.selectWrap}>
              <WuSelect
                data={randomizeAnswerCountOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={randomizeAnswerCountValue}
                onSelect={(item) =>
                  patch({
                    randomizeAnswerCount: (item as { value: RandomizeAnswerCount }).value,
                  })
                }
                variant="outlined"
              />
            </div>
          </div>
        ) : null}

        <hr className={styles.sectionDivider} aria-hidden />

        <div className={styles.field}>
          <div className={styles.toggleRow}>
            <WuToggle
              Label="Alternate colors"
              labelPosition="right"
              checked={settings.alternateColors}
              onChange={(alternateColors) => patch({ alternateColors })}
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Question Display</span>
          <div className={styles.selectWrap}>
            <WuSelect
              data={questionDisplayOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={questionDisplayValue}
              onSelect={(item) => {
                const questionDisplay = (item as { value: QuestionDisplayMode }).value;
                patch({
                  questionDisplay,
                  ...(questionDisplay !== 'hide-question'
                    ? { autoSelectShownOptions: false }
                    : {}),
                });
              }}
              variant="outlined"
            />
          </div>
        </div>

        {settings.questionDisplay === 'hide-question' &&
        (showAutoSelectOption || isSelectMany) ? (
          <div className={styles.field}>
            {showAutoSelectOption ? (
              <div className={styles.toggleLabelRow}>
                <WuToggle
                  Label="Auto select shown option"
                  labelPosition="right"
                  checked={settings.autoSelectShownOptions}
                  onChange={(autoSelectShownOptions) => patch({ autoSelectShownOptions })}
                />
                <WuTooltip content={AUTO_SELECT_SHOWN_OPTION_HELP} position="top">
                  <span
                    className={styles.helpBtn}
                    role="img"
                    aria-label={AUTO_SELECT_SHOWN_OPTION_HELP}
                  >
                    <span className="wm-info" aria-hidden />
                  </span>
                </WuTooltip>
              </div>
            ) : (
              <div className={styles.toggleRow}>
                <WuToggle
                  Label="Auto select shown options"
                  labelPosition="right"
                  checked={settings.autoSelectShownOptions}
                  onChange={(autoSelectShownOptions) => patch({ autoSelectShownOptions })}
                />
              </div>
            )}
          </div>
        ) : null}

        <hr className={styles.sectionDivider} aria-hidden />

        <div className={styles.field}>
          <div className={styles.toggleRow}>
            <WuToggle
              Label="Question Tips"
              labelPosition="right"
              checked={settings.questionTips}
              onChange={(questionTips) => patch({ questionTips })}
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Video</span>
          <div className={styles.selectWrap}>
            <WuSelect
              data={VIDEO_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={videoValue}
              onSelect={(item) => patch({ video: (item as { value: VideoOption }).value })}
              variant="outlined"
            />
          </div>
        </div>

        <div className={styles.tabs}>
          <div className={styles.tabList} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'metadata'}
              className={`${styles.tabBtn} ${activeTab === 'metadata' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('metadata')}
            >
              Metadata
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'communities'}
              className={`${styles.tabBtn} ${activeTab === 'communities' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('communities')}
            >
              Communities
            </button>
          </div>

          {activeTab === 'metadata' ? (
            <div role="tabpanel">
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="question-settings-report-label">
                  Report Label
                </label>
                <input
                  id="question-settings-report-label"
                  type="text"
                  className={styles.textInput}
                  value={settings.reportLabel}
                  onChange={(event) => patch({ reportLabel: event.target.value })}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Scale type</span>
                <ul className={styles.radioList}>
                  {SCALE_TYPE_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <label className={styles.radioItem}>
                        <input
                          type="radio"
                          name="question-scale-type"
                          checked={settings.scaleType === option.value}
                          onChange={() => patch({ scaleType: option.value })}
                        />
                        {option.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className={styles.placeholder}>
              Community targeting for this question is not configured in this prototype.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
