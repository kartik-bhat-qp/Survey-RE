'use client';

import { useCallback, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  generateQuotasFromAiPrompt,
  QUOTA_AI_CAPABILITY_PILLS,
  QUOTA_AI_EXAMPLE_PROMPTS,
  QUOTA_AI_GREETING,
  type QuotaAiGenerationResult,
} from '@/data/mock-quota-ai-agent';
import { QuotaAiThinkingOverlay } from '@/components/surveys/QuotaAiThinkingOverlay';
import styles from './QuotaAiAgentSidebar.module.css';

interface QuotaAiAgentSidebarProps {
  open: boolean;
  surveyId: number;
  onClose: () => void;
  onGenerated?: (result: QuotaAiGenerationResult) => void;
}

export function QuotaAiAgentSidebar({
  open,
  surveyId,
  onClose,
  onGenerated,
}: QuotaAiAgentSidebarProps) {
  const { showToast } = useWuShowToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resetPrompt = useCallback((): void => {
    setPrompt('');
  }, []);

  function handleClose(): void {
    if (isGenerating) return;
    resetPrompt();
    onClose();
  }

  function handleNewChat(): void {
    if (isGenerating) return;
    resetPrompt();
    showToast({ message: 'Started a new quota agent chat', variant: 'info' });
  }

  async function handleSubmit(): Promise<void> {
    if (isGenerating || !prompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateQuotasFromAiPrompt(prompt, surveyId);
      onGenerated?.(result);
      showToast({ message: result.summary, variant: 'success' });
      resetPrompt();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to create quotas',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function applyPrompt(text: string): void {
    setPrompt(text);
    inputRef.current?.focus();
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <QuotaAiThinkingOverlay open={isGenerating} />
      <aside className={styles.sidebar} aria-label="Quota agent">
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Quota Agent</h2>
            <span className={styles.headerAvatar} aria-hidden>
              🙂
            </span>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerIconBtn}
              aria-label="About quota agent"
              title="About quota agent"
              onClick={() =>
                showToast({
                  message: 'Quota agent helps you create and configure survey quotas with AI',
                  variant: 'info',
                })
              }
            >
              <span className="wm-info-outline" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.headerIconBtn}
              aria-label="New chat"
              title="New chat"
              onClick={handleNewChat}
            >
              <span className="wm-add" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.headerIconBtn}
              aria-label="Close quota agent"
              title="Close"
              onClick={handleClose}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <p className={styles.greeting}>{QUOTA_AI_GREETING}</p>

          <div className={styles.exampleList}>
            {QUOTA_AI_EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.id}
                type="button"
                className={styles.exampleCard}
                onClick={() => applyPrompt(example.text)}
              >
                {example.text}
              </button>
            ))}
          </div>

          <div className={styles.capabilities}>
            <p className={styles.capabilitiesLabel}>I can also:</p>
            <div className={styles.capabilityPills}>
              {QUOTA_AI_CAPABILITY_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className={styles.capabilityPill}
                  onClick={() => applyPrompt(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.inputWrap}>
            <button
              type="button"
              className={styles.attachBtn}
              aria-label="Attach file"
              title="Attach file"
              onClick={() =>
                showToast({
                  message: 'File attachments are not available in this prototype',
                  variant: 'info',
                })
              }
            >
              <span className="wm-attach-file" aria-hidden />
            </button>
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={2}
              value={prompt}
              placeholder="Describe what you'd like to do..."
              aria-label="Describe what you'd like to do"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handlePromptKeyDown}
            />
            <button
              type="button"
              className={styles.sendBtn}
              aria-label="Send"
              title="Send"
              disabled={isGenerating || !prompt.trim()}
              onClick={() => void handleSubmit()}
            >
              <span className="wm-send" aria-hidden />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
