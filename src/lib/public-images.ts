/**
 * Static image paths served from `public/images/`.
 * In the browser these resolve to `/images/...`.
 */
export const PUBLIC_IMAGES_ROOT = '/images';

/** Build a URL path under `public/images/`. */
export function publicImage(...segments: string[]): string {
  return `${PUBLIC_IMAGES_ROOT}/${segments.join('/')}`;
}

export const PUBLIC_IMAGES = {
  addWidget: {
    questionBasedActive: publicImage('add-widget', 'question_based_active.svg'),
    questionBasedDefault: publicImage('add-widget', 'question_based_default.svg'),
    advancedWidgetsActive: publicImage('add-widget', 'advanced_widgets_active.svg'),
    advancedWidgetsDefault: publicImage('add-widget', 'advanced_widgets_default.svg'),
  },
  createDashboard: {
    blank: publicImage('create-dashboard', 'blank-dashboard.svg'),
    qxbot: publicImage('create-dashboard', 'qxbot-dashboard.svg'),
  },
  singleSelectWidgets: {
    bar: publicImage('single-select-widgets', 'bar.svg'),
    pie: publicImage('single-select-widgets', 'pie.svg'),
    line: publicImage('single-select-widgets', 'line.svg'),
    donut: publicImage('single-select-widgets', 'donut.svg'),
    scoringTrend: publicImage('single-select-widgets', 'scoring_trend.svg'),
    gauge: publicImage('single-select-widgets', 'gauge.svg'),
    scoringDonut: publicImage('single-select-widgets', 'scoring_donut.svg'),
    benchmark: publicImage('single-select-widgets', 'benchmark.svg'),
    semiCircle: publicImage('single-select-widgets', 'semi_circle.svg'),
    leaderboard: publicImage('single-select-widgets', 'leaderboard.svg'),
    imageBar: publicImage('single-select-widgets', 'image_bar.svg'),
    pictorial: publicImage('single-select-widgets', 'pictorial.svg'),
    stackbar: publicImage('single-select-widgets', 'stackbar.svg'),
    tabular: publicImage('single-select-widgets', 'tabular.svg'),
    statHighlight: publicImage('single-select-widgets', 'stat_highlight.svg'),
  },
  matrixWidgets: {
    stackbar: publicImage('matrix-widgets', 'matrix_stackbar.svg'),
    bar: publicImage('matrix-widgets', 'matrix_bar.svg'),
    spider: publicImage('matrix-widgets', 'matrix_spider.svg'),
    heatmap: publicImage('matrix-widgets', 'matrix_heatmap.svg'),
  },
  advancedWidgets: {
    textBox: publicImage('advanced-widgets', 'text_box.svg'),
    mapChart: publicImage('advanced-widgets', 'map_chart.svg'),
    responseTimeline: publicImage('advanced-widgets', 'response_timeline.svg'),
    responseInfo: publicImage('advanced-widgets', 'response_info.svg'),
    comparativeBar: publicImage('advanced-widgets', 'comparative_bar.svg'),
    heatMap: publicImage('advanced-widgets', 'heat_map.svg'),
    crossTab: publicImage('advanced-widgets', 'cross_tab.svg'),
    segmentTrendLine: publicImage('advanced-widgets', 'segment_trend_line.svg'),
    barChart: publicImage('advanced-widgets', 'bar_chart.svg'),
    funnel: publicImage('advanced-widgets', 'funnel.svg'),
    responseViewer: publicImage('advanced-widgets', 'response_viewer.svg'),
  },
} as const;
