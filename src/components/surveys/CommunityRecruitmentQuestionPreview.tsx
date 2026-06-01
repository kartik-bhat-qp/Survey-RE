'use client';

import type { CommunityRecruitmentPreviewData } from '@/data/mock-add-question-previews';
import styles from './CommunityRecruitmentQuestionPreview.module.css';

interface CommunityRecruitmentQuestionPreviewProps {
  data: CommunityRecruitmentPreviewData;
}

export function CommunityRecruitmentQuestionPreview({
  data,
}: CommunityRecruitmentQuestionPreviewProps) {
  return (
    <ul className={styles.fieldList} aria-hidden>
      {data.fields.map((label) => (
        <li key={label} className={styles.field}>
          <span className={styles.fieldLabel}>{label}</span>
          <div className={styles.fieldLine} />
        </li>
      ))}
    </ul>
  );
}
