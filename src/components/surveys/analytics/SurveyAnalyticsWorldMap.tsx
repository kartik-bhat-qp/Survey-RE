'use client';

import { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import type { SurveyAnalyticsCountryRow } from '@/data/mock-survey-analytics';
import {
  buildSurveyAnalyticsMapOptions,
  HighchartsMap,
} from '@/components/surveys/analytics/survey-analytics-chart-options';
import styles from './SurveyAnalyticsCharts.module.css';

interface SurveyAnalyticsWorldMapProps {
  countries: SurveyAnalyticsCountryRow[];
}

export function SurveyAnalyticsWorldMap({ countries }: SurveyAnalyticsWorldMapProps) {
  const options = useMemo(() => buildSurveyAnalyticsMapOptions(countries), [countries]);

  return (
    <div className={styles.mapHost}>
      <HighchartsReact
        highcharts={HighchartsMap}
        constructorType="mapChart"
        options={options}
        immutable
      />
    </div>
  );
}
