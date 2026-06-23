'use client';

import dynamic from 'next/dynamic';
import styles from './DashboardWidgetCard.module.css';

const DIAMOND_TOOLTIP =
  'Not available with your current license. Will only show a maximum of 100 responses.';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface DashboardWidgetCardProps {
  title: string;
  children: React.ReactNode;
  dragHandleClassName?: string;
  showDiamond?: boolean;
}

export function DashboardWidgetCard({
  title,
  children,
  dragHandleClassName,
  showDiamond = false,
}: DashboardWidgetCardProps) {
  return (
    <article className={styles.card}>
      <header className={`${styles.header} ${dragHandleClassName ?? ''}`.trim()}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} aria-label="Insights">
            <span className="wm-lightbulb-outline" />
          </button>
          {showDiamond && (
            <WuTooltip content={DIAMOND_TOOLTIP} position="bottom">
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.diamondBtn}`}
                aria-label={DIAMOND_TOOLTIP}
              >
                <span className="wm-diamond" />
              </button>
            </WuTooltip>
          )}
          <button type="button" className={styles.actionBtn} aria-label="Widget menu">
            <span className="wm-more-vert" />
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
