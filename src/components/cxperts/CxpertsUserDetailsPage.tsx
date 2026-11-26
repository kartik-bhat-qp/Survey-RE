'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { usePhishingHoldState } from '@/hooks/usePhishingPublishHold';
import {
  escalateCaseToHigh,
  releaseHeldSurvey,
  setVerificationChannelStatus,
  suspendAccount,
  type VerificationChannelStatus,
} from '@/data/mock-phishing-publish-hold';
import styles from './CxpertsUserDetailsPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const STATUS_OPTIONS: VerificationChannelStatus[] = ['Verified', 'Unverified', 'Blocked'];

function StatusPill({ status }: { status: VerificationChannelStatus }) {
  const tone =
    status === 'Verified'
      ? styles.pillVerified
      : status === 'Blocked'
        ? styles.pillBlocked
        : styles.pillUnverified;
  return (
    <span className={`${styles.pill} ${tone}`}>
      {status === 'Verified' ? (
        <span className="wm-check" aria-hidden />
      ) : status === 'Blocked' ? (
        <span className="wm-block" aria-hidden />
      ) : null}
      {status}
    </span>
  );
}

function EditVerificationModal({
  open,
  channel,
  current,
  onClose,
  onSave,
}: {
  open: boolean;
  channel: 'email' | 'phone' | null;
  current: VerificationChannelStatus;
  onClose: () => void;
  onSave: (status: VerificationChannelStatus, note: string) => void;
}) {
  const wick = useWickUILib();
  const [status, setStatus] = useState<VerificationChannelStatus>(current);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setStatus(current);
    setNote('');
  }, [open, current, channel]);

  if (!open || !wick || !channel) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton: ModalButton } = wick;
  const label =
    channel === 'email' ? 'Email account verification status' : 'Phone number verification status';

  return (
    <WuModal
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      variant="action"
      size="sm"
    >
      <WuModalHeader>Edit verification status</WuModalHeader>
      <WuModalContent>
        <p className={styles.modalLabel}>{label}</p>
        <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
          {STATUS_OPTIONS.map((option) => (
            <label key={option} className={styles.radioRow}>
              <input
                type="radio"
                name="verification-status"
                checked={status === option}
                onChange={() => setStatus(option)}
              />
              <StatusPill status={option} />
            </label>
          ))}
        </div>
        <label className={styles.noteLabel} htmlFor="cx-note">
          Audit note (optional)
        </label>
        <textarea
          id="cx-note"
          className={styles.note}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Phishing hold case #…"
        />
      </WuModalContent>
      <WuModalFooter>
        <ModalButton variant="secondary" onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          color="primary"
          onClick={() => {
            onSave(status, note);
            onClose();
          }}
        >
          Save
        </ModalButton>
      </WuModalFooter>
    </WuModal>
  );
}

export function CxpertsUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const state = usePhishingHoldState();
  const userId = String(params.id ?? 'demo');

  const [editChannel, setEditChannel] = useState<'email' | 'phone' | null>(null);

  const activeCases = useMemo(
    () =>
      state.cases.filter(
        (c) =>
          c.holdStatus === 'held' ||
          c.holdStatus === 'verifying' ||
          c.holdStatus === 'suspended'
      ),
    [state.cases]
  );

  const editCurrent =
    editChannel === 'email'
      ? state.verification.emailStatus
      : editChannel === 'phone'
        ? state.verification.phoneStatus
        : 'Verified';

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <strong>CXpertsUX</strong>
          <span className={styles.meta}>Org ID 6144112</span>
        </div>
        <div className={styles.topActions}>
          <WuButton variant="secondary" onClick={() => router.push('/surveys')}>
            Back to Surveys
          </WuButton>
          <WuButton
            variant="secondary"
            onClick={() => router.push('/account/verification')}
          >
            Author Verification
          </WuButton>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.sideNav} aria-label="CXperts navigation">
          <p className={styles.navGroup}>User</p>
          <a className={`${styles.navItem} ${styles.navActive}`} href="#">
            User details
          </a>
          <a className={styles.navItem} href="#">
            Logs
          </a>
          <a className={styles.navItem} href="#">
            Product details
          </a>
          <p className={styles.navGroup}>Organization</p>
          <a className={styles.navItem} href="#">
            Overview
          </a>
          <a className={styles.navItem} href="#">
            Tickets
          </a>
          <a className={styles.navItem} href="#">
            Security
          </a>
        </nav>

        <main className={styles.main}>
          <h1 className={styles.pageTitle}>User details</h1>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Account information</h2>
              <dl className={styles.dl}>
                <div>
                  <dt>User ID</dt>
                  <dd>{userId === 'demo' ? '6366033' : userId}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>Kartik Bhat</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>kartik.bhat@questionpro.com</dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>QuestionPro Essentials — Trial</dd>
                </div>
                <div>
                  <dt>Publish / send</dt>
                  <dd>
                    {state.account.suspended
                      ? 'Suspended'
                      : state.account.publishSendPaused
                        ? 'Paused (High)'
                        : 'Active'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Abuse report</h2>
              <p className={styles.abuseCount}>
                User abuse count <strong>{state.verification.abuseCount}</strong>
              </p>
              {state.verification.lastNote ? (
                <p className={styles.notePreview}>{state.verification.lastNote}</p>
              ) : null}
            </section>
          </div>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>User settings</h2>
            <h3 className={styles.subTitle}>Verification status</h3>

            <div className={styles.verifyRow}>
              <span className={`wm-email ${styles.verifyIcon}`} aria-hidden />
              <span className={styles.verifyLabel}>Email account verification status</span>
              <StatusPill status={state.verification.emailStatus} />
              <button
                type="button"
                className={styles.editBtn}
                aria-label="Edit email verification status"
                onClick={() => setEditChannel('email')}
              >
                <span className="wm-edit" aria-hidden />
              </button>
            </div>

            <div className={styles.verifyRow}>
              <span className={`wm-phone ${styles.verifyIcon}`} aria-hidden />
              <span className={styles.verifyLabel}>Phone number verification status</span>
              <StatusPill status={state.verification.phoneStatus} />
              <button
                type="button"
                className={styles.editBtn}
                aria-label="Edit phone verification status"
                onClick={() => setEditChannel('phone')}
              >
                <span className="wm-edit" aria-hidden />
              </button>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Held surveys</h2>
            {activeCases.length === 0 ? (
              <p className={styles.empty}>No active hold cases for this account.</p>
            ) : (
              <ul className={styles.caseList}>
                {activeCases.map((item) => (
                  <li key={item.caseId} className={styles.caseItem}>
                    <div>
                      <p className={styles.caseTitle}>
                        {item.surveyName}{' '}
                        <span className={styles.tier}>{item.riskTier}</span>
                      </p>
                      <p className={styles.caseMeta}>
                        {item.caseId} · {item.flaggedQuestionLabel}
                      </p>
                    </div>
                    <div className={styles.caseActions}>
                      <WuButton
                        color="primary"
                        onClick={() => {
                          releaseHeldSurvey(item.surveyId);
                          showToast({
                            message: `Released ${item.surveyName} — auto-publish path`,
                            variant: 'success',
                          });
                        }}
                      >
                        Release
                      </WuButton>
                      <WuButton
                        variant="secondary"
                        onClick={() => {
                          escalateCaseToHigh(item.surveyId);
                          showToast({
                            message: 'Escalated to High — phone verification Blocked',
                            variant: 'info',
                          });
                        }}
                      >
                        Escalate High
                      </WuButton>
                      <WuButton
                        color="error"
                        onClick={() => {
                          suspendAccount();
                          showToast({
                            message: 'Account suspended',
                            variant: 'error',
                          });
                          router.push('/account-suspended');
                        }}
                      >
                        Suspend account
                      </WuButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>

      <EditVerificationModal
        open={editChannel !== null}
        channel={editChannel}
        current={editCurrent}
        onClose={() => setEditChannel(null)}
        onSave={(status, note) => {
          if (!editChannel) return;
          setVerificationChannelStatus(editChannel, status, note);
          showToast({
            message: `${editChannel === 'email' ? 'Email' : 'Phone'} status set to ${status}`,
            variant: 'success',
          });
        }}
      />
    </div>
  );
}
