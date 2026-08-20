'use client';

import dynamic from 'next/dynamic';
import type { ListenAiQuestionConfig } from '@/data/mock-listenai-question';
import { normalizeListenAiMaxFollowUps } from '@/data/mock-listenai-question';
import {
  LISTENAI_INTERVIEW_TYPE_OPTIONS,
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
    <aside className={`${panelStyles.panel} ${styles.panel}`} aria-label="ListenAI settings">
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <h3 className={styles.headerTitle}>ListenAI</h3>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={styles.body}>
        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Interview type</span>
          <div className={styles.typeList}>
            {LISTENAI_INTERVIEW_TYPE_OPTIONS.map((option) => {
              const active = study.interviewType === option.value;
              return (
                <label key={option.value} className={styles.typeItem}>
                  <input
                    type="radio"
                    name="listenai-interview-type"
                    checked={active}
                    onChange={() =>
                      onChange(patchStudy(config, { ...study, interviewType: 'conversation' }))
                    }
                  />
                  <span>
                    <span className={styles.typeLabel}>{option.label}</span>
                    <span className={styles.typeDescription}>{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

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
          <span className={panelStyles.fieldLabel}>Key learning objectives</span>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="e.g. understand why respondents prefer a brand and what would change a return visit"
            value={study.objectives.join('\n')}
            onChange={(event) => patchLongText('objectives', event.target.value)}
          />
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Target audience (optional)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="e.g. frequent fast-food customers, parents of young children"
            value={study.audienceNotes}
            onChange={(event) =>
              onChange(
                patchStudy(config, {
                  ...study,
                  audienceNotes: event.target.value,
                })
              )
            }
          />
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

        <div className={styles.constraintNote} role="note" aria-label="ListenAI placement rules">
          <span className={styles.constraintIcon} aria-hidden>
            i
          </span>
          <p className={styles.constraintText}>
            ListenAI uses the same placement rules as Platform Connect: it cannot be the first
            question on a page, cannot be the last question in the survey, and is not compatible
            with question or block randomization or Respondent Anonymity Assurance.
          </p>
        </div>
      </div>
    </aside>
  );
}
