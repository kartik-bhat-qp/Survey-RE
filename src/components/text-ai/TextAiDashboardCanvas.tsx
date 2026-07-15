'use client';

import { TextAiAnalysisWidgetCard } from '@/components/text-ai/TextAiAnalysisWidget';
import { TextAiSummaryWidgetCard } from '@/components/text-ai/TextAiSummaryWidget';
import { TextAiTopicSegmentWidgetCard } from '@/components/text-ai/TextAiTopicSegmentWidget';
import { getTextAiSummaryWidgets } from '@/data/mock-text-ai-summary-widget';
import { getTextAiDashboardWidgets } from '@/data/mock-text-ai-widget-data';
import { getTextAiTopicSegmentWidgets } from '@/data/mock-text-ai-topic-segment-widget';
import styles from './TextAiDashboardCanvas.module.css';

interface TextAiDashboardCanvasProps {
  dashboardId: number;
}

export function TextAiDashboardCanvas({ dashboardId }: TextAiDashboardCanvasProps) {
  const summaryWidgets = getTextAiSummaryWidgets(dashboardId);
  const topicSegmentWidgets = getTextAiTopicSegmentWidgets(dashboardId);
  const analysisWidgets = getTextAiDashboardWidgets(dashboardId);

  return (
    <div className={styles.canvas}>
      {topicSegmentWidgets.map((widget) => (
        <TextAiTopicSegmentWidgetCard key={widget.id} widget={widget} />
      ))}
      {analysisWidgets.map((widget) => (
        <TextAiAnalysisWidgetCard key={widget.id} widget={widget} />
      ))}
      {summaryWidgets.map((widget) => (
        <TextAiSummaryWidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
