'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  DEFAULT_STALE_COOKIE_BROWSER,
  DEFAULT_STALE_COOKIE_PLATFORM,
  STALE_COOKIE_BROWSERS,
  STALE_COOKIE_PAGE_COPY,
  STALE_COOKIE_PLATFORMS,
  STALE_COOKIE_STEPS,
  type StaleCookieBrowser,
  type StaleCookiePlatform,
} from '@/data/mock-stale-cookies';
import styles from './StaleCookiesPage.module.css';

function clearSiteCookies(): void {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

export default function StaleCookiesPage() {
  const { showToast } = useWuShowToast();
  const [stepsOpen, setStepsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<StaleCookiePlatform>(
    DEFAULT_STALE_COOKIE_PLATFORM
  );
  const [activeBrowser, setActiveBrowser] = useState<StaleCookieBrowser>(
    DEFAULT_STALE_COOKIE_BROWSER
  );

  function handleReload(): void {
    clearSiteCookies();
    showToast({ message: 'Site data cleared. Reloading the survey…', variant: 'success' });
    window.setTimeout(() => window.location.reload(), 600);
  }

  const activeSteps = STALE_COOKIE_STEPS[activeBrowser][activePlatform];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.badge}>
              <div className={styles.badgeDot} />
            </div>
            <div>
              <h1 className={styles.title}>{STALE_COOKIE_PAGE_COPY.title}</h1>
              <p className={styles.description}>{STALE_COOKIE_PAGE_COPY.description}</p>
            </div>
          </div>
          <div className={styles.illustration}>
            <svg
              viewBox="0 0 260 170"
              width="260"
              height="170"
              role="img"
              aria-label="Browser with a cookie being refreshed"
            >
              <rect x="20" y="18" width="180" height="128" rx="8" fill="#eaf3fd" />
              <rect x="20" y="18" width="180" height="28" rx="8" fill="#1b3380" />
              <rect x="20" y="38" width="180" height="8" fill="#1b3380" />
              <circle cx="36" cy="32" r="4" fill="#7ea4d9" />
              <circle cx="50" cy="32" r="4" fill="#7ea4d9" />
              <circle cx="64" cy="32" r="4" fill="#7ea4d9" />
              <rect x="80" y="26" width="108" height="12" rx="6" fill="#42548f" />
              <rect x="38" y="62" width="100" height="10" rx="5" fill="#c3ddf5" />
              <rect x="38" y="82" width="130" height="10" rx="5" fill="#c3ddf5" />
              <rect x="38" y="102" width="80" height="10" rx="5" fill="#c3ddf5" />
              <circle cx="196" cy="112" r="38" fill="#f0b452" />
              <circle cx="182" cy="100" r="5" fill="#8a5a1e" />
              <circle cx="205" cy="96" r="6" fill="#8a5a1e" />
              <circle cx="212" cy="120" r="5" fill="#8a5a1e" />
              <circle cx="190" cy="126" r="6" fill="#8a5a1e" />
              <circle cx="199" cy="111" r="3" fill="#8a5a1e" />
              <path
                d="M 226 60 A 26 26 0 1 0 232 86"
                fill="none"
                stroke="#1b87e6"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path d="M 222 46 L 228 62 L 211 64 Z" fill="#1b87e6" />
            </svg>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.reloadButton} onClick={handleReload}>
            {STALE_COOKIE_PAGE_COPY.reloadLabel}
          </button>
          <span className={styles.actionHint}>{STALE_COOKIE_PAGE_COPY.reloadHint}</span>
        </div>

        <div className={styles.manualSection}>
          <button
            type="button"
            className={styles.manualToggle}
            aria-expanded={stepsOpen}
            onClick={() => setStepsOpen((open) => !open)}
          >
            <span className={styles.manualToggleLabel}>
              {STALE_COOKIE_PAGE_COPY.manualStepsLabel}
            </span>
            <span
              className={`${styles.manualToggleArrow} ${stepsOpen ? styles.manualToggleArrowOpen : ''}`}
              aria-hidden
            >
              v
            </span>
          </button>

          {stepsOpen ? (
            <div className={styles.manualBody}>
              <div className={styles.platformTabs}>
                {STALE_COOKIE_PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className={`${styles.platformTab} ${
                      platform === activePlatform ? styles.platformTabActive : ''
                    }`}
                    onClick={() => setActivePlatform(platform)}
                  >
                    {platform}
                  </button>
                ))}
              </div>
              <div className={styles.browserTabs}>
                {STALE_COOKIE_BROWSERS.map((browser) => (
                  <button
                    key={browser}
                    type="button"
                    className={`${styles.browserTab} ${
                      browser === activeBrowser ? styles.browserTabActive : ''
                    }`}
                    onClick={() => setActiveBrowser(browser)}
                  >
                    {browser}
                  </button>
                ))}
              </div>
              <div className={styles.stepsPanel}>
                <ol className={styles.stepsList}>
                  {activeSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <p className={styles.incognitoHint}>{STALE_COOKIE_PAGE_COPY.incognitoHint}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.footer}>
        <span>Powered by</span>
        <span className={styles.footerBrand}>QuestionPro</span>
      </div>
    </div>
  );
}
