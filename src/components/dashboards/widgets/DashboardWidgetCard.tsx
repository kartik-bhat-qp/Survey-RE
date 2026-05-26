'use client';

import styles from './DashboardWidgetCard.module.css';

interface DashboardWidgetCardProps {
  title: string;
  children: React.ReactNode;
  dragHandleClassName?: string;
}

export function DashboardWidgetCard({
  title,
  children,
  dragHandleClassName,
}: DashboardWidgetCardProps) {
  return (
    <article className={styles.card}>
      <header className={`${styles.header} ${dragHandleClassName ?? ''}`.trim()}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} aria-label="Insights">
            <span className="wm-lightbulb-outline" />
          </button>
          <button type="button" className={styles.actionBtn} aria-label="Widget menu">
            <span className="wm-more-vert" />
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
