'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
import {
  buildListenAiFollowUp,
  getListenAiMaxFollowUps,
  getResolvedListenAiOpeningMessages,
} from '@/data/mock-listenai-interview';
import styles from './ListenAIConversationScreen.module.css';

const RETURN_TO_SURVEY_DELAY_MS = 1600;

interface ListenAIConversationScreenProps {
  study: ListenAiStudy;
  selectedAnswerLabel: string;
  onComplete: () => void;
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isFollowUp?: boolean;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ListenAIConversationScreen({
  study,
  selectedAnswerLabel,
  onComplete,
}: ListenAIConversationScreenProps) {
  const opening = useMemo(
    () => getResolvedListenAiOpeningMessages(study, selectedAnswerLabel),
    [selectedAnswerLabel, study]
  );
  const maxFollowUps = getListenAiMaxFollowUps(study);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    opening.map((text, index) => ({
      id: `open-${index}`,
      role: 'ai',
      text,
    }))
  );
  const [draft, setDraft] = useState('');
  const [followUpsAsked, setFollowUpsAsked] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const totalSteps = maxFollowUps + 1;
  const currentStep = isComplete ? totalSteps : Math.min(totalSteps, followUpsAsked + 1);
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  const progressLabel = isComplete
    ? 'Complete'
    : followUpsAsked === 0
      ? `Opening question · ${currentStep} of ${totalSteps}`
      : `Follow-up ${followUpsAsked} of ${maxFollowUps}`;

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isComplete]);

  useEffect(() => {
    if (!isComplete) return;
    const timeoutId = window.setTimeout(() => {
      onCompleteRef.current();
    }, RETURN_TO_SURVEY_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isComplete]);

  function finishInterview(): void {
    const thankYou =
      study.thankYouNote.trim() ||
      'Thank you for sharing. You will now return to the survey.';
    setMessages((current) => [
      ...current,
      { id: nextId('ai'), role: 'ai', text: thankYou },
    ]);
    setIsComplete(true);
  }

  function sendReply(): void {
    const text = draft.trim();
    if (!text || isComplete) return;

    const userMessage: ChatMessage = { id: nextId('user'), role: 'user', text };
    const nextFollowUps = followUpsAsked + 1;
    setDraft('');
    setMessages((current) => [...current, userMessage]);

    if (nextFollowUps <= maxFollowUps) {
      const followUp = buildListenAiFollowUp(
        study,
        text,
        followUpsAsked,
        selectedAnswerLabel
      );
      setFollowUpsAsked(nextFollowUps);
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { id: nextId('ai'), role: 'ai', text: followUp, isFollowUp: true },
        ]);
      }, 280);
      return;
    }

    window.setTimeout(() => {
      finishInterview();
    }, 280);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    sendReply();
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.logo} aria-hidden>
            ?
          </span>
          <div className={styles.headerCopy}>
            <h1 className={styles.headerTitle}>Conversation</h1>
            <p className={styles.headerSubtitle}>
              A short AI follow-up based on your previous answer
            </p>
          </div>
        </div>
        <div className={styles.progressRow}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={progressLabel}
          >
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={styles.progressMeta}>{progressLabel}</span>
        </div>
      </header>

      <div className={styles.thread} ref={threadRef} aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.row} ${message.role === 'user' ? styles.rowUser : ''}`}
          >
            {message.role === 'ai' ? (
              <span className={styles.avatar} aria-hidden>
                ?
              </span>
            ) : null}
            <div className={styles.bubbleCol}>
              {message.isFollowUp ? <span className={styles.followUpBadge}>Follow-up</span> : null}
              <p
                className={`${styles.bubble} ${
                  message.role === 'ai' ? styles.bubbleAi : styles.bubbleUser
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.composer}>
        {isComplete ? (
          <p className={styles.returningNote} role="status" aria-live="polite">
            Returning to the survey…
          </p>
        ) : (
          <div className={styles.inputRow}>
            <textarea
              className={styles.textarea}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Type your response"
              aria-label="Type your response"
            />
            <button
              type="button"
              className={`${styles.sendBtn} ${draft.trim() ? styles.sendBtnReady : ''}`}
              aria-label="Send"
              disabled={!draft.trim()}
              onClick={sendReply}
            >
              <span className="wm-send" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>
          Powered by{' '}
          <a
            className={styles.brandLink}
            href="https://www.questionpro.com/research-suite/listen-ai/"
            target="_blank"
            rel="noreferrer"
          >
            Interviews
          </a>
        </span>
        <span>Enter to send · Shift+Enter for new line</span>
      </footer>
    </div>
  );
}
