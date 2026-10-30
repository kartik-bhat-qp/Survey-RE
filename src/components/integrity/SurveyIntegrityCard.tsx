'use client';

import Link from 'next/link';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  SURVEY_CHECKS,
  findSurveyProtection,
  surveyCheckSummary,
  surveyProtectionSummary,
  toleranceSummary,
} from '@/lib/integrity/coverage';
import styles from './SurveyIntegrityCard.module.css';

export function SurveyIntegrityCard({
  surveyId,
  surveyName,
}: {
  surveyId: number;
  surveyName: string;
}) {
  const [coverage] = usePersistedState(INTEGRITY_COVERAGE_KEY, EMPTY_INTEGRITY_COVERAGE);
  const record = findSurveyProtection(coverage, surveyId);
  const href = `/integrity?survey=${surveyId}`;

  return (
    <section className={styles.card} aria-label="Respondent Integrity">
      <div className={styles.copy}>
        <h2>Respondent Integrity</h2>
        <p>
          {record
            ? (record.checks?.length ?? 0) > 0
              ? [
                  surveyCheckSummary(record.checks),
                  toleranceSummary(record.checks, record.tolerance, SURVEY_CHECKS),
                ]
                  .filter(Boolean)
                  .join('. ')
              : surveyProtectionSummary(record.protections)
            : `${surveyName} is not protected.`}
        </p>
      </div>
      <Link className={styles.link} href={href}>
        {record ? 'Edit in Integrity' : 'Protect this survey'}
      </Link>
    </section>
  );
}
