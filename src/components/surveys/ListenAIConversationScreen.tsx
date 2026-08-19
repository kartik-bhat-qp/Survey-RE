'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
import {
  buildListenAiFollowUp,
  getListenAiMaxFollowUps,
  getResolvedListenAiOpeningMessages,
} from '@/data/mock-listenai-interview';
import styles from './ListenAIConversationScreen.module.css';

interface ListenAIConversationScreenProps {
  study: ListenAiStudy;
  selectedAnswerLabel: string;
  onComplete: () => void;
  completeLabel?: string;
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
  completeLabel = 'Return to survey',
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
  const progressPercent = isComplete
    ? 100
    : Math.min(95, Math.round(((followUpsAsked + 1) / (maxFollowUps + 2)) * 100));

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isComplete]);

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
        <span className={styles.logo} aria-hidden>
          ?
        </span>
        <div className={styles.headerCopy}>
          <h1 className={styles.headerTitle}>{study.title}</h1>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Interview progress"
          >
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
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
          <button type="button" className={styles.returnBtn} onClick={onComplete}>
            {completeLabel}
          </button>
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
          Powered by <span className={styles.brand}>QuestionPro</span>
        </span>
        <span>Enter to send · Shift+Enter for new line</span>
      </footer>
    </div>
  );
}
