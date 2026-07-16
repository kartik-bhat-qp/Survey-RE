'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AppHeaderBreadcrumb } from '@/components/header/AppHeaderBreadcrumb';
import { AppHeaderContent } from '@/components/header/AppHeaderContent';
import { HeaderDataCenter } from '@/components/header/HeaderDataCenter';
import { GlobalFooter } from '@/components/GlobalFooter';
import { SideNav } from '@/components/SideNav';
import {
  HEADER_BRAND_COLOR,
  MOCK_HEADER_CATEGORIES,
} from '@/data/mock-header-categories';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import { useMounted } from '@/hooks/useMounted';
import { getBiHeaderProductName } from '@/lib/bi-header-product';
import styles from './DashboardShell.module.css';

const WuAppHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeader })),
  { ssr: false }
);
const WuSidebar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebar })),
  { ssr: false }
);
const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const productName = getBiHeaderProductName(pathname);
  const { showToast } = useWuShowToast();

  return (
    <div className={styles.shell}>
      {mounted ? <WuToast /> : null}
      <header className={styles.header}>
        {mounted ? (
          <WuAppHeader
            productName={productName}
            categories={MOCK_HEADER_CATEGORIES}
            brandColor={HEADER_BRAND_COLOR}
            user={MOCK_HEADER_USER}
            DataCenter={<HeaderDataCenter />}
            onLogout={() => showToast({ message: 'Logged out', variant: 'success' })}
          >
            <AppHeaderContent>
              <AppHeaderBreadcrumb />
            </AppHeaderContent>
          </WuAppHeader>
        ) : (
          <div className={styles.headerPlaceholder} aria-hidden />
        )}
      </header>
      <div className={styles.sidebarArea}>
        {mounted ? (
          <WuSidebar Sidebar={<SideNav />} className={styles.sidebar}>
            <main className={styles.main}>
              <div className="flex-1 min-h-0">{children}</div>
              <GlobalFooter />
            </main>
          </WuSidebar>
        ) : (
          <main className={styles.main}>
            <div className="flex-1 min-h-0">{children}</div>
            <GlobalFooter />
          </main>
        )}
      </div>
    </div>
  );
}
