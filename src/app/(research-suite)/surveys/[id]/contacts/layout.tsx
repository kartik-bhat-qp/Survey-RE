'use client';

import { ContactHubShell } from '@/components/contacts/ContactHubShell';

export default function SurveyListsLayout({ children }: { children: React.ReactNode }) {
  return <ContactHubShell>{children}</ContactHubShell>;
}
