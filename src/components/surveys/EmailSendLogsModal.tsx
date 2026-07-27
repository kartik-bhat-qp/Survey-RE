'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';
import { EmptyState } from '@/components/ui/EmptyState';
import {
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
    case 'Sent':
      return styles.statusSent;
    case 'Queued':
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

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;
  const logs = MOCK_SURVEY_NOTIFICATION_EMAIL_SEND_LOGS;

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action" size="lg">
      <WuModalHeader className={styles.header}>Email Send Logs</WuModalHeader>
      <WuModalContent className={styles.content}>
        {logs.length === 0 ? (
          <EmptyState
            icon="wm-description"
            title="No email send logs"
            description="Notification emails sent from this survey will appear here."
          />
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.colTimestamp}>Timestamp</div>
              <div className={styles.colNotification}>Notification</div>
              <div className={styles.colRecipient}>Recipient</div>
              <div className={styles.colStatus}>Status</div>
            </div>
            <div className={styles.tableBody}>
              {logs.map((log) => (
                <div key={log.id} className={styles.tableRow}>
                  <div className={styles.colTimestamp}>
                    {formatNotificationEmailSendTimestamp(log.sentAt)}
                  </div>
                  <div className={styles.colNotification} title={log.notificationName}>
                    {log.notificationName}
                  </div>
                  <div className={styles.colRecipient} title={log.recipient}>
                    {log.recipient}
                  </div>
                  <div className={styles.colStatus}>
                    <span className={`${styles.statusBadge} ${statusClass(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}
