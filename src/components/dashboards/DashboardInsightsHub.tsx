'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './DashboardInsightsHub.module.css';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

interface DashboardInsightsHubProps {
  dashboardName: string;
  tabName: string;
}

const SUGGESTIONS = [
  'Summarize this dashboard',
  'What trends should I look at?',
  'What should I explore next?',
];

// Local demonstration copy only. No dashboard data is sent or analyzed.
function demoReply(question: string, dashboardName: string, tabName: string): string {
  const context = `“${dashboardName}” → ${tabName}`;
  if (/trend|change|time/i.test(question)) {
    return `For ${context}, I could help identify changes over time, highlight unusual peaks or dips, and compare the current period with a previous one.\n\nThis is a sample response. In the connected experience, I would explain the trends using your dashboard data.`;
  }
  if (/next|explore|recommend/i.test(question)) {
    return `A useful next step for ${context} would be to compare key segments, review changes over time, and look more closely at any outliers.\n\nThis is a sample response. Data-backed recommendations will be available when Insights Hub is connected.`;
  }
  if (/summari|summary|overview/i.test(question)) {
    return `Here’s an example of how I would summarize ${context}:\n\n• Highlight the main metrics and their performance.\n• Explain the most notable differences across segments.\n• Point out areas worth exploring further.\n\nThis is a sample response, not an analysis of your dashboard.`;
  }
  return `I can help explore that question for ${context}. In the connected experience, I would use the dashboard’s charts, metrics, and filters to give you a relevant answer.\n\nFor now, this is a sample reply so you can try the conversation.`;
}

export function DashboardInsightsHub({ dashboardName, tabName }: DashboardInsightsHubProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replying, setReplying] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);
  const panelId = useId();
  const headingId = useId();

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = messages.length ? logRef.current.scrollHeight : 0;
    }
  }, [open, messages, replying]);

  function closeChat() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question || replying) return;
    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text: question };
    setMessages(current => [...current, userMessage]);
    setDraft('');
    setReplying(true);
    inputRef.current?.focus();
    // Capture the dashboard/tab at send time, even if the user switches tabs.
    const answer = demoReply(question, dashboardName, tabName);
    replyTimer.current = setTimeout(() => {
      const assistantMessage: ChatMessage = { id: nextId.current++, role: 'assistant', text: answer };
      setMessages(current => [...current, assistantMessage]);
      setReplying(false);
      replyTimer.current = null;
    }, 650);
  }

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherActive : ''}`}
        aria-label="Insights Hub"
        title="Insights Hub"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => open ? closeChat() : setOpen(true)}
      >
        <span className="wp-insightshub" aria-hidden="true" />
      </button>

      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
          className={styles.panel}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              closeChat();
            }
          }}
        >
          <header className={styles.header}>
            <span className={`wp-insightshub ${styles.headerIcon}`} aria-hidden="true" />
            <div className={styles.heading}>
              <h2 id={headingId}>Insights Hub</h2>
              <p>Ask about your dashboard</p>
            </div>
            <span className={styles.badge}>Demo</span>
            <button type="button" className={styles.close} aria-label="Close Insights Hub" title="Close" onClick={closeChat}>
              <span className="wm-close" aria-hidden="true" />
            </button>
          </header>

          <div className={styles.context} title={`${dashboardName} · ${tabName}`}>
            <span className="wm-insert-chart" aria-hidden="true" />
            <span>{dashboardName}</span>
            <span className={styles.tabContext}>{tabName}</span>
          </div>

          <div ref={logRef} className={styles.conversation} role="log" aria-label="Insights Hub conversation" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
            <div className={styles.welcome}>
              <span className={`wp-insightshub ${styles.welcomeIcon}`} aria-hidden="true" />
              <h3>Let’s explore your dashboard</h3>
              <p>Ask a question about your metrics, discover trends, or find a place to start.</p>
              {messages.length === 0 && (
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map(question => (
                    <button type="button" key={question} onClick={() => sendMessage(question)}>
                      {question}<span className="wm-arrow-forward" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {messages.map(message => (
              <div key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant}`}>
                <span className={styles.author}>{message.role === 'user' ? 'You' : 'Insights Hub · Sample response'}</span>
                <p>{message.text}</p>
              </div>
            ))}
            {replying && <div className={styles.replying} role="status">Preparing a sample reply<span aria-hidden="true">…</span></div>}
          </div>

          <form className={styles.composer} onSubmit={event => { event.preventDefault(); sendMessage(draft); }}>
            <div className={styles.inputRow}>
              <textarea
                ref={inputRef}
                aria-label="Ask Insights Hub a question"
                placeholder="Ask about this dashboard…"
                value={draft}
                rows={2}
                maxLength={2000}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    sendMessage(draft);
                  }
                }}
              />
              <button type="submit" className={styles.send} disabled={!draft.trim() || replying} aria-label="Send message" title="Send message">
                <span className="wm-send" aria-hidden="true" />
              </button>
            </div>
            <p className={styles.disclaimer}>Demo only · Replies use sample text, not dashboard data.</p>
          </form>
        </section>
      )}
    </div>
  );
}
