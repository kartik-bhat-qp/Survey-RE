import {
  getQuestionLogicHelpUrl,
  type QuestionLogicHelpTopic,
} from '@/data/mock-help-links';
import styles from './HelpFileLink.module.css';

interface HelpFileLinkProps {
  topic: QuestionLogicHelpTopic;
  label: string;
}

export function HelpFileLink({ topic, label }: HelpFileLinkProps) {
  return (
    <a
      href={getQuestionLogicHelpUrl(topic)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      aria-label={`Help: ${label}`}
      title={label}
    >
      ?
    </a>
  );
}
