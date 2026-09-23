'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AudioInputButton } from '@/components/ui/AudioInputButton';
import {
  createDashboardResearchAgentMessageId,
  DASHBOARD_RESEARCH_AGENT_ABOUT,
  DASHBOARD_RESEARCH_AGENT_EXAMPLE_PROMPTS,
  DASHBOARD_RESEARCH_AGENT_PLACEHOLDER,
  DASHBOARD_RESEARCH_AGENT_TITLE,
  generateDashboardResearchAgentReply,
  getDashboardResearchAgentOpening,
  type DashboardResearchAgentMessage,
} from '@/data/mock-dashboard-research-agent';
import styles from './DashboardResearchAgentPanel.module.css';

interface DashboardResearchAgentPanelProps {
  open: boolean;
  dashboardName: string;
  onClose: () => void;
}

function renderMessageText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function DashboardResearchAgentPanel({
  open,
  dashboardName,
  onClose,
}: DashboardResearchAgentPanelProps) {
  const { showToast } = useWuShowToast();
  const [messages, setMessages] = useState<DashboardResearchAgentMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMessages([getDashboardResearchAgentOpening(dashboardName)]);
    setPrompt('');
    setShowSuggestions(true);
    setIsReplying(false);
  }, [open, dashboardName]);

  useEffect(() => {
    if (!open) return;
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isReplying, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isReplying) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isReplying, onClose]);

  if (!open) return null;

  async function sendPrompt(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || isReplying) return;

    const userMessage: DashboardResearchAgentMessage = {
      id: createDashboardResearchAgentMessageId(),
      role: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt('');
    setShowSuggestions(false);
    setIsReplying(true);

    try {
      const reply = await generateDashboardResearchAgentReply(trimmed, dashboardName);
      setMessages((current) => [...current, reply]);
    } catch {
      showToast({
        message: 'Unable to get a research agent reply',
        variant: 'error',
      });
    } finally {
      setIsReplying(false);
      inputRef.current?.focus();
    }
  }

  function handleNewChat(): void {
    if (isReplying) return;
    setMessages([getDashboardResearchAgentOpening(dashboardName)]);
    setPrompt('');
    setShowSuggestions(true);
    showToast({ message: 'Started a new research agent chat', variant: 'info' });
  }

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt(prompt);
    }
  }

  return (
    <div className={styles.shell} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close research agent"
        onClick={() => {
          if (!isReplying) onClose();
        }}
      />
      <aside className={styles.panel} aria-label={DASHBOARD_RESEARCH_AGENT_TITLE}>
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <span className={`wc-ai ${styles.headerIcon}`} aria-hidden />
            <h2 className={styles.headerTitle}>{DASHBOARD_RESEARCH_AGENT_TITLE}</h2>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerIconBtn}
              aria-label="About research agent"
              title="About"
              onClick={() =>
                showToast({ message: DASHBOARD_RESEARCH_AGENT_ABOUT, variant: 'info' })
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
              aria-label="Close research agent"
              title="Close"
              disabled={isReplying}
              onClick={onClose}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.thread} role="log" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.bubble} ${
                  message.role === 'user' ? styles.bubbleUser : styles.bubbleAgent
                }`}
              >
                {message.role === 'agent' ? (
                  <span className={styles.agentLabel}>Research agent</span>
                ) : null}
                <p className={styles.bubbleText}>{renderMessageText(message.text)}</p>
                {message.summary ? (
                  <div className={styles.summaryCard}>
                    <p className={styles.summaryHeadline}>{message.summary.headline}</p>
                    <ul className={styles.summaryList}>
                      {message.summary.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                    <div className={styles.callouts}>
                      {message.summary.callouts.map((callout) => (
                        <div
                          key={callout.label}
                          className={`${styles.callout} ${
                            callout.tone === 'watch'
                              ? styles.calloutWatch
                              : callout.tone === 'positive'
                                ? styles.calloutPositive
                                : ''
                          }`}
                        >
                          <span className={styles.calloutLabel}>{callout.label}</span>
                          <span className={styles.calloutValue}>{callout.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {isReplying ? (
              <div className={`${styles.bubble} ${styles.bubbleAgent}`}>
                <span className={styles.agentLabel}>Research agent</span>
                <p className={styles.typing}>
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            ) : null}

            {showSuggestions && !isReplying ? (
              <div className={styles.suggestions}>
                <p className={styles.suggestionsLabel}>Start talking</p>
                <div className={styles.suggestionList}>
                  {DASHBOARD_RESEARCH_AGENT_EXAMPLE_PROMPTS.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      className={styles.suggestionCard}
                      onClick={() => void sendPrompt(example.text)}
                    >
                      {example.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={threadEndRef} />
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.inputWrap}>
            <AudioInputButton
              size="sm"
              disabled={isReplying}
              onTranscript={(text) =>
                setPrompt((prev) => (prev ? `${prev} ${text}` : text))
              }
            />
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={2}
              value={prompt}
              placeholder={DASHBOARD_RESEARCH_AGENT_PLACEHOLDER}
              aria-label="Ask the research agent"
              disabled={isReplying}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handlePromptKeyDown}
            />
            <button
              type="button"
              className={styles.sendBtn}
              aria-label="Send"
              title="Send"
              disabled={isReplying || !prompt.trim()}
              onClick={() => void sendPrompt(prompt)}
            >
              <span className="wm-send" aria-hidden />
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
