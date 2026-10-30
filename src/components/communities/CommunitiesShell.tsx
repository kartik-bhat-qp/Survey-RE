'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CommunityHeaderBreadcrumb } from '@/components/communities/CommunityHeaderBreadcrumb';
import { AppHeaderContent } from '@/components/header/AppHeaderContent';
import { GlobalFooter } from '@/components/GlobalFooter';
import { HeaderDataCenter } from '@/components/header/HeaderDataCenter';
import {
  HEADER_BRAND_COLOR,
  MOCK_HEADER_CATEGORIES,
} from '@/data/mock-header-categories';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import { getCommunityById } from '@/data/mock-communities';
import { useMounted } from '@/hooks/useMounted';
import styles from '@/components/surveys/ResearchSuiteShell.module.css';

const WuAppHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeader })),
  { ssr: false }
);
const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export function CommunitiesShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const { showToast } = useWuShowToast();
  const pathname = usePathname() ?? '';
  const communityId = pathname.match(/^\/communities\/([^/]+)$/)?.[1];
  const community = communityId ? getCommunityById(communityId) : undefined;

  return (
    <div className={styles.shell}>
      {mounted ? <WuToast /> : null}
      <header className={styles.header}>
        {mounted ? (
          <WuAppHeader
            productName="Communities"
            categories={MOCK_HEADER_CATEGORIES}
            brandColor={HEADER_BRAND_COLOR}
            user={MOCK_HEADER_USER}
            DataCenter={<HeaderDataCenter />}
            onLogout={() => showToast({ message: 'Logged out', variant: 'success' })}
          >
            {community ? (
              <AppHeaderContent>
                <CommunityHeaderBreadcrumb name={community.name} />
              </AppHeaderContent>
            ) : null}
          </WuAppHeader>
        ) : (
          <div className={styles.headerPlaceholder} aria-hidden />
        )}
      </header>
      <div className={styles.body}>
        <div className={styles.content}>{children}</div>
        <GlobalFooter copy="QuestionPro Admin | #Communities v2.0" />
      </div>
    </div>
  );
}
