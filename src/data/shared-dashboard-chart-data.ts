import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import type { SharedDashboardResponse } from './mock-shared-urls';

const COUNTRIES = [
  { id: 'IN', name: 'India', longitude: 78.9, latitude: 20.6 },
  { id: 'US', name: 'United States', longitude: -98.6, latitude: 39.8 },
  { id: 'GB', name: 'United Kingdom', longitude: -2.5, latitude: 54.7 },
  { id: 'DE', name: 'Germany', longitude: 10.5, latitude: 51.2 },
];
const GENDERS = ['Female', 'Male', 'Other'];
const COLORS = ['#1b87e6', '#70b8f0', '#1b3380', '#7996bb', '#a6c9e5', '#cfdfed'];

export function sharedResponseMean(responses: SharedDashboardResponse[]): string {
  return responses.length ? (responses.reduce((sum, response) => sum + response.satisfaction, 0) / responses.length).toFixed(2) : '—';
}

/** All shared-view widget data comes from the same filtered, synthetic response set. */
export function buildSharedChartPayload(responses: SharedDashboardResponse[]): AiWidgetChartPayload {
  const totalResponses = responses.length;
  const completed = responses.filter((response) => response.status === 'Completed').length;
  const averageSeconds = totalResponses ? Math.round(responses.reduce((sum, response) => sum + response.durationSeconds, 0) / totalResponses) : 0;
  const avgMinutes = Math.floor(averageSeconds / 60);
  const avgSeconds = averageSeconds % 60;
  const dates = responses.map((response) => response.respondedAt).sort();
  const durations = responses.map((response) => response.durationSeconds);
  const ageBarItems = ['18-24', '25-34', '35-44', '45-54', '55-64', 'Above 64'].map((category, index) => ({
    category, color: COLORS[index],
    value: totalResponses ? Math.round(responses.filter((response) => response.age === category).length / totalResponses * 1000) / 10 : 0,
  }));
  const mapPoints = COUNTRIES.map((country) => ({ ...country, value: responses.filter((response) => response.country === country.name).length }));
  const nps = (items: SharedDashboardResponse[]) => items.length ? Math.round((items.filter((item) => item.recommendation >= 9).length - items.filter((item) => item.recommendation <= 6).length) / items.length * 100) : 0;
  const series = GENDERS.map((name, index) => ({ name, field: `gender${index}`, color: COLORS[index] }));
  const comparativeBarRows = COUNTRIES.map(({ name }) => ({
    category: name,
    ...Object.fromEntries(GENDERS.map((gender, index) => [`gender${index}`, responses.filter((response) => response.country === name && response.gender === gender).length])),
  }));
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  const segmentTrendRows = months.map((month) => ({
    category: month,
    ...Object.fromEntries(GENDERS.map((gender, index) => [`gender${index}`, responses.filter((response) => response.respondedAt.startsWith(month) && response.gender === gender).length])),
  }));
  return {
    ageBarItems,
    npsBenchmarkItems: COUNTRIES.map(({ name }) => ({ category: name, npsScore: nps(responses.filter((response) => response.country === name)) })),
    npsBenchmarkResponseCount: totalResponses,
    barItems: ageBarItems, pieSegments: [], linePoints: [], mapPoints,
    responseInfo: {
      totalResponses, completed, avgMinutes, avgSeconds, questionCount: 6,
      firstResponseDate: dates[0] ?? '', lastResponseDate: dates.at(-1) ?? '',
      minResponseSeconds: durations.length ? Math.min(...durations) : 0,
      maxResponseSeconds: durations.length ? Math.max(...durations) : 0,
    },
    totalResponses, completed, avgMinutes, avgSeconds, gaugeScore: nps(responses),
    statValue: totalResponses ? Number(sharedResponseMean(responses)) : 0,
    leaderboard: [], tableRows: [], stackSegments: [], pictorial: [], imageBars: [], benchmarkItems: [],
    comparativeBarRows, comparativeBarSeries: series,
    segmentTrendRows, segmentTrendSeries: series, matrixStackBarRows: [], matrixStackBarSeries: [],
  };
}
