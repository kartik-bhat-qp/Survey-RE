'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  INTEGRITY_OUTCOME_LABELS,
  INTEGRITY_RISK_LABELS,
  formatCompletionTime,
  getIntegrityFlagLabel,
  type IntegrityResponsesDrilldown,
} from '@/data/mock-respondent-integrity';
import { formatNumber, formatSmartDate } from '@/data/mock-utils';
import hubStyles from './SurveyAnalyticsHub.module.css';
import styles from './AnalyticsRespondentIntegrity.module.css';

const RISK_CLASS = {
  high: styles.riskHigh,
  medium: styles.riskMedium,
  low: styles.riskLow,
} as const;

interface IntegrityOutcomeResponsesModalProps {
  drilldown: IntegrityResponsesDrilldown | null;
  onClose: () => void;
  onOpenResponse: (responseId: string) => void;
}

export function IntegrityOutcomeResponsesModal({
  drilldown,
  onClose,
  onOpenResponse,
}: IntegrityOutcomeResponsesModalProps) {
  const wick = useWickUILib();

  if (!drilldown || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;
  const { title, total, rows } = drilldown;

  return (
    <WuModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      variant="action"
    >
      <WuModalHeader>
        {title}
        <span className={styles.modalHeaderMeta}>
          Showing {rows.length} of {formatNumber(total)}
        </span>
      </WuModalHeader>
      <WuModalContent>
        {rows.length === 0 ? (
          <p className={hubStyles.muted}>No responses in this group.</p>
        ) : (
          <div className={styles.modalTableWrap}>
            <table className={hubStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Response ID</th>
                  <th scope="col">Respondent</th>
                  <th scope="col">Outcome</th>
                  <th scope="col" className={hubStyles.right}>
                    Score
                  </th>
                  <th scope="col">Risk</th>
                  <th scope="col">Flags</th>
                  <th scope="col" className={hubStyles.right}>
                    Time taken
                  </th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.responseId}>
                    <td>
                      <button
                        type="button"
                        className={hubStyles.linkBtn}
                        onClick={() => onOpenResponse(row.responseId)}
                      >
                        {row.responseId}
                      </button>
                    </td>
                    <td>
                      <span className={styles.respondent} title={row.respondent}>
                        {row.respondent ?? <span className={hubStyles.muted}>Anonymous</span>}
                      </span>
                      <span className={styles.collector}>{row.collector}</span>
                    </td>
                    <td>{INTEGRITY_OUTCOME_LABELS[row.outcome]}</td>
                    <td className={hubStyles.right}>
                      <span className={styles.score}>{row.score}</span>
                    </td>
                    <td>
                      <span className={`${styles.riskBadge} ${RISK_CLASS[row.risk]}`}>
                        {INTEGRITY_RISK_LABELS[row.risk]}
                      </span>
                    </td>
                    <td>
                      {row.flags.length > 0 ? (
                        <span className={styles.flagChips}>
                          {row.flags.map((flag) => (
                            <span key={flag} className={styles.flagChip}>
                              {getIntegrityFlagLabel(flag)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className={hubStyles.muted}>No flags</span>
                      )}
                    </td>
                    <td className={hubStyles.right}>
                      {formatCompletionTime(row.completionSeconds)}
                    </td>
                    <td>{formatSmartDate(row.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}
