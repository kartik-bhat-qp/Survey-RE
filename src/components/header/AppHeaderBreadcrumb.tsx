'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';
import { MOCK_DATASETS } from '@/data/mock-datasets';
import { getReportById } from '@/data/mock-reports';
import { MOCK_CURRENT_WORKSPACE } from '@/data/mock-workspace';
import { getBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import { getSectionBasePath, withSectionBasePath } from '@/lib/section-base-path';
import styles from './AppHeaderBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false }
);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const biBasePath = getBiProductBasePath(pathname);
  const sectionBasePath = getSectionBasePath(pathname);
  const basePath = biBasePath || sectionBasePath;
  const routePath =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || '/'
      : pathname;
  const path = (href: string) =>
    biBasePath
      ? withBiProductBasePath(biBasePath, href)
      : withSectionBasePath(sectionBasePath, href);

  const workspaces: BreadcrumbItem = { label: 'Workspaces', href: '/workspaces' };
  const workspace: BreadcrumbItem = { label: MOCK_CURRENT_WORKSPACE.name };
  const dashboards: BreadcrumbItem = { label: 'Dashboards', href: path('/dashboards') };

  if (routePath === '/workspaces') {
    return [{ label: 'Workspaces' }];
  }

  if (routePath === '/dashboards') {
    return [workspaces, workspace, { label: 'Dashboards' }];
  }

  if (routePath === '/reports') {
    return [workspaces, workspace, { label: 'Reports' }];
  }

  const reportMatch = routePath.match(/^\/reports\/(\d+)$/);
  if (reportMatch) {
    const report = getReportById(Number(reportMatch[1]));
    return [
      workspaces,
      workspace,
      { label: 'Reports', href: path('/reports') },
      { label: report?.name ?? 'Untitled' },
    ];
  }

  if (routePath === '/settings') {
    return [workspaces, workspace, { label: 'Settings' }];
  }

  if (routePath === '/text-ai') {
    return [workspaces, workspace, { label: 'TextAI' }];
  }

  if (routePath === '/datasets') {
    return [workspace, { label: 'Data set' }];
  }

  const datasetMatch = routePath.match(/^\/datasets\/(\d+)$/);
  if (datasetMatch) {
    const dataset = MOCK_DATASETS.find((item) => item.id === Number(datasetMatch[1]));
    return [
      workspace,
      { label: 'Data set', href: path('/datasets') },
      { label: dataset?.name ?? 'Untitled' },
    ];
  }

  const textAiThemeMatch = routePath.match(/^\/text-ai\/(\d+)\/theme-configuration$/);
  if (textAiThemeMatch) {
    const dashboard = getTextAiDashboardById(Number(textAiThemeMatch[1]));
    return [
      workspaces,
      workspace,
      { label: 'TextAI', href: path('/text-ai') },
      {
        label: dashboard?.name ?? 'Untitled',
        href: path(`/text-ai/${textAiThemeMatch[1]}`),
      },
      { label: 'Theme configuration' },
    ];
  }

  const textAiMatch = routePath.match(/^\/text-ai\/(\d+)$/);
  if (textAiMatch) {
    const dashboard = getTextAiDashboardById(Number(textAiMatch[1]));
    return [
      workspaces,
      workspace,
      { label: 'TextAI', href: path('/text-ai') },
      { label: dashboard?.name ?? 'Untitled' },
    ];
  }

  const dashboardMatch = routePath.match(/^\/dashboards\/(\d+)$/);
  if (dashboardMatch) {
    const dashboard = getDashboardById(Number(dashboardMatch[1]));
    return [
      workspaces,
      workspace,
      dashboards,
      { label: dashboard?.name ?? 'Untitled' },
    ];
  }

  return [workspaces, workspace];
}

export function AppHeaderBreadcrumb() {
  const pathname = usePathname();
  const items = buildBreadcrumbItems(pathname);

  return (
    <nav className={`wu-breadcrumb-nav ${styles.nav}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const hideOnMobile = index < items.length - 2;
        const label = <WuTruncatedLabel label={item.label} className="wu-breadcrumb-page" />;

        return (
          <span
            key={`${item.label}-${index}`}
            className={styles.crumbSegment}
            data-hide-mobile={hideOnMobile ? 'true' : undefined}
          >
            {index > 0 && (
              <span className={`wu-breadcrumb-separator wm-arrow-forward-ios ${styles.separator}`} />
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className={`wu-breadcrumb-link ${styles.link}`}>
                {label}
              </Link>
            ) : (
              <span className={isLast ? styles.currentPage : `wu-breadcrumb-link ${styles.link}`}>
                {label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
