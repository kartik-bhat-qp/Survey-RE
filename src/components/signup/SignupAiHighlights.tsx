import { SIGNUP_AI_CAPABILITIES } from '@/data/mock-signup-page';
import styles from './SignupAiHighlights.module.css';

export function SignupAiHighlights() {
  return (
    <ul className={styles.list} aria-label="QuestionPro AI capabilities">
      {SIGNUP_AI_CAPABILITIES.map((capability) => (
        <li key={capability.id} className={styles.item}>
          <span className={`${capability.icon} ${styles.icon}`} aria-hidden />
          {capability.label}
        </li>
      ))}
    </ul>
  );
}
