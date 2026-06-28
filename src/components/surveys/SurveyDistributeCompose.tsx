'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DEFAULT_EMAIL_COMPOSE,
  EMAIL_SIDEBAR_ITEMS,
  MOCK_DISTRIBUTE_CREDITS,
  MOCK_EMAIL_LISTS,
  MOCK_EMAIL_SENDERS,
  MOCK_EMAIL_TEMPLATES,
  MOCK_REPLY_TO_OPTIONS,
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

const RICH_TEXT_ACTIONS = [
  { icon: 'wm-link', label: 'Insert link' },
  { icon: 'wm-image', label: 'Insert image' },
  { label: 'Bold', text: 'B' },
  { label: 'Italic', text: 'I' },
  { label: 'Underline', text: 'U' },
  { icon: 'wm-format-color-fill', label: 'Highlight color' },
  { icon: 'wm-format-align-left', label: 'Align left' },
  { icon: 'wm-format-align-center', label: 'Align center' },
  { icon: 'wm-format-align-right', label: 'Align right' },
  { icon: 'wm-format-list-bulleted', label: 'Bulleted list' },
  { icon: 'wm-format-list-numbered', label: 'Numbered list' },
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
  const [selectedList, setSelectedList] = useState(MOCK_EMAIL_LISTS[0] ?? null);
  const [selectedSender, setSelectedSender] = useState(MOCK_EMAIL_SENDERS[0] ?? null);
  const [selectedReplyTo, setSelectedReplyTo] = useState(MOCK_REPLY_TO_OPTIONS[0] ?? null);
  const [selectedTemplate, setSelectedTemplate] = useState(MOCK_EMAIL_TEMPLATES[0] ?? null);
  const [subject, setSubject] = useState(DEFAULT_EMAIL_COMPOSE.subject);
  const [body, setBody] = useState(DEFAULT_EMAIL_COMPOSE.body);
  const [emailEnabled, setEmailEnabled] = useState(DEFAULT_EMAIL_COMPOSE.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(DEFAULT_EMAIL_COMPOSE.smsEnabled);

  const sidebarPlaceholder = useMemo(() => {
    const item = EMAIL_SIDEBAR_ITEMS.find((entry) => entry.id === activeSidebar);
    return item?.label ?? 'Email';
  }, [activeSidebar]);

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
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>To:</span>
                <div className={styles.fieldControl}>
                  <div className={styles.selectWrap}>
                    <WuSelect
                      data={MOCK_EMAIL_LISTS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedList}
                      onSelect={(item) =>
                        setSelectedList(item as (typeof MOCK_EMAIL_LISTS)[number])
                      }
                      placeholder="Select List"
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>From:</span>
                <div className={`${styles.fieldControl} ${styles.fieldControlWithToggle}`}>
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
                  <WuToggle
                    Label="Email"
                    labelPosition="left"
                    checked={emailEnabled}
                    onChange={setEmailEnabled}
                  />
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

              <div className={`${styles.fieldRow} ${styles.fieldRowWide}`}>
                <span className={styles.fieldLabel}>Subject:</span>
                <div className={styles.fieldControl}>
                  <WuInput value={subject} onChange={(event) => setSubject(event.target.value)} />
                </div>
              </div>

              <div className={styles.templateRow}>
                <span className={styles.templateLabel}>Template</span>
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

            <div className={styles.editorSection}>
              <textarea
                className={styles.bodyField}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={12}
                aria-label="Email body"
              />
              <div className={styles.toolbar} role="toolbar" aria-label="Email formatting">
                {RICH_TEXT_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className={styles.toolbarBtn}
                    aria-label={action.label}
                    onClick={() => handleToolbarAction(action.label)}
                  >
                    {'text' in action ? (
                      action.text
                    ) : (
                      <span className={action.icon} aria-hidden />
                    )}
                  </button>
                ))}
                <span className={styles.toolbarDivider} aria-hidden />
                <button
                  type="button"
                  className={styles.toolbarBtn}
                  onClick={() => handleToolbarAction('Source')}
                >
                  Source
                </button>
              </div>
            </div>

            <div className={styles.composeFooter}>
              <div className={styles.footerLeft}>
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

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => showToast({ message: 'Invitation sent', variant: 'success' })}
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
