'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { MOCK_CURRENT_WORKSPACE } from '@/data/mock-workspace';
import { biLitePath } from '@/lib/bi-lite-paths';
import styles from '@/components/header/AppHeaderBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false }
);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const routePath = pathname.startsWith(biLitePath(''))
    ? pathname.slice(biLitePath('').length) || '/'
    : pathname;

  const workspaces: BreadcrumbItem = { label: 'Workspaces', href: biLitePath('/workspaces') };
  const workspace: BreadcrumbItem = { label: MOCK_CURRENT_WORKSPACE.name };
  const dashboards: BreadcrumbItem = { label: 'Dashboards', href: biLitePath('/dashboards') };

  if (routePath === '/workspaces') {
    return [{ label: 'Workspaces' }];
  }

  if (routePath === '/dashboards') {
    return [workspaces, workspace, { label: 'Dashboards' }];
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

export function BiLiteAppHeaderBreadcrumb() {
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
