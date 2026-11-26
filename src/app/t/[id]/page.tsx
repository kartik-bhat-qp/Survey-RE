'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { surveyLinkUnavailable } from '@/data/mock-phishing-publish-hold';
import {
  PHISHING_UNAVAILABLE_BODY,
  PHISHING_UNAVAILABLE_TITLE,
} from '@/data/mock-phishing-publish-hold';
import styles from '../../survey/unavailable/SurveyUnavailablePage.module.css';

/** Shareable / take-survey link — held and suspended surveys show unavailable. */
export default function TakeSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);

  useEffect(() => {
    if (!Number.isFinite(surveyId)) return;
    if (surveyLinkUnavailable(surveyId)) {
      router.replace(`/survey/unavailable?id=${surveyId}`);
    }
  }, [router, surveyId]);

  if (Number.isFinite(surveyId) && surveyLinkUnavailable(surveyId)) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{PHISHING_UNAVAILABLE_TITLE}</h1>
          <p className={styles.body}>{PHISHING_UNAVAILABLE_BODY}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Survey {surveyId}</h1>
        <p className={styles.body}>
          Respondent take flow placeholder. Live surveys collect responses here.
        </p>
      </div>
    </main>
  );
}
