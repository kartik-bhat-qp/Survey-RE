'use client';

import type { ConjointPreviewData } from '@/data/mock-add-question-previews';
import styles from './ConjointQuestionPreview.module.css';

interface ConjointQuestionPreviewProps {
  data: ConjointPreviewData;
}

export function ConjointQuestionPreview({ data }: ConjointQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <ul className={styles.configTabs}>
        {data.configTabs.map((tab) => (
          <li key={tab.id}>
            <span
              className={
                tab.active ? `${styles.configTab} ${styles.configTabActive}` : styles.configTab
              }
            >
              {tab.label}
              {tab.suffix ? (
                <>
                  : <strong className={styles.configTabValue}>{tab.suffix}</strong>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <table className={styles.featureTable}>
        <thead>
          <tr>
            <th scope="col">Features</th>
            <th scope="col">Levels</th>
          </tr>
        </thead>
        <tbody>
          {data.features.map((row) => (
            <tr key={row.feature}>
              <th scope="row">{row.feature}</th>
              <td>
                <ul className={styles.levelList}>
                  {row.levels.map((level) => (
                    <li key={level}>{level}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.summaryBar}>
        <span>
          Task Count: <strong>{data.taskCount}</strong>
        </span>
        <span>
          Concept Per Task: <strong>{data.conceptPerTask}</strong>
        </span>
      </div>
    </div>
  );
}
