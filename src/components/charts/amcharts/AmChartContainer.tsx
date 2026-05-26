'use client';

import styles from './AmChartContainer.module.css';

interface AmChartContainerProps {
  chartId: string;
}

export function AmChartContainer({ chartId }: AmChartContainerProps) {
  return <div id={chartId} className={styles.container} />;
}

//test comment dxfsdf
