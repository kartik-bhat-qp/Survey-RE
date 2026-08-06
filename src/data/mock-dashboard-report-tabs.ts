import { MOCK_REPORTS, type Report } from '@/data/mock-reports';
import { MOCK_TEXT_AI_DASHBOARDS } from '@/data/mock-text-ai-dashboards';

export type DashboardReportTabCategory = 'crosstab' | 'text-ai' | 'conjoint';

export interface DashboardReportTabCategoryOption {
  id: DashboardReportTabCategory;
  label: string;
  comingSoon?: boolean;
}

export const DASHBOARD_REPORT_TAB_CATEGORIES: DashboardReportTabCategoryOption[] = [
  { id: 'crosstab', label: 'Crosstab' },
  { id: 'text-ai', label: 'Text AI' },
  { id: 'conjoint', label: 'Conjoint', comingSoon: true },
];

export const DASHBOARD_REPORT_TAB_PAGE_SIZE = 10;

export interface DashboardReportPickItem extends Report {
  category: Exclude<DashboardReportTabCategory, 'conjoint'>;
  /** Original TextAI dashboard id when category is text-ai. */
  textAiDashboardId?: number;
}

/** Extra crosstab-style reports so the picker can show a longer list like production. */
const EXTRA_CROSSTAB_REPORTS: DashboardReportPickItem[] = [
  { id: 101, name: 'Brand Tracker Wave 3', creationDate: '2026-05-20', category: 'crosstab' },
  { id: 102, name: 'Region × Satisfaction', creationDate: '2026-05-18', category: 'crosstab' },
  { id: 103, name: 'Gender breakout', creationDate: '2026-05-12', category: 'crosstab' },
  { id: 104, name: 'Age band × NPS', creationDate: '2026-05-09', category: 'crosstab' },
  { id: 105, name: 'Store exit crosstab', creationDate: '2026-05-03', category: 'crosstab' },
  { id: 106, name: 'Promo awareness grid', creationDate: '2026-04-28', category: 'crosstab' },
  { id: 107, name: 'Loyalty tier mix', creationDate: '2026-04-21', category: 'crosstab' },
  { id: 108, name: 'Channel preference', creationDate: '2026-04-16', category: 'crosstab' },
  { id: 109, name: 'Purchase intent matrix', creationDate: '2026-04-11', category: 'crosstab' },
  { id: 110, name: 'Concept test scores', creationDate: '2026-04-07', category: 'crosstab' },
  { id: 111, name: 'Usage occasion table', creationDate: '2026-03-30', category: 'crosstab' },
  { id: 112, name: 'Competitor set', creationDate: '2026-03-22', category: 'crosstab' },
  { id: 113, name: 'Feature importance', creationDate: '2026-03-15', category: 'crosstab' },
];

/** TextAI dashboards available to attach as a report tab (same list as TextAI dashboards page). */
const TEXT_AI_DASHBOARD_PICK_ITEMS: DashboardReportPickItem[] = MOCK_TEXT_AI_DASHBOARDS.map(
  (dashboard) => ({
    // Offset avoids colliding with crosstab report ids.
    id: 1000 + dashboard.id,
    name: dashboard.name,
    creationDate: dashboard.creationDate,
    category: 'text-ai' as const,
    textAiDashboardId: dashboard.id,
  })
);

export const DASHBOARD_REPORT_PICK_ITEMS: DashboardReportPickItem[] = [
  ...MOCK_REPORTS.map((report) => ({
    ...report,
    category: 'crosstab' as const,
  })),
  ...EXTRA_CROSSTAB_REPORTS,
  ...TEXT_AI_DASHBOARD_PICK_ITEMS,
];

export function getDashboardReportsByCategory(
  category: DashboardReportTabCategory
): DashboardReportPickItem[] {
  if (category === 'conjoint') return [];
  return DASHBOARD_REPORT_PICK_ITEMS.filter((report) => report.category === category);
}
