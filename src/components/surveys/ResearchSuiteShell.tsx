'use client';

import dynamic from 'next/dynamic';
import { AppHeaderContent } from '@/components/header/AppHeaderContent';
import { SurveysAppHeaderContent } from '@/components/surveys/SurveysAppHeaderContent';
import {
  HEADER_BRAND_COLOR,
  MOCK_HEADER_CATEGORIES,
} from '@/data/mock-header-categories';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import styles from './ResearchSuiteShell.module.css';

const WuAppHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeader })),
  { ssr: false }
);
const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export function ResearchSuiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <WuToast />
      <header className={styles.header}>
        <WuAppHeader
          productName="Surveys"
          categories={MOCK_HEADER_CATEGORIES}
          brandColor={HEADER_BRAND_COLOR}
          user={MOCK_HEADER_USER}
        >
          <AppHeaderContent>
            <SurveysAppHeaderContent />
          </AppHeaderContent>
        </WuAppHeader>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
