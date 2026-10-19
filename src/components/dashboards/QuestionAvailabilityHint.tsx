'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const WuTooltip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuTooltip })), { ssr: false });

export function QuestionAvailabilityHint({ reason, children }: { reason?: string | null; children?: ReactNode }) {
  if (!reason) return <>{children}</>;
  return <WuTooltip content={reason} position="top" showArrow tabIndex={0} aria-label={reason} style={{ zIndex: 100 }}>
    <span style={{ display: 'inline-flex', pointerEvents: 'auto', cursor: 'help' }}>
      {children ?? <span className="wm-info" aria-hidden="true" />}
    </span>
  </WuTooltip>;
}
