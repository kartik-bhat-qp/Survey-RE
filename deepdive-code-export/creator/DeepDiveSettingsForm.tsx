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
import { OptionMultiSelect } from '@/components/surveys/OptionMultiSelect';
import { VALUE_SEPARATOR } from '@/data/mock-criteria-engine';
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

  const selectedProbeValues = (settings.probeWhenOptionIds ?? []).join(VALUE_SEPARATOR);

  function handleProbeWhenChange(next: string): void {
    const optionIds = next
      .split(VALUE_SEPARATOR)
      .map((id) => id.trim())
      .filter(Boolean);

    if (optionIds.length === 0) {
      onChange({
        probeWhen: 'any-answer',
        probeWhenOptionIds: [],
        probeWhenOptionId: undefined,
      });
      return;
    }

    onChange({
      probeWhen: 'specific-option',
      probeWhenOptionIds: optionIds,
      probeWhenOptionId: undefined,
    });
  }

  return (
    <div className={styles.formRoot}>
      {showHeader ? (
        <header className={styles.header}>
          <div className={styles.headerStart}>
            <h3 className={styles.headerTitle}>DeepDive</h3>
            <span className={styles.betaBadge} aria-label="Beta">
              <span className="wm-experiment" aria-hidden />
            </span>
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
            <OptionMultiSelect
              options={probeWhenOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={selectedProbeValues}
              onChange={handleProbeWhenChange}
              triggerClassName={styles.probeMenuTrigger}
              placeholder="Any answer"
            />
          </div>
          <p className={styles.fieldHelper}>
            {probeWhenOptions.length === 0
              ? 'Select a target question to choose answer triggers.'
              : 'Skip the follow-up entirely for routine answers. Leave empty for any answer.'}
          </p>
        </div>

        <div className={styles.twoColumnRow}>
          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Follow Ups</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Decrease follow-ups"
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
                aria-label="Increase follow-ups"
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
            {settings.maxFollowUp >= DEEPDIVE_MAX_FOLLOW_UP_LIMIT ? (
              <p className={styles.fieldHelper}>
                Maximum {DEEPDIVE_MAX_FOLLOW_UP_LIMIT} follow-ups are allowed
              </p>
            ) : null}
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

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>
            Intent (optional)
            <span className={styles.comingSoonBadge}>Coming Soon</span>
          </span>
          <WuInput
            variant="outlined"
            placeholder="e.g. understand why respondents prefer a brand, uncover unmet needs"
            value={settings.intent}
            disabled
            onChange={(event) => onChange({ intent: event.target.value })}
          />
          <p className={styles.fieldHelper}>
            Goals that guide the AI to ask better follow-up questions.
          </p>
        </div>
      </div>
    </div>
  );
}
