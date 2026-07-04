'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  COMPOSE_WRITING_ACTIONS,
  COMPOSE_WRITING_PROMPT_PLACEHOLDER,
  generateComposeWriting,
  type ComposeWritingActionId,
} from '@/data/mock-survey-distribute';
import styles from './ComposeHelpMeWrite.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const BAR_ACTIONS = COMPOSE_WRITING_ACTIONS.slice(0, 4);

interface ComposeHelpMeWriteTriggerProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ComposeHelpMeWriteTrigger({
  active,
  disabled = false,
  onClick,
}: ComposeHelpMeWriteTriggerProps) {
  return (
    <button
      type="button"
      className={`${styles.trigger} ${active ? styles.triggerActive : ''}`}
      aria-label="Help me write"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`wm-edit ${styles.triggerPencil}`} aria-hidden />
      <span className={`wc-ai ${styles.triggerAi}`} aria-hidden />
    </button>
  );
}

interface ComposeHelpMeWriteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  body: string;
  subject: string;
  onBodyChange: (body: string) => void;
  onSubjectChange: (subject: string) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function ComposeHelpMeWrite({
  open,
  onOpenChange,
  body,
  subject,
  onBodyChange,
  onSubjectChange,
  onGeneratingChange,
}: ComposeHelpMeWriteProps) {
  const { showToast } = useWuShowToast();
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeActionId, setActiveActionId] = useState<ComposeWritingActionId | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!open) {
    return null;
  }

  async function runGeneration(
    request:
      | { type: 'action'; actionId: ComposeWritingActionId }
      | { type: 'prompt'; prompt: string }
  ): Promise<void> {
    if (isGenerating) return;

    setIsGenerating(true);
    onGeneratingChange?.(true);

    if (request.type === 'action') {
      setActiveActionId(request.actionId);
    } else {
      setActiveActionId(null);
    }

    try {
      const result = await generateComposeWriting(request, { body, subject });
      onBodyChange(result.body);
      if (result.subject) {
        onSubjectChange(result.subject);
      }
      showToast({ message: result.summary, variant: 'success' });
      if (request.type === 'prompt') {
        setCustomPrompt('');
      }
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to update message',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
      setActiveActionId(null);
      onGeneratingChange?.(false);
    }
  }

  function handleActionClick(actionId: ComposeWritingActionId): void {
    void runGeneration({ type: 'action', actionId });
  }

  function handleCustomPromptSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void runGeneration({ type: 'prompt', prompt: customPrompt });
  }

  return (
    <section className={styles.bar} aria-label="Help me write">
      <span className={`wm-edit ${styles.barPencil}`} aria-hidden />

      <form className={styles.promptForm} onSubmit={handleCustomPromptSubmit}>
        <input
          type="text"
          value={customPrompt}
          onChange={(event) => setCustomPrompt(event.target.value)}
          placeholder={COMPOSE_WRITING_PROMPT_PLACEHOLDER}
          className={styles.promptInput}
          disabled={isGenerating}
          aria-label="Describe how to change this message"
        />
      </form>

      <div className={styles.actionGroup} role="group" aria-label="Writing actions">
        {BAR_ACTIONS.map((action) => {
          const isActive = activeActionId === action.id && isGenerating;

          return (
            <WuTooltip key={action.id} content={action.label} position="top">
              <button
                type="button"
                className={`${styles.actionBtn} ${isActive ? styles.actionBtnActive : ''}`}
                aria-label={action.label}
                title={action.description}
                onClick={() => handleActionClick(action.id)}
                disabled={isGenerating}
              >
                <span className={action.icon} aria-hidden />
              </button>
            </WuTooltip>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.closeBtn}
        aria-label="Close help me write"
        onClick={() => onOpenChange(false)}
        disabled={isGenerating}
      >
        <span className="wm-close" aria-hidden />
      </button>
    </section>
  );
}
