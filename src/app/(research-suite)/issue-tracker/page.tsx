'use client';

import { AccountPlaceholderPage } from '@/components/account/AccountPlaceholderPage';

export default function IssueTrackerPage() {
  return (
    <AccountPlaceholderPage
      activeId="issue-tracker"
      title="Issue Tracker"
      description="Tracked issues and support tickets will appear here."
    />
  );
}
