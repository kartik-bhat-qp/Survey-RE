'use client';

import { TextAiAnalysisWidgetCard } from '@/components/text-ai/TextAiAnalysisWidget';
import { TextAiSummaryWidgetCard } from '@/components/text-ai/TextAiSummaryWidget';
import { TextAiTopicSegmentWidgetCard } from '@/components/text-ai/TextAiTopicSegmentWidget';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
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
import styles from './TextAiDashboardCanvas.module.css';

interface TextAiDashboardCanvasProps {
  dashboardId: number;
  selectedQuestion: TextAiDashboardQuestion;
  questionIndex: number;
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

export function TextAiDashboardCanvas({
  dashboardId,
  selectedQuestion,
  questionIndex,
}: TextAiDashboardCanvasProps) {
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

  return (
    <div className={styles.canvas}>
      {topicSegmentWidgets.map((widget) => (
        <TextAiTopicSegmentWidgetCard
          key={`${widget.id}-${selectedQuestion.id}`}
          widget={widget}
        />
      ))}
      {analysisWidgets.map((widget) => (
        <TextAiAnalysisWidgetCard key={widget.id} widget={widget} />
      ))}
      {summaryWidgets.map((widget) => (
        <TextAiSummaryWidgetCard
          key={`${widget.id}-${selectedQuestion.id}`}
          widget={widget}
        />
      ))}
    </div>
  );
}
