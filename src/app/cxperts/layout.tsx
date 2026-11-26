'use client';

import dynamic from 'next/dynamic';
import { useMounted } from '@/hooks/useMounted';

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export default function CxpertsLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  return (
    <>
      {mounted ? <WuToast /> : null}
      {children}
    </>
  );
}
