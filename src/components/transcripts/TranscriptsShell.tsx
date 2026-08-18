'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AppHeaderContent } from '@/components/header/AppHeaderContent';
import { HeaderDataCenter } from '@/components/header/HeaderDataCenter';
import { GlobalFooter } from '@/components/GlobalFooter';
import { TranscriptsAppHeaderBreadcrumb } from '@/components/transcripts/TranscriptsAppHeaderBreadcrumb';
import { TranscriptsSideNav } from '@/components/transcripts/TranscriptsSideNav';
import {
  HEADER_BRAND_COLOR,
  MOCK_HEADER_CATEGORIES,
} from '@/data/mock-header-categories';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import { useMounted } from '@/hooks/useMounted';
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

export function TranscriptsShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const { showToast } = useWuShowToast();

  return (
    <div className={styles.shell}>
      {mounted ? <WuToast /> : null}
      <header className={styles.header}>
        {mounted ? (
          <WuAppHeader
            productName="Transcripts"
            categories={MOCK_HEADER_CATEGORIES}
            brandColor={HEADER_BRAND_COLOR}
            user={MOCK_HEADER_USER}
            DataCenter={<HeaderDataCenter />}
            onLogout={() => showToast({ message: 'Logged out', variant: 'success' })}
          >
            <AppHeaderContent>
              <TranscriptsAppHeaderBreadcrumb />
            </AppHeaderContent>
          </WuAppHeader>
        ) : (
          <div className={styles.headerPlaceholder} aria-hidden />
        )}
      </header>
      <div className={styles.sidebarArea}>
        {mounted ? (
          <WuSidebar Sidebar={<TranscriptsSideNav />} className={styles.sidebar}>
            <main className={styles.main}>
              <div className={styles.content}>{children}</div>
              <GlobalFooter />
            </main>
          </WuSidebar>
        ) : (
          <main className={styles.main}>
            <div className={styles.content}>{children}</div>
            <GlobalFooter />
          </main>
        )}
      </div>
    </div>
  );
}
