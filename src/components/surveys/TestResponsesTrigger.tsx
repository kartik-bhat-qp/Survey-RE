'use client';

import dynamic from 'next/dynamic';
import { TestResponsesIcon } from '@/components/surveys/TestResponsesIcon';
import { useTestResponses } from '@/components/surveys/TestResponsesProvider';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface TestResponsesTriggerProps {
  className?: string;
  variant?: 'icon' | 'text';
}

export function TestResponsesTrigger({
  className,
  variant = 'icon',
}: TestResponsesTriggerProps) {
  const { openTestResponses, testResponsesTooltip, testResponsesBusy, generationProgress } =
    useTestResponses();

  if (variant === 'text') {
    return (
      <button
        type="button"
        className={className}
        onClick={openTestResponses}
        aria-busy={testResponsesBusy || undefined}
      >
        Test Responses
      </button>
    );
  }

  return (
    <WuTooltip content={testResponsesTooltip} position="bottom">
      <button
        type="button"
        className={`${styles.toolbarIconBtn} ${testResponsesBusy ? styles.toolbarIconBtnBusy : ''} ${className ?? ''}`}
        aria-label={
          testResponsesBusy
            ? 'Generating synthetic responses in progress'
            : 'Test Responses'
        }
        aria-busy={testResponsesBusy || undefined}
        onClick={openTestResponses}
      >
        <TestResponsesIcon progress={generationProgress} />
      </button>
    </WuTooltip>
  );
}
