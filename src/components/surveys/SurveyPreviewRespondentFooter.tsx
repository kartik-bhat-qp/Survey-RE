import styles from './SurveyPreviewRespondentFooter.module.css';

export function SurveyPreviewRespondentFooter() {
  return (
    <footer className={styles.footer}>
      <a href="#" className={styles.link} onClick={(event) => event.preventDefault()}>
        Powered by QuestionPro
      </a>
      <span className={styles.links}>
        <a href="#" className={styles.link} onClick={(event) => event.preventDefault()}>
          Privacy &amp; Data Security
        </a>
        <span className={styles.divider}>|</span>
        <a href="#" className={styles.link} onClick={(event) => event.preventDefault()}>
          Respondent Anonymity Assurance
        </a>
      </span>
    </footer>
  );
}
