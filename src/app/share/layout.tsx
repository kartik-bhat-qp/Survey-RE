'use client';

import dynamic from 'next/dynamic';
import { useMounted } from '@/hooks/useMounted';
import styles from './ShareLayout.module.css';

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();

  return (
    <div className={styles.root}>
      {mounted ? <WuToast /> : null}
      {children}
    </div>
  );
}
