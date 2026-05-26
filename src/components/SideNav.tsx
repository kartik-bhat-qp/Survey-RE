'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false }
);
const WuSidebarFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarFooter })),
  { ssr: false }
);
const WuSidebarGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarGroup })),
  { ssr: false }
);
const WuSidebarMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarMenu })),
  { ssr: false }
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false }
);

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const ANALYTICS_NAV: NavItem[] = [
  { label: 'Dashboards', href: '/dashboards', icon: <span className="wm-dashboard" /> },
  { label: 'TextAI', href: '/text-ai', icon: <span className="wc-ai" /> },
  { label: 'Reports', href: '/reports', icon: <span className="wc-report" /> },
];

const DATA_NAV: NavItem[] = [
  { label: 'Survey stacks', href: '/survey-stacks', icon: <span className="wm-layers" /> },
  { label: 'Weightings', href: '/weightings', icon: <span className="wm-balance" /> },
  { label: 'Datasets', href: '/datasets', icon: <span className="wm-table-chart" /> },
  { label: 'Exports', href: '/exports', icon: <span className="wm-download" /> },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: <span className="wm-admin-panel-settings" /> },
  { label: 'Settings', href: '/settings', icon: <span className="wm-settings" /> },
];

function NavLinkItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <WuSidebarItem key={item.href} Icon={item.icon} isActive={isActive}>
      <Link href={item.href}>{item.label}</Link>
    </WuSidebarItem>
  );
}

export function SideNav() {
  return (
    <>
      <WuSidebarContent>
        <WuSidebarGroup label="Analytics">
          {ANALYTICS_NAV.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}
        </WuSidebarGroup>
        <WuSidebarGroup label="Data">
          {DATA_NAV.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}
        </WuSidebarGroup>
      </WuSidebarContent>

      <WuSidebarFooter>
        <WuSidebarMenu>
          {BOTTOM_NAV.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}
        </WuSidebarMenu>
      </WuSidebarFooter>
    </>
  );
}
