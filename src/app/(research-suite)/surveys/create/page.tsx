'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './NewSurveyCreationFlowPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

export default function NewSurveyCreationFlowPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [surveyName, setSurveyName] = useState('');

  function handleCreateSurvey() {
    const trimmed = surveyName.trim();
    if (trimmed.length === 0) {
      showToast({ message: 'Enter a survey name to continue', variant: 'error' });
      return;
    }
    showToast({ message: `"${trimmed}" created`, variant: 'success' });
    router.push('/surveys/1');
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to QuestionPro!</h1>

        <div className={styles.sections}>
          <section className={styles.section}>
            <div className={styles.iconWrap} aria-hidden>
              <span className={`wm-directions-run ${styles.sectionIcon}`} />
            </div>
            <div className={styles.sectionBody}>
              <p className={styles.sectionText}>
                Getting started is easy! Create your first survey now.
              </p>
              <div className={styles.createRow}>
                <WuInput
                  variant="outlined"
                  placeholder="Enter Survey Name"
                  value={surveyName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setSurveyName(event.target.value)
                  }
                  className={styles.nameInput}
                  aria-label="Survey name"
                />
                <WuButton onClick={handleCreateSurvey}>Create Survey</WuButton>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.iconWrap} aria-hidden>
              <span className={`wm-groups ${styles.sectionIcon}`} />
            </div>
            <div className={styles.sectionBody}>
              <p className={styles.sectionText}>
                Need help getting started? Use a professionally written survey template.
              </p>
              <button
                type="button"
                className={styles.textLink}
                onClick={() =>
                  showToast({ message: 'Survey template library opened', variant: 'success' })
                }
              >
                Browse Templates
                <span className={`wm-arrow-drop-down ${styles.linkCaret}`} aria-hidden />
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.iconWrap} aria-hidden>
              <span className={`wm-rocket-launch ${styles.sectionIcon}`} />
            </div>
            <div className={styles.sectionBody}>
              <p className={styles.sectionText}>
                Need advanced features? Try our full platform, no credit card required.
              </p>
              <button
                type="button"
                className={styles.textLink}
                onClick={() =>
                  showToast({ message: '10-day trial started', variant: 'success' })
                }
              >
                Start 10 Days Trial
                <span className={`wm-arrow-drop-down ${styles.linkCaret}`} aria-hidden />
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerLabel}>QuestionPro Essentials</span>
        <div className={styles.footerActions}>
          <Link href="/surveys" className={styles.footerIconBtn} aria-label="My surveys">
            <span className="wm-home" aria-hidden />
          </Link>
          <button
            type="button"
            className={styles.footerIconBtn}
            aria-label="Recent activity"
            onClick={() =>
              showToast({ message: 'Recent activity is not available in this prototype', variant: 'info' })
            }
          >
            <span className="wm-history" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  );
}
