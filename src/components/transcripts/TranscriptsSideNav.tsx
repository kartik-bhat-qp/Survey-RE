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

export function TranscriptsSideNav() {
  const pathname = usePathname() ?? '';
  const isTranscripts =
    pathname === '/transcripts' || pathname.startsWith('/transcripts/');

  return (
    <>
      <WuSidebarContent>
        <WuSidebarGroup label="Library">
          <WuSidebarItem Icon={<span className="wm-description" />} isActive={isTranscripts}>
            <Link href="/transcripts">Transcripts</Link>
          </WuSidebarItem>
        </WuSidebarGroup>
      </WuSidebarContent>
      <WuSidebarFooter>
        <WuSidebarMenu>
          <WuSidebarItem Icon={<span className="wm-settings" />} isActive={pathname === '/settings'}>
            <Link href="/settings">Settings</Link>
          </WuSidebarItem>
        </WuSidebarMenu>
      </WuSidebarFooter>
    </>
  );
}
