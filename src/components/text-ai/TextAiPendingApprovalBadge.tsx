import styles from './TextAiPendingApprovalBadge.module.css';

export function TextAiPendingApprovalBadge() {
  return (
    <span className={styles.badge}>
      <span className={styles.dot} aria-hidden />
      Pending approval
    </span>
  );
}
