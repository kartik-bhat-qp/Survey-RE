'use client';

import { Suspense } from 'react';
import { SurveyProtectionDashboard } from '@/components/integrity/SurveyProtectionDashboard';

export default function IntegritySurveyPage() {
  return (
    <Suspense>
      <SurveyProtectionDashboard />
    </Suspense>
  );
}
