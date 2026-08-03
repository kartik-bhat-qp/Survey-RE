'use client';

import { useEffect, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { VoiceAnswerField } from '@/components/ui/VoiceAnswerField';
import { useDeepDiveFollowUpThread } from '@/components/surveys/useDeepDiveFollowUpThread';
import {
  emptyVoiceAnswer,
  type VoiceAnswerValue,
} from '@/data/mock-voice-answer';
import type { DeepDiveFollowUpSettings } from '@/data/mock-deepdive-question-settings';
import styles from './DeepDiveConversationScreen.module.css';

interface DeepDiveConversationScreenProps {
  /** Settings from Q18 config (tone, maxFollowUp, probeWhen, etc.) */
  settings: DeepDiveFollowUpSettings;
  /** The label of the option the respondent just selected in Q17 */
  selectedAnswerLabel: string;
  /** Called when the conversation finishes or the user skips all */
  onDone: () => void;
}

function replyTextFromVoice(value: VoiceAnswerValue): string {
  if (value.captionText?.trim()) return value.captionText.trim();
  if (value.textResponse?.trim()) return value.textResponse.trim();
  if (value.audioUrl) return 'Voice response';
  return '';
}

export function DeepDiveConversationScreen({
  settings,
  selectedAnswerLabel,
  onDone,
}: DeepDiveConversationScreenProps) {
  const { showToast } = useWuShowToast();
  const [answer, setAnswer] = useState<VoiceAnswerValue>(emptyVoiceAnswer());
  const [fieldKey, setFieldKey] = useState(0);
  // Track whether the thread has moved through at least one 'active' phase
  // so we don't call onDone() on the initial idle state before startThread fires.
  const hasBeenActive = useRef(false);

  const { state, startThread, submitReply, skipThread } =
    useDeepDiveFollowUpThread(settings);

  useEffect(() => {
    startThread('selected-option', selectedAnswerLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase === 'active') {
      hasBeenActive.current = true;
      setAnswer(emptyVoiceAnswer());
      setFieldKey((k) => k + 1);
    }
  }, [state.currentQuestion, state.phase]);

  useEffect(() => {
    if (!hasBeenActive.current) return;
    if (state.phase === 'collapsed' || state.phase === 'idle') {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function handleSubmit(value: VoiceAnswerValue): void {
    const text = replyTextFromVoice(value);
    if (!text) {
      showToast({ message: 'Enter an answer or record a voice response', variant: 'error' });
      return;
    }
    submitReply(text);
  }

  const progressPercent =
    state.progressTotal > 0
      ? Math.round((state.progressCurrent / state.progressTotal) * 100)
      : 0;

  return (
    <div className={styles.screen}>
      <div
        className={styles.progressRow}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Follow-up ${state.progressCurrent} of ${state.progressTotal}`}
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
        {state.currentQuestion && (
          <div className={styles.bubbleWrap} aria-live="polite">
            <p className={styles.bubble}>{state.currentQuestion}</p>
          </div>
        )}

        <div className={styles.inputCard}>
          <VoiceAnswerField
            key={fieldKey}
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmit}
            placeholder="Type your answer…"
            captionPlaceholder="Add a note, or tap send"
            embedded
            className={styles.voiceField}
          />
          <div className={styles.inputActions}>
            <button type="button" className={styles.skipBtn} onClick={skipThread}>
              Skip
            </button>
            <button
              type="button"
              className={styles.nextBtn}
              onClick={() => handleSubmit(answer)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        Powered by <span className={styles.brand}>QuestionPro</span>
      </footer>
    </div>
  );
}
