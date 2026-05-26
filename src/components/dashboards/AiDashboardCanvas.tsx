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
} from '@/data/dashboard-grid-config';
import {
  AI_DASHBOARD_GRID_COLS,
  AI_DASHBOARD_LAYOUT,
  AI_DASHBOARD_WIDGETS,
} from '@/data/mock-ai-widgets';
import { useIsMobile } from '@/hooks/useIsMobile';
import { stackLayoutSingleColumn } from '@/lib/ai-dashboard-layout';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { AiWidgetRenderer } from '@/components/dashboards/widgets/AiWidgetRenderer';
import styles from './AiDashboardCanvas.module.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridLayoutWithWidth = WidthProvider(ReactGridLayout);

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

export function AiDashboardCanvas() {
  const isMobile = useIsMobile();
  const [desktopLayout, setDesktopLayout] = useState<Layout>(AI_DASHBOARD_LAYOUT);
  const canvasRef = useRef<HTMLDivElement>(null);

  const displayLayout = useMemo(
    () => (isMobile ? stackLayoutSingleColumn(desktopLayout) : desktopLayout),
    [isMobile, desktopLayout]
  );

  const widgetById = useMemo(
    () => new Map(AI_DASHBOARD_WIDGETS.map((widget) => [widget.id, widget])),
    []
  );

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

  const gridCols = isMobile ? 1 : AI_DASHBOARD_GRID_COLS;
  const rowHeight = isMobile ? MOBILE_GRID_ROW_HEIGHT : GRID_ROW_HEIGHT;
  const margin = isMobile ? MOBILE_GRID_MARGIN : GRID_MARGIN;

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${isMobile ? styles.canvasMobile : ''}`}
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
        onLayoutChange={handleLayoutChange}
        onResize={notifyChartsResize}
        onResizeStop={notifyChartsResize}
        isDraggable={!isMobile}
        isResizable={!isMobile}
        resizeHandles={isMobile ? [] : ['se']}
        resizeHandle={isMobile ? undefined : renderResizeHandle}
        draggableHandle={isMobile ? undefined : `.${styles.dragHandle}`}
        draggableCancel={`.${styles.resizeHandle}`}
      >
        {displayLayout.map((item) => {
          const widget = widgetById.get(item.i);
          if (!widget) return null;

          return (
            <div key={widget.id} className={styles.gridItem}>
              <DashboardWidgetCard
                title={widget.title}
                dragHandleClassName={isMobile ? undefined : styles.dragHandle}
              >
                <AiWidgetRenderer widgetId={widget.id} type={widget.type} />
              </DashboardWidgetCard>
            </div>
          );
        })}
      </GridLayoutWithWidth>
      <button type="button" className={styles.aiFab} aria-label="AI assistant">
        <span className="wc-ai" />
      </button>
    </div>
  );
}
