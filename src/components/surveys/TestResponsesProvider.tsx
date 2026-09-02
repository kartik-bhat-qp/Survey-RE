'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  TestResponsesModal,
  type SyntheticTestGenerationRequest,
} from '@/components/surveys/TestResponsesModal';
import { useSyntheticTestGeneration } from '@/components/surveys/useSyntheticTestGeneration';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

interface TestResponsesContextValue {
  openTestResponses: () => void;
  testResponsesTooltip: ReactNode;
  testResponsesBusy: boolean;
  generationProgress: number | undefined;
}

const TestResponsesContext = createContext<TestResponsesContextValue | null>(null);

const TEST_RESPONSES_TOOLTIP = 'Test Responses';

export function TestResponsesProvider({ children }: { children: ReactNode }) {
  const { showToast } = useWuShowToast();
  const [testResponsesOpen, setTestResponsesOpen] = useState(false);
  const [syntheticGeneration, setSyntheticGeneration] =
    useState<SyntheticTestGenerationRequest | null>(null);

  const handleSyntheticGenerationComplete = useCallback(
    (count: string) => {
      setSyntheticGeneration(null);
      showToast({
        message: `Generated ${count} synthetic test response${count === '1' ? '' : 's'}`,
        variant: 'success',
      });
    },
    [showToast]
  );

  const generationProgress = useSyntheticTestGeneration(
    syntheticGeneration,
    handleSyntheticGenerationComplete
  );

  const handleStartSyntheticGeneration = useCallback(
    (request: SyntheticTestGenerationRequest) => {
      if (syntheticGeneration) {
        showToast({
          message: 'Synthetic responses are already generating in the background',
          variant: 'info',
        });
        return;
      }
      setSyntheticGeneration(request);
    },
    [showToast, syntheticGeneration]
  );

  const openTestResponses = useCallback(() => {
    setTestResponsesOpen(true);
  }, []);

  const testResponsesTooltip = useMemo(() => {
    if (!generationProgress || !syntheticGeneration) {
      return TEST_RESPONSES_TOOLTIP;
    }

    return (
      <div className={styles.generationTooltip}>
        <p className={styles.generationTooltipTitle}>Generating synthetic responses</p>
        <p className={styles.generationTooltipMeta}>{syntheticGeneration.panelLabel}</p>
        <p className={styles.generationTooltipStats}>
          {generationProgress.generatedCount} of {generationProgress.total} generated ·{' '}
          {generationProgress.progress}%
        </p>
        <p className={styles.generationTooltipStep}>{generationProgress.step}</p>
        <p className={styles.generationTooltipEta}>{generationProgress.eta}</p>
      </div>
    );
  }, [generationProgress, syntheticGeneration]);

  const value = useMemo(
    () => ({
      openTestResponses,
      testResponsesTooltip,
      testResponsesBusy: Boolean(generationProgress),
      generationProgress: generationProgress?.progress,
    }),
    [generationProgress, openTestResponses, testResponsesTooltip]
  );

  return (
    <TestResponsesContext.Provider value={value}>
      {children}
      {testResponsesOpen ? (
        <TestResponsesModal
          open
          onOpenChange={setTestResponsesOpen}
          onStartSynthetic={handleStartSyntheticGeneration}
        />
      ) : null}
    </TestResponsesContext.Provider>
  );
}

export function useTestResponses(): TestResponsesContextValue {
  const context = useContext(TestResponsesContext);
  if (!context) {
    throw new Error('useTestResponses must be used within TestResponsesProvider');
  }
  return context;
}
