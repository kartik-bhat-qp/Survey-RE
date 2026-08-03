'use client';

import { useEffect, useId, useState } from 'react';
import { formatDeepDiveProgressStep } from '@/data/mock-deepdive-follow-ups';
import type { DeepDiveFollowUpReply } from '@/data/mock-deepdive-follow-ups';
import { VoiceAnswerField } from '@/components/ui/VoiceAnswerField';
import {
  emptyVoiceAnswer,
  type VoiceAnswerValue,
} from '@/data/mock-voice-answer';
import styles from './DeepDiveFollowUpCard.module.css';

interface DeepDiveFollowUpCardActiveProps {
  progressCurrent: number;
  progressTotal: number;
  priorAnswerQuote: string;
  questionText: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
}

function replyTextFromVoice(value: VoiceAnswerValue): string {
  if (value.captionText?.trim()) return value.captionText.trim();
  if (value.textResponse?.trim()) return value.textResponse.trim();
  if (value.audioUrl) return 'Voice response';
  return '';
}

export function DeepDiveFollowUpCardActive({
  progressCurrent,
  progressTotal,
  priorAnswerQuote,
  questionText,
  onSubmit,
  onSkip,
}: DeepDiveFollowUpCardActiveProps) {
  const [answer, setAnswer] = useState<VoiceAnswerValue>(emptyVoiceAnswer());
  const [fieldKey, setFieldKey] = useState(0);
  const questionId = useId();
  const liveRegionId = useId();
  const progressPercent =
    progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;
  const progressStepLabel = formatDeepDiveProgressStep(progressCurrent, progressTotal);

  useEffect(() => {
    setAnswer(emptyVoiceAnswer());
    setFieldKey((k) => k + 1);
  }, [questionText]);

  function handleSubmit(value: VoiceAnswerValue): void {
    const text = replyTextFromVoice(value);
    if (!text) return;
    onSubmit(text);
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

      <VoiceAnswerField
        key={fieldKey}
        value={answer}
        onChange={setAnswer}
        onSubmit={handleSubmit}
        placeholder="Type your answer or use the mic"
        captionPlaceholder="Add a note, or tap send"
      />

      <div className={styles.nextRow}>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={() => handleSubmit(answer)}
        >
          Next
        </button>
      </div>
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
