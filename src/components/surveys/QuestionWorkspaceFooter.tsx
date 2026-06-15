'use client';

import type { PointerEvent } from 'react';
import { QuotaControlAppliedIcon } from '@/components/surveys/QuotaControlAppliedIcon';
import { ShowHideOptionsAppliedIcon } from '@/components/surveys/ShowHideOptionsAppliedIcon';
import styles from './QuestionWorkspaceFooter.module.css';

interface QuestionWorkspaceFooterProps {
  showHideOptionsApplied?: boolean;
  quotaControlApplied?: boolean;
  className?: string;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
}

export function QuestionWorkspaceFooter({
  showHideOptionsApplied = false,
  quotaControlApplied = false,
  className,
  onPointerDown,
}: QuestionWorkspaceFooterProps) {
  const footerClassName = [styles.footer, className].filter(Boolean).join(' ');

  return (
    <div
      className={footerClassName}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onPointerDown={onPointerDown}
    >
      <span className={`wm-check-circle ${styles.statusIcon}`} aria-hidden />
      {showHideOptionsApplied ? <ShowHideOptionsAppliedIcon /> : null}
      {quotaControlApplied ? <QuotaControlAppliedIcon /> : null}
    </div>
  );
}
