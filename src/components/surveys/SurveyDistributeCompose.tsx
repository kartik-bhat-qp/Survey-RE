'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { WuLoaderWrapper } from '@/components/ui/WuLoaderWrapper';
import { ComposeEmailToolbar } from '@/components/surveys/ComposeEmailToolbar';
import { ComposeHelpMeWrite } from '@/components/surveys/ComposeHelpMeWrite';
import { ComposeRecipientsField } from '@/components/surveys/ComposeRecipientsField';
import {
  DEFAULT_EMAIL_COMPOSE,
  EMAIL_SIDEBAR_ITEMS,
  MOCK_DISTRIBUTE_CREDITS,
  MOCK_EMAIL_LISTS,
  MOCK_EMAIL_SENDERS,
  MOCK_EMAIL_TEMPLATES,
  MOCK_REPLY_TO_OPTIONS,
  SMS_SEGMENT_CHAR_LIMIT,
  getSmsSegmentUsage,
  type EmailSidebarId,
} from '@/data/mock-survey-distribute';
import styles from './SurveyDistributeCompose.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const SMS_TOOLBAR_ACTIONS = [
  { icon: 'wm-link', label: 'Insert link' },
  { icon: 'wm-label', label: 'Insert tag' },
  { icon: 'wm-mail', label: 'Insert email' },
] as const;

interface SurveyEmailComposePanelProps {
  activeSidebar: EmailSidebarId;
  onSidebarChange: (item: EmailSidebarId) => void;
}

export function SurveyEmailComposePanel({
  activeSidebar,
  onSidebarChange,
}: SurveyEmailComposePanelProps) {
  const { showToast } = useWuShowToast();
  const [selectedList, setSelectedList] = useState<typeof MOCK_EMAIL_LISTS[number] | null>(null);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [selectedSender, setSelectedSender] = useState(MOCK_EMAIL_SENDERS[0] ?? null);
  const [selectedReplyTo, setSelectedReplyTo] = useState(MOCK_REPLY_TO_OPTIONS[0] ?? null);
  const [selectedTemplate, setSelectedTemplate] = useState(MOCK_EMAIL_TEMPLATES[0] ?? null);
  const [subject, setSubject] = useState(DEFAULT_EMAIL_COMPOSE.subject);
  const [body, setBody] = useState(DEFAULT_EMAIL_COMPOSE.body);
  const [smsBody, setSmsBody] = useState(DEFAULT_EMAIL_COMPOSE.smsBody);
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState(MOCK_EMAIL_TEMPLATES[0] ?? null);
  const [emailEnabled, setEmailEnabled] = useState(DEFAULT_EMAIL_COMPOSE.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(DEFAULT_EMAIL_COMPOSE.smsEnabled);
  const [helpMeWriteOpen, setHelpMeWriteOpen] = useState(false);
  const [isWritingWithAi, setIsWritingWithAi] = useState(false);

  const sidebarPlaceholder = useMemo(() => {
    const item = EMAIL_SIDEBAR_ITEMS.find((entry) => entry.id === activeSidebar);
    return item?.label ?? 'Email';
  }, [activeSidebar]);

  const smsSegmentUsage = useMemo(() => getSmsSegmentUsage(smsBody), [smsBody]);

  function handleSend(): void {
    if (!selectedList && recipientEmails.length === 0) {
      showToast({ message: 'Add at least one list or email address', variant: 'error' });
      return;
    }

    const recipientSummary = [
      selectedList ? selectedList.label : null,
      recipientEmails.length > 0 ? `${recipientEmails.length} email address(es)` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    showToast({ message: `Invitation sent to ${recipientSummary}`, variant: 'success' });
  }

  function handleToolbarAction(label: string): void {
    showToast({ message: label, variant: 'info' });
  }

  return (
    <div className={styles.workspace}>
      <nav className={styles.sidebar} aria-label="Email distribution">
        {EMAIL_SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.sidebarItem} ${
              activeSidebar === item.id ? styles.sidebarItemActive : ''
            }`}
            aria-current={activeSidebar === item.id ? 'page' : undefined}
            onClick={() => onSidebarChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.main}>
        {activeSidebar === 'compose' ? (
          <div className={styles.composeCard}>
            <div className={styles.composeHeader}>
              <div className={styles.composeHeaderFields}>
                <div className={`${styles.fieldRow} ${styles.fieldRowWide}`}>
                  <span className={styles.fieldLabel}>To:</span>
                  <div className={styles.fieldControl}>
                    <ComposeRecipientsField
                      selectedList={selectedList}
                      onSelectedListChange={setSelectedList}
                      recipientEmails={recipientEmails}
                      onRecipientEmailsChange={setRecipientEmails}
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>From:</span>
                  <div className={styles.fieldControl}>
                    <div className={styles.selectWrap}>
                      <WuSelect
                        data={MOCK_EMAIL_SENDERS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={selectedSender}
                        onSelect={(item) =>
                          setSelectedSender(item as (typeof MOCK_EMAIL_SENDERS)[number])
                        }
                        variant="outlined"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Reply To:</span>
                  <div className={styles.fieldControl}>
                    <div className={styles.selectWrap}>
                      <WuSelect
                        data={MOCK_REPLY_TO_OPTIONS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={selectedReplyTo}
                        onSelect={(item) =>
                          setSelectedReplyTo(item as (typeof MOCK_REPLY_TO_OPTIONS)[number])
                        }
                        variant="outlined"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className={styles.channelSection} aria-label="Email message">
              <div className={styles.channelHeader}>
                <div className={styles.channelHeaderLeft}>
                  <WuToggle
                    Label="Email"
                    labelPosition="left"
                    checked={emailEnabled}
                    onChange={setEmailEnabled}
                  />
                </div>
                <div className={styles.channelHeaderRight}>
                  <div className={styles.templateSelect}>
                    <WuSelect
                      data={MOCK_EMAIL_TEMPLATES}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedTemplate}
                      onSelect={(item) =>
                        setSelectedTemplate(item as (typeof MOCK_EMAIL_TEMPLATES)[number])
                      }
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>

              {emailEnabled ? (
                <>
                  <div className={styles.subjectRow}>
                    <span className={styles.fieldLabel}>Subject:</span>
                    <div className={styles.fieldControl}>
                      <WuInput
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.editorSection}>
                    <WuLoaderWrapper
                      showLoader={isWritingWithAi}
                      className={styles.editorLoader}
                      message="Updating your message…"
                    >
                      <textarea
                        className={styles.bodyField}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={12}
                        aria-label="Email body"
                        disabled={isWritingWithAi}
                      />
                    </WuLoaderWrapper>

                    <ComposeHelpMeWrite
                      open={helpMeWriteOpen}
                      onOpenChange={setHelpMeWriteOpen}
                      body={body}
                      subject={subject}
                      onBodyChange={setBody}
                      onSubjectChange={setSubject}
                      onGeneratingChange={setIsWritingWithAi}
                    />

                    <ComposeEmailToolbar
                      helpMeWriteOpen={helpMeWriteOpen}
                      helpMeWriteDisabled={isWritingWithAi}
                      onHelpMeWriteToggle={() => setHelpMeWriteOpen((open) => !open)}
                      onAction={handleToolbarAction}
                    />
                  </div>
                </>
              ) : null}
            </section>

            <section className={styles.channelSection} aria-label="SMS message">
              <div className={styles.channelHeader}>
                <div className={styles.channelHeaderLeft}>
                  <WuToggle
                    Label="SMS"
                    labelPosition="left"
                    checked={smsEnabled}
                    onChange={setSmsEnabled}
                  />
                  <p className={styles.creditLine}>
                    Available Credit: ${MOCK_DISTRIBUTE_CREDITS.available.toFixed(2)}
                    <button
                      type="button"
                      className={styles.creditLink}
                      onClick={() => showToast({ message: 'Buy more credits', variant: 'info' })}
                    >
                      Buy More
                    </button>
                  </p>
                </div>
                {smsEnabled ? (
                  <div className={styles.channelHeaderRight}>
                    <div className={styles.templateSelect}>
                      <WuSelect
                        data={MOCK_EMAIL_TEMPLATES}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={selectedSmsTemplate}
                        onSelect={(item) =>
                          setSelectedSmsTemplate(item as (typeof MOCK_EMAIL_TEMPLATES)[number])
                        }
                        variant="outlined"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {smsEnabled ? (
                <div className={styles.smsEditorSection}>
                  <textarea
                    className={styles.smsBodyField}
                    value={smsBody}
                    onChange={(event) => setSmsBody(event.target.value)}
                    rows={4}
                    aria-label="SMS body"
                    aria-describedby="sms-segment-counter"
                  />
                  <div className={styles.smsFooter}>
                    <div className={styles.smsToolbar} role="toolbar" aria-label="SMS formatting">
                      {SMS_TOOLBAR_ACTIONS.map((action) => (
                        <WuTooltip key={action.label} content={action.label} position="top">
                          <button
                            type="button"
                            className={styles.toolbarBtn}
                            aria-label={action.label}
                            onClick={() => handleToolbarAction(action.label)}
                          >
                            <span className={action.icon} aria-hidden />
                          </button>
                        </WuTooltip>
                      ))}
                    </div>
                    <div
                      id="sms-segment-counter"
                      className={styles.smsCounterBar}
                      aria-live="polite"
                      aria-label={`${smsSegmentUsage.charsInCurrentSegment} of ${SMS_SEGMENT_CHAR_LIMIT} characters${
                        smsSegmentUsage.segmentCount > 1
                          ? `, ${smsSegmentUsage.segmentCount} SMS messages`
                          : ''
                      }`}
                    >
                      <div className={styles.smsCounter}>
                        <span
                          className={`${styles.smsCounterText} ${
                            smsSegmentUsage.segmentCount > 1 ||
                            smsSegmentUsage.charsInCurrentSegment >= 140
                              ? styles.smsCounterTextAlert
                              : ''
                          }`}
                        >
                          {smsSegmentUsage.charsInCurrentSegment} / {SMS_SEGMENT_CHAR_LIMIT}
                          {smsSegmentUsage.segmentCount > 1 ? (
                            <span className={styles.smsSegmentCount}>
                              {' '}
                              · {smsSegmentUsage.segmentCount} SMS
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={styles.smsCounterRing}
                          style={{
                            background: `conic-gradient(#22c55e ${
                              smsSegmentUsage.segmentFillPercent * 3.6
                            }deg, #e2e8f0 0deg)`,
                          }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <div className={styles.composeFooter}>
              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={handleSend}
                >
                  Send
                </button>
                <button
                  type="button"
                  className={styles.scheduleBtn}
                  onClick={() => showToast({ message: 'Schedule invitation', variant: 'info' })}
                >
                  Schedule
                </button>
                <span className={styles.canSpamBadge}>
                  CAN-SPAM
                  <span className="wm-check-circle" aria-hidden />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.placeholderPanel}>
            <EmptyState
              icon="wm-email"
              title={`${sidebarPlaceholder} is empty`}
              description="Distribution records will appear here in a future release."
              action={
                <button
                  type="button"
                  className={styles.scheduleBtn}
                  onClick={() => onSidebarChange('compose')}
                >
                  Back to Compose
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
