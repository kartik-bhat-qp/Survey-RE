'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioInputButton } from '@/components/ui/AudioInputButton';
import { useDeepDiveFollowUpThread } from '@/components/surveys/useDeepDiveFollowUpThread';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { shouldTriggerDeepDiveForSelection } from '@/data/mock-deepdive-question-settings';
import type { DeepDiveQuestionPreviewSession } from '@/data/survey-question-preview-session';
import styles from './DeepDiveQuestionPreview.module.css';

interface DeepDiveQuestionPreviewProps {
  session: DeepDiveQuestionPreviewSession;
  onClose: () => void;
}

type Phase = 'target-question' | 'deepdive' | 'done';

export function DeepDiveQuestionPreview({
  session,
  onClose,
}: DeepDiveQuestionPreviewProps) {
  const { targetQuestionText, targetOptions, settings } = session;

  // ── Phase 1: target question ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('target-question');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Phase 2: DeepDive conversation ────────────────────────────────────────
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Always pass settings so startThread is enabled when the respondent submits
  // (gating on phase left settings null in the same click handler).
  const { state, startThread, submitReply, skipThread } =
    useDeepDiveFollowUpThread(settings?.enabled ? settings : null);
  const hasBeenActive = useRef(false);

  // Automatically kick off the AI conversation after the respondent submits
  function handleTargetSubmit(): void {
    if (!selectedId) return;
    const selected = targetOptions.find((o) => o.id === selectedId);
    if (!shouldTriggerDeepDiveForSelection(settings, [selectedId])) {
      setPhase('done');
      return;
    }
    startThread(selectedId, selected?.label ?? 'my response');
    setPhase('deepdive');
  }

  // Refocus textarea on each new AI question
  useEffect(() => {
    if (phase === 'deepdive' && state.phase === 'active') {
      hasBeenActive.current = true;
      setDraft('');
      textareaRef.current?.focus();
    }
  }, [state.currentQuestion, state.phase, phase]);

  // Transition to done when thread finishes (ignore initial idle before start)
  useEffect(() => {
    if (!hasBeenActive.current) return;
    if (
      phase === 'deepdive' &&
      (state.phase === 'collapsed' || state.phase === 'idle')
    ) {
      setPhase('done');
    }
  }, [state.phase, phase]);

  function handleSend(): void {
    const trimmed = draft.trim();
    if (!trimmed) return;
    submitReply(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const progressPercent =
    state.progressTotal > 0
      ? Math.round((state.progressCurrent / state.progressTotal) * 100)
      : 0;

  const questionText =
    plainTextFromRichValue(targetQuestionText) || targetQuestionText;

  // ── Phase 1: target question ──────────────────────────────────────────────
  if (phase === 'target-question') {
    return (
      <div className={styles.shell}>
        <div className={styles.body}>
          <section className={styles.questionSection}>
            <p className={styles.questionText}>{questionText}</p>

            <ul className={styles.optionList} role="radiogroup">
              {targetOptions.map((option) => (
                <li key={option.id}>
                  <label
                    className={`${styles.optionLabel} ${
                      selectedId === option.id ? styles.optionLabelSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="target-q"
                      className={styles.radioInput}
                      checked={selectedId === option.id}
                      onChange={() => setSelectedId(option.id)}
                      aria-label={option.label}
                    />
                    <span className={styles.radioCircle} aria-hidden />
                    <span className={styles.optionText}>{option.label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className={styles.nextRow}>
              <button
                type="button"
                className={styles.nextBtn}
                disabled={!selectedId}
                onClick={handleTargetSubmit}
              >
                Next
              </button>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          Powered by <span className={styles.footerBrand}>QuestionPro</span>
        </footer>
      </div>
    );
  }

  // ── Phase 2: DeepDive conversation ────────────────────────────────────────
  if (phase === 'deepdive') {
    return (
      <div className={styles.shell}>
        {/* Progress bar */}
        <div
          className={styles.progressRow}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${state.progressCurrent} of ${state.progressTotal}`}
        >
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{progressPercent}%</span>
        </div>

        <div className={styles.body}>
          {/* AI question chat bubble */}
          {state.currentQuestion && (
            <div className={styles.bubbleWrap} aria-live="polite">
              <p className={styles.bubble}>{state.currentQuestion}</p>
            </div>
          )}

          {/* Answer input */}
          <div className={styles.inputCard}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={draft}
              placeholder="Tap mic to speak (or type)."
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Your answer"
            />
            <div className={styles.inputActions}>
              <button
                type="button"
                className={styles.skipLink}
                onClick={skipThread}
              >
                Skip
              </button>
              <div className={styles.actionBtns}>
                <AudioInputButton
                  size="sm"
                  onTranscript={(text) =>
                    setDraft((prev) => (prev ? `${prev} ${text}` : text))
                  }
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  disabled={!draft.trim()}
                  onClick={handleSend}
                  aria-label="Send answer"
                >
                  <span className="wm-send" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          Powered by <span className={styles.footerBrand}>QuestionPro</span>
        </footer>
      </div>
    );
  }

  // ── Phase 3: done ─────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>
      <div className={`${styles.body} ${styles.bodyCenter}`}>
        <div className={styles.doneWrap}>
          <span className={`wm-check-circle ${styles.doneIcon}`} aria-hidden />
          <p className={styles.doneHeading}>Thank you!</p>
          <p className={styles.doneText}>
            Your responses have been recorded. This concludes the follow-up
            section.
          </p>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Close preview
          </button>
        </div>
      </div>
      <footer className={styles.footer}>
        Powered by <span className={styles.footerBrand}>QuestionPro</span>
      </footer>
    </div>
  );
}
