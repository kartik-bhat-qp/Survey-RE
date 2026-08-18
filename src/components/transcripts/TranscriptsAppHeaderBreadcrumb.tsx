'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getTranscriptById } from '@/data/mock-transcripts';
import styles from '@/components/header/AppHeaderBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false }
);

export function TranscriptsAppHeaderBreadcrumb() {
  const pathname = usePathname() ?? '';
  const match = pathname.match(/^\/transcripts\/([^/]+)$/);
  const transcript = match ? getTranscriptById(match[1]) : undefined;

  const items = transcript
    ? [
        { label: 'Transcripts', href: '/transcripts' },
        { label: transcript.name },
      ]
    : [{ label: 'Transcripts' }];

  return (
    <nav className={`wu-breadcrumb-nav ${styles.nav}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = <WuTruncatedLabel label={item.label} className="wu-breadcrumb-page" />;

        return (
          <span key={`${item.label}-${index}`} className={styles.crumbSegment}>
            {index > 0 ? (
              <span className={`wu-breadcrumb-separator wm-arrow-forward-ios ${styles.separator}`} />
            ) : null}
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
