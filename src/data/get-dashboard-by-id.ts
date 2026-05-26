import { getRuntimeDashboards } from '@/data/dashboard-runtime';
import { MOCK_DASHBOARDS, type Dashboard } from '@/data/mock-dashboards';

export function getDashboardById(id: number): Dashboard | undefined {
  const runtime = getRuntimeDashboards().find((d) => d.id === id);
  if (runtime) return runtime;
  return MOCK_DASHBOARDS.find((d) => d.id === id);
}
