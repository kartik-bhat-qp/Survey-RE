'use client';

import { SurveyIntegrityEditor } from './SurveyIntegrityEditor';
import styles from './SurveyIntegrityCard.module.css';

export function SurveyIntegrityCard({
  surveyId,
  surveyName,
}: {
  surveyId: number;
  surveyName: string;
}) {
  return (
    <section className={styles.card} aria-label="Respondent integrity">
      <h2>Respondent integrity</h2>
      <SurveyIntegrityEditor embedded surveyId={surveyId} surveyName={surveyName} />
    </section>
  );
}
