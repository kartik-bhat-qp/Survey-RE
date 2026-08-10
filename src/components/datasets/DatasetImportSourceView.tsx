'use client';

import dynamic from 'next/dynamic';
import styles from './DatasetImportSourceView.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);

export interface DatasetImportSourceViewProps {
  datasetName: string;
  surveyName: string;
  onSyncAll: () => void;
  onUploadData: () => void;
  onManualImport: () => void;
  onTextAiImport: () => void;
}

const SETUP_STEPS = [
  { id: 'type', label: 'Dataset type', state: 'done' as const, icon: 'wm-check' },
  { id: 'source', label: 'Data source', state: 'current' as const, icon: 'wm-cloud-upload' },
  { id: 'variables', label: 'Variables', state: 'upcoming' as const, icon: 'wm-view-list' },
];

export function DatasetImportSourceView({
  datasetName,
  surveyName,
  onSyncAll,
  onUploadData,
  onManualImport,
  onTextAiImport,
}: DatasetImportSourceViewProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <WuHeading size="xl" className={styles.title}>
          {datasetName || 'Untitled dataset'}
        </WuHeading>
        <div className={styles.headerActions}>
          <button type="button" className={styles.syncAllBtn} onClick={onSyncAll}>
            <span className="wm-sync" aria-hidden />
            Sync all
          </button>
          <WuButton
            className={styles.uploadBtn}
            Icon={<span className="wm-cloud-upload" aria-hidden />}
            onClick={onUploadData}
          >
            Upload data
          </WuButton>
        </div>
      </header>

      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Datasource type</span>
          <span className={styles.metaPill}>Survey</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Survey name</span>
          <span className={styles.metaPill}>{surveyName || '—'}</span>
        </div>
      </div>

      <nav className={styles.stepper} aria-label="Dataset setup progress">
        {SETUP_STEPS.map((step, index) => (
          <span key={step.id} className={styles.stepWrap}>
            {index > 0 ? <span className={styles.stepDivider} aria-hidden /> : null}
            <span
              className={`${styles.step} ${
                step.state === 'done'
                  ? styles.stepDone
                  : step.state === 'current'
                    ? styles.stepCurrent
                    : styles.stepUpcoming
              }`}
            >
              <span className={`${step.icon} ${styles.stepIcon}`} aria-hidden />
              <span className={styles.stepLabel}>{step.label}</span>
            </span>
          </span>
        ))}
      </nav>

      <div className={styles.body}>
        <h2 className={styles.heading}>What data do you want to import?</h2>
        <p className={styles.lede}>
          {datasetName || 'This dataset'} has no variables yet. Choose where the data should
          come from — you can upload more data later.
        </p>

        <div className={styles.cardGrid}>
          <button type="button" className={styles.sourceCard} onClick={onManualImport}>
            <span className={`wm-description ${styles.sourceIcon}`} aria-hidden />
            <span className={styles.sourceTitle}>Manual</span>
            <span className={styles.sourceSubtitle}>
              Upload an Excel or CSV file using the template
            </span>
            <span className={styles.sourceDescription}>
              We read the header row of your file to create variables, and let you map each
              column to a variable type before importing.
            </span>
            <span className={styles.tagRow}>
              <span className={styles.tag}>.xls</span>
              <span className={styles.tag}>.xlsx</span>
              <span className={styles.tag}>.csv</span>
            </span>
            <span className={styles.sourceCta}>
              Upload a file <span aria-hidden>→</span>
            </span>
          </button>

          <button type="button" className={styles.sourceCard} onClick={onTextAiImport}>
            <span className={`wc-ai ${styles.sourceIcon}`} aria-hidden />
            <span className={styles.sourceTitle}>TextAI</span>
            <span className={styles.sourceSubtitle}>
              Import the themes, sub-themes and sentiment for this dataset
            </span>
            <span className={styles.sourceDescription}>
              Pick a TextAI dashboard. Themes, sub-themes and sentiment are processed in the
              background and appear as variables when ready.
            </span>
            <span className={styles.tagRow}>
              <span className={styles.tag}>Themes</span>
              <span className={styles.tag}>Sub themes</span>
              <span className={styles.tag}>Sentiment</span>
            </span>
            <span className={styles.sourceCta}>
              Select a dashboard <span aria-hidden>→</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
