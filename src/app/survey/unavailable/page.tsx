'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PHISHING_UNAVAILABLE_BODY,
  PHISHING_UNAVAILABLE_TITLE,
} from '@/data/mock-phishing-publish-hold';
import styles from './SurveyUnavailablePage.module.css';

function UnavailableContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={`wm-link-off ${styles.icon}`} aria-hidden />
        <h1 className={styles.title}>{PHISHING_UNAVAILABLE_TITLE}</h1>
        <p className={styles.body}>{PHISHING_UNAVAILABLE_BODY}</p>
        {id ? <p className={styles.meta}>Survey reference: {id}</p> : null}
      </div>
    </main>
  );
}

export default function SurveyUnavailablePage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <UnavailableContent />
    </Suspense>
  );
}
