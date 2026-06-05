'use client';

import styles from './ShowHideOptionsAppliedIcon.module.css';

interface ShowHideOptionsAppliedIconProps {
  className?: string;
  title?: string;
}

export function ShowHideOptionsAppliedIcon({
  className,
  title = 'Show/Hide Options logic applied',
}: ShowHideOptionsAppliedIconProps) {
  const rootClassName = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <span className={rootClassName} title={title} aria-label={title} role="img">
      <svg viewBox="0 0 18 14" aria-hidden>
        <line x1="1" y1="3.5" x2="8" y2="3.5" />
        <line x1="1" y1="10.5" x2="8" y2="10.5" />
        <path d="M12.25 3.5 16.75 10.5" />
        <path d="M16.75 3.5 12.25 10.5" />
      </svg>
    </span>
  );
}
