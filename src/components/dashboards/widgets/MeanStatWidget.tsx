'use client';

import { MEAN_STAT_DEMO_VALUE } from '@/data/mock-mean-stat';
import styles from './MeanStatWidget.module.css';

interface MeanStatWidgetProps {
  value?: string;
}

export function MeanStatWidget({ value = MEAN_STAT_DEMO_VALUE }: MeanStatWidgetProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
