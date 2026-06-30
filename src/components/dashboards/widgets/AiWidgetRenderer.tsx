'use client';

import { useMemo } from 'react';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import { AGE_BAR_DEMO_DATA } from '@/data/mock-age-bar';
import {
  type AiWidgetType,
  createSeededRandom,
  randomInt,
  randomPercent,
} from '@/data/mock-ai-widgets';
import type {
  AmChartWidgetType,
  MatrixAmChartWidgetType,
} from '@/components/charts/amcharts/types';

type DashboardAmChartType = Exclude<AmChartWidgetType, MatrixAmChartWidgetType>;
import { MeanStatWidget } from '@/components/dashboards/widgets/MeanStatWidget';
import { NpsBenchmarkWidget } from '@/components/dashboards/widgets/NpsBenchmarkWidget';
import { ResponseInfoWidget } from '@/components/dashboards/widgets/ResponseInfoWidget';
import {
  COMPARATIVE_BAR_DEMO_DATA,
  COMPARATIVE_BAR_SERIES,
} from '@/data/mock-comparative-bar';
import {
  SEGMENT_TREND_DEMO_DATA,
  SEGMENT_TREND_SERIES,
} from '@/data/mock-segment-trend';
import {
  NPS_BENCHMARK_DEMO_DATA,
  NPS_BENCHMARK_RESPONSE_COUNT,
} from '@/data/mock-nps-benchmark';
import styles from './AiWidgetRenderer.module.css';

const AMCHART_TYPES: DashboardAmChartType[] = [
  'map',
  'bar',
  'pie',
  'line',
  'donut',
  'scoring-trend',
  'gauge',
  'scoring-donut',
  'benchmark',
  'semi-circle',
  'image-bar',
  'pictorial',
  'stackbar',
  'comparative-bar',
  'segment-trend',
];

function isAmChartType(type: AiWidgetType): type is DashboardAmChartType {
  return AMCHART_TYPES.includes(type as DashboardAmChartType);
}

interface AiWidgetRendererProps {
  widgetId: string;
  type: AiWidgetType;
  typography?: AmChartTypography;
  chartInstanceId?: string;
}

function buildChartPayload(widgetId: string): AiWidgetChartPayload {
  const rand = createSeededRandom(widgetId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

  const labels = ['18-24', '25-34', '35-44', '45-54', '55-64', 'Above 64'];
  const barItems = labels.map((label) => ({
    category: label,
    value: randomPercent(rand),
  }));

  const pieSegments = ['Promoters', 'Passives', 'Detractors', 'Unknown'].map((label) => ({
    category: label,
    value: randomInt(rand, 8, 45),
  }));

  const linePoints = Array.from({ length: 8 }, (_, i) => ({
    category: `W${i + 1}`,
    value: randomInt(rand, 20, 95),
  }));

  const mapPoints = [
    { id: 'US', name: 'United States', value: randomInt(rand, 400, 2200) },
    { id: 'GB', name: 'United Kingdom', value: randomInt(rand, 100, 800) },
    { id: 'DE', name: 'Germany', value: randomInt(rand, 80, 600) },
    { id: 'FR', name: 'France', value: randomInt(rand, 50, 400) },
    { id: 'IN', name: 'India', value: randomInt(rand, 50, 350) },
    { id: 'AU', name: 'Australia', value: randomInt(rand, 1, 120) },
  ];

  const useDemoResponseInfo = widgetId === 'w-response';
  const totalResponses = useDemoResponseInfo ? 2680 : randomInt(rand, 1800, 3200);
  const completed = useDemoResponseInfo ? 1822 : randomInt(rand, Math.floor(totalResponses * 0.6), totalResponses);
  const avgMinutes = useDemoResponseInfo ? 11 : randomInt(rand, 4, 18);
  const avgSeconds = useDemoResponseInfo ? 42 : randomInt(rand, 0, 59);
  const questionCount = useDemoResponseInfo ? 23 : randomInt(rand, 12, 35);
  const firstResponseDate = '2026-02-24T10:00:00Z';
  const lastResponseDate = '2026-05-09T16:30:00Z';
  const minResponseSeconds = useDemoResponseInfo ? 3 : randomInt(rand, 2, 45);
  const maxResponseSeconds = useDemoResponseInfo ? 11520 : randomInt(rand, 3600, 12000);

  const responseInfo = {
    totalResponses,
    completed,
    avgMinutes,
    avgSeconds,
    questionCount,
    firstResponseDate,
    lastResponseDate,
    minResponseSeconds,
    maxResponseSeconds,
  };

  const useNpsBenchmarkDemo = widgetId === 'w-nps-benchmark';
  const useComparativeBarDemo = widgetId === 'w-comparative-bar';
  const useSegmentTrendDemo = widgetId === 'w-segment-trend';

  return {
    ageBarItems: AGE_BAR_DEMO_DATA,
    npsBenchmarkItems: useNpsBenchmarkDemo ? NPS_BENCHMARK_DEMO_DATA : [],
    npsBenchmarkResponseCount: useNpsBenchmarkDemo ? NPS_BENCHMARK_RESPONSE_COUNT : 0,
    barItems,
    pieSegments,
    linePoints,
    mapPoints,
    responseInfo,
    totalResponses,
    completed,
    avgMinutes,
    avgSeconds,
    gaugeScore: randomInt(rand, 35, 92),
    statValue: randomInt(rand, 62, 98),
    leaderboard: ['North America', 'EMEA', 'APAC', 'LATAM', 'ANZ'].map((region) => ({
      region,
      score: randomInt(rand, 55, 99),
    })),
    tableRows: Array.from({ length: 5 }, (_, i) => ({
      question: `Question ${i + 1}`,
      responses: randomInt(rand, 120, 2400),
      avg: randomPercent(rand),
    })),
    stackSegments: ['Segment A', 'Segment B', 'Segment C', 'Segment D'].map((label) => ({
      category: label,
      value: randomInt(rand, 10, 35),
    })),
    pictorial: [
      { category: 'Male', value: randomInt(rand, 20, 50) },
      { category: 'Female', value: randomInt(rand, 20, 50) },
      { category: 'Other', value: randomInt(rand, 5, 20) },
    ],
    imageBars: ['Product A', 'Product B', 'Product C', 'Product D'].map((label) => ({
      category: label,
      value: randomInt(rand, 15, 95),
    })),
    benchmarkItems: ['Team A', 'Team B', 'Team C', 'Industry avg'].map((label) => ({
      category: label,
      value: randomInt(rand, 40, 95),
    })),
    comparativeBarSeries: useComparativeBarDemo ? COMPARATIVE_BAR_SERIES : [],
    comparativeBarRows: useComparativeBarDemo ? COMPARATIVE_BAR_DEMO_DATA : [],
    segmentTrendSeries: useSegmentTrendDemo ? SEGMENT_TREND_SERIES : [],
    segmentTrendRows: useSegmentTrendDemo ? SEGMENT_TREND_DEMO_DATA : [],
    matrixStackBarRows: [],
    matrixStackBarSeries: [],
  };
}

export function AiWidgetRenderer({
  widgetId,
  type,
  typography,
  chartInstanceId,
}: AiWidgetRendererProps) {
  const chartPayload = useMemo(() => buildChartPayload(widgetId), [widgetId]);

  if (type === 'benchmark') {
    return <NpsBenchmarkWidget widgetId={widgetId} chartPayload={chartPayload} />;
  }

  if (type === 'stat-metric') {
    return <MeanStatWidget />;
  }

  if (isAmChartType(type)) {
    return (
      <BiAmChart
        widgetId={chartInstanceId ?? widgetId}
        chartType={type}
        data={chartPayload}
        typography={typography}
      />
    );
  }

  switch (type) {
    case 'response-info':
      return <ResponseInfoWidget data={chartPayload.responseInfo} />;

    case 'leaderboard':
      return (
        <ol className={styles.leaderList}>
          {chartPayload.leaderboard
            .sort((a, b) => b.score - a.score)
            .map((item, i) => (
              <li key={item.region} className={styles.leaderItem}>
                <span className={styles.rank}>{i + 1}</span>
                <span>{item.region}</span>
                <span className={styles.barPct}>{item.score}</span>
              </li>
            ))}
        </ol>
      );

    case 'tabular':
      return (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Question</th>
              <th>Responses</th>
              <th>Avg score</th>
            </tr>
          </thead>
          <tbody>
            {chartPayload.tableRows.map((row) => (
              <tr key={row.question}>
                <td>{row.question}</td>
                <td>{row.responses.toLocaleString()}</td>
                <td>{row.avg}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'stat-highlight':
      return (
        <div className={styles.statHighlight}>
          <span className={styles.statValue}>{chartPayload.statValue}%</span>
          <span className={styles.statLabel}>Overall satisfaction</span>
          <span className={styles.statDelta}>
            +{randomInt(createSeededRandom(widgetId.length), 2, 12)}% vs last period
          </span>
        </div>
      );

    default:
      return null;
  }
}
