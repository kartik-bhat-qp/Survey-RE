'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  { href: '/integrity', label: 'Surveys', icon: 'wm-assignment' },
  { href: '/integrity/communities', label: 'Communities', icon: 'wm-groups' },
];

export function IntegritySideNav() {
  const pathname = usePathname() ?? '';

  return (
    <>
      <WuSidebarContent>
        <WuSidebarGroup label="Products">
          {NAV.map((item) => {
            const active =
              item.href === '/integrity'
                ? pathname === '/integrity'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
