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
import { saveRuntimeTextAiDashboard } from '@/data/text-ai-dashboard-runtime';
import {
  createDefaultSegmentFilterState,
  type TextAiSegmentFilterState,
} from '@/data/mock-text-ai-segment-filters';
import { MOCK_TEXT_AI_ANALYSIS_QUESTIONS } from '@/data/mock-text-ai-questions';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';

function resolveDashboardQuestions(
  dashboardId: number,
  questions: TextAiDashboardQuestion[] | undefined
): TextAiDashboardQuestion[] {
  if (questions?.length) return questions;

  return MOCK_TEXT_AI_ANALYSIS_QUESTIONS.map((question, index) => ({
    id: `dashboard-${dashboardId}-${question.code}`,
    text: question.text,
    creditsUsed: 880 + index * 73,
  }));
}

function TextAiDashboardDetailContent({ numericId }: { numericId: number }) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const dashboard = getTextAiDashboardById(numericId);
  const initialQuestions = resolveDashboardQuestions(numericId, dashboard?.questions);
  const [name, setName] = useState(dashboard?.name ?? 'Untitled');
  const [availableQuestions] = useState<TextAiDashboardQuestion[]>(initialQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<TextAiDashboardQuestion>(
    initialQuestions[0]
  );
  const [segmentFilters, setSegmentFilters] = useState<TextAiSegmentFilterState>(
    () => dashboard?.segmentFilters ?? createDefaultSegmentFilterState()
  );

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

  const currentDashboard = dashboard;

  function handleSegmentFiltersChange(nextFilters: TextAiSegmentFilterState): void {
    setSegmentFilters(nextFilters);
    saveRuntimeTextAiDashboard({
      ...currentDashboard,
      name,
      segmentFilters: nextFilters,
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <TextAiDashboardToolbar
        key={numericId}
        name={name}
        onNameChange={setName}
        onAddWidget={() => showToast({ message: 'Add widget', variant: 'success' })}
        onOpenSettings={() => showToast({ message: 'Dashboard settings', variant: 'success' })}
        questions={availableQuestions}
        selectedQuestion={selectedQuestion}
        onQuestionChange={setSelectedQuestion}
        segmentFilters={segmentFilters}
        onSegmentFiltersChange={handleSegmentFiltersChange}
      />
      <TextAiDashboardCanvas
        dashboardId={numericId}
        selectedQuestion={selectedQuestion}
        questionIndex={availableQuestions.findIndex(
          (question) => question.id === selectedQuestion.id
        )}
      />
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
