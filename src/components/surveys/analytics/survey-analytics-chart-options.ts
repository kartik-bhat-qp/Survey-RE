import type { Options, SeriesMapDataOptions, SeriesPieOptions } from 'highcharts';
import Highcharts from 'highcharts/highmaps';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import type {
  SurveyAnalyticsCountryRow,
  SurveyAnalyticsQuestionCard,
} from '@/data/mock-survey-analytics';

export const SURVEY_ANALYTICS_CHART_FONT = "'Fira Sans', sans-serif";

const PIE_SLICE_GRAY = '#9ca3af';
const PRIMARY_BLUE = '#1b87e6';
const PIE_EXPLODE_OFFSET = 14;

function chartBase(): Options {
  return {
    credits: { enabled: false },
    exporting: { enabled: false },
    title: { text: undefined },
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: SURVEY_ANALYTICS_CHART_FONT },
    },
  };
}

export function buildSurveyAnalyticsPieOptions(
  question: SurveyAnalyticsQuestionCard
): Options {
  const highlightIndex = question.highlightIndex;

  const seriesData = question.answers.map((row, index) => {
    const isHighlight = index === highlightIndex;
    return {
      name: row.answer,
      y: row.count,
      color: isHighlight ? PRIMARY_BLUE : PIE_SLICE_GRAY,
      sliced: isHighlight,
    };
  });

  const series: SeriesPieOptions = {
    type: 'pie',
    name: 'Responses',
    data: seriesData,
  };

  return {
    ...chartBase(),
    chart: {
      ...chartBase().chart,
      type: 'pie',
      height: 300,
      spacing: [8, 8, 8, 8],
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> ({point.percentage:.2f}%)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        borderColor: '#ffffff',
        borderWidth: 1,
        cursor: 'default',
        dataLabels: {
          enabled: true,
          connectorColor: '#94a3b8',
          connectorWidth: 1,
          distance: 24,
          format: '{point.name} : {point.percentage:.2f}%',
          style: {
            color: '#475569',
            fontSize: '11px',
            fontWeight: '400',
            textOutline: 'none',
          },
        },
        showInLegend: false,
        size: '68%',
        slicedOffset: PIE_EXPLODE_OFFSET,
        states: {
          hover: {
            brightness: 0.05,
            halo: { size: 0 },
          },
        },
      },
    },
    series: [series],
  };
}

/** ISO-2 / hc-key codes for response distribution choropleth. */
const COUNTRY_NAME_TO_HC_KEY: Record<string, string> = {
  India: 'in',
  'United States': 'us',
  'United Kingdom': 'gb',
  Canada: 'ca',
  Australia: 'au',
  Germany: 'de',
  France: 'fr',
  Brazil: 'br',
  Japan: 'jp',
};

function toMapSeriesData(countries: SurveyAnalyticsCountryRow[]): SeriesMapDataOptions[] {
  return countries
    .map((row) => {
      if (/^unknown$/i.test(row.country.trim())) return null;
      const hcKey = COUNTRY_NAME_TO_HC_KEY[row.country];
      if (!hcKey) return null;
      return {
        'hc-key': hcKey,
        value: row.responses,
        name: row.country,
      } as SeriesMapDataOptions;
    })
    .filter((point): point is SeriesMapDataOptions => point !== null);
}

export function buildSurveyAnalyticsMapOptions(
  countries: SurveyAnalyticsCountryRow[]
): Options {
  const mapData = toMapSeriesData(countries);

  return {
    ...chartBase(),
    chart: {
      ...chartBase().chart,
      map: worldMap as unknown as string,
      height: 220,
      spacing: [4, 4, 4, 4],
    },
    mapNavigation: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    colorAxis: mapData.length
      ? {
          min: 0,
          minColor: '#e8eef4',
          maxColor: PRIMARY_BLUE,
          labels: {
            style: { fontSize: '10px', color: '#64748b' },
          },
        }
      : undefined,
    tooltip: {
      headerFormat: '',
      pointFormat: '<b>{point.name}</b><br/>{point.value} responses',
    },
    plotOptions: {
      map: {
        allAreas: true,
        nullColor: '#e8eef4',
        borderColor: '#ffffff',
        borderWidth: 0.6,
        states: {
          hover: {
            color: '#7ec8f7',
          },
        },
      },
    },
    series: [
      {
        type: 'map',
        name: 'Responses',
        joinBy: ['hc-key', 'hc-key'],
        data: mapData,
        dataLabels: {
          enabled: false,
        },
      },
    ],
  };
}

export { Highcharts as HighchartsMap };
