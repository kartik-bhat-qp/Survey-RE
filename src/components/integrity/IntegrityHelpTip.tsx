'use client';

import dynamic from 'next/dynamic';
import styles from './IntegrityCoverage.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
);

export function IntegrityHelpTip({ label, content }: { label: string; content: string }) {
  return (
    <WuTooltip content={content} position="top" showArrow>
      <button type="button" className={styles.help} aria-label={label}>
        <span className="wm-info" aria-hidden />
      </button>
    </WuTooltip>
  );
}
