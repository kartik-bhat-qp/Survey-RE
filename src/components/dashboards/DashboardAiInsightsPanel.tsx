'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AiWidgetRenderer } from '@/components/dashboards/widgets/AiWidgetRenderer';
import type { AiWidgetConfig } from '@/data/mock-ai-widgets';
import {
  formatAiInsightDateTime,
  getAiInsightRefreshOption,
  getNextAiInsightRefreshAt,
  type AiInsightRefreshFrequency,
  type DashboardInsightItem,
  type DashboardWidgetInsightThread,
} from '@/data/mock-dashboard-ai-insights';
import styles from './DashboardAiInsightsPanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuTooltip })),
  { ssr: false }
);

interface DashboardAiInsightsPanelProps {
  widget: AiWidgetConfig;
  thread: DashboardWidgetInsightThread;
  refreshFrequency: AiInsightRefreshFrequency;
  dashboardRefreshAnchorAt: string;
  refreshing: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onToggleLike: (insightId: string) => void;
  onAddInsight: (text: string) => void;
  onAddComment: (insightId: string, text: string) => void;
}

function InsightComments({ item }: { item: DashboardInsightItem }) {
  if (item.comments.length === 0) return null;

  return (
    <div className={styles.commentList} aria-label={`${item.comments.length} comments`}>
      {item.comments.map((comment) => (
        <div key={comment.id} className={styles.comment}>
          <span className={styles.avatarSmall}>{comment.initials}</span>
          <div>
            <div className={styles.commentMeta}>
              <span>{comment.author}</span>
              <span>{comment.createdAtLabel}</span>
            </div>
            <p>{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardAiInsightsPanel({
  widget,
  thread,
  refreshFrequency,
  dashboardRefreshAnchorAt,
  refreshing,
  onClose,
  onRefresh,
  onToggleLike,
  onAddInsight,
  onAddComment,
}: DashboardAiInsightsPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDialogRef = useRef<HTMLElement>(null);
  const wasRefreshConfirmOpenRef = useRef(false);
  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
  const [pastRunsOpen, setPastRunsOpen] = useState(false);
  const [newInsight, setNewInsight] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const refreshLabel = getAiInsightRefreshOption(refreshFrequency).label;
  const nextRefreshAt = useMemo(
    () => getNextAiInsightRefreshAt(dashboardRefreshAnchorAt, refreshFrequency),
    [dashboardRefreshAnchorAt, refreshFrequency]
  );
  const refreshTooltip = `${refreshLabel} · Last refreshed ${formatAiInsightDateTime(
    thread.lastRefreshedAt
  )} · Next scheduled ${formatAiInsightDateTime(nextRefreshAt)}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (wasRefreshConfirmOpenRef.current && !refreshConfirmOpen) {
      const focusTarget = refreshButtonRef.current?.disabled
        ? closeButtonRef.current
        : refreshButtonRef.current;
      focusTarget?.focus();
    }
    wasRefreshConfirmOpenRef.current = refreshConfirmOpen;
  }, [refreshConfirmOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        if (refreshConfirmOpen) {
          setRefreshConfirmOpen(false);
          return;
        }
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusRoot = refreshConfirmOpen ? confirmDialogRef.current : dialogRef.current;
      if (!focusRoot) return;
      const focusable = Array.from(
        focusRoot.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, refreshConfirmOpen]);

  function submitInsight(): void {
    const text = newInsight.trim();
    if (!text) return;
    onAddInsight(text);
    setNewInsight('');
  }

  function submitComment(insightId: string): void {
    const text = commentDrafts[insightId]?.trim();
    if (!text) return;
    onAddComment(insightId, text);
    setCommentDrafts((current) => ({ ...current, [insightId]: '' }));
  }

  return (
    <>
      <div
        ref={dialogRef}
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-label={`${widget.title} insights`}
      >
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close insights"
          tabIndex={-1}
          onClick={onClose}
        />

        <section className={styles.widgetPreview} aria-label={`${widget.title} widget preview`}>
          <header className={styles.widgetHeader}>
            <h2>{widget.title}</h2>
            <span>Widget preview</span>
          </header>
          <div className={styles.widgetBody}>
            <AiWidgetRenderer
              widgetId={widget.id}
              chartInstanceId={`${widget.id}-insights-preview`}
              type={widget.type}
            />
          </div>
        </section>

        <aside className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitleRow}>
                <h2>Insights</h2>
                <span className={styles.insightCount}>{thread.items.length}</span>
              </div>
              <p>AI and user insights for this widget</p>
            </div>
            <div className={styles.headerActions}>
              <WuTooltip content={refreshTooltip} position="bottom">
                <button
                  ref={refreshButtonRef}
                  type="button"
                  className={styles.iconButton}
                  aria-label="Refresh AI insight"
                  title={refreshTooltip}
                  disabled={refreshing}
                  onClick={() => setRefreshConfirmOpen(true)}
                >
                  <span className={refreshing ? 'wm-autorenew' : 'wm-refresh'} aria-hidden="true" />
                </button>
              </WuTooltip>
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.iconButton}
                aria-label="Close insights"
                onClick={onClose}
              >
                <span className="wm-close" aria-hidden="true" />
              </button>
            </div>
          </header>

          {thread.lastRefreshError ? (
            <div className={styles.refreshError} role="alert">
              <span className="wm-error-outline" aria-hidden="true" />
              <div>
                <strong>Refresh failed</strong>
                <span>{thread.lastRefreshError}</span>
              </div>
              <button type="button" onClick={() => setRefreshConfirmOpen(true)}>
                Retry
              </button>
            </div>
          ) : null}

          <div className={styles.insightList}>
            {thread.items.map((item) => {
              const isAi = item.kind === 'ai';
              const commentDraft = commentDrafts[item.id] ?? '';
              return (
                <Fragment key={item.id}>
                  <article className={styles.insightCard}>
                    <div className={styles.insightMeta}>
                      <span className={isAi ? styles.aiAvatar : styles.avatar}>
                        {isAi ? <span className="wc-ai" aria-hidden="true" /> : item.initials}
                      </span>
                      <div>
                        <strong>{isAi ? 'AI insight' : item.author}</strong>
                        <span>{item.createdAtLabel}</span>
                      </div>
                      <span className={isAi ? styles.aiBadge : styles.userBadge}>
                        {isAi ? 'Current' : 'User insight'}
                      </span>
                    </div>

                    <p className={styles.insightText}>{item.text}</p>

                    <div className={styles.insightStats}>
                      <button
                        type="button"
                        className={item.likedByViewer ? styles.likeButtonActive : styles.likeButton}
                        aria-label={item.likedByViewer ? 'Unlike insight' : 'Like insight'}
                        aria-pressed={item.likedByViewer ?? false}
                        onClick={() => onToggleLike(item.id)}
                      >
                        <span className="wm-thumb-up" aria-hidden="true" /> {item.likes}
                      </button>
                      <span>{item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}</span>
                    </div>

                    <InsightComments item={item} />

                    <div className={styles.composer}>
                      <input
                        type="text"
                        value={commentDraft}
                        placeholder="Add a comment"
                        aria-label={`Comment on ${isAi ? 'AI insight' : `${item.author}'s insight`}`}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') submitComment(item.id);
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Post comment"
                        disabled={!commentDraft.trim()}
                        onClick={() => submitComment(item.id)}
                      >
                        <span className="wm-send" aria-hidden="true" />
                      </button>
                    </div>
                  </article>

                  {isAi && thread.pastAiRuns.length > 0 ? (
                    <section className={styles.pastRuns} aria-label="Past AI insight runs">
                      <button
                        type="button"
                        className={styles.pastRunsToggle}
                        aria-expanded={pastRunsOpen}
                        onClick={() => setPastRunsOpen((open) => !open)}
                      >
                        <span>Past runs</span>
                        <span className={styles.pastRunsCount}>{thread.pastAiRuns.length}</span>
                        <span
                          className={pastRunsOpen ? 'wm-expand-less' : 'wm-expand-more'}
                          aria-hidden="true"
                        />
                      </button>
                      {pastRunsOpen ? (
                        <div className={styles.pastRunList}>
                          {thread.pastAiRuns.map((run, runIndex) => (
                            <article key={run.id} className={styles.pastRunCard}>
                              <div className={styles.pastRunMeta}>
                                <div>
                                  <strong>AI insight</strong>
                                  <span>
                                    {run.refreshTrigger === 'dashboard'
                                      ? 'Dashboard refresh'
                                      : run.refreshTrigger === 'widget'
                                        ? 'Widget refresh'
                                        : 'Scheduled refresh'}
                                    {run.generatedAt
                                      ? ` · ${formatAiInsightDateTime(run.generatedAt)}`
                                      : ''}
                                  </span>
                                </div>
                                <span>Run {thread.pastAiRuns.length - runIndex}</span>
                              </div>
                              <p className={styles.insightText}>{run.text}</p>
                              <div className={styles.pastRunStats}>
                                <span><span className="wm-thumb-up" aria-hidden="true" /> {run.likes}</span>
                                <span>{run.comments.length} {run.comments.length === 1 ? 'comment' : 'comments'}</span>
                              </div>
                              <InsightComments item={run} />
                            </article>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </Fragment>
              );
            })}
          </div>

          <footer className={styles.footer}>
            <input
              type="text"
              value={newInsight}
              placeholder="Add your insight"
              aria-label="Add your insight"
              onChange={(event) => setNewInsight(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitInsight();
              }}
            />
            <WuButton
              type="button"
              size="sm"
              className={styles.addInsightButton}
              disabled={!newInsight.trim()}
              onClick={submitInsight}
            >
              Add insight
            </WuButton>
          </footer>
        </aside>

        {refreshConfirmOpen ? (
          <div className={styles.confirmScrim}>
            <section
              ref={confirmDialogRef}
              className={styles.confirmDialog}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="refresh-insight-confirm-title"
              aria-describedby="refresh-insight-confirm-description"
            >
              <header>
                <h2 id="refresh-insight-confirm-title">Refresh AI insight</h2>
                <button
                  type="button"
                  aria-label="Close refresh confirmation"
                  onClick={() => setRefreshConfirmOpen(false)}
                >
                  <span className="wm-close" aria-hidden="true" />
                </button>
              </header>
              <p id="refresh-insight-confirm-description">
                A new AI insight will be generated using the latest widget data. The current
                AI insight, its comments, and its likes will move to Past runs. User-submitted
                insights will remain unchanged.
              </p>
              <footer>
                <button
                  type="button"
                  className={styles.confirmCancelButton}
                  onClick={() => setRefreshConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmActionButton}
                  autoFocus
                  onClick={() => {
                    setRefreshConfirmOpen(false);
                    onRefresh();
                  }}
                >
                  Refresh insight
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
