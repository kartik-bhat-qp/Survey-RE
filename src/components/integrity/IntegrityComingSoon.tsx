'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';

export function IntegrityComingSoon({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={`Integrity for ${title} is not available yet.`}
      />
      <EmptyState
        icon={icon}
        title="Coming soon"
        description={`${title} protection will be available here.`}
      />
    </PageContainer>
  );
}
