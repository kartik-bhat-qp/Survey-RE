'use client';

import dynamic from 'next/dynamic';
import { AppHeaderContent } from '@/components/header/AppHeaderContent';
import {
  HEADER_BRAND_COLOR,
  MOCK_HEADER_CATEGORIES,
} from '@/data/mock-header-categories';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import { BiLiteAppHeaderBreadcrumb } from '@/components/bi-lite/BiLiteAppHeaderBreadcrumb';
import { BiLiteGlobalFooter } from '@/components/bi-lite/BiLiteGlobalFooter';
import { BiLiteSideNav } from '@/components/bi-lite/BiLiteSideNav';
import styles from '@/components/DashboardShell.module.css';

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

export function BiLiteDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <WuToast />
      <header className={styles.header}>
        <WuAppHeader
          productName="BI Lite"
          categories={MOCK_HEADER_CATEGORIES}
          brandColor={HEADER_BRAND_COLOR}
          user={MOCK_HEADER_USER}
        >
          <AppHeaderContent>
            <BiLiteAppHeaderBreadcrumb />
          </AppHeaderContent>
        </WuAppHeader>
      </header>
      <div className={styles.sidebarArea}>
        <WuSidebar Sidebar={<BiLiteSideNav />} className={styles.sidebar}>
          <main className={styles.main}>
            <div className="flex-1 min-h-0">{children}</div>
            <BiLiteGlobalFooter />
          </main>
        </WuSidebar>
      </div>
    </div>
  );
}
