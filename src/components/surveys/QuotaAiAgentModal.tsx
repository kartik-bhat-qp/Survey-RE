'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  generateQuotasFromAiPrompt,
  QUOTA_AI_PROMPT_SUGGESTIONS,
  type QuotaAiGenerationResult,
} from '@/data/mock-quota-ai-agent';
import { QuotaAiThinkingOverlay } from '@/components/surveys/QuotaAiThinkingOverlay';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './QuotaAiAgentModal.module.css';

const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);

interface QuotaAiAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onGenerated?: (result: QuotaAiGenerationResult) => void;
}

export function QuotaAiAgentModal({
  open,
  onOpenChange,
  surveyId,
  onGenerated,
}: QuotaAiAgentModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const resetState = useCallback((): void => {
    setPrompt('');
    setIsGenerating(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean): void => {
      if (!nextOpen) {
        resetState();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState]
  );

  async function handleGenerate(): Promise<void> {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateQuotasFromAiPrompt(prompt, surveyId);
      onGenerated?.(result);
      showToast({ message: result.summary, variant: 'success' });
      handleOpenChange(false);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to create quotas',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;

  return (
    <>
      <QuotaAiThinkingOverlay open={isGenerating} />
      <WuModal
        open
        onOpenChange={handleOpenChange}
        className={styles.modal}
        variant="action"
      >
        <WuModalHeader className={styles.header}>
          <span className={`wc-ai ${styles.headerIcon}`} aria-hidden />
          Quota AI agent
        </WuModalHeader>
        <WuModalContent className={styles.content}>
          <div className={styles.body}>
            <p className={styles.description}>
              Describe the quotas you need. QuestionPro AI will set up question based, cross
              variable, or criteria quotas using your survey variables.
            </p>
            <WuTextarea
              value={prompt}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPrompt(event.target.value)
              }
              placeholder="Example: Create cross variable quotas for car type and brand by gender and age"
              rows={4}
              className={styles.promptInput}
            />
            <div className={styles.suggestions}>
              <span className={styles.suggestionsLabel}>Try:</span>
              <div className={styles.suggestionList}>
                {QUOTA_AI_PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <div className={styles.footer}>
            <WuButton variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </WuButton>
            <WuButton
              onClick={() => void handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              Icon={<span className="wc-ai" aria-hidden />}
            >
              Create quotas
            </WuButton>
          </div>
        </WuModalFooter>
      </WuModal>
    </>
  );
}
