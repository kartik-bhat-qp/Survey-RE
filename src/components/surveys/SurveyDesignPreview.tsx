'use client';

import type { CSSProperties } from 'react';
import {
  SURVEY_DESIGN_PREVIEW,
  getSurveyDesignFontFamily,
  getSurveyDesignTheme,
  type SurveyDesignCustomizeSettings,
  type SurveyDesignBehaviorSettings,
  type SurveyDesignPreviewDevice,
  type SurveyLayoutId,
} from '@/data/mock-survey-design';
import styles from './SurveyDesignPreview.module.css';

interface SurveyDesignPreviewProps {
  layout: SurveyLayoutId;
  themeId: string;
  customize: SurveyDesignCustomizeSettings;
  behavior: SurveyDesignBehaviorSettings;
  device: SurveyDesignPreviewDevice;
}

function getBackgroundStyle(
  customize: SurveyDesignCustomizeSettings,
  themeBackground: string,
  accentColor: string
): CSSProperties {
  if (customize.backgroundStyle === 'gradient') {
    return {
      background: `linear-gradient(180deg, ${themeBackground} 0%, ${accentColor}12 100%)`,
    };
  }

  if (customize.backgroundStyle === 'pattern') {
    return {
      backgroundColor: themeBackground,
      backgroundImage: `radial-gradient(${accentColor}22 1px, transparent 1px)`,
      backgroundSize: '12px 12px',
    };
  }

  return { backgroundColor: themeBackground };
}

export function SurveyDesignPreview({
  layout,
  themeId,
  customize,
  behavior,
  device,
}: SurveyDesignPreviewProps) {
  const theme = getSurveyDesignTheme(themeId);
  const preview = SURVEY_DESIGN_PREVIEW;
  const cssVars = {
    '--survey-design-bg': theme.backgroundColor,
    '--survey-design-header': theme.headerColor,
    '--survey-design-accent': theme.optionAccentColor,
    '--survey-design-button': theme.buttonColor,
    '--survey-design-font': getSurveyDesignFontFamily(customize.fontFamily),
  } as CSSProperties;

  const shellClass =
    device === 'tablet'
      ? `${styles.monitorShell} ${styles.monitorShellTablet}`
      : device === 'mobile'
        ? `${styles.monitorShell} ${styles.monitorShellMobile}`
        : styles.monitorShell;

  return (
    <div className={styles.previewPane}>
      <div className={styles.previewStage}>
        <div className={shellClass}>
          <div className={styles.monitorBezel}>
            <div className={styles.surveyShell} style={{ ...cssVars, ...getBackgroundStyle(customize, theme.backgroundColor, theme.accentColor) }}>
              <header className={styles.surveyHeader}>
                <span className={styles.surveyHeaderTitle}>{preview.surveyTitle}</span>
                <button type="button" className={styles.surveyHeaderClose} aria-hidden tabIndex={-1}>
                  <span className="wm-logout" />
                </button>
              </header>

              {customize.showProgressBar ? (
                <div className={styles.progressBar} aria-hidden>
                  <div className={styles.progressBarFill} />
                </div>
              ) : null}

              <div className={styles.surveyBody}>
                <div className={styles.surveyCanvas}>
                  <div className={styles.questionCard}>
                    {behavior.showRequiredIndicator ? (
                      <p className={styles.requiredNote}>Questions marked with a * are required</p>
                    ) : null}

                    <div className={styles.questionTitleRow}>
                      <h2 className={styles.questionTitle}>
                        {behavior.showRequiredIndicator ? (
                          <span className={styles.requiredMark} aria-hidden>
                            *{' '}
                          </span>
                        ) : null}
                        {preview.questionText}
                      </h2>
                      <span className={`wm-help-outline ${styles.helpIcon}`} aria-hidden />
                    </div>

                    <ul className={styles.optionList}>
                      {preview.options.map((option) => (
                        <li key={option}>
                          <label className={styles.optionLabel}>
                            <input
                              type="radio"
                              name="design-preview-option"
                              className={styles.optionRadio}
                              defaultChecked={option === 'Yes'}
                              readOnly
                            />
                            <span>{option}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {layout === 'focus' ? (
                  <div className={styles.focusFooter}>
                    <span
                      className={`${styles.backBtn} ${
                        behavior.allowBackNavigation ? '' : styles.backBtnDisabled
                      }`}
                      aria-hidden
                    >
                      <span className="wm-arrow-back" />
                    </span>
                    <button type="button" className={styles.nextBtn}>
                      Next
                    </button>
                  </div>
                ) : (
                  <div className={styles.focusFooter}>
                    <button type="button" className={styles.nextBtn}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SurveyDesignPreviewToolbar({
  device,
  onDeviceChange,
}: {
  device: SurveyDesignPreviewDevice;
  onDeviceChange: (device: SurveyDesignPreviewDevice) => void;
}) {
  const devices: { id: SurveyDesignPreviewDevice; icon: string; label: string }[] = [
    { id: 'desktop', icon: 'wm-desktop-windows', label: 'Desktop preview' },
    { id: 'tablet', icon: 'wm-tablet', label: 'Tablet preview' },
    { id: 'mobile', icon: 'wm-smartphone', label: 'Mobile preview' },
  ];

  return (
    <div className={styles.previewToolbar}>
      <div className={styles.deviceToggleGroup} role="group" aria-label="Preview device">
        {devices.map((item) => (
          <button
            key={item.id}
            type="button"
            className={device === item.id ? styles.deviceToggleBtnActive : styles.deviceToggleBtn}
            aria-label={item.label}
            aria-pressed={device === item.id}
            onClick={() => onDeviceChange(item.id)}
          >
            <span className={item.icon} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
