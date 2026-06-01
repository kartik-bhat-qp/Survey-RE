'use client';

import { UsStatesHeatmapMap } from '@/components/surveys/UsStatesHeatmapMap';
import styles from './HeatmapQuestionPreview.module.css';

export function HeatmapQuestionPreview() {
  return (
    <div className={styles.root} aria-hidden>
      <UsStatesHeatmapMap />
    </div>
  );
}
