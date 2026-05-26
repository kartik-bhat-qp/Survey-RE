'use client';

import dynamic from 'next/dynamic';
import styles from './AdvancedWidgetBetaBadge.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const BETA_TOOLTIP = 'This feature is in beta. Functionality may change.';

export function AdvancedWidgetBetaBadge() {
  return (
    <WuTooltip content={BETA_TOOLTIP} position="top">
      <span className={styles.badge} aria-label={BETA_TOOLTIP}>
        <span className="wm-experiment" />
      </span>
    </WuTooltip>
  );
}
