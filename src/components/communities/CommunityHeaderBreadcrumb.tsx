'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from '@/components/surveys/SurveyEditorBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false },
);

export function CommunityHeaderBreadcrumb({ name }: { name: string }) {
  return (
    <nav className={`wu-breadcrumb-nav ${styles.nav}`} aria-label="Breadcrumb">
      <Link href="/communities" className={`wu-breadcrumb-link ${styles.link}`}>
        <WuTruncatedLabel label="My Communities" className="wu-breadcrumb-page" />
      </Link>
      <span className={`wu-breadcrumb-separator wm-arrow-forward-ios ${styles.separator}`} />
      <span className={styles.current}>
        <WuTruncatedLabel label={name} className="wu-breadcrumb-page" />
      </span>
    </nav>
  );
}
