'use client';

import dynamic from 'next/dynamic';
import styles from './BiDiamondIcon.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface BiDiamondIconProps {
  /** When set, shows a WickUI tooltip on hover (Advanced license messaging). */
  tooltip?: string;
  /** Tooltip placement; defaults to left for right-aligned triggers. */
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function BiDiamondIcon({
  tooltip,
  position = 'left',
  className,
}: BiDiamondIconProps) {
  const wrapClassName = [
    styles.wrap,
    tooltip ? styles.wrapInteractive : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const icon = (
    <span
      className={wrapClassName}
      aria-label={tooltip}
      aria-hidden={tooltip ? undefined : true}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <span className={`wm-diamond ${styles.icon}`} aria-hidden />
    </span>
  );

  if (!tooltip) {
    return icon;
  }

  return (
    <WuTooltip
      content={tooltip}
      position={position}
      style={{ zIndex: 1001 }}
    >
      {icon}
    </WuTooltip>
  );
}
