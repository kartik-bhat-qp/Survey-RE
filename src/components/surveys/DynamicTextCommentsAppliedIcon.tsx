'use client';

import styles from './DynamicTextCommentsAppliedIcon.module.css';

interface DynamicTextCommentsAppliedIconProps {
  className?: string;
  title?: string;
}

export function DynamicTextCommentsAppliedIcon({
  className,
  title = 'Dynamic text comment box logic applied',
}: DynamicTextCommentsAppliedIconProps) {
  const rootClassName = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <span className={rootClassName} title={title} aria-label={title} role="img">
      <span className="wm-chat" aria-hidden />
    </span>
  );
}
