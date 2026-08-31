'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem, IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageContainer } from '@/components/ui/PageContainer';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import {
  MOCK_ORGANIZATION_CREDIT_BALANCE,
  MOCK_PERSONAL_CODING_PREFERENCES,
  MOCK_QUESTIONPRO_AI_ENABLED,
  MOCK_TEXT_AI_CREDIT_LOGS,
  type TextAiCreditLogEntry,
} from '@/data/mock-organization-settings';
import { formatDate, formatTextAiCredits } from '@/data/mock-utils';
import styles from './page.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false }
);
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const CREDIT_BALANCE_TOOLTIP =
  'To view the complete balance sheet, go to My Account → Usage.';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SettingsPage() {
  const { showToast } = useWuShowToast();
  const [questionProAiEnabled, setQuestionProAiEnabled] = useState(
    MOCK_QUESTIONPRO_AI_ENABLED
  );
  const [personalLearningEnabled, setPersonalLearningEnabled] = useState(
    MOCK_PERSONAL_CODING_PREFERENCES.enabled
  );
  const [personalPreferenceCount, setPersonalPreferenceCount] = useState(
    MOCK_PERSONAL_CODING_PREFERENCES.acceptedCodingChanges
  );
  const [resetPreferencesOpen, setResetPreferencesOpen] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>();

  const totalCreditsUsed = useMemo(
    () =>
      MOCK_TEXT_AI_CREDIT_LOGS.reduce(
        (total, entry) => total + entry.creditsUsed,
        0
      ),
    []
  );

  const filteredLogs = useMemo(() => {
    if (!selectedLogDate) return MOCK_TEXT_AI_CREDIT_LOGS;
    const selectedDateKey = toDateKey(selectedLogDate);
    return MOCK_TEXT_AI_CREDIT_LOGS.filter(
      (entry) => toDateKey(new Date(entry.createdOn)) === selectedDateKey
    );
  }, [selectedLogDate]);

  const logColumns = useMemo<IWuTableColumnDef<TextAiCreditLogEntry>[]>(
    () => [
      {
        accessorKey: 'dashboard',
        header: 'Dashboards',
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: true,
      },
      {
        accessorKey: 'creditsUsed',
        header: 'Credits used',
        enableSorting: true,
        cell: ({ row }) => formatTextAiCredits(row.original.creditsUsed),
      },
      {
        accessorKey: 'createdOn',
        header: 'Created on',
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.createdOn),
      },
    ],
    []
  );

  const hasPersonalPreferences = personalPreferenceCount > 0;
  const personalLearningStatus = personalLearningEnabled
    ? 'Learning enabled'
    : 'Learning disabled';

  const generalContent = (
    <div className={styles.generalPanel}>
      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>
            <span className={`wc-ai ${styles.settingIcon}`} aria-hidden />
            QuestionPro AI
          </span>
          <WuToggle
            checked={questionProAiEnabled}
            onChange={(checked) => {
              setQuestionProAiEnabled(checked);
              showToast({
                message: checked
                  ? 'QuestionPro AI enabled'
                  : 'QuestionPro AI disabled',
                variant: 'success',
              });
            }}
            aria-label="QuestionPro AI"
          />
        </div>
      </div>

      <section className={styles.preferenceSection} aria-labelledby="coding-preferences-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="coding-preferences-title">Text AI coding preferences</h2>
            <p>
              Personalize future AI suggestions using the theme, sub-theme, and
              sentiment changes you explicitly accept.
            </p>
          </div>
        </div>

        <div className={styles.preferenceCard}>
          <div className={styles.preferenceHeader}>
            <div>
              <h3>Personal coding preferences</h3>
              <p>These preferences belong only to you in this organization.</p>
            </div>
            <span
              className={`${styles.statusBadge} ${
                personalLearningEnabled ? styles.statusEnabled : styles.statusDisabled
              }`}
            >
              {personalLearningStatus}
            </span>
          </div>

          <div className={styles.preferenceToggleRow}>
            <div className={styles.preferenceToggleCopy}>
              <span>Learn from my coding preferences</span>
              <p>
                Learn from future coding corrections you accept and use them for
                your AI suggestions and individual recoding.
              </p>
            </div>
            <WuToggle
              checked={personalLearningEnabled}
              onChange={(checked) => {
                setPersonalLearningEnabled(checked);
                showToast({
                  message: checked
                    ? 'Personal coding preference learning enabled'
                    : 'Personal coding preference learning disabled',
                  variant: 'success',
                });
              }}
              aria-label="Learn from my coding preferences"
            />
          </div>

          <div className={styles.workspaceNote}>
            <span className="wm-info" aria-hidden />
            <p>
              Your preferences do not apply to collaborators or workspace-wide
              background processing. Existing dashboards and codeframes stay unchanged.
            </p>
          </div>

          <div className={styles.resetRow}>
            <div>
              <span className={styles.resetTitle}>Reset coding preferences</span>
              <p>
                {hasPersonalPreferences
                  ? `QuestionPro AI has learned from ${personalPreferenceCount.toLocaleString()} accepted coding changes. Last updated ${formatDate(MOCK_PERSONAL_CODING_PREFERENCES.lastUpdated)}.`
                  : 'No personal coding preferences have been learned yet.'}
              </p>
            </div>
            <WuButton
              variant="secondary"
              color="error"
              disabled={!hasPersonalPreferences}
              onClick={() => setResetPreferencesOpen(true)}
            >
              Reset coding preferences
            </WuButton>
          </div>
        </div>
      </section>
    </div>
  );

  const textAiLogsContent = (
    <div className={styles.logsPanel}>
      <div className={styles.logSummary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            Credit balance
            <WuTooltip content={CREDIT_BALANCE_TOOLTIP} position="bottom">
              <span className={styles.infoIconWrap} aria-label={CREDIT_BALANCE_TOOLTIP}>
                <span className="wm-info" />
              </span>
            </WuTooltip>
          </span>
          <strong>{formatTextAiCredits(MOCK_ORGANIZATION_CREDIT_BALANCE)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total credits used</span>
          <strong>{formatTextAiCredits(totalCreditsUsed)}</strong>
        </div>
      </div>

      <div className={styles.logsToolbar}>
        <div className={styles.dateFilter}>
          <WuDatePicker
            value={selectedLogDate}
            onChange={(date) => setSelectedLogDate(date)}
            formatString="MMM d, yyyy"
            placeholder="Select date"
            variant="outlined"
            Label={
              <span className={styles.visuallyHidden}>Text AI log date</span>
            }
            CustomTrigger={() => (
              <span className={styles.dateTrigger}>
                <span className="wm-calendar-month" aria-hidden />
                <span>
                  {selectedLogDate ? formatDate(selectedLogDate) : 'Select date'}
                </span>
                <span className="wm-keyboard-arrow-down" aria-hidden />
              </span>
            )}
          />
          {selectedLogDate ? (
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Clear log date"
              Icon={<span className="wm-close" aria-hidden />}
              onClick={() => setSelectedLogDate(undefined)}
            />
          ) : null}
        </div>
        <span className={styles.logCount}>
          {filteredLogs.length.toLocaleString()}{' '}
          {filteredLogs.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      <TableScrollWrap>
        <WuTable
          data={filteredLogs as unknown[]}
          columns={logColumns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          NoDataContent={
            <div className={styles.emptyLogs}>
              <span className="wm-history" aria-hidden />
              <strong>No Text AI activity found</strong>
              <p>Choose another date or clear the date filter.</p>
            </div>
          }
        />
      </TableScrollWrap>
    </div>
  );

  const tabs: IWuTabItem[] = [
    {
      value: 'general',
      Trigger: 'General',
      Content: generalContent,
    },
    {
      value: 'text-ai-logs',
      Trigger: 'Text AI Logs',
      Content: textAiLogsContent,
    },
  ];

  return (
    <PageContainer>
      <h1 className={styles.pageTitle}>Organization settings</h1>
      <WuTab items={tabs} defaultValue="general" className={styles.settingsTabs} />

      <ConfirmModal
        open={resetPreferencesOpen}
        onOpenChange={setResetPreferencesOpen}
        title="Reset coding preferences?"
        description="This permanently clears what QuestionPro AI has learned from your accepted coding changes. Existing dashboards and codeframes will not change."
        confirmLabel="Reset preferences"
        variant="critical"
        onConfirm={() => {
          setPersonalPreferenceCount(0);
          showToast({
            message: 'Personal coding preferences reset',
            variant: 'success',
          });
        }}
      />
    </PageContainer>
  );
}
