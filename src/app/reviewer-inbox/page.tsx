'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReviewerInboxView,
  getDefaultReviewerInboxEmail,
} from '@/components/surveys/ReviewerInboxView';

export default function ReviewerInboxPage() {
  return (
    <Suspense fallback={null}>
      <ReviewerInboxPageContent />
    </Suspense>
  );
}

function ReviewerInboxPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim() || getDefaultReviewerInboxEmail();

  return <ReviewerInboxView recipientEmail={email} />;
}
