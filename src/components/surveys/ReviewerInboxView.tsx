'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { formatSmartDate } from '@/data/mock-utils';
import { getCurrentSurveyReviewer } from '@/data/mock-survey-approval';
import {
  getReviewSurveyStartPath,
  listReviewerInboxEmails,
  markReviewerEmailRead,
  subscribeReviewerInbox,
  type ReviewerInboxEmail,
} from '@/data/mock-survey-reviewer-inbox';
import styles from './ReviewerInboxView.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface ReviewerInboxViewProps {
  recipientEmail: string;
}

export function ReviewerInboxView({ recipientEmail }: ReviewerInboxViewProps) {
  const router = useRouter();
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  const [emails, setEmails] = useState<ReviewerInboxEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setEmails(listReviewerInboxEmails(normalizedEmail));
  }, [normalizedEmail]);

  useEffect(() => {
    refresh();
    return subscribeReviewerInbox(normalizedEmail, refresh);
  }, [normalizedEmail, refresh]);

  useEffect(() => {
    if (emails.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !emails.some((email) => email.id === selectedId)) {
      setSelectedId(emails[0].id);
    }
  }, [emails, selectedId]);

  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedId) ?? null,
    [emails, selectedId]
  );

  const unreadCount = emails.filter((email) => !email.read).length;

  function handleSelectEmail(email: ReviewerInboxEmail): void {
    setSelectedId(email.id);
    if (!email.read) {
      markReviewerEmailRead(normalizedEmail, email.id);
      refresh();
    }
  }

  function handleReviewSurvey(): void {
    if (!selectedEmail) return;
    router.push(getReviewSurveyStartPath(selectedEmail.surveyId, normalizedEmail));
  }

  return (
    <div className={styles.root}>
      <div className={styles.banner}>
        <span className={styles.bannerLabel}>Reviewer email simulation</span>
        <span className={styles.bannerHint}>
          Approval requests arrive here instead of a real inbox in this prototype.
        </span>
      </div>

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Mailbox folders">
          <div className={styles.account}>
            <p className={styles.accountLabel}>Inbox for</p>
            <p className={styles.accountEmail}>{normalizedEmail}</p>
          </div>
          <button type="button" className={styles.folder} aria-current="page">
            <span>Inbox</span>
            <span className={styles.folderCount}>{unreadCount || emails.length}</span>
          </button>
        </aside>

        <div className={styles.main}>
          <section className={styles.listPane} aria-label="Email list">
            <h1 className={styles.listHeader}>Inbox</h1>
            {emails.length === 0 ? (
              <p className={styles.emptyInbox}>
                No review requests yet. Send a survey for review from the Approval tab to see an
                email here.
              </p>
            ) : (
              <ul className={styles.list}>
                {emails.map((email) => {
                  const active = email.id === selectedId;
                  return (
                    <li key={email.id}>
                      <button
                        type="button"
                        className={`${styles.listItem} ${active ? styles.listItemActive : ''} ${!email.read ? styles.listItemUnread : ''}`}
                        onClick={() => handleSelectEmail(email)}
                      >
                        <div className={styles.listRow}>
                          <span className={styles.listSender}>
                            {!email.read ? (
                              <span className={styles.unreadDot} aria-hidden />
                            ) : null}
                            {email.senderName}
                          </span>
                          <span className={styles.listTime}>{formatSmartDate(email.createdAt)}</span>
                        </div>
                        <p className={styles.listSubject}>{email.subject}</p>
                        <p className={styles.listPreview}>{email.preview}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.detailPane} aria-label="Email message">
            {!selectedEmail ? (
              <div className={styles.detailEmpty}>Select an email to read it</div>
            ) : (
              <>
                <header className={styles.detailHeader}>
                  <h2 className={styles.detailSubject}>{selectedEmail.subject}</h2>
                  <dl className={styles.metaList}>
                    <div>
                      <dt>From:</dt>
                      <dd>
                        {selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;
                      </dd>
                    </div>
                    <div>
                      <dt>To:</dt>
                      <dd>{selectedEmail.recipientEmail}</dd>
                    </div>
                    <div>
                      <dt>Date:</dt>
                      <dd>{formatSmartDate(selectedEmail.createdAt)}</dd>
                    </div>
                  </dl>
                </header>

                <div className={styles.detailBody}>
                  <p className={styles.bodyText}>{selectedEmail.body}</p>
                  <div className={styles.ctaCard}>
                    <h3 className={styles.ctaTitle}>Ready to review?</h3>
                    <p className={styles.ctaCopy}>
                      Open the survey review page to approve or reject{' '}
                      <strong>{selectedEmail.surveyName}</strong>. If you are not already a
                      QuestionPro user, you will be asked to create a free account first.
                    </p>
                    <WuButton onClick={handleReviewSurvey}>Review Survey</WuButton>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export function getDefaultReviewerInboxEmail(): string {
  return getCurrentSurveyReviewer().email;
}
