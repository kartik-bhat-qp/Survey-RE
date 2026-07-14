'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  CAPTCHA_RECAPTCHA_TYPE_OPTIONS,
  type CaptchaRecaptchaType,
  type CaptchaSettings,
} from '@/data/mock-captcha-settings';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './CaptchaQuestionSettingsPanel.module.css';

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
      </div>
    </aside>
  );
}
