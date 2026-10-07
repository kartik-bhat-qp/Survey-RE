'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountAreaTabs } from '@/components/account/AccountAreaTabs';
import {
  ORGANIZATION_NAV_ITEMS,
  organizationNavIdFromPath,
} from '@/data/mock-organization';
import styles from './OrganizationShell.module.css';

export function OrganizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeId = organizationNavIdFromPath(pathname);

  return (
    <div className={styles.page}>
      <AccountAreaTabs activeId="organization" />
      <div className={styles.body}>
        <nav className={styles.side} aria-label="Organization">
          <ul className={styles.list}>
            {ORGANIZATION_NAV_ITEMS.map((item) => {
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
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
