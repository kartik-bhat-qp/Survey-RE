'use client';

import { Suspense } from 'react';
import { IntegrityCheck } from '@/components/integrity/IntegrityCheck';

export default function IntegrityCheckPage() {
  return (
    <Suspense>
      <IntegrityCheck />
    </Suspense>
  );
}