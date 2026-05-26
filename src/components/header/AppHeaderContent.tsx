'use client';

import styles from './AppHeaderContent.module.css';

interface AppHeaderContentProps {
  children: React.ReactNode;
}

export function AppHeaderContent({ children }: AppHeaderContentProps) {
  return <div className={styles.headerContent}>{children}</div>;
}
