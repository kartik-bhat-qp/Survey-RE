'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/components/header/AppHeaderBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false },
);

const PAGE_LABEL: Record<string, string> = {
  '/integrity': 'Surveys',
  '/integrity/communities': 'Communities',
  '/integrity/check': 'Respondent check',
  '/integrity/settings': 'Protection settings',
};

export function IntegrityBreadcrumb() {
  const pathname = usePathname() ?? '';
  const page = PAGE_LABEL[pathname] ?? 'Survey start';
  const items =
    pathname === '/integrity'
      ? [{ label: 'Integrity' }]
      : [
          { label: 'Integrity', href: '/integrity' },
          { label: page },
        ];

  return (
    <nav className={`wu-breadcrumb-nav ${styles.nav}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = <WuTruncatedLabel label={item.label} className="wu-breadcrumb-page" />;
        return (
          <span key={item.label} className={styles.crumbSegment}>
            {index > 0 ? (
              <span
                className={`wu-breadcrumb-separator wm-arrow-forward-ios ${styles.separator}`}
              />
            ) : null}
            {'href' in item && item.href && !isLast ? (
              <Link href={item.href} className={`wu-breadcrumb-link ${styles.link}`}>
                {label}
              </Link>
            ) : (
              label
            )}
          </span>
        );
      })}
    </nav>
  );
}
