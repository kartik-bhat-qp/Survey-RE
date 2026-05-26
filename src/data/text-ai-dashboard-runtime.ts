import type { TextAiDashboard } from '@/data/mock-text-ai-dashboards';

const STORAGE_KEY = 'bi-stats-created-text-ai-dashboards';

export function getRuntimeTextAiDashboards(): TextAiDashboard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TextAiDashboard[]) : [];
  } catch {
    return [];
  }
}

export function saveRuntimeTextAiDashboard(dashboard: TextAiDashboard): void {
  if (typeof window === 'undefined') return;
  const existing = getRuntimeTextAiDashboards().filter((d) => d.id !== dashboard.id);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([dashboard, ...existing]));
}
