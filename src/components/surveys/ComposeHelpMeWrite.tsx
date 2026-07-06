'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  COMPOSE_WRITING_ACTIONS,
  COMPOSE_WRITING_PROMPT_PLACEHOLDER,
  generateComposeWriting,
  readComposeBodySelection,
  type ComposeWritingActionId,
  type ComposeWritingSelection,
} from '@/data/mock-survey-distribute';
import { truncate } from '@/data/mock-utils';
import styles from './ComposeHelpMeWrite.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const BAR_ACTIONS = COMPOSE_WRITING_ACTIONS.slice(0, 4);

interface ComposeWritingSnapshot {
  subject: string;
  body: string;
}

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
  bodyFieldRef: React.RefObject<HTMLTextAreaElement | null>;
  bodySelection: ComposeWritingSelection | null;
  onBodyChange: (body: string) => void;
  onSubjectChange: (subject: string) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function ComposeHelpMeWrite({
  open,
  onOpenChange,
  body,
  subject,
  bodyFieldRef,
  bodySelection,
  onBodyChange,
  onSubjectChange,
  onGeneratingChange,
}: ComposeHelpMeWriteProps) {
  const { showToast } = useWuShowToast();
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeActionId, setActiveActionId] = useState<ComposeWritingActionId | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<ComposeWritingSnapshot[]>([]);

  if (!open) {
    return null;
  }

  const hasSelection = Boolean(bodySelection?.text.trim());
  const selectionPreview = bodySelection?.text.trim() ?? '';

  function handleUndo(): void {
    if (isGenerating || undoStack.length === 0) return;

    const snapshot = undoStack[undoStack.length - 1];
    setUndoStack((current) => current.slice(0, -1));
    onBodyChange(snapshot.body);
    onSubjectChange(snapshot.subject);
    showToast({ message: 'Changes undone', variant: 'info' });
  }

  async function runGeneration(
    request:
      | { type: 'action'; actionId: ComposeWritingActionId }
      | { type: 'prompt'; prompt: string }
  ): Promise<void> {
    if (isGenerating) return;

    const selection = readComposeBodySelection(bodyFieldRef.current);
    if (!selection) {
      showToast({ message: 'Highlight text in the email body first', variant: 'error' });
      bodyFieldRef.current?.focus();
      return;
    }

    setIsGenerating(true);
    onGeneratingChange?.(true);

    if (request.type === 'action') {
      setActiveActionId(request.actionId);
    } else {
      setActiveActionId(null);
    }

    try {
      const result = await generateComposeWriting(request, { body, subject }, selection);
      setUndoStack((current) => [...current, { subject, body }]);
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

      <div className={styles.barMain}>
        <p
          className={hasSelection ? styles.selectionHint : styles.selectionHintMuted}
          title={hasSelection ? selectionPreview : undefined}
        >
          {hasSelection
            ? `Editing: "${truncate(selectionPreview, 56)}"`
            : 'Highlight text in the email body to use these actions'}
        </p>

        <form className={styles.promptForm} onSubmit={handleCustomPromptSubmit}>
          <input
            type="text"
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
            placeholder={COMPOSE_WRITING_PROMPT_PLACEHOLDER}
            className={styles.promptInput}
            disabled={isGenerating || !hasSelection}
            aria-label="Describe how to change the highlighted text"
          />
        </form>
      </div>

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
                disabled={isGenerating || !hasSelection}
              >
                <span className={action.icon} aria-hidden />
              </button>
            </WuTooltip>
          );
        })}
      </div>

      <WuTooltip content="Undo last change" position="top">
        <button
          type="button"
          className={styles.undoBtn}
          aria-label="Undo last change"
          onClick={handleUndo}
          disabled={isGenerating || undoStack.length === 0}
        >
          Undo
        </button>
      </WuTooltip>

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
