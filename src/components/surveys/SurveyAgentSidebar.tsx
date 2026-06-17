'use client';

import { useCallback, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  generateSurveyChangesFromAiPrompt,
  SURVEY_AI_CAPABILITY_PILLS,
  SURVEY_AI_EXAMPLE_PROMPTS,
  SURVEY_AI_GREETING,
  type SurveyAiGenerationResult,
} from '@/data/mock-survey-ai-agent';
import { SurveyAgentThinkingOverlay } from '@/components/surveys/SurveyAgentThinkingOverlay';
import styles from './SurveyAgentSidebar.module.css';

interface SurveyAgentSidebarProps {
  open: boolean;
  surveyId: number;
  onClose: () => void;
  onGenerated?: (result: SurveyAiGenerationResult) => void;
}

export function SurveyAgentSidebar({
  open,
  surveyId,
  onClose,
  onGenerated,
}: SurveyAgentSidebarProps) {
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
    showToast({ message: 'Started a new survey agent chat', variant: 'info' });
  }

  async function handleSubmit(): Promise<void> {
    if (isGenerating || !prompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateSurveyChangesFromAiPrompt(prompt, surveyId);
      onGenerated?.(result);
      showToast({ message: result.summary, variant: 'success' });
      resetPrompt();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to update survey',
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
      <SurveyAgentThinkingOverlay open={isGenerating} />
      <aside className={styles.sidebar} aria-label="Survey agent">
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Survey Agent</h2>
            <span className={styles.headerAvatar} aria-hidden>
              <span className={`wc-ai ${styles.headerAvatarIcon}`} />
            </span>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.headerIconBtn} ${styles.headerHelpBtn}`}
              aria-label="About survey agent"
              title="About survey agent"
              onClick={() =>
                showToast({
                  message: 'Survey agent helps you build, edit, and improve your survey with AI',
                  variant: 'info',
                })
              }
            >
              <span className={`wm-help-outline ${styles.headerHelpIcon}`} aria-hidden />
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
              aria-label="Close survey agent"
              title="Close"
              onClick={handleClose}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <p className={styles.greeting}>{SURVEY_AI_GREETING}</p>

          <div className={styles.exampleList}>
            {SURVEY_AI_EXAMPLE_PROMPTS.map((example) => (
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
              {SURVEY_AI_CAPABILITY_PILLS.map((pill) => (
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
