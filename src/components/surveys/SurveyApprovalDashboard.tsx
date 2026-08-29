'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IAccordionItemType } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatSmartDate } from '@/data/mock-utils';
import { isValidEmailAddress, normalizeEmailAddress } from '@/data/mock-survey-distribute';
import {
  DEFAULT_SURVEY_APPROVAL_STATE,
  SURVEY_APPROVAL_OWNER_NAME,
  SURVEY_REVIEWERS,
  createApprovalActivity,
  getPrototypeSurveyApprovalDueDate,
  getSurveyApprovalPendingStatusCopy,
  getSurveyApprovalPendingStatusLabel,
  getSurveyApprovalReminderCooldown,
  getSurveyReviewerSelectOptions,
  isSurveyApprovalRequestOverdue,
  readSurveyApprovalState,
  resolveSurveyReviewer,
  subscribeSurveyApprovalState,
  writeSurveyApprovalState,
  type SurveyApprovalActivity,
  type SurveyApprovalActivityType,
  type SurveyApprovalState,
  type SurveyReviewer,
} from '@/data/mock-survey-approval';
import { deliverReviewRequestEmail } from '@/data/mock-survey-reviewer-inbox';
import styles from './SurveyApprovalDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuAccordion = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAccordion })),
  { ssr: false }
);

interface SurveyApprovalDashboardProps {
  surveyId: number;
  surveyName: string;
  /** Tighter layout when embedded in the Approvals modal. */
  compact?: boolean;
}

function statusClass(
  status: SurveyApprovalState['status'],
  overdue: boolean
): string {
  if (status === 'pending' && overdue) return styles.statusOverdue;
  if (status === 'pending') return styles.statusPending;
  if (status === 'approved') return styles.statusApproved;
  if (status === 'rejected' || status === 'changes-requested') return styles.statusRejected;
  return styles.statusIdle;
}

function getReviewerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function getReviewerMetaLine(request: { submittedAt: string }): string {
  return `sent ${formatSmartDate(request.submittedAt)}`;
}

function activityLabel(type: SurveyApprovalActivityType): string {
  switch (type) {
    case 'submitted':
      return 'Sent for review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'changes-requested':
      return 'Changes requested';
    case 'reminder':
      return 'Reminder sent';
    default:
      return 'Request cancelled';
  }
}

function activityTargetLabel(item: SurveyApprovalActivity): string | null {
  if (item.type !== 'submitted' && item.type !== 'reminder') return null;
  if (item.targetLabel?.trim()) return item.targetLabel.trim();
  const match = item.message.match(/^Sent to (\S+?)(?:\s+for review\.?|\.|$)/i);
  return match?.[1] ?? null;
}

function activityDisplayMessage(item: SurveyApprovalActivity): string {
  const trimmed = item.message.trim();
  if (!trimmed) return '';
  if (item.type !== 'submitted') return trimmed;
  return trimmed
    .replace(/^Sent to \S+\s+for review\.?\s*/i, '')
    .replace(/^Sent to \S+\.\s*/i, '')
    .trim();
}

function activityDotClass(type: SurveyApprovalActivityType): string {
  if (type === 'submitted') return styles.activityDotSubmitted;
  if (type === 'approved') return styles.activityDotApproved;
  if (type === 'rejected' || type === 'changes-requested') return styles.activityDotRejected;
  if (type === 'reminder') return styles.activityDotIdle;
  return styles.activityDotIdle;
}

function canSendForReview(state: SurveyApprovalState): boolean {
  return (
    state.status === 'not-submitted' ||
    state.status === 'changes-requested' ||
    state.status === 'rejected' ||
    (state.status === 'approved' && !state.published)
  );
}

export function SurveyApprovalDashboard({
  surveyId,
  surveyName,
  compact = false,
}: SurveyApprovalDashboardProps) {
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<SurveyApprovalState>(DEFAULT_SURVEY_APPROVAL_STATE);
  const [composeOpen, setComposeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewerMode, setReviewerMode] = useState<'existing' | 'email'>('existing');
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const reviewerOptions = useMemo(() => getSurveyReviewerSelectOptions(), []);
  const selectedOption =
    reviewerOptions.find((option) => option.id === selectedReviewerId) ?? null;
  const canSubmitCompose =
    reviewerMode === 'existing'
      ? Boolean(selectedReviewerId)
      : isValidEmailAddress(normalizeEmailAddress(email));

  useEffect(() => {
    setState(readSurveyApprovalState(surveyId));
    return subscribeSurveyApprovalState(surveyId, setState);
  }, [surveyId]);

  useEffect(() => {
    if (state.status === 'pending') {
      setComposeOpen(false);
    }
  }, [state.status]);

  function resetComposeInputs(): void {
    setReviewerMode('existing');
    setSelectedReviewerId(null);
    setEmail('');
    setNotes('');
  }

  function openCompose(): void {
    resetComposeInputs();
    setComposeOpen(true);
  }

  function closeCompose(): void {
    setComposeOpen(false);
    resetComposeInputs();
  }

  function switchReviewerMode(mode: 'existing' | 'email'): void {
    if (mode === reviewerMode) return;
    if (mode === 'existing') {
      setEmail('');
    } else {
      setSelectedReviewerId(null);
    }
    setReviewerMode(mode);
  }

  function patchState(next: SurveyApprovalState): void {
    writeSurveyApprovalState(surveyId, next);
  }

  function handleSelectReviewer(item: { id: string } | null): void {
    setSelectedReviewerId(item?.id ?? null);
  }

  function handleSendForReview(reviewer: SurveyReviewer, ownerNotes: string): void {
    const request = {
      id: `req-${Date.now()}`,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
      notes: ownerNotes,
      submittedAt: new Date().toISOString(),
      submittedBy: SURVEY_APPROVAL_OWNER_NAME,
      // Prototype: seed an overdue due date so Remind / overdue UX is demonstrable.
      dueDate: getPrototypeSurveyApprovalDueDate(),
      lastReminderSentAt: null as string | null,
    };
    patchState({
      status: 'pending',
      published: false,
      currentRequest: request,
      reviewerFeedback: '',
      activity: [
        createApprovalActivity(
          'submitted',
          SURVEY_APPROVAL_OWNER_NAME,
          ownerNotes,
          reviewer.email
        ),
      ],
    });
    deliverReviewRequestEmail({
      surveyId,
      surveyName,
      requestId: request.id,
      recipientEmail: reviewer.email,
      requesterName: SURVEY_APPROVAL_OWNER_NAME,
      ownerNotes,
    });
    closeCompose();
    showToast({
      message: `Review request emailed to ${reviewer.email}`,
      variant: 'success',
    });
  }

  function handleSubmitCompose(): void {
    if (reviewerMode === 'existing') {
      const reviewer = SURVEY_REVIEWERS.find((entry) => entry.id === selectedReviewerId);
      if (!reviewer) {
        showToast({ message: 'Select a reviewer', variant: 'error' });
        return;
      }
      handleSendForReview(reviewer, notes.trim());
      return;
    }

    const normalized = normalizeEmailAddress(email);
    if (!isValidEmailAddress(normalized)) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      return;
    }
    handleSendForReview(resolveSurveyReviewer(normalized), notes.trim());
  }

  function handleCancelRequest(): void {
    const reviewerName = state.currentRequest?.reviewerName ?? 'the reviewer';
    patchState({
      status: 'not-submitted',
      published: false,
      currentRequest: null,
      reviewerFeedback: '',
      activity: [
        createApprovalActivity(
          'cancelled',
          SURVEY_APPROVAL_OWNER_NAME,
          `Cancelled the review request to ${reviewerName}.`
        ),
        ...state.activity,
      ],
    });
    showToast({ message: 'Review request cancelled', variant: 'success' });
  }

  function handleRemindReviewer(): void {
    const request = state.currentRequest;
    if (!request || !isSurveyApprovalRequestOverdue(request)) return;

    const cooldown = getSurveyApprovalReminderCooldown(request);
    if (cooldown.blocked) {
      showToast({
        message: cooldown.message ?? 'Reminder already sent recently',
        variant: 'info',
      });
      return;
    }

    const remindedAt = new Date().toISOString();
    deliverReviewRequestEmail({
      surveyId,
      surveyName,
      requestId: request.id,
      recipientEmail: request.reviewerEmail || request.reviewerName,
      requesterName: SURVEY_APPROVAL_OWNER_NAME,
      ownerNotes: request.notes,
    });
    patchState({
      ...state,
      currentRequest: {
        ...request,
        lastReminderSentAt: remindedAt,
      },
      activity: [
        createApprovalActivity(
          'reminder',
          SURVEY_APPROVAL_OWNER_NAME,
          `Sent a reminder to ${request.reviewerName}.`,
          request.reviewerEmail || request.reviewerName
        ),
        ...state.activity,
      ],
    });
    showToast({
      message: `Reminder emailed to ${request.reviewerEmail || request.reviewerName}`,
      variant: 'success',
    });
  }

  const showReviewerComments =
    Boolean(state.reviewerFeedback) &&
    (state.status === 'rejected' ||
      state.status === 'changes-requested' ||
      state.status === 'approved');
  const isIdle = state.status === 'not-submitted';
  const sendLabel =
    state.status === 'changes-requested' || state.status === 'rejected'
      ? 'Resend for review'
      : 'Send for review';
  const showCompose = composeOpen && canSendForReview(state);
  const isOverdue =
    state.status === 'pending' && isSurveyApprovalRequestOverdue(state.currentRequest);
  const reminderCooldown = getSurveyApprovalReminderCooldown(state.currentRequest);
  const showRemind = isOverdue;

  const activityAccordionItems: IAccordionItemType[] = useMemo(() => {
    const details =
      state.activity.length === 0 ? (
        <p className={styles.emptyCopy}>No review activity yet.</p>
      ) : (
        <ol className={styles.activityList}>
          {state.activity.map((item) => {
            const target = activityTargetLabel(item);
            const message = activityDisplayMessage(item);
            return (
              <li key={item.id} className={styles.activityItem}>
                <span
                  className={`${styles.activityDot} ${activityDotClass(item.type)}`}
                  aria-hidden
                />
                <div className={styles.activityBody}>
                  <div className={styles.activityHeading}>
                    <span className={styles.activityType}>{activityLabel(item.type)}</span>
                    {target ? (
                      <>
                        <span className={styles.activityHeadingSep} aria-hidden>
                          ·
                        </span>
                        <span className={styles.activityTarget}>{target}</span>
                      </>
                    ) : null}
                  </div>
                  <span className={styles.activityMeta}>
                    {item.actorName} · {formatSmartDate(item.createdAt)}
                  </span>
                  {message ? <span className={styles.activityMessage}>{message}</span> : null}
                </div>
              </li>
            );
          })}
        </ol>
      );

    return [
      {
        value: 'activity',
        Summary: <span className={styles.sectionTitle}>Activity</span>,
        Details: details,
      },
    ];
  }, [state.activity]);

  return (
    <div className={`${styles.workspace} ${compact ? styles.workspaceCompact : ''}`}>
      <div className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
        <p className={styles.subtitle}>
          Send {surveyName} for review. The reviewer receives an email notification and publishes
          the survey when they approve it, or requests changes with comments.
        </p>

        <div className={styles.tabBody}>
          {isIdle || showCompose ? (
            <section className={styles.statusCard} aria-label="Review status">
              {showCompose ? (
                <>
                  <div className={styles.emptyStateCopy}>
                    <p className={styles.emptyStateTitle}>Send for review</p>
                    <p className={styles.statusCopy}>
                      Publish stays off until your reviewer approves.
                    </p>
                  </div>
                  <div className={styles.composeFields}>
                    <div
                      className={styles.composeSelectRow}
                      role="tablist"
                      aria-label="Reviewer source"
                    >
                      <WuButton
                        variant={reviewerMode === 'existing' ? 'primary' : 'secondary'}
                        onClick={() => switchReviewerMode('existing')}
                        aria-selected={reviewerMode === 'existing'}
                      >
                        Existing reviewer
                      </WuButton>
                      <WuButton
                        variant={reviewerMode === 'email' ? 'primary' : 'secondary'}
                        onClick={() => switchReviewerMode('email')}
                        aria-selected={reviewerMode === 'email'}
                      >
                        New by email
                      </WuButton>
                    </div>

                    {reviewerMode === 'existing' ? (
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Reviewer</span>
                        <WuSelect
                          data={reviewerOptions}
                          accessorKey={{ value: 'id', label: 'label' }}
                          value={selectedOption}
                          onSelect={(item) =>
                            handleSelectReviewer(item as { id: string } | null)
                          }
                          variant="outlined"
                        />
                      </label>
                    ) : (
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Email address</span>
                        <WuInput
                          variant="outlined"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </label>
                    )}

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Comments</span>
                      <textarea
                        className={styles.textarea}
                        rows={3}
                        placeholder="Add context for the reviewer, such as what changed or what to look at first."
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </label>

                    <div className={styles.composeActions}>
                      <WuButton variant="secondary" onClick={closeCompose}>
                        Cancel
                      </WuButton>
                      <WuButton
                        variant="primary"
                        disabled={!canSubmitCompose}
                        onClick={handleSubmitCompose}
                      >
                        Send
                      </WuButton>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyStateRow}>
                  <div className={styles.emptyStateCopy}>
                    <p className={styles.emptyStateTitle}>No review requested yet</p>
                    <p className={styles.statusCopy}>
                      Publish stays off until a reviewer approves this survey.
                    </p>
                  </div>
                  <WuButton onClick={openCompose}>Send for review</WuButton>
                </div>
              )}
            </section>
          ) : state.status === 'pending' && state.currentRequest ? (
            <section className={styles.statusCard} aria-label="Review status">
              <div className={styles.reviewStatusHeader}>
                <h2 className={styles.sectionTitle}>Review status</h2>
                <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                  {getSurveyApprovalPendingStatusLabel(state.status, state.currentRequest)}
                </span>
              </div>
              <div className={styles.reviewerRow}>
                <div className={styles.reviewerIdentity}>
                  <span className={styles.reviewerAvatar} aria-hidden>
                    {getReviewerInitials(state.currentRequest.reviewerName)}
                  </span>
                  <div className={styles.reviewerCopy}>
                    <p className={styles.reviewerName}>{state.currentRequest.reviewerName}</p>
                    <p className={styles.reviewerMeta}>
                      {getReviewerMetaLine(state.currentRequest)}
                    </p>
                  </div>
                </div>
                <div className={styles.reviewerActions}>
                  {showRemind ? (
                    <WuButton
                      variant="link"
                      disabled={reminderCooldown.blocked}
                      onClick={handleRemindReviewer}
                    >
                      Remind
                    </WuButton>
                  ) : null}
                  <WuButton variant="link" onClick={() => setCancelOpen(true)}>
                    Cancel
                  </WuButton>
                </div>
              </div>
            </section>
          ) : (
            <section className={styles.statusCard} aria-label="Review status">
              <div className={styles.reviewStatusHeader}>
                <h2 className={styles.sectionTitle}>Review status</h2>
                <span
                  className={`${styles.statusBadge} ${statusClass(state.status, false)}`}
                >
                  {getSurveyApprovalPendingStatusLabel(state.status, state.currentRequest)}
                </span>
              </div>
              {canSendForReview(state) ? (
                <div className={styles.statusActions}>
                  <WuButton onClick={openCompose}>{sendLabel}</WuButton>
                </div>
              ) : null}
              <p className={styles.statusCopy}>
                {getSurveyApprovalPendingStatusCopy(
                  state.status,
                  state.published,
                  state.currentRequest
                )}
              </p>
              {showReviewerComments ? (
                <div className={styles.feedbackBox}>
                  <p className={styles.feedbackLabel}>Reviewer comments</p>
                  <p className={styles.feedbackText}>{state.reviewerFeedback}</p>
                </div>
              ) : null}
            </section>
          )}

          {!isIdle && !showCompose && state.status !== 'pending' && state.currentRequest ? (
            <section className={styles.detailCard} aria-label="Current request">
              <h2 className={styles.sectionTitle}>Current request</h2>
              <dl className={styles.metaList}>
                <div>
                  <dt>Reviewer</dt>
                  <dd>{state.currentRequest.reviewerName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{state.currentRequest.reviewerEmail || state.currentRequest.reviewerName}</dd>
                </div>
                <div>
                  <dt>Sent by</dt>
                  <dd>{state.currentRequest.submittedBy}</dd>
                </div>
                <div>
                  <dt>Sent</dt>
                  <dd>{formatSmartDate(state.currentRequest.submittedAt)}</dd>
                </div>
              </dl>
              {state.currentRequest.notes ? (
                <p className={styles.notes}>{state.currentRequest.notes}</p>
              ) : null}
            </section>
          ) : null}

          <div className={styles.activityAccordion}>
            <WuAccordion type="single" defaultValue="activity" items={activityAccordionItems} />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel review request?"
        description="The reviewer will no longer see this survey in their review queue."
        confirmLabel="Cancel request"
        variant="critical"
        onConfirm={handleCancelRequest}
      />
    </div>
  );
}
