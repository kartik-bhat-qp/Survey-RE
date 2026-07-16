'use client';

import { AccountPlaceholderPage } from '@/components/account/AccountPlaceholderPage';

export default function BillingPage() {
  return (
    <AccountPlaceholderPage
      activeId="billing"
      title="Billing & Invoices"
      description="Billing history and invoices will appear here."
    />
  );
}
