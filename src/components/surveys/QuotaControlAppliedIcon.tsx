'use client';

import styles from './QuotaControlAppliedIcon.module.css';

interface QuotaControlAppliedIconProps {
  className?: string;
  title?: string;
}

export function QuotaControlAppliedIcon({
  className,
  title = 'Quota Control logic applied',
}: QuotaControlAppliedIconProps) {
  const rootClassName = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <span className={rootClassName} title={title} aria-label={title} role="img">
      <span className="wm-science" aria-hidden />
    </span>
  );
}
