'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { formatDeepDiveProgressStep } from '@/data/mock-deepdive-follow-ups';
import type { DeepDiveFollowUpReply } from '@/data/mock-deepdive-follow-ups';
import styles from './DeepDiveFollowUpCard.module.css';

interface DeepDiveFollowUpCardActiveProps {
  progressCurrent: number;
  progressTotal: number;
  priorAnswerQuote: string;
  questionText: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
}

export function DeepDiveFollowUpCardActive({
  progressCurrent,
  progressTotal,
  priorAnswerQuote,
  questionText,
  onSubmit,
  onSkip,
}: DeepDiveFollowUpCardActiveProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const questionId = useId();
  const liveRegionId = useId();
  const isLastFollowUp = progressCurrent >= progressTotal;
  const submitLabel = isLastFollowUp ? 'Submit' : 'Next';
  const progressPercent =
    progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;
  const progressStepLabel = formatDeepDiveProgressStep(progressCurrent, progressTotal);

  useEffect(() => {
    setDraft('');
    inputRef.current?.focus();
  }, [questionText]);

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setDraft('');
  }

  return (
    <div
      className={styles.card}
      role="region"
      aria-labelledby={questionId}
      aria-live="polite"
      id={liveRegionId}
    >
      <div className={styles.cardHeader}>
        <div className={styles.progressSection}>
          <div className={styles.progressMeta}>
            <span className={styles.progressStep}>{progressStepLabel}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progressCurrent}
            aria-valuemin={1}
            aria-valuemax={progressTotal}
            aria-label={`Follow-up ${progressStepLabel}`}
          >
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <button type="button" className={styles.skipLink} onClick={onSkip}>
          Skip
        </button>
      </div>

      <p className={styles.priorAnswer}>
        You said:{' '}
        <span className={styles.priorAnswerQuote}>&ldquo;{priorAnswerQuote}&rdquo;</span>
      </p>

      <p className={styles.questionText} id={questionId}>
        {questionText}
      </p>

      <form className={styles.formRow} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.textInput}
          rows={2}
          value={draft}
          placeholder="Type your answer"
          aria-label="Follow-up answer"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className={styles.submitBtn} disabled={!draft.trim()}>
          {submitLabel}
        </button>
      </form>
    </div>
  );
}

interface DeepDiveFollowUpCardSummaryProps {
  summaryLabel: string;
  replies: DeepDiveFollowUpReply[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function DeepDiveFollowUpCardSummary({
  summaryLabel,
  replies,
  isExpanded,
  onToggle,
}: DeepDiveFollowUpCardSummaryProps) {
  return (
    <>
      <button
        type="button"
        className={styles.summaryChip}
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span className={`wm-forum ${styles.summaryIcon}`} aria-hidden />
        {summaryLabel}
      </button>

      {isExpanded ? (
        <div className={styles.reviewPanel} aria-live="polite">
          {replies.map((reply, index) => (
            <div key={`${reply.question}-${index}`} className={styles.reviewItem}>
              <p className={styles.reviewQuestion}>{reply.question}</p>
              <p className={styles.reviewAnswer}>{reply.answer}</p>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
