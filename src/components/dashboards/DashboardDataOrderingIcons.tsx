interface OrderingIconProps {
  size?: number;
}

export function DataOrderingDefaultIcon({ size = 20 }: OrderingIconProps) {
  return <span className="wm-block" style={{ fontSize: size }} aria-hidden />;
}

export function DataOrderingAscendingIcon({ size = 20 }: OrderingIconProps) {
  return <span className="wc-organize-sort-1" style={{ fontSize: size }} aria-hidden />;
}

export function DataOrderingDescendingIcon({ size = 20 }: OrderingIconProps) {
  return <span className="wc-organize-sort" style={{ fontSize: size }} aria-hidden />;
}
