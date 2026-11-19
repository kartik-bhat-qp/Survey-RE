'use client';

import { useLayoutEffect, useRef, useMemo } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { addAmChartLicense, applyBiTheme } from '@/components/charts/amcharts/theme';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import styles from './DriverAnalysisWidget.module.css';

export interface DriverChartPoint {
  id: string;
  name: string;
  rank: number;
  x: number;
  importance: number | null;
  description: string;
  color: string;
}

export function DriverImportanceChart({ points, cutoff, yMax, active, onActive, typography, lowerColor, higherColor }: {
  points: DriverChartPoint[];
  cutoff: number;
  yMax: number;
  active: string | null;
  onActive: (id: string | null) => void;
  typography?: AmChartTypography;
  lowerColor: string;
  higherColor: string;
}) {
  const pointKey = JSON.stringify(points);
  // Point identities can change when the sibling table is hovered. Reuse the same chart data.
  const chartPoints = useMemo<DriverChartPoint[]>(() => JSON.parse(pointKey), [pointKey]);
  const container = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, am5.Circle>());
  // Hover changes highlight sprites without rebuilding the chart/model.
  const callbacks = useRef(onActive);
  useLayoutEffect(() => { callbacks.current = onActive; }, [onActive]);
  useLayoutEffect(() => {
    if (!container.current) return;
    addAmChartLicense();
    const chartMarkers = markers.current;
    const root = am5.Root.new(container.current);
    applyBiTheme(root, {
      fontFamily: typography?.fontFamily ?? 'Fira Sans', fontSize: Math.max(12, typography?.fontSize ?? 13),
      fontWeight: typography?.fontWeight ?? '400', fontStyle: typography?.fontStyle ?? 'normal',
    });
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false, panY: false, wheelX: 'none', wheelY: 'none',
      paddingTop: 12, paddingRight: 14, paddingBottom: 0, paddingLeft: 0,
    }));
    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 90 });
    const yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 65 });
    const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
      min: 0, max: 100, strictMinMax: true, maxPrecision: 0, renderer: xRenderer,
    }));
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0, max: yMax, strictMinMax: true, maxPrecision: 2, numberFormat: "0.0", renderer: yRenderer,
    }));
    xRenderer.grid.template.setAll({ stroke: am5.color('#cbd6df'), strokeOpacity: 0.3 });
    yRenderer.grid.template.setAll({ stroke: am5.color('#cbd6df'), strokeOpacity: 0.3 });
    chart.plotContainer.set('background', am5.Rectangle.new(root, { fill: am5.color('#f7f9fb'), fillOpacity: 1 }));
    for (const [x, color] of [[0, lowerColor], [50, higherColor]] as const) {
      chart.plotContainer.children.unshift(am5.Rectangle.new(root, {
        isMeasured: false, x: am5.percent(x), y: 0, width: am5.p50,
        height: am5.percent(100 - cutoff / yMax * 100), fill: am5.color(color), fillOpacity: 0.12,
      }));
    }
    const xRange = xAxis.createAxisRange(xAxis.makeDataItem({ value: 50 }));
    const yRange = yAxis.createAxisRange(yAxis.makeDataItem({ value: cutoff }));
    for (const range of [xRange, yRange]) range.get('grid')?.setAll({
      visible: true, stroke: am5.color('#73879b'), strokeOpacity: 0.8, strokeDasharray: [4, 3],
    });
    const series = chart.series.push(am5xy.LineSeries.new(root, {
      xAxis, yAxis, valueXField: 'x', valueYField: 'importance', maskBullets: false,
    }));
    series.strokes.template.set('visible', false);
    series.bullets.push((_root, _series, dataItem) => {
      const point = dataItem.dataContext as DriverChartPoint;
      const color = point.color === 'amber' ? lowerColor : point.color === 'teal' ? higherColor : '#4a6381';
      const tooltip = am5.Tooltip.new(root, { getFillFromSprite: false, labelText: point.description });
      tooltip.get('background')?.setAll({ fill: am5.color('#17365e'), fillOpacity: 1 });
      tooltip.label.setAll({ fill: am5.color('#ffffff'), maxWidth: 300, oversizedBehavior: 'wrap', fontSize: 13 });
      const circle = am5.Circle.new(root, {
        radius: 7, fill: am5.color(color), stroke: am5.color('#ffffff'), strokeWidth: 2,
        tooltipText: point.description, tooltip, focusable: true, role: 'button',
        ariaLabel: point.description, hoverOnFocus: true, cursorOverStyle: 'pointer',
      });
      circle.states.create('hover', { radius: 10, stroke: am5.color('#17365e'), strokeWidth: 2 });
      circle.events.on('pointerover', () => callbacks.current(point.id));
      circle.events.on('pointerout', () => callbacks.current(null));
      circle.events.on('focus', () => callbacks.current(point.id));
      circle.events.on('blur', () => callbacks.current(null));
      chartMarkers.set(point.id, circle);
      return am5.Bullet.new(root, { sprite: circle });
    });
    series.data.setAll(chartPoints.filter(point => point.importance !== null));
    const observer = new ResizeObserver(() => root.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); chartMarkers.clear(); root.dispose(); };
  }, [chartPoints, cutoff, yMax, typography, lowerColor, higherColor]);
  useLayoutEffect(() => {
    markers.current.forEach((marker, id) => marker.states.apply(id === active ? 'hover' : 'default'));
  }, [active]);
  return <div ref={container} className={styles.amChart} aria-label="Driver importance versus mean rating. Full values are available in the ranked drivers table." />;
}
