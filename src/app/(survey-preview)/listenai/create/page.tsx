'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListenAICreateStudyScreen } from '@/components/surveys/ListenAICreateStudyScreen';
import { readListenAiCreateStudySession } from '@/data/listenai-create-study-session';
import { useListenAiStudiesCatalog } from '@/hooks/useListenAiStudiesCatalog';
import { EmptyState } from '@/components/ui/EmptyState';
import styles from './ListenAICreateStudyPage.module.css';

function ListenAiCreateStudyPageContent() {
  const searchParams = useSearchParams();
  const { studies } = useListenAiStudiesCatalog();
  const studyId = searchParams.get('studyId')?.trim() || readListenAiCreateStudySession()?.studyId;
  const study = studies.find((item) => item.id === studyId) ?? null;

  if (!study) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          icon="wm-auto-awesome"
          title="No ListenAI study to create"
          description="Save a new study from the survey builder. The study description will be used as the Create AI Study prompt."
        />
      </div>
    );
  }

  return <ListenAICreateStudyScreen key={study.id} study={study} />;
}

export default function ListenAiCreateStudyPage() {
  return (
    <Suspense fallback={null}>
      <ListenAiCreateStudyPageContent />
    </Suspense>
  );
}
