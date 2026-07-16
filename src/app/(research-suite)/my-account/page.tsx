'use client';

import { AccountPlaceholderPage } from '@/components/account/AccountPlaceholderPage';

export default function MyAccountPage() {
  return (
    <AccountPlaceholderPage
      activeId="my-account"
      title="My Account"
      description="Account profile and preferences will appear here."
    />
  );
}
