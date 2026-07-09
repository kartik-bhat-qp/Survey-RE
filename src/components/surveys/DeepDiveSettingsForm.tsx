'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { SurveySection } from '@/data/mock-survey-detail';
import {
  DEEPDIVE_MAX_FOLLOW_UP_LIMIT,
  DEEPDIVE_TONE_OPTIONS,
  normalizeDeepDiveMaxFollowUp,
  type DeepDiveFollowUpSettings,
  type DeepDiveTone,
} from '@/data/mock-deepdive-question-settings';
import { buildDeepDiveProbeWhenOptions } from '@/data/mock-deepdive-follow-up-question';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './DeepDiveQuestionSettingsPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

export interface DeepDiveSettingsFormProps {
  settings: DeepDiveFollowUpSettings;
  sections: SurveySection[];
  probeTargetSectionId: string;
  probeTargetQuestionId: string;
  onChange: (partial: Partial<DeepDiveFollowUpSettings>) => void;
  showHeader?: boolean;
  onClose?: () => void;
}

export function DeepDiveSettingsForm({
  settings,
  sections,
  probeTargetSectionId,
  probeTargetQuestionId,
  onChange,
  showHeader = false,
  onClose,
}: DeepDiveSettingsFormProps) {
  const probeWhenOptions = useMemo(
    () =>
      buildDeepDiveProbeWhenOptions(sections, probeTargetSectionId, probeTargetQuestionId),
    [sections, probeTargetSectionId, probeTargetQuestionId]
  );

  const toneValue =
    DEEPDIVE_TONE_OPTIONS.find((option) => option.value === settings.tone) ??
    DEEPDIVE_TONE_OPTIONS[0] ??
    null;
  const probeWhenValue =
    probeWhenOptions.find((option) => {
      if (settings.probeWhen === 'specific-option' && settings.probeWhenOptionId) {
        return option.optionId === settings.probeWhenOptionId;
      }
      return option.probeWhen === 'any-answer';
    }) ?? probeWhenOptions[0] ?? null;

  return (
    <div className={styles.formRoot}>
      {showHeader ? (
        <header className={styles.header}>
          <div className={styles.headerStart}>
            <span className={styles.ddIcon} aria-hidden>
              DD
            </span>
            <h3 className={styles.headerTitle}>DeepDive</h3>
          </div>
          <div className={styles.headerEnd}>
            {onClose ? (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <span className="wm-close" aria-hidden />
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className={showHeader ? styles.embeddedBody : undefined}>
        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Only probe when</span>
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={probeWhenOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={probeWhenValue}
              onSelect={(item) => {
                const selected = item as {
                  probeWhen: DeepDiveFollowUpSettings['probeWhen'];
                  optionId?: string;
                };
                onChange({
                  probeWhen: selected.probeWhen,
                  probeWhenOptionId:
                    selected.probeWhen === 'specific-option' ? selected.optionId : undefined,
                });
              }}
              variant="outlined"
              placeholder="Any answer"
            />
          </div>
          <p className={styles.fieldHelper}>Skip the follow-up entirely for routine answers.</p>
        </div>

        <div className={styles.twoColumnRow}>
          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Max follow-ups</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Decrease max follow-ups"
                disabled={settings.maxFollowUp <= 1}
                onClick={() =>
                  onChange({
                    maxFollowUp: normalizeDeepDiveMaxFollowUp(settings.maxFollowUp - 1),
                  })
                }
              >
                −
              </button>
              <span className={styles.stepperValue}>{settings.maxFollowUp}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Increase max follow-ups"
                disabled={settings.maxFollowUp >= DEEPDIVE_MAX_FOLLOW_UP_LIMIT}
                onClick={() =>
                  onChange({
                    maxFollowUp: normalizeDeepDiveMaxFollowUp(settings.maxFollowUp + 1),
                  })
                }
              >
                +
              </button>
            </div>
          </div>

          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Tone</span>
            <div className={panelStyles.selectWrap}>
              <WuSelect
                data={DEEPDIVE_TONE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={toneValue}
                onSelect={(item) => onChange({ tone: (item as { value: DeepDiveTone }).value })}
                variant="outlined"
              />
            </div>
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Guardrails (optional)</span>
          <WuInput
            variant="outlined"
            placeholder="e.g. don't ask about price, don't compare to named competitors"
            value={settings.guardrails}
            onChange={(event) => onChange({ guardrails: event.target.value })}
          />
          <p className={styles.fieldHelper}>Topics or phrasing the AI should avoid.</p>
        </div>
      </div>
    </div>
  );
}
