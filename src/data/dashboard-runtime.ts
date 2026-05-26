import type { Dashboard } from '@/data/mock-dashboards';

const STORAGE_KEY = 'bi-lite-created-dashboards';

export function getRuntimeDashboards(): Dashboard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Dashboard[]) : [];
  } catch {
    return [];
  }
}

export function saveRuntimeDashboard(dashboard: Dashboard): void {
  if (typeof window === 'undefined') return;
  const existing = getRuntimeDashboards().filter((d) => d.id !== dashboard.id);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([dashboard, ...existing]));
}
