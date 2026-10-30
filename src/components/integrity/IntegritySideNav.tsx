'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './IntegritySideNav.module.css';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false },
);
const WuSidebarFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarFooter })),
  { ssr: false },
);
const WuSidebarGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarGroup })),
  { ssr: false },
);
const WuSidebarMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarMenu })),
  { ssr: false },
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false },
);

const NAV = [
  { href: '/surveys/integrity', label: 'Surveys', icon: 'wm-assignment' },
  { href: '/communities', label: 'Communities', icon: 'wm-groups' },
];

const COMING_SOON = [
  {
    href: '/integrity/customer-experience',
    label: 'Customer Experience',
    icon: 'wm-sentiment-satisfied',
  },
  {
    href: '/integrity/employee-experience',
    label: 'Employee Experience',
    icon: 'wm-badge',
  },
];

export function IntegritySideNav() {
  const pathname = usePathname() ?? '';

  return (
    <>
      <WuSidebarContent>
        <WuSidebarGroup label="Sources">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <WuSidebarItem
                key={item.href}
                Icon={<span className={item.icon} />}
                isActive={active}
              >
                <Link href={item.href}>{item.label}</Link>
              </WuSidebarItem>
            );
          })}
          {COMING_SOON.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <WuSidebarItem
                key={item.href}
                Icon={<span className={item.icon} />}
                isActive={active}
              >
                <Link href={item.href} className={styles.soonLink}>
                  <span>{item.label}</span>
                  <span className={styles.note}>Coming soon</span>
                </Link>
              </WuSidebarItem>
            );
          })}
        </WuSidebarGroup>
        <WuSidebarGroup label="All sources">
          <WuSidebarItem
            Icon={<span className="wm-block" />}
            isActive={
              pathname === '/organization/blocklist' ||
              pathname.startsWith('/organization/blocklist/')
            }
          >
            <Link href="/organization/blocklist">Blocklist</Link>
          </WuSidebarItem>
        </WuSidebarGroup>
      </WuSidebarContent>
      <WuSidebarFooter>
        <WuSidebarMenu>
          <WuSidebarItem
            Icon={<span className="wm-settings" />}
            isActive={pathname === '/integrity/settings'}
          >
            <Link href="/integrity/settings">Protection settings</Link>
          </WuSidebarItem>
        </WuSidebarMenu>
      </WuSidebarFooter>
    </>
  );
}
