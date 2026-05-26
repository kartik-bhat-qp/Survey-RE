'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { TextAiDashboardCanvas } from '@/components/text-ai/TextAiDashboardCanvas';
import { TextAiDashboardToolbar } from '@/components/text-ai/TextAiDashboardToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';

function TextAiDashboardDetailContent({ numericId }: { numericId: number }) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const dashboard = getTextAiDashboardById(numericId);
  const [name, setName] = useState(dashboard?.name ?? 'Untitled');

  if (!dashboard) {
    if (!wick) {
      return (
        <PageContainer>
          <StandardLoader message="Loading dashboard…" />
        </PageContainer>
      );
    }

    const { WuButton } = wick;

    return (
      <PageContainer>
        <EmptyState
          icon="wc-ai"
          title="TextAI dashboard cannot be loaded."
          description="This dashboard may have been deleted or you do not have access."
          action={
            <Link href="/text-ai">
              <WuButton>Back to TextAI dashboards</WuButton>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <TextAiDashboardToolbar
        key={numericId}
        name={name}
        onNameChange={setName}
        onAddWidget={() => showToast({ message: 'Add widget', variant: 'success' })}
        onOpenSettings={() => showToast({ message: 'Dashboard settings', variant: 'success' })}
      />
      <TextAiDashboardCanvas dashboardId={numericId} />
    </div>
  );
}

export default function TextAiDashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);

  return <TextAiDashboardDetailContent key={numericId} numericId={numericId} />;
}
