'use client';

import { AccountAreaTabs } from '@/components/account/AccountAreaTabs';
import type { AccountAreaTabId } from '@/data/mock-organization';
import styles from './OrganizationPlaceholderPage.module.css';

interface OrganizationPlaceholderPageProps {
  title: string;
}

export function OrganizationPlaceholderPage({ title }: OrganizationPlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.copy}>{title} will appear here.</p>
    </section>
  );
}

interface AccountAreaPlaceholderPageProps {
  activeId: AccountAreaTabId;
  title: string;
}

export function AccountAreaPlaceholderPage({
  activeId,
  title,
}: AccountAreaPlaceholderPageProps) {
  return (
    <div className={styles.frame}>
      <AccountAreaTabs activeId={activeId} />
      <OrganizationPlaceholderPage title={title} />
    </div>
  );
}
