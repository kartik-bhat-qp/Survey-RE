'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';
import { MOCK_CURRENT_WORKSPACE } from '@/data/mock-workspace';
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
  const workspaces: BreadcrumbItem = { label: 'Workspaces', href: '/workspaces' };
  const workspace: BreadcrumbItem = { label: MOCK_CURRENT_WORKSPACE.name };
  const dashboards: BreadcrumbItem = { label: 'Dashboards', href: '/dashboards' };

  if (pathname === '/workspaces') {
    return [{ label: 'Workspaces' }];
  }

  if (pathname === '/dashboards') {
    return [workspaces, workspace, { label: 'Dashboards' }];
  }

  if (pathname === '/settings') {
    return [workspaces, workspace, { label: 'Settings' }];
  }

  if (pathname === '/text-ai') {
    return [workspaces, workspace, { label: 'TextAI' }];
  }

  const textAiMatch = pathname.match(/^\/text-ai\/(\d+)$/);
  if (textAiMatch) {
    const dashboard = getTextAiDashboardById(Number(textAiMatch[1]));
    return [
      workspaces,
      workspace,
      { label: 'TextAI', href: '/text-ai' },
      { label: dashboard?.name ?? 'Untitled' },
    ];
  }

  const dashboardMatch = pathname.match(/^\/dashboards\/(\d+)$/);
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
