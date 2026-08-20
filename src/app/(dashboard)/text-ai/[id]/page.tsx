'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextAiAddWidgetModal } from '@/components/text-ai/TextAiAddWidgetModal';
import { TextAiDashboardCanvas } from '@/components/text-ai/TextAiDashboardCanvas';
import { TextAiDashboardSettingsModal } from '@/components/text-ai/TextAiDashboardSettingsModal';
import { TextAiDashboardToolbar } from '@/components/text-ai/TextAiDashboardToolbar';
import type { TextAiAnalysisQuestion } from '@/data/mock-text-ai-questions';
import type { TextAiWidgetChartTypeId } from '@/data/mock-text-ai-widget-chart-types';
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
import {
  createTextAiComparativeChartWidget,
  type TextAiTopicSegmentWidget,
} from '@/data/mock-text-ai-topic-segment-widget';
import type { TextAiThemeStatusFilter } from '@/data/mock-text-ai-widget-data';
import {
  getTextAiThemePreferences,
  TEXT_AI_THEME_PREFERENCES_EVENT,
  type TextAiThemePreferences,
} from '@/data/text-ai-theme-preferences';

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
  const router = useRouter();
  const wick = useWickUILib();
  const dashboard = getTextAiDashboardById(numericId);
  const initialQuestions = resolveDashboardQuestions(numericId, dashboard?.questions);
  const [name, setName] = useState(dashboard?.name ?? 'Untitled');
  const [availableQuestions, setAvailableQuestions] =
    useState<TextAiDashboardQuestion[]>(initialQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<TextAiDashboardQuestion>(
    initialQuestions[0]
  );
  const [segmentFilters, setSegmentFilters] = useState<TextAiSegmentFilterState>(
    () => dashboard?.segmentFilters ?? createDefaultSegmentFilterState()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [themeStatus, setThemeStatus] =
    useState<TextAiThemeStatusFilter>('all');
  const [addedTopicSegmentWidgets, setAddedTopicSegmentWidgets] = useState<
    TextAiTopicSegmentWidget[]
  >([]);
  const [themePreferences, setThemePreferences] = useState<TextAiThemePreferences>({
    approvedEmergingNames: [],
    autoApproveEmergingThemes: true,
    emergingThemeValidityDays: 28,
    showThemesWithNoResponses: true,
  });

  useEffect(() => {
    const refreshPreferences = () =>
      setThemePreferences(getTextAiThemePreferences(numericId));
    refreshPreferences();
    window.addEventListener(TEXT_AI_THEME_PREFERENCES_EVENT, refreshPreferences);
    window.addEventListener('storage', refreshPreferences);
    return () => {
      window.removeEventListener(
        TEXT_AI_THEME_PREFERENCES_EVENT,
        refreshPreferences
      );
      window.removeEventListener('storage', refreshPreferences);
    };
  }, [numericId]);

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

  function handleAddWidget(
    question: TextAiAnalysisQuestion,
    chartTypeId: TextAiWidgetChartTypeId
  ): void {
    const dashboardQuestion: TextAiDashboardQuestion = {
      id: `dashboard-${numericId}-${question.code}-${Date.now()}`,
      text: question.text,
      creditsUsed: 880,
    };
    setAvailableQuestions((prev) => {
      const exists = prev.some((entry) => entry.text === question.text);
      return exists ? prev : [...prev, dashboardQuestion];
    });
    setSelectedQuestion(dashboardQuestion);

    if (
      chartTypeId === 'comparative-chart' ||
      chartTypeId === 'subtheme-comparative-chart'
    ) {
      setAddedTopicSegmentWidgets((prev) => [
        createTextAiComparativeChartWidget(question.text),
        ...prev,
      ]);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <TextAiDashboardToolbar
        key={numericId}
        name={name}
        onNameChange={setName}
        onAddWidget={() => setAddWidgetOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenThemeConfiguration={() =>
          router.push(`/text-ai/${numericId}/theme-configuration`)
        }
        questions={availableQuestions}
        selectedQuestion={selectedQuestion}
        onQuestionChange={setSelectedQuestion}
        themeStatus={themeStatus}
        onThemeStatusChange={setThemeStatus}
        segmentFilters={segmentFilters}
        onSegmentFiltersChange={handleSegmentFiltersChange}
      />
      <TextAiDashboardCanvas
        dashboardId={numericId}
        selectedQuestion={selectedQuestion}
        questionIndex={availableQuestions.findIndex(
          (question) => question.id === selectedQuestion.id
        )}
        themeStatus={themeStatus}
        addedTopicSegmentWidgets={addedTopicSegmentWidgets}
        themePreferences={themePreferences}
      />
      <TextAiDashboardSettingsModal
        dashboard={currentDashboard}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <TextAiAddWidgetModal
        open={addWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        onAddWidget={handleAddWidget}
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
