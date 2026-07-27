'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  filterNotificationEmailSendLogs,
  formatNotificationEmailSendTimestamp,
  MOCK_SURVEY_NOTIFICATION_EMAIL_SEND_LOGS,
  type SurveyNotificationEmailSendStatus,
} from '@/data/mock-survey-notifications';
import styles from './EmailSendLogsModal.module.css';

interface EmailSendLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusClass(status: SurveyNotificationEmailSendStatus): string {
  switch (status) {
    case 'Delivered':
    case 'Sent':
      return styles.statusDelivered;
    case 'Queued':
    case 'Deferred':
      return styles.statusQueued;
    case 'Failed':
      return styles.statusFailed;
    case 'Bounced':
      return styles.statusBounced;
    default:
      return '';
  }
}

export function EmailSendLogsModal({ open, onOpenChange }: EmailSendLogsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
  }, [open]);

  const filteredLogs = useMemo(
    () => filterNotificationEmailSendLogs(MOCK_SURVEY_NOTIFICATION_EMAIL_SEND_LOGS, search),
    [search]
  );

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action" size="lg">
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Notifications log</span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
            <input
              type="search"
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by Response ID or Email Address (To)"
              aria-label="Search by Response ID or Email Address (To)"
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Response ID</th>
                <th scope="col">Email Type</th>
                <th scope="col">Email Address (To)</th>
                <th scope="col">Email Address (From)</th>
                <th scope="col">Sent On</th>
                <th scope="col">SMTP Status</th>
                <th scope="col">Logs</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    No data to display...
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className={styles.dataRow}>
                    <td>{log.responseId}</td>
                    <td title={log.emailType}>{log.emailType}</td>
                    <td title={log.toEmail}>{log.toEmail}</td>
                    <td title={log.fromEmail}>{log.fromEmail}</td>
                    <td>{formatNotificationEmailSendTimestamp(log.sentOn)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(log.smtpStatus)}`}>
                        {log.smtpStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.logLink}
                        title={log.logs}
                        onClick={() =>
                          showToast({
                            message: log.logs,
                            variant: 'info',
                          })
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
