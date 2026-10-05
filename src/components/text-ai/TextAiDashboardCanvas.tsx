'use client';

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { TextAiConfiguredWidget } from './TextAiConfiguredWidget';
import { EMPTY_TEXT_AI_FILTER, type TextAiResponseFilter, type TextAiSettingsKind, type TextAiWidgetSettingsProps } from '@/data/text-ai-widget-settings';
import { TEXT_AI_SUBTHEME_STACKBAR_ROWS } from '@/data/mock-text-ai-subtheme-stackbar';
import type { ReactNode } from 'react';
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type ResizeHandleAxis,
} from 'react-grid-layout/legacy';
import { TextAiOverviewWidget, type TextAiOverviewKind } from './TextAiOverviewWidget';
import type { TextAiWidgetChartTypeId } from '@/data/mock-text-ai-widget-chart-types';
import { TextAiAnalysisWidgetCard } from '@/components/text-ai/TextAiAnalysisWidget';
import { TextAiKpiByThemeWidget } from '@/components/text-ai/TextAiKpiByThemeWidget';
import { TextAiSubthemeStackbarWidget } from '@/components/text-ai/TextAiSubthemeStackbarWidget';
import { TextAiSubthemeTrendWidget } from '@/components/text-ai/TextAiSubthemeTrendWidget';
import { TextAiSummaryWidgetCard } from '@/components/text-ai/TextAiSummaryWidget';
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
} from '@/data/mock-text-ai-widget-data';
import { isTextAiItemEmerging } from '@/data/text-ai-emerging-status';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import { defaultTextAiKpiConfig, type TextAiKpiConfig, type TextAiKpiWidgetInstance } from '@/data/mock-text-ai-kpi-by-theme';
import type { TextAiSubthemeTrendWidgetInstance } from '@/data/mock-text-ai-subtheme-trend';
import { DEFAULT_DASHBOARD_DESIGN, getDashboardDesignColorVars, type DashboardDesign } from '@/data/dashboard-design';
import { getTextAiTypographyCssVars } from '@/components/text-ai/text-ai-typography';
import { CENSORED_CONFIGURATION_EVENT, getSharedOutlierResponses, visibleCensoredResponses } from '@/data/text-ai-censored-subthemes';
import { parseTagAssignments, type TagAssignments } from '@/data/text-ai-tag-drafts';
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
  | 'overview'
  | 'subtheme-comparative'
  | 'kpi-by-theme'
  | 'subtheme-trend'
  | 'topic-segment'
  | 'subtheme-stackbar'
  | 'analysis'
  | 'summary';

interface TextAiCanvasWidget {
  id: string;
  kind: TextAiCanvasWidgetKind;
  content: ReactNode;
}

export interface TextAiAddedWidget { id: string; chartType: TextAiWidgetChartTypeId; question: string; }

interface TextAiDashboardCanvasProps {
  dashboardFilter?: TextAiResponseFilter;
  addedWidgets?: TextAiAddedWidget[];
  dashboardId: number;
  design?: DashboardDesign;
  selectedQuestion: TextAiDashboardQuestion;
  questionIndex: number;
  /** Widgets added via Add widget (e.g. comparative chart). Shown above default widgets. */
  addedTopicSegmentWidgets?: TextAiTopicSegmentWidget[];
  /** KPI impact widgets added through the TextAI widget gallery. */
  addedKpiWidgets?: TextAiKpiWidgetInstance[];
  onKpiChange?: (widgetId: string, config: TextAiKpiConfig) => void;
  /** Sub-theme trend widgets added through the TextAI widget gallery. */
  addedSubthemeTrendWidgets?: TextAiSubthemeTrendWidgetInstance[];
  themePreferences: TextAiThemePreferences;
}

const INITIAL_WIDGET_HEIGHTS: Record<TextAiCanvasWidgetKind, number> = {
  overview: 8,
  'subtheme-comparative': 8,
  'kpi-by-theme': 13,
  'subtheme-trend': 8,
  'topic-segment': 9,
  'subtheme-stackbar': 8,
  analysis: 8,
  summary: 8,
};

const MIN_WIDGET_HEIGHTS: Record<TextAiCanvasWidgetKind, number> = {
  overview: 6,
  'subtheme-comparative': 6,
  'kpi-by-theme': 1,
  'subtheme-trend': 8,
  'topic-segment': 5,
  'subtheme-stackbar': 6,
  analysis: 6,
  summary: 6,
};

function createInitialLayout(widgets: TextAiCanvasWidget[], previous: Layout = []): Layout {
  let y = 0;
  let x = 0;
  let rowHeight = 0;
  return widgets.map(widget => {
    const fullWidth = widget.kind === 'topic-segment' || widget.kind === 'kpi-by-theme';
    if (fullWidth && x !== 0) { y += rowHeight; x = 0; rowHeight = 0; }
    const height = previous.find(item => item.i === widget.id)?.h ?? INITIAL_WIDGET_HEIGHTS[widget.kind];
    const item = { isResizable: widget.kind !== 'kpi-by-theme', i: widget.id, x, y, w: fullWidth ? 12 : 6, h: height, minW: fullWidth ? 12 : 6, maxW: fullWidth ? 12 : 6, minH: MIN_WIDGET_HEIGHTS[widget.kind] };
    rowHeight = Math.max(rowHeight, height);
    if (fullWidth || x === 6) { y += rowHeight; x = 0; rowHeight = 0; } else x = 6;
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

function filterTopicRowsForDashboard(
  rows: TextAiTopicSegmentRow[],
  isApproved: (name: string, candidate: boolean) => boolean,
  isEmerging: (name: string, candidate: boolean | undefined) => boolean,
  parentCandidate = false
): TextAiTopicSegmentRow[] {
  return rows.flatMap((row) => {
    const rowCandidate = parentCandidate || Boolean(row.emerging);
    const rowApproved = isApproved(row.topic, rowCandidate);
    const rowEmerging = rowApproved && isEmerging(row.topic, rowCandidate);
    const subtopics = row.subtopics
      ? filterTopicRowsForDashboard(
          row.subtopics,
          isApproved,
          isEmerging,
          rowCandidate
        )
      : undefined;

    if (!rowApproved && !subtopics?.length) return [];

    return [
      {
        ...row,
        emerging: rowEmerging,
        subtopics,
      },
    ];
  });
}

function filterAnalysisWidgetsForDashboard(
  widgets: TextAiAnalysisWidget[],
  isApproved: (name: string, candidate: boolean) => boolean,
  isEmerging: (name: string, candidate: boolean | undefined) => boolean
): TextAiAnalysisWidget[] {
  return widgets.map((widget) => ({
    ...widget,
    rows: widget.rows.flatMap((row) => {
      const topicCandidate = Boolean(row.topicEmerging);
      const subtopicCandidate = topicCandidate || Boolean(row.subtopicEmerging);
      const topicApproved = isApproved(row.topic, topicCandidate);
      const subtopicApproved = isApproved(row.subtopic, subtopicCandidate);
      const topicEmerging =
        topicApproved && isEmerging(row.topic, topicCandidate);
      const subtopicEmerging =
        subtopicApproved && isEmerging(row.subtopic, subtopicCandidate);
      const visible = topicApproved && subtopicApproved;

      return visible
        ? [{ ...row, subtopicEmerging, topicEmerging }]
        : [];
    }),
  }));
}

export function TextAiDashboardCanvas({
  dashboardId,
  dashboardFilter = EMPTY_TEXT_AI_FILTER,
  design = DEFAULT_DASHBOARD_DESIGN,
  selectedQuestion,
  questionIndex,
  addedTopicSegmentWidgets = [],
  addedWidgets = [],
  addedKpiWidgets = [],
  onKpiChange,
  addedSubthemeTrendWidgets = [],
  themePreferences,
}: TextAiDashboardCanvasProps) {
  const designStyle = { ...getTextAiTypographyCssVars(design.typography), ...getDashboardDesignColorVars(design) };
  const isMobile = useIsMobile();
  const [isPositioning, setIsPositioning] = useState(false);
  const [removedWidgetIds, setRemovedWidgetIds] = useState<Set<string>>(() => new Set());
  const [deleteError,setDeleteError]=useState('');
  const [outlierAssignments, setOutlierAssignments] = useState<TagAssignments>({});
  const [outlierLoadError, setOutlierLoadError] = useState('');
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem(`bi-stats-text-ai-configuration-v2:${dashboardId}`);
        const snapshot = raw ? JSON.parse(raw) : null;
        setOutlierAssignments(parseTagAssignments(snapshot ? JSON.stringify(snapshot.assignments) : localStorage.getItem(`bi-stats-text-ai-tags-v1:${dashboardId}`)));
        setOutlierLoadError('');
      } catch { setOutlierLoadError('Saved Outlier responses could not be loaded. Reload to try again.'); }
    };
    refresh();
    window.addEventListener(CENSORED_CONFIGURATION_EVENT, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CENSORED_CONFIGURATION_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, [dashboardId]);
  useEffect(()=>{
    try{const ids=JSON.parse(localStorage.getItem(`text-ai-removed-widgets:${dashboardId}`)??'[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(Array.isArray(ids))setRemovedWidgetIds(new Set(ids.filter((v:unknown)=>typeof v==='string')));
    }catch{/* Ignore corrupt removal records. */}
  },[dashboardId]);
  const isApproved = (name: string, candidate: boolean) =>
    !candidate || themePreferences.approvedEmergingNames.includes(name);
  const isEmerging = (name: string, candidate: boolean | undefined) =>
    isTextAiItemEmerging(
      name,
      candidate,
      themePreferences.emergingThemeValidityDays,
      themePreferences.emergingApprovedAtByName[name]
    );
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
  const outlierRows = outlierLoadError ? [] : visibleCensoredResponses(getSharedOutlierResponses(selectedQuestion.id, outlierAssignments), themePreferences.showCensoredSubthemes).map(response => ({
    id: response.id, value: response.text, topic: response.subthemes.some(tag => tag.id.startsWith('outlier:')) ? 'Outlier Parent Topic' : response.subthemes.length ? 'Manually coded' : 'Untagged',
    subtopic: response.subthemes.map(tag => tag.label).join(', ') || 'Untagged', subtopicTone: 'neutral' as const,
    insight: '', tags: response.subthemes.map(tag => tag.label), collectedOn: '2026-10-05',
  }));
  const analysisWidgets = adaptAnalysisWidgets(
    getTextAiDashboardWidgets(dashboardId),
    selectedQuestion,
    questionIndex
  ).map(widget => ({ ...widget, rows: [...widget.rows, ...outlierRows] }));
  const visibleAddedTopicSegmentWidgets = addedTopicSegmentWidgets.map((widget) => ({
    ...widget,
    rows: filterTopicRowsForDashboard(
      widget.rows,
      isApproved,
      isEmerging
    ),
  }));
  const visibleTopicSegmentWidgets = topicSegmentWidgets.map((widget) => ({
    ...widget,
    rows: filterTopicRowsForDashboard(
      widget.rows,
      isApproved,
      isEmerging
    ),
  }));
  const visibleAnalysisWidgets = filterAnalysisWidgetsForDashboard(
    analysisWidgets,
    isApproved,
    isEmerging
  );

  function removeWidget(widgetId: string): void {
    const next=new Set(removedWidgetIds);next.add(widgetId);
    if (widgetId.startsWith('kpi-widget-')) { setRemovedWidgetIds(next); return; }
    try{localStorage.setItem(`text-ai-removed-widgets:${dashboardId}`,JSON.stringify([...next].filter(id => !id.startsWith('kpi-widget-'))));setRemovedWidgetIds(next);setDeleteError('');}
    catch{setDeleteError('The widget could not be deleted because browser storage is unavailable.');}
  }

  function renderAddedWidget(widget: TextAiAddedWidget): TextAiCanvasWidget {
    const onDelete = () => removeWidget(widget.id);
    const question = widget.question;
    if (widget.chartType === 'text-viewer') return { id: widget.id, kind: 'analysis', content: <TextAiAnalysisWidgetCard widget={{ ...analysisWidgets[0], id: widget.id, question }} onDelete={onDelete} /> };
    if (widget.chartType === 'text-summary') return { id: widget.id, kind: 'summary', content: <TextAiSummaryWidgetCard widget={{ ...summaryWidgets[0], id: widget.id, question }} onDelete={onDelete} /> };
    if (widget.chartType === 'subtheme-stacked-bar') return { id: widget.id, kind: 'subtheme-stackbar', content: <TextAiSubthemeStackbarWidget question={question} themePreferences={themePreferences} onDelete={onDelete} /> };
    if (widget.chartType === 'subtheme-comparative-chart') {
      const base = visibleTopicSegmentWidgets[0];
      const rows = base.rows.flatMap(parent => (parent.subtopics ?? []).map(row => ({ ...row, parentTopic: parent.topic, subtopics: undefined })));
      return { id: widget.id, kind: 'subtheme-comparative', content: <TextAiTopicSegmentWidgetCard widget={{ ...base, id: widget.id, question, rows, visibleSegmentKeys: ['overall'] }} onDelete={onDelete} /> };
    }
    return { id: widget.id, kind: 'overview', content: <TextAiOverviewWidget kind={widget.chartType as TextAiOverviewKind} question={question} themePreferences={themePreferences} onDelete={onDelete} /> };
  }
  const defaultExtraWidgets: TextAiAddedWidget[] = ['gauge', 'theme-stacked-bar', 'bubble-chart', 'trend-line', 'subtheme-comparative-chart'].map(chartType => ({ id: `default-${chartType}`, chartType: chartType as TextAiWidgetChartTypeId, question: selectedQuestion.text }));

  const allCanvasWidgets: TextAiCanvasWidget[] = [
    ...addedWidgets.map(renderAddedWidget),
    ...addedKpiWidgets.map((widget) => {
      const id = `kpi-widget-${widget.id}`;
      return {
        id,
        kind: 'kpi-by-theme' as const,
        content: (
          <TextAiConfiguredWidget dashboardId={dashboardId} widgetId={id} kind="kpi-by-theme"
            title={widget.name ?? 'Impact on KPI'} design={design} dashboardFilter={dashboardFilter}
            kpiBinding={{ config: widget.config ?? defaultTextAiKpiConfig(widget.kpiId), onChange: config => onKpiChange?.(widget.id, config) }}>
          <TextAiKpiByThemeWidget
            key={widget.id}
            question={widget.question}
            kpiId={widget.kpiId}
            config={widget.config}
            onContentHeightChange={height => reportKpiHeight(id, height)}
            responseFilter={dashboardFilter}
            onDelete={() => removeWidget(id)}
          />
          </TextAiConfiguredWidget>
        ),
      };
    }),
    ...addedSubthemeTrendWidgets.map((widget) => {
      const id = `subtheme-trend-${widget.id}`;
      return {
        id,
        kind: 'subtheme-trend' as const,
        content: (
          <TextAiSubthemeTrendWidget
            key={widget.id}
            question={widget.question}
            onDelete={() => removeWidget(id)}
          />
        ),
      };
    }),
    ...visibleAddedTopicSegmentWidgets.map((widget) => {
      const id = `topic-segment-${widget.id}`;
      return {
        id,
        kind: 'topic-segment' as const,
        content: (
          <TextAiTopicSegmentWidgetCard
            key={widget.id}
            widget={widget}
            onDelete={() => removeWidget(id)}
          />
        ),
      };
    }),
    ...visibleTopicSegmentWidgets.map((widget) => {
      const id = `topic-segment-${widget.id}`;
      return {
        id,
        kind: 'topic-segment' as const,
        content: (
          <TextAiTopicSegmentWidgetCard
            key={`${widget.id}-${selectedQuestion.id}`}
            widget={widget}
            onDelete={() => removeWidget(id)}
          />
        ),
      };
    }),
    {
      id: 'subtheme-stackbar',
      kind: 'subtheme-stackbar' as const,
      content: (
        <TextAiSubthemeStackbarWidget
          question={selectedQuestion.text}
          onDelete={() => removeWidget('subtheme-stackbar')}
          themePreferences={themePreferences}
        />
      ),
    },
    ...defaultExtraWidgets.map(renderAddedWidget),
    ...visibleAnalysisWidgets.map((widget, index) => {
      const id = `analysis-${index}`;
      return {
        id,
        kind: 'analysis' as const,
        content: (
          <TextAiAnalysisWidgetCard
            key={widget.id}
            widget={widget}
            onDelete={() => removeWidget(id)}
          />
        ),
      };
    }),
    ...summaryWidgets.map((widget) => {
      const id = `summary-${widget.id}`;
      return {
        id,
        kind: 'summary' as const,
        content: (
          <TextAiSummaryWidgetCard
            key={`${widget.id}-${selectedQuestion.id}`}
            widget={widget}
            onDelete={() => removeWidget(id)}
          />
        ),
      };
    }),
  ];
  function configureWidget(entry: TextAiCanvasWidget): TextAiCanvasWidget {
    if(entry.kind==='kpi-by-theme'||entry.kind==='subtheme-trend') return entry;
    const element=entry.content as ReactElement<TextAiWidgetSettingsProps & {kind?:TextAiOverviewKind;question?:string;widget?:TextAiTopicSegmentWidget & TextAiSummaryWidget}>;
    const kind:TextAiSettingsKind=entry.kind==='overview'?element.props.kind! : entry.kind==='analysis'?'text-viewer':entry.kind==='summary'?'text-summary':entry.kind==='subtheme-stackbar'?'subtheme-stacked-bar':entry.kind==='subtheme-comparative'?'subtheme-comparative-chart':'comparative-chart';
    const title=element.props.question??element.props.widget?.question??selectedQuestion.text;
    const rows=element.props.widget?.rows??[];
    const stackRows=TEXT_AI_SUBTHEME_STACKBAR_ROWS.filter(row=>isApproved(row.label,Boolean(row.emerging)));
    const items=kind.includes('comparative')?rows.map(row=>({id:row.id,label:row.topic})):stackRows.map(row=>({id:row.id,label:row.label}));
    const subthemes=stackRows.flatMap(parent=>parent.subthemes.filter(row=>isApproved(row.label,Boolean(parent.emerging||row.emerging))).map(row=>({id:row.id,label:`${parent.label} / ${row.label}`,parentId:parent.id})));
    const identity=addedWidgets.some(w=>w.id===entry.id)||visibleAddedTopicSegmentWidgets.some(w=>`topic-segment-${w.id}`===entry.id)?entry.id:`${entry.id}:${selectedQuestion.id}`;
    return {...entry,content:<TextAiConfiguredWidget key={identity} dashboardId={dashboardId} widgetId={identity} kind={kind} title={title} design={design} dashboardFilter={dashboardFilter} items={items} parents={stackRows.map(row=>({id:row.id,label:row.label}))} subthemes={subthemes} sections={[...new Set(element.props.widget?.summaryTypes?.flatMap(v=>v.sections.map(section=>section.heading))??[])]}>{element}</TextAiConfiguredWidget>};
  }
  const canvasWidgets = allCanvasWidgets.map(configureWidget).filter(
    (widget) => !removedWidgetIds.has(widget.id)
  ).sort((a, b) => Number(b.kind === 'topic-segment') - Number(a.kind === 'topic-segment'));
  const canvasWidgetIds = canvasWidgets.map((widget) => widget.id).join('|');
  const [desktopLayout, setDesktopLayout] = useState<Layout>(() =>
    createInitialLayout(canvasWidgets)
  );

  useEffect(() => {
    // Grid layout is the external state owned by react-grid-layout; reconcile it
    // when the set of rendered widgets changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktopLayout((prev) => {
      const visibleIds = new Set(canvasWidgets.map((widget) => widget.id));
      const kept = prev.filter((item) => visibleIds.has(item.i));
      const existingIds = new Set(kept.map((item) => item.i));
      const missing = canvasWidgets.filter((widget) => !existingIds.has(widget.id));

      if (missing.length === 0 && kept.length === prev.length) return prev;
      return createInitialLayout(canvasWidgets, prev);
    });
    // Sync layout when widgets are added or deleted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidgetIds]);

  function reportKpiHeight(id: string, pixels: number): void {
    const h = (Math.ceil(pixels) + TEXT_AI_GRID_MARGIN[1]) / (TEXT_AI_GRID_ROW_HEIGHT + TEXT_AI_GRID_MARGIN[1]);
    setDesktopLayout(previous => {
      const item = previous.find(item => item.i === id);
      if (!item || Math.abs(item.h - h) < 0.001) return previous;
      return previous.map(item => item.i === id ? { ...item, h, minH: 1, isResizable: false } : item);
    });
  }

  const widgetById = new Map(canvasWidgets.map((widget) => [widget.id, widget]));

  const notifyWidgetResize = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  const handleLayoutChange = useCallback((nextLayout: Layout) => {
    setDesktopLayout(nextLayout.map((item) => ({ ...item })));
  }, [setDesktopLayout]);

  function startPositioning(): void {
    setIsPositioning(true);
  }

  function stopPositioning(): void {
    setIsPositioning(false);
    notifyWidgetResize();
  }

  if (isMobile) {
    return (
      <div className={styles.canvas} style={designStyle} data-dashboard-theme={design.theme}>
        {deleteError&&<p role="alert">{deleteError}</p>}
      {outlierLoadError&&<p role="alert">{outlierLoadError}</p>}
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
      style={designStyle}
      data-dashboard-theme={design.theme}
    >
      {deleteError&&<p role="alert">{deleteError}</p>}
      {outlierLoadError&&<p role="alert">{outlierLoadError}</p>}
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
