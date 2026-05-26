import { getRuntimeTextAiDashboards } from '@/data/text-ai-dashboard-runtime';
import {
  MOCK_TEXT_AI_DASHBOARDS,
  type TextAiDashboard,
} from '@/data/mock-text-ai-dashboards';

export function getTextAiDashboardById(id: number): TextAiDashboard | undefined {
  const runtime = getRuntimeTextAiDashboards().find((d) => d.id === id);
  if (runtime) return runtime;
  return MOCK_TEXT_AI_DASHBOARDS.find((d) => d.id === id);
}
