'use client';

import dynamic from 'next/dynamic';
import styles from './SignupLayout.module.css';

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <WuToast />
      {children}
    </div>
  );
}
