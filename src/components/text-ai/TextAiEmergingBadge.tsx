import styles from './TextAiEmergingBadge.module.css';

export function TextAiEmergingBadge() {
  return (
    <span className={styles.badge}>
      <span className={styles.dot} aria-hidden />
      Emerging
    </span>
  );
}
