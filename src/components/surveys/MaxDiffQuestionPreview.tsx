'use client';

import type { MaxDiffPreviewData } from '@/data/mock-add-question-previews';
import styles from './MaxDiffQuestionPreview.module.css';

interface MaxDiffQuestionPreviewProps {
  data: MaxDiffPreviewData;
}

export function MaxDiffQuestionPreview({ data }: MaxDiffQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.edgeHeader} scope="col">
              {data.leastLabel}
            </th>
            <th className={styles.optionHeader} scope="col" />
            <th className={styles.edgeHeader} scope="col">
              {data.mostLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.options.map((option) => (
            <tr key={option} className={styles.dataRow}>
              <td className={styles.radioCell}>
                <input type="radio" disabled tabIndex={-1} aria-hidden />
              </td>
              <td className={styles.optionCell}>{option}</td>
              <td className={styles.radioCell}>
                <input type="radio" disabled tabIndex={-1} aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
