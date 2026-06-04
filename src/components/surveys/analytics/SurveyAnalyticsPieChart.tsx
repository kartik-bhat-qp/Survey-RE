'use client';

import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { SurveyAnalyticsQuestionCard } from '@/data/mock-survey-analytics';
import { buildSurveyAnalyticsPieOptions } from '@/components/surveys/analytics/survey-analytics-chart-options';
import styles from './SurveyAnalyticsCharts.module.css';

interface SurveyAnalyticsPieChartProps {
  question: SurveyAnalyticsQuestionCard;
}

export function SurveyAnalyticsPieChart({ question }: SurveyAnalyticsPieChartProps) {
  const options = useMemo(() => buildSurveyAnalyticsPieOptions(question), [question]);

  return (
    <div className={styles.pieHost} aria-hidden>
      <HighchartsReact highcharts={Highcharts} options={options} immutable />
    </div>
  );
}
