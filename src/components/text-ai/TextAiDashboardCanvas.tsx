'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type ResizeHandleAxis,
} from 'react-grid-layout/legacy';
import { TextAiAnalysisWidgetCard } from '@/components/text-ai/TextAiAnalysisWidget';
import { TextAiSubthemeStackbarWidget } from '@/components/text-ai/TextAiSubthemeStackbarWidget';
import { TextAiSummaryWidgetCard } from '@/components/text-ai/TextAiSummaryWidget';
import { TextAiThemeStackbarWidget } from '@/components/text-ai/TextAiThemeStackbarWidget';
import { TextAiTopicSegmentWidgetCard } from '@/components/text-ai/TextAiTopicSegmentWidget';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  getTextAiSummaryWidgets,
  type TextAiSummarySection,
  type TextAiSummaryWidget,
} from '@/data/mock-text-ai-summary-widget';
import {
  deriveGenderChiSquare,
  getTextAiTopicSegmentWidgets,
  type TextAiTopicSegmentCell,
  type TextAiTopicSegmentRow,
  type TextAiTopicSegmentWidget,
} from '@/data/mock-text-ai-topic-segment-widget';
import {
  getTextAiDashboardWidgets,
  type TextAiAnalysisWidget,
  type TextAiThemeStatusFilter,
} from '@/data/mock-text-ai-widget-data';
import styles from './TextAiDashboardCanvas.module.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridLayoutWithWidth = WidthProvider(ReactGridLayout);

const TEXT_AI_GRID_COLS = 12;
const TEXT_AI_GRID_ROW_HEIGHT = 40;
const TEXT_AI_GRID_MARGIN: [number, number] = [12, 12];
const TEXT_AI_GRID_GUIDE_CELL_COUNT = TEXT_AI_GRID_COLS * 60;
const TEXT_AI_WIDGET_DRAG_HANDLE_CLASS = 'text-ai-widget-drag-handle';

type TextAiCanvasWidgetKind =
  | 'topic-segment'
  | 'subtheme-stackbar'
  | 'theme-stackbar'
  | 'analysis'
  | 'summary';

interface TextAiCanvasWidget {
  id: string;
  kind: TextAiCanvasWidgetKind;
  content: ReactNode;
}

interface TextAiDashboardCanvasProps {
  dashboardId: number;
  selectedQuestion: TextAiDashboardQuestion;
  questionIndex: number;
  themeStatus: TextAiThemeStatusFilter;
  /** Widgets added via Add widget (e.g. comparative chart). Shown above default widgets. */
  addedTopicSegmentWidgets?: TextAiTopicSegmentWidget[];
}

const INITIAL_WIDGET_HEIGHTS: Record<TextAiCanvasWidgetKind, number> = {
  'topic-segment': 9,
  'subtheme-stackbar': 8,
  'theme-stackbar': 11,
  analysis: 25,
  summary: 10,
};

const MIN_WIDGET_HEIGHTS: Record<TextAiCanvasWidgetKind, number> = {
  'topic-segment': 5,
  'subtheme-stackbar': 6,
  'theme-stackbar': 6,
  analysis: 6,
  summary: 6,
};

function createInitialLayout(widgets: TextAiCanvasWidget[]): Layout {
  let y = 0;

  return widgets.map((widget) => {
    const height = INITIAL_WIDGET_HEIGHTS[widget.kind];
    const item = {
      i: widget.id,
      x: 0,
      y,
      w: TEXT_AI_GRID_COLS,
      h: height,
      minW: 3,
      minH: MIN_WIDGET_HEIGHTS[widget.kind],
    };
    y += height;
    return item;
  });
}

function renderResizeHandle(
  _axis: ResizeHandleAxis,
  ref: React.Ref<HTMLSpanElement>
): React.ReactElement {
  return (
    <span
      ref={ref}
      className={`react-resizable-handle react-resizable-handle-se ${styles.resizeHandle}`}
      aria-label="Resize widget"
    />
  );
}

function getQuestionFactor(questionIndex: number): number {
  return [1, 0.91, 1.08, 0.96, 1.04][Math.max(0, questionIndex) % 5];
}

function scaleCell(
  cell: TextAiTopicSegmentCell,
  countFactor: number,
  percentageFactor: number
): TextAiTopicSegmentCell {
  return {
    count: Math.max(1, Math.round(cell.count * countFactor)),
    percentage: Math.max(0.1, Math.round(cell.percentage * percentageFactor * 10) / 10),
  };
}

function adaptTopicRows(
  rows: TextAiTopicSegmentRow[],
  questionId: string,
  factor: number
): TextAiTopicSegmentRow[] {
  return rows.map((row, rowIndex) => {
    const rowAdjustment = 1 + ((rowIndex % 3) - 1) * 0.018;
    const countFactor = factor * rowAdjustment;
    const percentageFactor =
      1 + (factor - 1) * 0.55 + (rowIndex % 2 ? 0.012 : -0.008);
    const overall = scaleCell(row.overall, countFactor, percentageFactor);
    const male = scaleCell(row.male, countFactor * 1.008, percentageFactor);
    const female = scaleCell(row.female, countFactor * 0.992, percentageFactor * 0.99);
    const otherGender = scaleCell(
      row.otherGender,
      countFactor * 1.015,
      percentageFactor * 1.01
    );

    return {
      ...row,
      overall,
      male,
      female,
      otherGender,
      genderChiSquare: deriveGenderChiSquare({
        id: `${row.id}-${questionId}`,
        male,
        female,
        otherGender,
      }),
      subtopics: row.subtopics
        ? adaptTopicRows(row.subtopics, questionId, factor)
        : undefined,
    };
  });
}

function adaptTopicWidgets(
  widgets: TextAiTopicSegmentWidget[],
  selectedQuestion: TextAiDashboardQuestion,
  factor: number
): TextAiTopicSegmentWidget[] {
  return widgets.map((widget) => ({
    ...widget,
    question: selectedQuestion.text,
    rows: adaptTopicRows(widget.rows, selectedQuestion.id, factor),
  }));
}

function adaptSummaryText(text: string, factor: number, questionIndex: number): string {
  const responseCount = Math.round(3044 * factor).toLocaleString('en-US');
  const positiveCount = Math.round(1281 * factor).toLocaleString('en-US');
  const topicCount = 27 + ((Math.max(0, questionIndex) % 5) - 2);

  return text
    .replaceAll('3,044', responseCount)
    .replaceAll('1,281', positiveCount)
    .replaceAll('27 parent topics', `${topicCount} parent topics`)
    .replaceAll('customer feedback', 'responses to the selected question')
    .replaceAll('Customer feedback', 'Responses to the selected question');
}

function adaptSummarySection(
  section: TextAiSummarySection,
  factor: number,
  questionIndex: number
): TextAiSummarySection {
  const adapt = (text: string) => adaptSummaryText(text, factor, questionIndex);
  return {
    ...section,
    paragraphs: section.paragraphs.map(adapt),
    bullets: section.bullets?.map(adapt),
    trailingParagraphs: section.trailingParagraphs?.map(adapt),
  };
}

function adaptSummaryWidgets(
  widgets: TextAiSummaryWidget[],
  selectedQuestion: TextAiDashboardQuestion,
  factor: number,
  questionIndex: number
): TextAiSummaryWidget[] {
  return widgets.map((widget) => ({
    ...widget,
    question: selectedQuestion.text,
    summaryTypes: widget.summaryTypes.map((summaryType) => ({
      ...summaryType,
      sections: summaryType.sections.map((section) =>
        adaptSummarySection(section, factor, questionIndex)
      ),
    })) as TextAiSummaryWidget['summaryTypes'],
  }));
}

function adaptAnalysisWidgets(
  widgets: TextAiAnalysisWidget[],
  selectedQuestion: TextAiDashboardQuestion,
  questionIndex: number
): TextAiAnalysisWidget[] {
  const safeIndex = Math.max(0, questionIndex);
  const baseWidget = widgets[safeIndex % widgets.length];
  if (!baseWidget) return [];
  const rowOffset = safeIndex % baseWidget.rows.length;
  const rotatedRows = [
    ...baseWidget.rows.slice(rowOffset),
    ...baseWidget.rows.slice(0, rowOffset),
  ];
  const visibleRowCount = Math.max(5, rotatedRows.length - (safeIndex % 3));

  return [
    {
      ...baseWidget,
      id: `${baseWidget.id}-${selectedQuestion.id}`,
      question: selectedQuestion.text,
      rows: rotatedRows.slice(0, visibleRowCount),
    },
  ];
}

function filterTopicRowsByStatus(
  rows: TextAiTopicSegmentRow[],
  status: TextAiThemeStatusFilter
): TextAiTopicSegmentRow[] {
  if (status === 'all') return rows;

  return rows.flatMap((row) => {
    const subtopics = row.subtopics
      ? filterTopicRowsByStatus(row.subtopics, status)
      : undefined;
    const rowMatches =
      status === 'emerging' ? Boolean(row.emerging) : !row.emerging;

    if (!rowMatches && !subtopics?.length) return [];

    return [
      {
        ...row,
        subtopics,
      },
    ];
  });
}

function filterAnalysisWidgetsByStatus(
  widgets: TextAiAnalysisWidget[],
  status: TextAiThemeStatusFilter
): TextAiAnalysisWidget[] {
  if (status === 'all') return widgets;

  return widgets.map((widget) => ({
    ...widget,
    rows: widget.rows.filter((row) => {
      const emerging = Boolean(row.topicEmerging || row.subtopicEmerging);
      return status === 'emerging' ? emerging : !emerging;
    }),
  }));
}

export function TextAiDashboardCanvas({
  dashboardId,
  selectedQuestion,
  questionIndex,
  themeStatus,
  addedTopicSegmentWidgets = [],
}: TextAiDashboardCanvasProps) {
  const isMobile = useIsMobile();
  const [isPositioning, setIsPositioning] = useState(false);
  const questionFactor = getQuestionFactor(questionIndex);
  const summaryWidgets = adaptSummaryWidgets(
    getTextAiSummaryWidgets(dashboardId),
    selectedQuestion,
    questionFactor,
    questionIndex
  );
  const topicSegmentWidgets = adaptTopicWidgets(
    getTextAiTopicSegmentWidgets(dashboardId),
    selectedQuestion,
    questionFactor
  );
  const analysisWidgets = adaptAnalysisWidgets(
    getTextAiDashboardWidgets(dashboardId),
    selectedQuestion,
    questionIndex
  );
  const visibleAddedTopicSegmentWidgets = addedTopicSegmentWidgets.map((widget) => ({
    ...widget,
    rows: filterTopicRowsByStatus(widget.rows, themeStatus),
  }));
  const visibleTopicSegmentWidgets = topicSegmentWidgets.map((widget) => ({
    ...widget,
    rows: filterTopicRowsByStatus(widget.rows, themeStatus),
  }));
  const visibleAnalysisWidgets = filterAnalysisWidgetsByStatus(
    analysisWidgets,
    themeStatus
  );
  const canvasWidgets: TextAiCanvasWidget[] = [
    ...visibleAddedTopicSegmentWidgets.map((widget) => ({
      id: `topic-segment-${widget.id}`,
      kind: 'topic-segment' as const,
      content: <TextAiTopicSegmentWidgetCard key={widget.id} widget={widget} />,
    })),
    ...visibleTopicSegmentWidgets.map((widget) => ({
      id: `topic-segment-${widget.id}`,
      kind: 'topic-segment' as const,
      content: (
        <TextAiTopicSegmentWidgetCard
          key={`${widget.id}-${selectedQuestion.id}`}
          widget={widget}
        />
      ),
    })),
    {
      id: 'subtheme-stackbar',
      kind: 'subtheme-stackbar',
      content: (
        <TextAiSubthemeStackbarWidget
          question={selectedQuestion.text}
          themeStatus={themeStatus}
        />
      ),
    },
    {
      id: 'theme-stackbar',
      kind: 'theme-stackbar',
      content: (
        <TextAiThemeStackbarWidget
          question={selectedQuestion.text}
          themeStatus={themeStatus}
        />
      ),
    },
    ...visibleAnalysisWidgets.map((widget, index) => ({
      id: `analysis-${index}`,
      kind: 'analysis' as const,
      content: <TextAiAnalysisWidgetCard key={widget.id} widget={widget} />,
    })),
    ...summaryWidgets.map((widget) => ({
      id: `summary-${widget.id}`,
      kind: 'summary' as const,
      content: (
        <TextAiSummaryWidgetCard
          key={`${widget.id}-${selectedQuestion.id}`}
          widget={widget}
        />
      ),
    })),
  ];
  const canvasWidgetIds = canvasWidgets.map((widget) => widget.id).join('|');
  const [desktopLayout, setDesktopLayout] = useState<Layout>(() =>
    createInitialLayout(canvasWidgets)
  );

  useEffect(() => {
    setDesktopLayout((prev) => {
      const existingIds = new Set(prev.map((item) => item.i));
      const missing = canvasWidgets.filter((widget) => !existingIds.has(widget.id));
      if (missing.length === 0) return prev;

      let yOffset = 0;
      const inserted = missing.map((widget) => {
        const height = INITIAL_WIDGET_HEIGHTS[widget.kind];
        const item = {
          i: widget.id,
          x: 0,
          y: yOffset,
          w: TEXT_AI_GRID_COLS,
          h: height,
          minW: 3,
          minH: MIN_WIDGET_HEIGHTS[widget.kind],
        };
        yOffset += height;
        return item;
      });

      return [
        ...inserted,
        ...prev.map((item) => ({ ...item, y: item.y + yOffset })),
      ];
    });
    // Sync layout when widgets are added (e.g. comparative chart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidgetIds]);

  const widgetById = new Map(canvasWidgets.map((widget) => [widget.id, widget]));

  const notifyWidgetResize = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  const handleLayoutChange = useCallback((nextLayout: Layout) => {
    setDesktopLayout(nextLayout.map((item) => ({ ...item })));
  }, []);

  function startPositioning(): void {
    setIsPositioning(true);
  }

  function stopPositioning(): void {
    setIsPositioning(false);
    notifyWidgetResize();
  }

  if (isMobile) {
    return (
      <div className={styles.canvas}>
        <div className={styles.mobileWidgetStack}>
          {canvasWidgets.map((widget) => (
            <div className={styles.mobileWidget} key={widget.id}>
              {widget.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.canvas} ${isPositioning ? styles.canvasPositioning : ''}`}
    >
      <div className={styles.layoutStage}>
        <div className={styles.gridGuide} aria-hidden>
          {Array.from({ length: TEXT_AI_GRID_GUIDE_CELL_COUNT }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <GridLayoutWithWidth
          className={styles.gridLayout}
          layout={desktopLayout}
          cols={TEXT_AI_GRID_COLS}
          rowHeight={TEXT_AI_GRID_ROW_HEIGHT}
          margin={TEXT_AI_GRID_MARGIN}
          containerPadding={[0, 0]}
          compactType="vertical"
          isBounded
          isDraggable
          isResizable
          resizeHandles={['se']}
          resizeHandle={renderResizeHandle}
          draggableHandle={`.${TEXT_AI_WIDGET_DRAG_HANDLE_CLASS}`}
          draggableCancel="button, input, textarea, select, [role='button'], [role='combobox']"
          onDragStart={startPositioning}
          onDragStop={stopPositioning}
          onResizeStart={startPositioning}
          onResize={notifyWidgetResize}
          onResizeStop={stopPositioning}
          onLayoutChange={handleLayoutChange}
        >
          {desktopLayout.map((item) => {
            const widget = widgetById.get(item.i);
            if (!widget) return null;

            return (
              <div
                key={widget.id}
                className={styles.gridItem}
                data-text-ai-widget={widget.id}
              >
                <div className={styles.widgetSurface}>{widget.content}</div>
              </div>
            );
          })}
        </GridLayoutWithWidth>
      </div>
    </div>
  );
}
