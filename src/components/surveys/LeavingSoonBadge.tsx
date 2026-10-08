'use client';

import dynamic from 'next/dynamic';
import { LEAVING_SOON_NOTICE } from '@/data/mock-survey-design';
import styles from './LeavingSoonBadge.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface LeavingSoonBadgeProps {
  icon?: string;
  className?: string;
  learnMoreHref?: string;
}

export function LeavingSoonBadge({
  icon = 'wm-hourglass-empty',
  className,
  learnMoreHref = LEAVING_SOON_NOTICE.learnMoreHref,
}: LeavingSoonBadgeProps) {
  const { title, body, learnMoreLabel } = LEAVING_SOON_NOTICE;

  return (
    <WuTooltip
      content={
        <span className={styles.tooltip}>
          <span className={styles.tooltipTitle}>{title}</span>
          <span className={styles.tooltipBody}>
            {body}{' '}
            <a
              href={learnMoreHref}
              className={styles.learnMore}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              {learnMoreLabel}
            </a>
          </span>
        </span>
      }
      position="top"
      showArrow
    >
      <span
        className={[styles.badge, className].filter(Boolean).join(' ')}
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        }}
      >
        <span className={`${icon} ${styles.icon}`} aria-hidden />
        <span className={styles.label}>{title}</span>
      </span>
    </WuTooltip>
  );
}
