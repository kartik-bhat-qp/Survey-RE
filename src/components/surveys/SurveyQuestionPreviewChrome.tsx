'use client';

import { useState } from 'react';
import {
  SurveyPreviewToolbarContext,
  type SurveyPreviewToolbarToggles,
} from '@/components/surveys/SurveyPreviewToolbarContext';
import styles from './SurveyQuestionPreviewChrome.module.css';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface SurveyQuestionPreviewChromeProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const TOOLBAR_TOGGLES: { id: keyof SurveyPreviewToolbarToggles; label: string }[] = [
  { id: 'urlVariable', label: 'URL Variable' },
  { id: 'validations', label: 'Validations' },
  { id: 'logic', label: 'Logic' },
  { id: 'pageBreaks', label: 'Page Breaks' },
];

const DEFAULT_TOOLBAR_TOGGLES: SurveyPreviewToolbarToggles = {
  urlVariable: true,
  validations: true,
  logic: true,
  pageBreaks: true,
};

export function SurveyQuestionPreviewChrome({
  children,
  onClose,
}: SurveyQuestionPreviewChromeProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [toggles, setToggles] = useState<SurveyPreviewToolbarToggles>(DEFAULT_TOOLBAR_TOGGLES);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarToggles}>
          {TOOLBAR_TOGGLES.map((item) => (
            <label key={item.id} className={styles.toggleItem}>
              <span className={styles.toggleLabel}>{item.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={toggles[item.id]}
                className={`${styles.toggleSwitch} ${
                  toggles[item.id] ? styles.toggleSwitchOn : ''
                }`}
                onClick={() =>
                  setToggles((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                }
              >
                <span className={styles.toggleKnob} />
              </button>
            </label>
          ))}
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.toolbarIconBtn} aria-label="Open in new tab">
            <span className="wm-open-in-new" aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.toolbarIconBtn} ${
              device === 'desktop' ? styles.toolbarIconBtnActive : ''
            }`}
            aria-label="Desktop preview"
            aria-pressed={device === 'desktop'}
            onClick={() => setDevice('desktop')}
          >
            <span className="wm-desktop-windows" aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.toolbarIconBtn} ${
              device === 'tablet' ? styles.toolbarIconBtnActive : ''
            }`}
            aria-label="Tablet preview"
            aria-pressed={device === 'tablet'}
            onClick={() => setDevice('tablet')}
          >
            <span className="wm-tablet" aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.toolbarIconBtn} ${
              device === 'mobile' ? styles.toolbarIconBtnActive : ''
            }`}
            aria-label="Mobile preview"
            aria-pressed={device === 'mobile'}
            onClick={() => setDevice('mobile')}
          >
            <span className="wm-smartphone" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.toolbarIconBtn}
            aria-label="Close preview"
            onClick={onClose}
          >
            <span className="wm-close" aria-hidden />
          </button>
        </div>
      </div>

      <div className={styles.draftBar} aria-hidden>
        Draft
      </div>

      <div
        className={`${styles.deviceFrame} ${
          device === 'tablet'
            ? styles.deviceFrameTablet
            : device === 'mobile'
              ? styles.deviceFrameMobile
              : ''
        }`}
      >
        <SurveyPreviewToolbarContext.Provider value={toggles}>
          {children}
        </SurveyPreviewToolbarContext.Provider>
      </div>
    </div>
  );
}
