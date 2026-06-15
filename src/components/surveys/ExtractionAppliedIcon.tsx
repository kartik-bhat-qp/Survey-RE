'use client';

import styles from './ExtractionAppliedIcon.module.css';

interface ExtractionAppliedIconProps {
  className?: string;
  title?: string;
}

export function ExtractionAppliedIcon({
  className,
  title = 'Extraction logic applied',
}: ExtractionAppliedIconProps) {
  const rootClassName = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <span className={rootClassName} title={title} aria-label={title} role="img">
      <span className="wm-call-split" aria-hidden />
    </span>
  );
}
