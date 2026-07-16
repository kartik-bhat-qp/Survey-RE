'use client';

import Link from 'next/link';
import type { AccountNavId } from '@/data/mock-compliance';
import { ACCOUNT_NAV_ITEMS } from '@/data/mock-compliance';
import styles from './AccountSectionNav.module.css';

interface AccountSectionNavProps {
  activeId: AccountNavId;
}

export function AccountSectionNav({ activeId }: AccountSectionNavProps) {
  return (
    <nav className={styles.nav} aria-label="Account">
      <ul className={styles.list}>
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={active ? styles.linkActive : styles.link}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
