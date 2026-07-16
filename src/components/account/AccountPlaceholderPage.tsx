'use client';

import { AccountSectionNav } from '@/components/account/AccountSectionNav';
import type { AccountNavId } from '@/data/mock-compliance';
import styles from './AccountPlaceholderPage.module.css';

interface AccountPlaceholderPageProps {
  activeId: AccountNavId;
  title: string;
  description: string;
}

export function AccountPlaceholderPage({
  activeId,
  title,
  description,
}: AccountPlaceholderPageProps) {
  return (
    <div className={styles.page}>
      <AccountSectionNav activeId={activeId} />
      <div className={styles.body}>
        <section className={styles.panel}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.copy}>{description}</p>
        </section>
      </div>
    </div>
  );
}
