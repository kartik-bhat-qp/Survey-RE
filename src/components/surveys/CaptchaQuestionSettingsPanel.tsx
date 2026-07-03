'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  CAPTCHA_FEEDBACK_STYLE_OPTIONS,
  CAPTCHA_FAILURE_HANDLING_COPY,
  CAPTCHA_RECAPTCHA_TYPE_OPTIONS,
  type CaptchaFeedbackStyle,
  type CaptchaRecaptchaType,
  type CaptchaSettings,
} from '@/data/mock-captcha-settings';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './CaptchaQuestionSettingsPanel.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

export interface CaptchaQuestionSettingsPanelProps {
  settings: CaptchaSettings;
  onChange: (settings: CaptchaSettings) => void;
  onClose: () => void;
}

export function CaptchaQuestionSettingsPanel({
  settings,
  onChange,
  onClose,
}: CaptchaQuestionSettingsPanelProps) {
  const { showToast } = useWuShowToast();

  function patch(partial: Partial<CaptchaSettings>): void {
    onChange({ ...settings, ...partial });
  }

  function showHelp(): void {
    showToast({ message: 'reCAPTCHA type help', variant: 'info' });
  }

  return (
    <aside className={`${panelStyles.panel} ${styles.panel}`} aria-label="reCAPTCHA settings">
      <header className={panelStyles.header}>
        <h2 className={`${panelStyles.title} ${styles.panelTitle}`}>reCAPTCHA</h2>
        <button type="button" className={panelStyles.closeBtn} onClick={onClose} aria-label="Close">
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={panelStyles.body}>
        <div className={panelStyles.field}>
          <span className={styles.fieldLabelRow}>
            <span className={styles.sectionLabel}>reCAPTCHA type</span>
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="Help: reCAPTCHA type"
              onClick={showHelp}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </span>

          <ul className={styles.recaptchaTypeList}>
            {CAPTCHA_RECAPTCHA_TYPE_OPTIONS.map((option) => {
              const active = settings.recaptchaType === option.value;
              return (
                <li key={option.value}>
                  <label className={styles.recaptchaTypeItem}>
                    <input
                      type="radio"
                      name="captcha-recaptcha-type"
                      checked={active}
                      onChange={() =>
                        patch({ recaptchaType: option.value as CaptchaRecaptchaType })
                      }
                    />
                    <span className={styles.recaptchaTypeText}>
                      <span className={styles.recaptchaTypeLabelRow}>
                        <span className={styles.recaptchaTypeLabel}>{option.label}</span>
                        {option.isNew ? (
                          <span className={styles.newBadge} aria-label="New feature">
                            New
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.recaptchaTypeDescription}>{option.description}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {settings.recaptchaType === 'invisible' ? (
          <>
            <div className={panelStyles.field}>
              <span className={styles.sectionLabel}>Verification feedback</span>
              <ul className={styles.recaptchaTypeList}>
                {CAPTCHA_FEEDBACK_STYLE_OPTIONS.map((option) => {
                  const active = settings.captchaFeedbackStyle === option.value;
                  return (
                    <li key={option.value}>
                      <label className={styles.recaptchaTypeItem}>
                        <input
                          type="radio"
                          name="captcha-feedback-style"
                          checked={active}
                          onChange={() =>
                            patch({
                              captchaFeedbackStyle: option.value as CaptchaFeedbackStyle,
                            })
                          }
                        />
                        <span className={styles.recaptchaTypeText}>
                          <span className={styles.recaptchaTypeLabel}>{option.label}</span>
                          <span className={styles.recaptchaTypeDescription}>
                            {option.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={panelStyles.field}>
              <span className={styles.sectionLabel}>{CAPTCHA_FAILURE_HANDLING_COPY.sectionLabel}</span>
              <div className={panelStyles.toggleRow}>
                <WuToggle
                  Label={CAPTCHA_FAILURE_HANDLING_COPY.toggleLabel}
                  labelPosition="right"
                  checked={settings.showV2OnV3VerificationFailed}
                  onChange={(showV2OnV3VerificationFailed) =>
                    patch({ showV2OnV3VerificationFailed })
                  }
                />
              </div>
              <p className={styles.toggleDescription}>
                {CAPTCHA_FAILURE_HANDLING_COPY.toggleDescription}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
