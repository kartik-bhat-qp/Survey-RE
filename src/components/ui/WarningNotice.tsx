import type { ReactNode } from 'react';
import styles from './WarningNotice.module.css';

// WickUI's current exports do not include an inline alert component.
export function WarningNotice({ children, Icon, className = '' }: {
  children: ReactNode;
  Icon?: ReactNode;
  className?: string;
}) {
  return <div role="note" className={`${styles.notice} ${className}`}>
    {Icon && <span className={styles.icon} aria-hidden="true">{Icon}</span>}
    <div className={styles.content}>{children}</div>
  </div>;
}
