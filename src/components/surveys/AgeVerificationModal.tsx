'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { OptionMultiSelect } from '@/components/surveys/OptionMultiSelect';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { VALUE_SEPARATOR } from '@/data/mock-criteria-engine';
import {
  AGE_VERIFICATION_COUNTRIES,
  AGE_VERIFICATION_FAILED_OPTIONS,
  AGE_VERIFICATION_HELP,
  createAgeVerificationCountryRule,
  type AgeVerificationCountryRule,
  type AgeVerificationFailedAction,
  type AgeVerificationSettings,
} from '@/data/mock-survey-settings';
import styles from './AgeVerificationModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface AgeVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: AgeVerificationSettings;
  onSave: (next: AgeVerificationSettings) => void;
}

function parseMinimumAge(raw: string): number {
  const parsed = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > 120) return 120;
  return parsed;
}

function countryCodesToValue(codes: string[]): string {
  return codes.join(VALUE_SEPARATOR);
}

function valueToCountryCodes(raw: string): string[] {
  return raw
    .split(VALUE_SEPARATOR)
    .map((code) => code.trim())
    .filter(Boolean);
}

export function AgeVerificationModal({
  open,
  onOpenChange,
  value,
  onSave,
}: AgeVerificationModalProps) {
  const wick = useWickUILib();
  const [draft, setDraft] = useState<AgeVerificationSettings>(value);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setEditorKey((key) => key + 1);
  }, [open, value]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const selectedFailedAction =
    AGE_VERIFICATION_FAILED_OPTIONS.find(
      (option) => option.value === draft.failedVerificationAction
    ) ?? AGE_VERIFICATION_FAILED_OPTIONS[0];
  const geolocationEnabled = draft.geolocationLogicEnabled;

  function handleSave(): void {
    onSave(draft);
    onOpenChange(false);
  }

  function handleEnableGeolocation(): void {
    setDraft((prev) => ({
      ...prev,
      geolocationLogicEnabled: true,
      countryRules:
        prev.countryRules.length > 0
          ? prev.countryRules
          : [createAgeVerificationCountryRule({ minimumAge: prev.minimumAge })],
    }));
  }

  function updateCountryRule(
    ruleId: string,
    patch: Partial<AgeVerificationCountryRule>
  ): void {
    setDraft((prev) => ({
      ...prev,
      countryRules: prev.countryRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule
      ),
    }));
  }

  function addCountryRule(): void {
    setDraft((prev) => ({
      ...prev,
      countryRules: [
        ...prev.countryRules,
        createAgeVerificationCountryRule({ minimumAge: prev.minimumAge }),
      ],
    }));
  }

  function removeCountryRule(ruleId: string): void {
    setDraft((prev) => {
      const nextRules = prev.countryRules.filter((rule) => rule.id !== ruleId);
      if (nextRules.length === 0) {
        return {
          ...prev,
          geolocationLogicEnabled: false,
          countryRules: [],
        };
      }
      return { ...prev, countryRules: nextRules };
    });
  }

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      className={`${styles.modal} ${geolocationEnabled ? styles.modalWide : ''}`}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitleRow}>
          <span className={styles.headerTitle}>Age Verification</span>
          <WuTooltip content={AGE_VERIFICATION_HELP} position="bottom">
            <span className={styles.helpIcon} aria-label={AGE_VERIFICATION_HELP}>
              <span className="wm-help" aria-hidden />
            </span>
          </WuTooltip>
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.messageField}>
          <SurveySettingsRichText
            key={editorKey}
            value={draft.message}
            onChange={(message) => setDraft((prev) => ({ ...prev, message }))}
            ariaLabel="Age verification message"
            toolbarPosition="bottom"
          />
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>
            {geolocationEnabled ? 'Default Minimum Age' : 'Minimum Age'}
          </span>
          <div className={styles.minimumAgeRow}>
            <WuInput
              className={styles.minimumAgeInput}
              value={String(draft.minimumAge)}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  minimumAge: parseMinimumAge(event.target.value),
                }))
              }
              aria-label={geolocationEnabled ? 'Default minimum age' : 'Minimum age'}
            />
            <span className={styles.yearsSuffix}>years</span>
            {!geolocationEnabled ? (
              <button
                type="button"
                className={styles.geolocationLink}
                onClick={handleEnableGeolocation}
              >
                + Geolocation Logic
              </button>
            ) : null}
          </div>
        </div>

        {geolocationEnabled
          ? draft.countryRules.map((rule, index) => {
              const isLast = index === draft.countryRules.length - 1;
              return (
                <div key={rule.id} className={styles.countryRuleRow}>
                  <span className={styles.fieldLabel}>Minimum Age</span>
                  <div className={styles.countryRuleControls}>
                    <WuInput
                      className={styles.minimumAgeInput}
                      value={String(rule.minimumAge)}
                      onChange={(event) =>
                        updateCountryRule(rule.id, {
                          minimumAge: parseMinimumAge(event.target.value),
                        })
                      }
                      aria-label={`Minimum age for country rule ${index + 1}`}
                    />
                    <span className={styles.yearsSuffix}>Years</span>
                    <span className={styles.ifCountryLabel}>if Country is</span>
                    <div className={styles.countrySelectWrap}>
                      <OptionMultiSelect
                        options={AGE_VERIFICATION_COUNTRIES}
                        value={countryCodesToValue(rule.countryCodes)}
                        onChange={(next) =>
                          updateCountryRule(rule.id, {
                            countryCodes: valueToCountryCodes(next),
                          })
                        }
                        placeholder="Nothing selected"
                        triggerClassName={styles.countryMenuTrigger}
                      />
                    </div>
                    <div className={styles.ruleActions}>
                      <button
                        type="button"
                        className={styles.ruleActionBtn}
                        aria-label={`Remove country rule ${index + 1}`}
                        onClick={() => removeCountryRule(rule.id)}
                      >
                        <span className="wm-do-not-disturb-on" aria-hidden />
                      </button>
                      {isLast ? (
                        <button
                          type="button"
                          className={`${styles.ruleActionBtn} ${styles.ruleActionBtnAdd}`}
                          aria-label="Add country rule"
                          onClick={addCountryRule}
                        >
                          <span className="wm-add-circle" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          : null}

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Button Text</span>
          <WuInput
            value={draft.buttonText}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, buttonText: event.target.value }))
            }
            aria-label="Button text"
          />
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Failed Verification</span>
          <div className={styles.selectWrap}>
            <WuSelect
              data={AGE_VERIFICATION_FAILED_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedFailedAction}
              onSelect={(item) => {
                const selected = item as { value: AgeVerificationFailedAction } | null;
                if (!selected) return;
                setDraft((prev) => ({
                  ...prev,
                  failedVerificationAction: selected.value,
                }));
              }}
              variant="outlined"
              aria-label="Failed verification action"
            />
          </div>
        </div>

        {draft.failedVerificationAction === 'automatic-redirect' ? (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>URL</span>
            <WuInput
              value={draft.failedVerificationRedirectUrl}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  failedVerificationRedirectUrl: event.target.value,
                }))
              }
              placeholder="https://"
              aria-label="Redirect URL"
            />
          </div>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <WuButton onClick={handleSave}>Save</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
