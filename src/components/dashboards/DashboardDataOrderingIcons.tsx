import type { ReactNode } from 'react';

const ICON_COLOR = '#5985E1';

interface OrderingIconProps {
  size?: number;
}

function OrderingSvg({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      viewBox="0 -960 960 960"
      fill={ICON_COLOR}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Material Symbols Outlined: default (filter_none) */
export function DataOrderingDefaultIcon({ size }: OrderingIconProps) {
  return (
    <OrderingSvg size={size}>
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
    </OrderingSvg>
  );
}

/** Material Symbols Outlined: arrow_downward */
export function DataOrderingDescendingIcon({ size }: OrderingIconProps) {
  return (
    <OrderingSvg size={size}>
      <path d="M480-348 288-560h144v-400h96v400h144L480-348Z" />
    </OrderingSvg>
  );
}

/** Material Symbols Outlined: arrow_upward */
export function DataOrderingAscendingIcon({ size }: OrderingIconProps) {
  return (
    <OrderingSvg size={size}>
      <path d="M480-612 288-400h144v400h96v-400h144L480-612Z" />
    </OrderingSvg>
  );
}
