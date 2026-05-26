import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import * as am5percent from '@amcharts/amcharts5/percent';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5geodataWorldLow from '@amcharts/amcharts5-geodata/worldLow';
import { addAmChartLicense, applyBiTheme } from '@/components/charts/amcharts/theme';
import type {
  AiWidgetChartPayload,
  AmChartWidgetType,
  ChartDataPoint,
  ColoredChartDataPoint,
  NpsBenchmarkDataPoint,
} from '@/components/charts/amcharts/types';
import type { ComparativeBarSeriesConfig } from '@/data/mock-comparative-bar';
import type {
  MatrixStackBarDataRow,
  MatrixStackBarSeriesConfig,
} from '@/components/charts/amcharts/types';
import type { SegmentTrendSeriesConfig } from '@/data/mock-segment-trend';

const NPS_BENCHMARK_NEGATIVE = '#FF7681';
const NPS_BENCHMARK_POSITIVE = '#17B26B';

function createRoot(containerId: string): am5.Root {
  addAmChartLicense();
  const root = am5.Root.new(containerId);
  applyBiTheme(root);
  return root;
}

function createHorizontalBarChart(
  root: am5.Root,
  data: ChartDataPoint[],
  showPercent = true
): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingRight: 12,
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: am5xy.AxisRendererY.new(root, {
        minGridDistance: 12,
        inversed: true,
      }),
    })
  );
  yAxis.data.setAll(data);

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: showPercent ? 100 : undefined,
      renderer: am5xy.AxisRendererX.new(root, {}),
    })
  );

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueXField: 'value',
      categoryYField: 'category',
    })
  );
  series.columns.template.setAll({
    height: am5.percent(70),
    cornerRadiusTR: 2,
    cornerRadiusBR: 2,
  });
  series.data.setAll(data);

  series.bullets.push(() =>
    am5.Bullet.new(root, {
      locationX: 1,
      sprite: am5.Label.new(root, {
        text: showPercent ? "{valueX.formatNumber('#.#')}%" : "{valueX}",
        populateText: true,
        centerY: am5.p50,
        centerX: am5.p100,
        dx: 6,
        fontSize: 11,
      }),
    })
  );

  chart.appear(400, 50);
}

function createAgeBarChart(root: am5.Root, data: ColoredChartDataPoint[]): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      paddingLeft: 0,
      paddingRight: 16,
      paddingTop: 8,
      paddingBottom: 8,
    })
  );

  const xRenderer = am5xy.AxisRendererX.new(root, {
    minGridDistance: 40,
  });
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 11,
  });

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 25,
      strictMinMax: true,
      renderer: xRenderer,
    })
  );
  xAxis.set('numberFormat', "#'%'");

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 1,
    inversed: true,
  });
  yRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  yRenderer.labels.template.setAll({
    fill: am5.color(0x545e6b),
    fontSize: 12,
    textAlign: 'left',
  });

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: yRenderer,
    })
  );
  yAxis.data.setAll(data);

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueXField: 'value',
      categoryYField: 'category',
    })
  );

  series.columns.template.setAll({
    height: am5.percent(75),
    strokeOpacity: 0,
    cornerRadiusTR: 0,
    cornerRadiusBR: 0,
  });

  series.columns.template.adapters.add('fill', (_fill, target) => {
    const ctx = target.dataItem?.dataContext as ColoredChartDataPoint | undefined;
    return ctx?.color ? am5.color(ctx.color) : am5.color(0x1b4f9c);
  });

  series.bullets.push(() =>
    am5.Bullet.new(root, {
      locationX: 1,
      locationY: 0.5,
      sprite: am5.Label.new(root, {
        text: '{valueX}%',
        populateText: true,
        fontSize: 11,
        fontWeight: '500',
        fill: am5.color(0xffffff),
        textAlign: 'right',
        centerX: am5.p100,
        centerY: am5.p50,
        dx: -8,
      }),
    })
  );

  series.data.setAll(data);
  chart.appear(400, 50);
}

function createPercentChart(
  root: am5.Root,
  data: ChartDataPoint[],
  options: { innerRadius?: number; startAngle?: number; endAngle?: number; centerLabel?: string }
): void {
  const chart = root.container.children.push(
    am5percent.PieChart.new(root, {
      innerRadius: am5.percent(options.innerRadius ?? 0),
      startAngle: options.startAngle,
      endAngle: options.endAngle,
      layout: root.verticalLayout,
    })
  );

  const series = chart.series.push(
    am5percent.PieSeries.new(root, {
      valueField: 'value',
      categoryField: 'category',
    })
  );
  series.labels.template.setAll({ fontSize: 11 });
  series.data.setAll(data);

  if (options.centerLabel) {
    chart.seriesContainer.children.push(
      am5.Label.new(root, {
        text: options.centerLabel,
        centerX: am5.p50,
        centerY: am5.p50,
        fontSize: 18,
        fontWeight: '600',
        fill: am5.color(0x1b4f9c),
      })
    );
  }

  chart.appear(400, 50);
}

function createLineChart(root: am5.Root, data: ChartDataPoint[], withArea: boolean): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingRight: 12,
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }),
    })
  );
  xAxis.data.setAll(data);

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
    })
  );

  const series = chart.series.push(
    am5xy.LineSeries.new(root, {
      xAxis,
      yAxis,
      valueYField: 'value',
      categoryXField: 'category',
      stroke: am5.color(0x1b4f9c),
      fill: withArea ? am5.color(0x90bef2) : undefined,
    })
  );
  if (withArea) {
    series.fills.template.setAll({ fillOpacity: 0.35, visible: true });
  }
  series.strokes.template.setAll({ strokeWidth: 2 });
  series.data.setAll(data);
  series.bullets.push(() =>
    am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        radius: 4,
        fill: series.get('stroke'),
      }),
    })
  );

  chart.appear(400, 50);
}

function createGaugeChart(root: am5.Root, score: number): void {
  const chart = root.container.children.push(
    am5radar.RadarChart.new(root, {
      panX: false,
      panY: false,
      startAngle: 180,
      endAngle: 360,
      innerRadius: am5.percent(60),
    })
  );

  const axisRenderer = am5radar.AxisRendererCircular.new(root, {});
  axisRenderer.grid.template.setAll({ strokeOpacity: 0 });
  axisRenderer.labels.template.setAll({ visible: false });
  axisRenderer.ticks.template.setAll({ visible: false });

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      strictMinMax: true,
      renderer: axisRenderer,
    })
  );

  const rangeDataItem = xAxis.makeDataItem({ value: 0, endValue: score });
  xAxis.createAxisRange(rangeDataItem);
  rangeDataItem.get('axisFill')?.setAll({
    visible: true,
    fill: am5.color(0x1b4f9c),
    fillOpacity: 0.85,
  });

  const clockHand = am5radar.ClockHand.new(root, {
    pinRadius: 6,
    radius: am5.percent(85),
    bottomWidth: 8,
  });
  clockHand.hand.setAll({ fill: am5.color(0x234693) });
  clockHand.pin.setAll({ fill: am5.color(0x234693) });

  const bulletDataItem = xAxis.makeDataItem({});
  bulletDataItem.set(
    'bullet',
    am5xy.AxisBullet.new(root, { sprite: clockHand })
  );
  xAxis.createAxisRange(bulletDataItem);
  bulletDataItem.set('value', score);

  chart.radarContainer.children.push(
    am5.Label.new(root, {
      centerX: am5.p50,
      centerY: am5.p50,
      text: `${score}`,
      fontSize: 22,
      fontWeight: '700',
      fill: am5.color(0x1b4f9c),
    })
  );

  chart.appear(400, 50);
}

function createNpsBenchmarkChart(root: am5.Root, data: NpsBenchmarkDataPoint[]): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 4,
      paddingRight: 8,
    })
  );

  const xRenderer = am5xy.AxisRendererX.new(root, {
    minGridDistance: 30,
    cellStartLocation: 0.15,
    cellEndLocation: 0.85,
  });
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe8e8e8),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x545e6b),
    fontSize: 12,
  });

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: xRenderer,
    })
  );
  xAxis.data.setAll(data);

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 30,
  });
  yRenderer.grid.template.setAll({
    stroke: am5.color(0xe8e8e8),
    strokeOpacity: 1,
  });
  yRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 11,
  });

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: -15,
      max: 5,
      strictMinMax: true,
      renderer: yRenderer,
    })
  );

  const zeroRange = yAxis.createAxisRange(
    yAxis.makeDataItem({ value: 0 })
  );
  zeroRange.get('grid')?.setAll({
    stroke: am5.color(0xd0d0d0),
    strokeOpacity: 1,
    strokeWidth: 1,
  });

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueYField: 'npsScore',
      categoryXField: 'category',
    })
  );

  series.columns.template.setAll({
    width: am5.percent(55),
    strokeOpacity: 0,
    cornerRadiusTL: 0,
    cornerRadiusTR: 0,
    cornerRadiusBL: 0,
    cornerRadiusBR: 0,
  });

  series.columns.template.adapters.add('fill', (_fill, target) => {
    const score =
      (target.dataItem?.dataContext as NpsBenchmarkDataPoint | undefined)?.npsScore ?? 0;
    return am5.color(score >= 0 ? NPS_BENCHMARK_POSITIVE : NPS_BENCHMARK_NEGATIVE);
  });

  series.bullets.push((bulletRoot, _series, dataItem) => {
    const npsScore =
      (dataItem?.dataContext as NpsBenchmarkDataPoint | undefined)?.npsScore ?? 0;
    return am5.Bullet.new(bulletRoot, {
      locationY: 1,
      locationX: 0.5,
      sprite: am5.Label.new(bulletRoot, {
        text: '{valueY.formatNumber("#.0")}',
        populateText: true,
        fontSize: 11,
        fontWeight: '500',
        fill: am5.color(0xffffff),
        centerX: am5.p50,
        centerY: npsScore > 0 ? 0 : am5.p100,
      }),
    });
  });

  series.data.setAll(data);
  chart.appear(400, 50);
}

function createSegmentTrendChart(
  root: am5.Root,
  rows: AiWidgetChartPayload['segmentTrendRows'],
  seriesConfig: SegmentTrendSeriesConfig[]
): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingTop: 12,
      paddingBottom: 4,
      paddingLeft: 8,
      paddingRight: 16,
    })
  );

  const xRenderer = am5xy.AxisRendererX.new(root, {
    minGridDistance: 40,
  });
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 10,
    oversizedBehavior: 'truncate',
    maxWidth: 72,
  });

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: xRenderer,
    })
  );
  xAxis.data.setAll(rows);

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 40,
  });
  yRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  yRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 11,
  });

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 1000,
      strictMinMax: true,
      renderer: yRenderer,
    })
  );

  seriesConfig.forEach((config) => {
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: config.name,
        xAxis,
        yAxis,
        valueYField: config.field,
        categoryXField: 'category',
        stroke: am5.color(config.color),
      })
    );

    series.strokes.template.setAll({ strokeWidth: 2 });
    series.set('fill', am5.color(config.color));

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: am5.color(config.color),
          stroke: am5.color(0xffffff),
          strokeWidth: 1,
        }),
      })
    );

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Label.new(root, {
          text: '{valueY}',
          populateText: true,
          centerX: am5.p50,
          centerY: am5.p100,
          dy: -10,
          fontSize: 11,
          fill: am5.color(0x000000),
        }),
      })
    );

    series.data.setAll(rows);
  });

  const legend = chart.children.push(
    am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 8,
    })
  );
  legend.labels.template.setAll({
    fontSize: 11,
    fill: am5.color(0x545e6b),
  });
  legend.valueLabels.template.set('forceHidden', true);
  legend.markers.template.setAll({
    width: 12,
    height: 12,
  });
  legend.data.setAll(chart.series.values);

  chart.appear(400, 50);
}

function createComparativeBarChart(
  root: am5.Root,
  rows: AiWidgetChartPayload['comparativeBarRows'],
  seriesConfig: ComparativeBarSeriesConfig[]
): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingTop: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      paddingRight: 12,
    })
  );

  const xRenderer = am5xy.AxisRendererX.new(root, {
    minGridDistance: 30,
    cellStartLocation: 0.1,
    cellEndLocation: 0.9,
  });
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 11,
  });

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: xRenderer,
    })
  );
  xAxis.data.setAll(rows);

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 28,
  });
  yRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  yRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 11,
  });

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 30,
      strictMinMax: true,
      renderer: yRenderer,
    })
  );
  yAxis.set('numberFormat', "#'%'");

  seriesConfig.forEach((config) => {
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: config.name,
        xAxis,
        yAxis,
        valueYField: config.field,
        categoryXField: 'category',
        clustered: true,
      })
    );

    series.set('fill', am5.color(config.color));
    series.columns.template.setAll({
      width: am5.percent(85),
      strokeOpacity: 0,
      cornerRadiusTL: 0,
      cornerRadiusTR: 0,
    });

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Label.new(root, {
          text: "{valueY.formatNumber('#.#')}%",
          populateText: true,
          centerX: am5.p50,
          centerY: am5.p100,
          dy: -4,
          fontSize: 10,
          fill: am5.color(0xffffff),
        }),
      })
    );

    series.data.setAll(rows);
  });

  const legend = chart.children.push(
    am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 8,
      layout: am5.GridLayout.new(root, {
        maxColumns: 2,
        fixedWidthGrid: true,
      }),
    })
  );
  legend.labels.template.setAll({
    fontSize: 10,
    fill: am5.color(0x545e6b),
    maxWidth: 200,
    oversizedBehavior: 'truncate',
  });
  legend.valueLabels.template.set('forceHidden', true);
  legend.markers.template.setAll({
    width: 10,
    height: 10,
  });
  legend.data.setAll(chart.series.values);

  chart.appear(400, 50);
}

function createMatrixStackBarChart(
  root: am5.Root,
  rows: MatrixStackBarDataRow[],
  seriesConfig: MatrixStackBarSeriesConfig[]
): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingTop: 8,
      paddingBottom: 4,
      paddingLeft: 4,
      paddingRight: 12,
    })
  );

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 24,
  });
  yRenderer.grid.template.set('visible', false);
  yRenderer.labels.template.setAll({
    fill: am5.color(0x545e6b),
    fontSize: 11,
  });

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: yRenderer,
    })
  );
  yAxis.data.setAll(rows);

  const xRenderer = am5xy.AxisRendererX.new(root, {});
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 10,
  });

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      strictMinMax: true,
      renderer: xRenderer,
    })
  );
  xAxis.set('numberFormat', "#'%'");

  seriesConfig.forEach((config) => {
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: config.name,
        xAxis,
        yAxis,
        valueXField: config.field,
        categoryYField: 'category',
        stacked: true,
      })
    );

    series.set('fill', am5.color(config.color));
    series.columns.template.setAll({
      height: am5.percent(72),
      strokeOpacity: 0,
    });
    series.data.setAll(rows);
  });

  const legend = chart.children.push(
    am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 8,
      layout: am5.GridLayout.new(root, {
        maxColumns: 4,
        fixedWidthGrid: true,
      }),
    })
  );
  legend.labels.template.setAll({
    fontSize: 10,
    fill: am5.color(0x545e6b),
    maxWidth: 120,
    oversizedBehavior: 'truncate',
  });
  legend.valueLabels.template.set('forceHidden', true);
  legend.markers.template.setAll({
    width: 10,
    height: 10,
  });
  legend.data.setAll(chart.series.values);

  chart.appear(400, 50);
}

function createMatrixBarChart(
  root: am5.Root,
  rows: MatrixStackBarDataRow[],
  seriesConfig: MatrixStackBarSeriesConfig[]
): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
      paddingTop: 8,
      paddingBottom: 4,
      paddingLeft: 4,
      paddingRight: 12,
    })
  );

  const yRenderer = am5xy.AxisRendererY.new(root, {
    minGridDistance: 24,
  });
  yRenderer.grid.template.set('visible', false);
  yRenderer.labels.template.setAll({
    fill: am5.color(0x545e6b),
    fontSize: 11,
  });

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: yRenderer,
    })
  );
  yAxis.data.setAll(rows);

  const xRenderer = am5xy.AxisRendererX.new(root, {});
  xRenderer.grid.template.setAll({
    stroke: am5.color(0xe0e0e0),
    strokeOpacity: 1,
  });
  xRenderer.labels.template.setAll({
    fill: am5.color(0x9b9b9b),
    fontSize: 10,
  });

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 40,
      strictMinMax: true,
      renderer: xRenderer,
    })
  );
  xAxis.set('numberFormat', "#'%'");

  seriesConfig.forEach((config) => {
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: config.name,
        xAxis,
        yAxis,
        valueXField: config.field,
        categoryYField: 'category',
        clustered: true,
      })
    );

    series.set('fill', am5.color(config.color));
    series.columns.template.setAll({
      height: am5.percent(72),
      strokeOpacity: 0,
    });
    series.data.setAll(rows);
  });

  const legend = chart.children.push(
    am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 8,
      layout: am5.GridLayout.new(root, {
        maxColumns: 4,
        fixedWidthGrid: true,
      }),
    })
  );
  legend.labels.template.setAll({
    fontSize: 10,
    fill: am5.color(0x545e6b),
    maxWidth: 120,
    oversizedBehavior: 'truncate',
  });
  legend.valueLabels.template.set('forceHidden', true);
  legend.markers.template.setAll({
    width: 10,
    height: 10,
  });
  legend.data.setAll(chart.series.values);

  chart.appear(400, 50);
}

function createStackBarChart(root: am5.Root, segments: ChartDataPoint[]): void {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: root.verticalLayout,
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'category',
      renderer: am5xy.AxisRendererY.new(root, { visible: false }),
    })
  );
  yAxis.data.setAll([{ category: 'All' }]);

  const xAxis = chart.xAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      renderer: am5xy.AxisRendererX.new(root, { visible: false }),
    })
  );

  segments.forEach((segment, index) => {
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: segment.category,
        xAxis,
        yAxis,
        valueXField: 'value',
        categoryYField: 'category',
        stacked: true,
      })
    );
    series.columns.template.setAll({ height: am5.percent(55) });
    series.set(
      'fill',
      am5.color(
        ['#1b4f9c', '#3d7cc9', '#90bef2', '#5a9ad4'][index % 4] ?? '#1b4f9c'
      )
    );
    series.data.setAll([{ category: 'All', value: segment.value }]);
  });

  const legend = chart.children.push(
    am5.Legend.new(root, { centerX: am5.p50, x: am5.p50 })
  );
  legend.data.setAll(chart.series.values);

  chart.appear(400, 50);
}

function createPictorialChart(root: am5.Root, data: ChartDataPoint[]): void {
  const chart = root.container.children.push(
    am5percent.SlicedChart.new(root, {
      layout: root.verticalLayout,
    })
  );

  const series = chart.series.push(
    am5percent.PictorialStackedSeries.new(root, {
      valueField: 'value',
      categoryField: 'category',
      orientation: 'vertical',
      svgPath:
        'M 12 2 C 15.3 2 18 4.7 18 8 C 18 11.3 15.3 14 12 14 C 8.7 14 6 11.3 6 8 C 6 4.7 8.7 2 12 2 Z M 4 20 L 20 20 L 20 18 C 20 15 16 13 12 13 C 8 13 4 15 4 18 Z',
    })
  );
  series.labels.template.setAll({ fontSize: 11 });
  series.data.setAll(data);
  chart.appear(400, 50);
}

function createMapChart(
  root: am5.Root,
  points: { id: string; name: string; value: number }[]
): void {
  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      projection: am5map.geoMercator(),
      panX: 'none',
      panY: 'none',
      wheelY: 'none',
    })
  );

  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodataWorldLow,
      exclude: ['AQ'],
    })
  );
  polygonSeries.mapPolygons.template.setAll({
    fill: am5.color(0x90bef2),
    fillOpacity: 0.35,
    stroke: am5.color(0xffffff),
  });

  const bubbleSeries = chart.series.push(
    am5map.MapPointSeries.new(root, {})
  );
  bubbleSeries.bullets.push(() =>
    am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        radius: 10,
        fill: am5.color(0xe53935),
        fillOpacity: 0.9,
        stroke: am5.color(0xffffff),
        strokeWidth: 1,
      }),
    })
  );
  bubbleSeries.bullets.push(() =>
    am5.Bullet.new(root, {
      sprite: am5.Label.new(root, {
        text: '{value}',
        populateText: true,
        centerX: am5.p50,
        centerY: am5.p50,
        fontSize: 9,
        fill: am5.color(0xffffff),
      }),
    })
  );

  const mapData = points.map((point) => {
    const feature = am5geodataWorldLow.features.find((f) => f.id === point.id);
    let longitude = 0;
    let latitude = 0;
    if (feature?.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0][0] as number[];
      longitude = coords[0];
      latitude = coords[1];
    }
    return {
      id: point.id,
      name: point.name,
      value: point.value,
      geometry: { type: 'Point' as const, coordinates: [longitude, latitude] },
    };
  });

  bubbleSeries.data.setAll(mapData);
  chart.appear(400, 50);
}

export interface ChartInstance {
  dispose: () => void;
  resize: () => void;
}

export function buildChart(
  containerId: string,
  chartType: AmChartWidgetType,
  payload: AiWidgetChartPayload
): ChartInstance {
  const root = createRoot(containerId);

  switch (chartType) {
    case 'map':
      createMapChart(root, payload.mapPoints);
      break;
    case 'bar':
      createAgeBarChart(root, payload.ageBarItems);
      break;
    case 'image-bar':
      createHorizontalBarChart(root, payload.imageBars, true);
      break;
    case 'pie':
      createPercentChart(root, payload.pieSegments, { innerRadius: 0 });
      break;
    case 'donut':
    case 'scoring-donut':
      createPercentChart(root, payload.pieSegments, {
        innerRadius: 55,
        centerLabel: chartType === 'scoring-donut' ? `${payload.gaugeScore}` : undefined,
      });
      break;
    case 'semi-circle':
      createPercentChart(root, payload.pieSegments.slice(0, 1), {
        innerRadius: 0,
        startAngle: 180,
        endAngle: 360,
        centerLabel: `${payload.gaugeScore}%`,
      });
      break;
    case 'line':
      createLineChart(root, payload.linePoints, false);
      break;
    case 'scoring-trend':
      createLineChart(root, payload.linePoints, true);
      break;
    case 'gauge':
      createGaugeChart(root, payload.gaugeScore);
      break;
    case 'benchmark':
      createNpsBenchmarkChart(root, payload.npsBenchmarkItems);
      break;
    case 'stackbar':
      createStackBarChart(root, payload.stackSegments);
      break;
    case 'comparative-bar':
      createComparativeBarChart(
        root,
        payload.comparativeBarRows,
        payload.comparativeBarSeries
      );
      break;
    case 'segment-trend':
      createSegmentTrendChart(
        root,
        payload.segmentTrendRows,
        payload.segmentTrendSeries
      );
      break;
    case 'pictorial':
    case 'matrix-heatmap':
      createPictorialChart(root, payload.pictorial);
      break;
    case 'matrix-stackbar':
      createMatrixStackBarChart(
        root,
        payload.matrixStackBarRows,
        payload.matrixStackBarSeries
      );
      break;
    case 'matrix-bar':
      createMatrixBarChart(
        root,
        payload.matrixStackBarRows,
        payload.matrixStackBarSeries
      );
      break;
    case 'matrix-spider':
      createPercentChart(root, payload.pieSegments, { innerRadius: 0 });
      break;
    default:
      break;
  }

  return {
    dispose: () => {
      root.dispose();
    },
    resize: () => {
      root.resize();
    },
  };
}
