'use client';

import dynamic from 'next/dynamic';
import type { ListenAiQuestionConfig } from '@/data/mock-listenai-question';
import { normalizeListenAiMaxFollowUps } from '@/data/mock-listenai-question';
import {
  LISTENAI_MAX_FOLLOW_UP_LIMIT,
  LISTENAI_TONE_OPTIONS,
  type ListenAiStudy,
  type ListenAiTone,
} from '@/data/mock-listenai-studies';
import type { SurveySection } from '@/data/mock-survey-detail';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './ListenAIQuestionSettingsPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export interface ListenAIQuestionSettingsPanelProps {
  config: ListenAiQuestionConfig;
  sections: SurveySection[];
  questionId: string;
  onChange: (config: ListenAiQuestionConfig) => void;
  onClose: () => void;
}

function patchStudy(config: ListenAiQuestionConfig, study: ListenAiStudy): ListenAiQuestionConfig {
  return {
    ...config,
    study,
  };
}

export function ListenAIQuestionSettingsPanel({
  config,
  onChange,
  onClose,
}: ListenAIQuestionSettingsPanelProps) {
  const study = {
    ...config.study,
    interviewType: 'conversation' as const,
    maxFollowUps: normalizeListenAiMaxFollowUps(config.study.maxFollowUps),
    tone: config.study.tone ?? 'curious',
  } satisfies ListenAiStudy;
  const selectedTone =
    LISTENAI_TONE_OPTIONS.find((item) => item.value === study.tone) ??
    LISTENAI_TONE_OPTIONS[4] ??
    null;
  const objectivesText = study.objectives.join('\n');
  const objectivesMissing = objectivesText.trim().length === 0;

  function patchMaxFollowUps(maxFollowUps: number): void {
    const next = normalizeListenAiMaxFollowUps(maxFollowUps);
    onChange(
      patchStudy(config, {
        ...study,
        maxFollowUps: next,
        discussionGuide: study.discussionGuide.map((question) => ({
          ...question,
          maxFollowUps: next,
        })),
      })
    );
  }

  function patchLongText(field: 'objectives' | 'moderatorInstructions', value: string): void {
    onChange(
      patchStudy(config, {
        ...study,
        [field]: value.trim() ? [value] : [],
      })
    );
  }

  return (
    <aside className={`${panelStyles.panel} ${styles.panel}`} aria-label="Conversation settings">
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <div className={styles.headerCopy}>
            <h3 className={styles.headerTitle}>
              Conversation
              <span
                className={`wc-ai ${styles.aiMark}`}
                title="This question uses QuestionPro AI"
                aria-label="This question uses QuestionPro AI"
              />
            </h3>
            <p className={styles.headerTagline}>
              Powered by{' '}
              <a
                className={styles.headerTaglineLink}
                href="https://staging.listenai.questionpro.com/ui/interviews/create/ai"
                target="_blank"
                rel="noreferrer"
              >
                QuestionProAI Interviews
              </a>
            </p>
          </div>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.twoColumnRow}>
          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Follow Ups</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Decrease follow-ups"
                disabled={study.maxFollowUps <= 1}
                onClick={() => patchMaxFollowUps(study.maxFollowUps - 1)}
              >
                −
              </button>
              <span className={styles.stepperValue}>{study.maxFollowUps}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Increase follow-ups"
                disabled={study.maxFollowUps >= LISTENAI_MAX_FOLLOW_UP_LIMIT}
                onClick={() => patchMaxFollowUps(study.maxFollowUps + 1)}
              >
                +
              </button>
            </div>
            {study.maxFollowUps >= LISTENAI_MAX_FOLLOW_UP_LIMIT ? (
              <p className={styles.fieldHelper}>
                Maximum {LISTENAI_MAX_FOLLOW_UP_LIMIT} follow-ups are allowed
              </p>
            ) : null}
          </div>

          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Tone</span>
            <div className={panelStyles.selectWrap}>
              <WuSelect
                data={LISTENAI_TONE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedTone}
                onSelect={(item) =>
                  onChange(
                    patchStudy(config, {
                      ...study,
                      tone: (item as { value: ListenAiTone }).value,
                    })
                  )
                }
                variant="outlined"
              />
            </div>
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>
            Key learning objectives <span className={styles.requiredMark}>*</span>
          </span>
          <textarea
            className={`${styles.textarea} ${objectivesMissing ? styles.textareaRequired : ''}`}
            rows={4}
            placeholder="e.g. understand why respondents prefer a brand and what would change a return visit"
            value={objectivesText}
            onChange={(event) => patchLongText('objectives', event.target.value)}
            aria-required="true"
            aria-invalid={objectivesMissing}
            required
          />
          {objectivesMissing ? (
            <p className={styles.requiredHelper}>Add at least one key learning objective.</p>
          ) : null}
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>AI moderator instructions (optional)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="e.g. stay curious, probe on a recent visit before moving on"
            value={study.moderatorInstructions.join('\n')}
            onChange={(event) => patchLongText('moderatorInstructions', event.target.value)}
          />
        </div>

        <div className={styles.constraintNote} role="note" aria-label="Conversation placement rules">
          <span className={styles.constraintIcon} aria-hidden>
            i
          </span>
          <p className={styles.constraintText}>
            Conversation uses the same placement rules as Platform Connect: it cannot be the first
            question on a page, cannot be the last question in the survey, and is not compatible
            with question or block randomization or Respondent Anonymity Assurance.
          </p>
        </div>
      </div>
    </aside>
  );
}
