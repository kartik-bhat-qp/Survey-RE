'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type ResizeHandleAxis,
} from 'react-grid-layout/legacy';
import {
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  MOBILE_GRID_MARGIN,
  MOBILE_GRID_ROW_HEIGHT,
  DRIVER_ANALYSIS_LAYOUT_W,
} from '@/data/dashboard-grid-config';
import {
  AI_DASHBOARD_GRID_COLS,
  AI_DASHBOARD_LAYOUT,
  AI_DASHBOARD_WIDGETS,
  type AiWidgetConfig,
} from '@/data/mock-ai-widgets';
import {
  DEFAULT_DESIGN_TYPOGRAPHY,
  getDashboardTypographyCssVars,
  type DesignTypographyOptions,
} from '@/components/dashboards/DashboardDesignSettingsTab';
import { DashboardAiInsightsPanel } from '@/components/dashboards/DashboardAiInsightsPanel';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useBiLicenseRestrictions } from '@/hooks/useBiLicenseRestrictions';
import { stackLayoutSingleColumn } from '@/lib/ai-dashboard-layout';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { AiWidgetRenderer } from '@/components/dashboards/widgets/AiWidgetRenderer';
import { WordCloudDashboardCard } from '@/components/dashboards/widgets/WordCloudDashboardCard';
import { DriverAnalysisDashboardCard } from '@/components/dashboards/widgets/DriverAnalysisDashboardCard';
import {
  createDashboardWidgetInsightThread,
  DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY,
  failDashboardWidgetInsightRefresh,
  refreshDashboardWidgetInsightThread,
  type AiInsightRefreshFrequency,
  type DashboardWidgetInsightThread,
} from '@/data/mock-dashboard-ai-insights';
import styles from './AiDashboardCanvas.module.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridLayoutWithWidth = WidthProvider(ReactGridLayout);

const NO_ADDED_WIDGETS: AiWidgetConfig[] = [];

const CHART_BODY_FONT_SIZE_BY_DESIGN_SIZE: Record<string, number> = {
  'extra-small': 11,
  small: 13,
  medium: 15,
  large: 18,
  'extra-large': 21,
};

function renderResizeHandle(
  _axis: ResizeHandleAxis,
  ref: React.Ref<HTMLSpanElement>
): React.ReactElement {
  return (
    <span
      ref={ref}
      className={`react-resizable-handle react-resizable-handle-se ${styles.resizeHandle}`}
      aria-label="Resize widget"
    >
      <span className="wm-resize" />
    </span>
  );
}

interface AiDashboardCanvasProps {
  designTypography?: DesignTypographyOptions;
  insightRefreshFrequency?: AiInsightRefreshFrequency;
  globalInsightRefreshVersion?: number;
  globalInsightRefreshTargetWidgetIds?: string[];
  globalInsightRefreshFailedWidgetIds?: string[];
  lastAiInsightsRefreshAt?: string;
  onInsightsRefreshed?: (widgetId: string, refreshedAt: string) => void;
  /** Widgets added from the Add widget flow — appended below the seeded widgets. */
  addedWidgets?: AiWidgetConfig[];
  readOnly?: boolean;
  renderWidget?: (widget: AiWidgetConfig) => React.ReactNode;
  renderWidgetActions?: (widget: AiWidgetConfig) => React.ReactNode;
  footer?: React.ReactNode;
}

export function AiDashboardCanvas({
  designTypography = DEFAULT_DESIGN_TYPOGRAPHY,
  insightRefreshFrequency = DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY,
  globalInsightRefreshVersion = 0,
  globalInsightRefreshTargetWidgetIds,
  globalInsightRefreshFailedWidgetIds = [],
  lastAiInsightsRefreshAt = '2026-09-01T06:30:00.000Z',
  onInsightsRefreshed,
  addedWidgets = NO_ADDED_WIDGETS,
  readOnly = false,
  renderWidget,
  renderWidgetActions,
  footer,
}: AiDashboardCanvasProps) {
  const { showToast } = useWuShowToast();
  const isMobile = useIsMobile();
  const showLicenseRestrictions = useBiLicenseRestrictions();
  const [desktopLayout, setDesktopLayout] = useState<Layout>(AI_DASHBOARD_LAYOUT);
  const [activeInsightWidgetId, setActiveInsightWidgetId] = useState<string | null>(null);
  const [refreshingWidgetId, setRefreshingWidgetId] = useState<string | null>(null);
  const [insightThreads, setInsightThreads] = useState<Record<string, DashboardWidgetInsightThread>>(
    () =>
      Object.fromEntries(
        AI_DASHBOARD_WIDGETS.map((widget) => [
          widget.id,
          createDashboardWidgetInsightThread(widget.id, lastAiInsightsRefreshAt),
        ])
      )
  );
  const previousGlobalRefreshVersion = useRef(globalInsightRefreshVersion);
  const canvasRef = useRef<HTMLDivElement>(null);

  const displayLayout = useMemo(
    () => (isMobile ? stackLayoutSingleColumn(desktopLayout) : desktopLayout),
    [isMobile, desktopLayout]
  );

  const widgetById = useMemo(
    () =>
      new Map(
        [...AI_DASHBOARD_WIDGETS, ...addedWidgets].map((widget) => [widget.id, widget])
      ),
    [addedWidgets]
  );

  useEffect(() => {
    if (addedWidgets.length === 0) return;

    setDesktopLayout((current) => {
      const missing = addedWidgets.filter(
        (widget) => !current.some((item) => item.i === widget.id)
      );
      if (missing.length === 0) return current;
      let nextY = current.reduce((lowest, item) => Math.max(lowest, item.y + item.h), 0);
      return [
        ...current,
        ...missing.map((widget) => {
          const item = {
            i: widget.id,
            x: 0,
            y: nextY,
            w: widget.type === 'driver-analysis' ? DRIVER_ANALYSIS_LAYOUT_W : AI_DASHBOARD_GRID_COLS,
            h: 1,
            minW: 1,
            minH: 1,
          };
          nextY += 1;
          return item;
        }),
      ];
    });

    setInsightThreads((current) => {
      const missing = addedWidgets.filter((widget) => !current[widget.id]);
      if (missing.length === 0) return current;
      return {
        ...current,
        ...Object.fromEntries(
          missing.map((widget) => [
            widget.id,
            createDashboardWidgetInsightThread(widget.id, lastAiInsightsRefreshAt),
          ])
        ),
      };
    });
  }, [addedWidgets, lastAiInsightsRefreshAt]);

  const handleLayoutChange = useCallback(
    (nextLayout: Layout) => {
      if (isMobile) return;
      setDesktopLayout(nextLayout);
    },
    [isMobile]
  );

  const notifyChartsResize = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      notifyChartsResize();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [notifyChartsResize]);

  useEffect(() => {
    notifyChartsResize();
  }, [isMobile, notifyChartsResize]);

  useEffect(() => {
    if (previousGlobalRefreshVersion.current === globalInsightRefreshVersion) return;
    previousGlobalRefreshVersion.current = globalInsightRefreshVersion;
    const targetWidgetIds = new Set(
      globalInsightRefreshTargetWidgetIds ?? AI_DASHBOARD_WIDGETS.map((widget) => widget.id)
    );
    const failedWidgetIds = new Set(globalInsightRefreshFailedWidgetIds);
    setInsightThreads((current) =>
      Object.fromEntries(
        Object.entries(current).map(([widgetId, thread]) => {
          if (!targetWidgetIds.has(widgetId)) return [widgetId, thread];
          return [
            widgetId,
            failedWidgetIds.has(widgetId)
              ? failDashboardWidgetInsightRefresh(thread, lastAiInsightsRefreshAt)
              : refreshDashboardWidgetInsightThread(
                  thread,
                  lastAiInsightsRefreshAt,
                  'dashboard'
                ),
          ];
        })
      )
    );
  }, [
    globalInsightRefreshFailedWidgetIds,
    globalInsightRefreshTargetWidgetIds,
    globalInsightRefreshVersion,
    lastAiInsightsRefreshAt,
  ]);

  const refreshWidgetInsight = useCallback(
    (widgetId: string) => {
      if (refreshingWidgetId) return;
      setRefreshingWidgetId(widgetId);
      window.setTimeout(() => {
        const refreshedAt = new Date().toISOString();
        setInsightThreads((current) => ({
          ...current,
          [widgetId]: refreshDashboardWidgetInsightThread(current[widgetId], refreshedAt),
        }));
        setRefreshingWidgetId(null);
        onInsightsRefreshed?.(widgetId, refreshedAt);
        showToast({
          message: 'AI insight refreshed. The previous AI insight moved to Past runs.',
          variant: 'success',
        });
      }, 700);
    },
    [onInsightsRefreshed, refreshingWidgetId, showToast]
  );

  const addUserInsight = useCallback((widgetId: string, text: string) => {
    setInsightThreads((current) => {
      const thread = current[widgetId];
      return {
        ...current,
        [widgetId]: {
          ...thread,
          items: [
            ...thread.items,
            {
              id: `${widgetId}-user-${Date.now()}`,
              kind: 'user',
              author: 'Prabal Gupta',
              initials: 'PG',
              text,
              createdAtLabel: 'Just now',
              likes: 0,
              comments: [],
            },
          ],
        },
      };
    });
  }, []);

  const addInsightComment = useCallback((widgetId: string, insightId: string, text: string) => {
    setInsightThreads((current) => {
      const thread = current[widgetId];
      return {
        ...current,
        [widgetId]: {
          ...thread,
          items: thread.items.map((item) =>
            item.id === insightId
              ? {
                  ...item,
                  comments: [
                    ...item.comments,
                    {
                      id: `${insightId}-comment-${Date.now()}`,
                      author: 'Prabal Gupta',
                      initials: 'PG',
                      text,
                      createdAtLabel: 'Just now',
                    },
                  ],
                }
              : item
          ),
        },
      };
    });
  }, []);

  const toggleInsightLike = useCallback((widgetId: string, insightId: string) => {
    setInsightThreads((current) => {
      const thread = current[widgetId];
      return {
        ...current,
        [widgetId]: {
          ...thread,
          items: thread.items.map((item) => {
            if (item.id !== insightId) return item;
            const likedByViewer = !(item.likedByViewer ?? false);
            return {
              ...item,
              likedByViewer,
              likes: Math.max(0, item.likes + (likedByViewer ? 1 : -1)),
            };
          }),
        },
      };
    });
  }, []);

  const gridCols = isMobile ? 1 : AI_DASHBOARD_GRID_COLS;
  const rowHeight = isMobile ? MOBILE_GRID_ROW_HEIGHT : GRID_ROW_HEIGHT;
  const margin = isMobile ? MOBILE_GRID_MARGIN : GRID_MARGIN;
  const typographyStyle = useMemo(
    () => getDashboardTypographyCssVars(designTypography),
    [designTypography]
  );
  const chartTypography = useMemo<AmChartTypography>(
    () => ({
      fontFamily: designTypography.fontFamily.value,
      fontSize:
        CHART_BODY_FONT_SIZE_BY_DESIGN_SIZE[designTypography.fontSize.value] ?? 13,
      fontStyle: designTypography.fontStyle.value === 'italic' ? 'italic' : 'normal',
      fontWeight: designTypography.fontStyle.value === 'bold' ? '600' : '400',
    }),
    [designTypography]
  );

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${isMobile ? styles.canvasMobile : ''} ${readOnly ? styles.readOnly : ''}`}
      style={typographyStyle}
    >
      <GridLayoutWithWidth
        key={isMobile ? 'mobile' : 'desktop'}
        className={styles.gridLayout}
        layout={displayLayout}
        cols={gridCols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={[0, 0]}
        compactType="vertical"
        onLayoutChange={readOnly ? undefined : handleLayoutChange}
        onResize={notifyChartsResize}
        onResizeStop={notifyChartsResize}
        isDraggable={!isMobile && !readOnly}
        isResizable={!isMobile && !readOnly}
        resizeHandles={isMobile || readOnly ? [] : ['se']}
        resizeHandle={isMobile || readOnly ? undefined : renderResizeHandle}
        draggableHandle={isMobile || readOnly ? undefined : `.${styles.dragHandle}`}
        draggableCancel={`.${styles.resizeHandle}, .dashboard-widget-actions`}
      >
        {displayLayout.map((item) => {
          const widget = widgetById.get(item.i);
          if (!widget) return null;

          return (
            <div key={widget.id} className={styles.gridItem}>
              {widget.type === 'wordcloud' ? <WordCloudDashboardCard shared={readOnly} dragHandleClassName={isMobile || readOnly ? undefined : styles.dragHandle} /> : widget.type === 'driver-analysis' ? (
                <DriverAnalysisDashboardCard
                  title={widget.title}
                  dragHandleClassName={isMobile || readOnly ? undefined : styles.dragHandle}
                  shared={readOnly}
                  actions={renderWidgetActions?.(widget) ?? (readOnly ? null : undefined)}
                  insightCount={insightThreads[widget.id]?.items.length ?? 0}
                  onOpenInsights={readOnly ? undefined : () => setActiveInsightWidgetId(widget.id)}
                  driverAnalysis={widget.driverAnalysis}
                />
              ) : <>
              <DashboardWidgetCard
                title={widget.title}
                dragHandleClassName={isMobile || readOnly ? undefined : styles.dragHandle}
                shared={readOnly}
                actions={renderWidgetActions?.(widget) ?? (readOnly ? null : undefined)}
                insightCount={insightThreads[widget.id]?.items.length ?? 0}
                onOpenInsights={readOnly ? undefined : () => setActiveInsightWidgetId(widget.id)}
                showDiamond={
                  showLicenseRestrictions &&
                  (widget.id === 'w-nps-benchmark' ||
                    widget.id === 'w-mean' ||
                    widget.id === 'w-comparative-bar' ||
                    widget.id === 'w-segment-trend')
                }
              >
                {renderWidget ? renderWidget(widget) : <AiWidgetRenderer
                  widgetId={widget.id}
                  type={widget.type}
                  typography={chartTypography}
                />}
              </DashboardWidgetCard>
              </>}
            </div>
          );
        })}
      </GridLayoutWithWidth>
      {footer}
      {!readOnly && <button type="button" className={styles.aiFab} aria-label="AI assistant">
        <span className="wc-ai" />
      </button>}

      {!readOnly && activeInsightWidgetId ? (() => {
        const activeWidget = widgetById.get(activeInsightWidgetId);
        const activeThread = insightThreads[activeInsightWidgetId];
        if (!activeWidget || !activeThread) return null;
        return (
          <DashboardAiInsightsPanel
            widget={activeWidget}
            thread={activeThread}
            refreshFrequency={insightRefreshFrequency}
            dashboardRefreshAnchorAt={lastAiInsightsRefreshAt}
            refreshing={refreshingWidgetId === activeInsightWidgetId}
            onClose={() => setActiveInsightWidgetId(null)}
            onRefresh={() => refreshWidgetInsight(activeInsightWidgetId)}
            onToggleLike={(insightId) =>
              toggleInsightLike(activeInsightWidgetId, insightId)
            }
            onAddInsight={(text) => addUserInsight(activeInsightWidgetId, text)}
            onAddComment={(insightId, text) =>
              addInsightComment(activeInsightWidgetId, insightId, text)
            }
          />
        );
      })() : null}
    </div>
  );
}
