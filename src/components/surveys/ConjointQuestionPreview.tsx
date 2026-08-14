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
            <th scope="col">Feature Type</th>
            <th scope="col">Levels</th>
          </tr>
        </thead>
        <tbody>
          {data.features.map((row, index) => (
            <tr key={row.feature}>
              <th scope="row">
                {index + 1} {row.feature}
              </th>
              <td>{row.featureType}</td>
              <td>
                <ul className={styles.levelList}>
                  {row.levels.map((level) => (
                    <li key={level}>{level}</li>
                  ))}
                </ul>
                <span className={styles.addLink}>Add Level</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.tableTools}>
        <span className={styles.addLink}>Add Feature</span>
        <span className={styles.bulkLinks}>
          Bulk Edit Features | Bulk Edit Levels
        </span>
      </div>

      <div className={styles.summaryBar}>
        <span>
          Task Count: <strong>{data.taskCount}</strong>
        </span>
        <span>
          Concept Per Task: <strong>{data.conceptPerTask}</strong>
        </span>
        <span>Not Applicable Option</span>
      </div>
      <p className={styles.infoBanner}>
        <span className={`wm-warning ${styles.infoIcon}`} aria-hidden />
        Conjoint questions require at least 2 features and 2 levels for each feature.
      </p>
    </div>
  );
}
