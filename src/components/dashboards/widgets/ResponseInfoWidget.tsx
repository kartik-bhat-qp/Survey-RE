'use client';

import { formatDate } from '@/data/mock-utils';
import type { ResponseInfoData } from '@/components/charts/amcharts/types';
import styles from './ResponseInfoWidget.module.css';

interface MetricProps {
  value: string;
  label: string;
  iconClass: string;
}

function Metric({ value, label, iconClass }: MetricProps) {
  return (
    <div className={styles.metric}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>
        <span className={`${iconClass} ${styles.labelIcon}`} aria-hidden />
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatAvgResponseTime(minutes: number, seconds: number): string {
  return `${minutes} mins ${seconds} sec`;
}

function formatDurationSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours} hrs ${minutes} mins` : `${hours} hrs`;
  }
  if (minutes > 0 && seconds > 0) {
    return `${minutes} mins ${seconds} sec`;
  }
  if (minutes > 0) {
    return `${minutes} mins`;
  }
  return `${seconds} sec`;
}

interface ResponseInfoWidgetProps {
  data: ResponseInfoData;
}

export function ResponseInfoWidget({ data }: ResponseInfoWidgetProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <Metric
          value={data.totalResponses.toLocaleString()}
          label="Total responses"
          iconClass="wm-forum"
        />
        <Metric
          value={data.completed.toLocaleString()}
          label="Completed responses"
          iconClass="wm-assignment-turned-in"
        />
        <Metric
          value={formatAvgResponseTime(data.avgMinutes, data.avgSeconds)}
          label="Average response time"
          iconClass="wm-timer"
        />
      </div>
      <div className={styles.row}>
        <Metric
          value={String(data.questionCount)}
          label="Question count"
          iconClass="wm-help-outline"
        />
        <Metric
          value={formatDate(data.firstResponseDate)}
          label="First response date"
          iconClass="wm-event"
        />
        <Metric
          value={formatDate(data.lastResponseDate)}
          label="Last response date"
          iconClass="wm-event"
        />
      </div>
      <div className={styles.rowCentered}>
        <Metric
          value={formatDurationSeconds(data.minResponseSeconds)}
          label="Min response time"
          iconClass="wm-timer"
        />
        <Metric
          value={formatDurationSeconds(data.maxResponseSeconds)}
          label="Max response time"
          iconClass="wm-timer"
        />
      </div>
    </div>
  );
}
