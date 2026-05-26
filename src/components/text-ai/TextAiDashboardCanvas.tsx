'use client';

import { TextAiAnalysisWidgetCard } from '@/components/text-ai/TextAiAnalysisWidget';
import { getTextAiDashboardWidgets } from '@/data/mock-text-ai-widget-data';
import styles from './TextAiDashboardCanvas.module.css';

interface TextAiDashboardCanvasProps {
  dashboardId: number;
}

export function TextAiDashboardCanvas({ dashboardId }: TextAiDashboardCanvasProps) {
  const widgets = getTextAiDashboardWidgets(dashboardId);

  return (
    <div className={styles.canvas}>
      {widgets.map((widget) => (
        <TextAiAnalysisWidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
