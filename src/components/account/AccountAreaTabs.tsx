'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  ACCOUNT_AREA_TABS,
  ORGANIZATION_BLOG_LINKS,
  type AccountAreaTabId,
} from '@/data/mock-organization';
import styles from './AccountAreaTabs.module.css';

interface AccountAreaTabsProps {
  activeId: AccountAreaTabId;
}

export function AccountAreaTabs({ activeId }: AccountAreaTabsProps) {
  const { showToast } = useWuShowToast();

  return (
    <div className={styles.bar}>
      <nav className={styles.tabs} aria-label="Account">
        {ACCOUNT_AREA_TABS.map((tab) => {
          const active = tab.id === activeId;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={active ? styles.tabActive : styles.tab}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`${tab.icon} ${styles.tabIcon}`} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.promo}>
        {ORGANIZATION_BLOG_LINKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === 'blog' ? styles.promoTitle : styles.promoItem}
            onClick={() =>
              showToast({
                message: `${item.label} will appear here.`,
                variant: 'info',
              })
            }
          >
            <span>{item.label}</span>
            {item.id === 'blog' ? null : (
              <span className={`wm-expand-more ${styles.promoCaret}`} aria-hidden />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
