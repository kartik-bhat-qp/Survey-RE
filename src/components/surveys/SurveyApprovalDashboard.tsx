'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SendSurveyForReviewModal } from '@/components/surveys/SendSurveyForReviewModal';
import { formatSmartDate } from '@/data/mock-utils';
import {
  DEFAULT_SURVEY_APPROVAL_STATE,
  SURVEY_APPROVAL_OWNER_NAME,
  createApprovalActivity,
  getSurveyApprovalStatusCopy,
  getSurveyApprovalStatusLabel,
  readSurveyApprovalState,
  subscribeSurveyApprovalState,
  writeSurveyApprovalState,
  type SurveyApprovalActivityType,
  type SurveyApprovalState,
  type SurveyReviewer,
} from '@/data/mock-survey-approval';
import {
  deliverReviewRequestEmail,
  getReviewerInboxPagePath,
  openReviewerInbox,
} from '@/data/mock-survey-reviewer-inbox';
import styles from './SurveyApprovalDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface SurveyApprovalDashboardProps {
  surveyId: number;
  surveyName: string;
}

function statusClass(status: SurveyApprovalState['status']): string {
  if (status === 'pending') return styles.statusPending;
  if (status === 'approved') return styles.statusApproved;
  if (status === 'rejected' || status === 'changes-requested') return styles.statusRejected;
  return styles.statusIdle;
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
    default:
      return 'Request cancelled';
  }
}

function canSendForReview(state: SurveyApprovalState): boolean {
  return (
    state.status === 'not-submitted' ||
    state.status === 'changes-requested' ||
    state.status === 'rejected' ||
    (state.status === 'approved' && !state.published)
  );
}

export function SurveyApprovalDashboard({ surveyId, surveyName }: SurveyApprovalDashboardProps) {
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<SurveyApprovalState>(DEFAULT_SURVEY_APPROVAL_STATE);
  const [sendOpen, setSendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    setState(readSurveyApprovalState(surveyId));
    return subscribeSurveyApprovalState(surveyId, setState);
  }, [surveyId]);

  function patchState(next: SurveyApprovalState): void {
    writeSurveyApprovalState(surveyId, next);
  }

  function handleSendForReview(reviewer: SurveyReviewer, notes: string): void {
    const request = {
      id: `req-${Date.now()}`,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
      notes,
      submittedAt: new Date().toISOString(),
      submittedBy: SURVEY_APPROVAL_OWNER_NAME,
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
          notes
            ? `Sent to ${reviewer.email}. ${notes}`
            : `Sent to ${reviewer.email} for review.`
        ),
        ...state.activity,
      ],
    });
    deliverReviewRequestEmail({
      surveyId,
      surveyName,
      requestId: request.id,
      recipientEmail: reviewer.email,
      requesterName: SURVEY_APPROVAL_OWNER_NAME,
      ownerNotes: notes,
    });
    const inboxWindow = openReviewerInbox(reviewer.email);
    showToast({
      message: inboxWindow
        ? `Review request emailed to ${reviewer.email}. Their inbox opened in a new tab.`
        : `Review request emailed to ${reviewer.email}. Open ${getReviewerInboxPagePath(reviewer.email)} if the tab was blocked.`,
      variant: 'success',
    });
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

  const showReviewerComments =
    Boolean(state.reviewerFeedback) &&
    (state.status === 'rejected' ||
      state.status === 'changes-requested' ||
      state.status === 'approved');

  return (
    <div className={styles.workspace}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>Approval</h1>
          <p className={styles.subtitle}>
            Send {surveyName} for review. The reviewer receives an email notification and publishes
            the survey when they approve it, or rejects it with comments.
          </p>
        </header>

        <div className={styles.tabBody}>
          <section className={styles.statusCard} aria-label="Review status">
            <div className={styles.statusHeader}>
              <span className={`${styles.statusBadge} ${statusClass(state.status)}`}>
                {getSurveyApprovalStatusLabel(state.status)}
              </span>
              {canSendForReview(state) ? (
                <WuButton onClick={() => setSendOpen(true)}>Send for review</WuButton>
              ) : null}
              {state.status === 'pending' ? (
                <div className={styles.statusActions}>
                  <WuButton
                    variant="secondary"
                    onClick={() => {
                      const reviewerEmail =
                        state.currentRequest?.reviewerEmail ?? state.currentRequest?.reviewerName;
                      if (!reviewerEmail) return;
                      const inboxWindow = openReviewerInbox(reviewerEmail);
                      showToast({
                        message: inboxWindow
                          ? 'Reviewer inbox opened'
                          : `Open ${getReviewerInboxPagePath(reviewerEmail)} if the page was blocked`,
                        variant: inboxWindow ? 'success' : 'info',
                      });
                    }}
                  >
                    Open reviewer inbox
                  </WuButton>
                  <WuButton
                    variant="secondary"
                    onClick={() =>
                      showToast({
                        message: `Reminder sent to ${state.currentRequest?.reviewerEmail ?? state.currentRequest?.reviewerName ?? 'reviewer'}`,
                        variant: 'success',
                      })
                    }
                  >
                    Send reminder
                  </WuButton>
                  <WuButton variant="secondary" onClick={() => setCancelOpen(true)}>
                    Cancel request
                  </WuButton>
                </div>
              ) : null}
            </div>
            <p className={styles.statusCopy}>
              {getSurveyApprovalStatusCopy(state.status, state.published)}
            </p>
            {showReviewerComments ? (
              <div className={styles.feedbackBox}>
                <p className={styles.feedbackLabel}>Reviewer comments</p>
                <p className={styles.feedbackText}>{state.reviewerFeedback}</p>
              </div>
            ) : null}
          </section>

          {state.currentRequest ? (
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

          <section className={styles.detailCard} aria-label="Activity">
            <h2 className={styles.sectionTitle}>Activity</h2>
            {state.activity.length === 0 ? (
              <p className={styles.emptyCopy}>No review activity yet.</p>
            ) : (
              <ol className={styles.activityList}>
                {state.activity.map((item) => (
                  <li key={item.id} className={styles.activityItem}>
                    <span className={styles.activityType}>{activityLabel(item.type)}</span>
                    <span className={styles.activityMeta}>
                      {item.actorName} · {formatSmartDate(item.createdAt)}
                    </span>
                    <span className={styles.activityMessage}>{item.message}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <SendSurveyForReviewModal
        open={sendOpen}
        onOpenChange={setSendOpen}
        onSubmit={handleSendForReview}
      />
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
