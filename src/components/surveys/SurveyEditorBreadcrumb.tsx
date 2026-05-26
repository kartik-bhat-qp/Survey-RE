'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Survey } from '@/data/mock-surveys';
import { getSurveyFolderById } from '@/data/get-survey-by-id';
import styles from './SurveyEditorBreadcrumb.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false }
);

interface SurveyEditorBreadcrumbProps {
  survey: Survey;
  editorTitle: string;
}

export function SurveyEditorBreadcrumb({ survey, editorTitle }: SurveyEditorBreadcrumbProps) {
  const folder = getSurveyFolderById(survey.folderId);

  return (
    <nav className={`wu-breadcrumb-nav ${styles.nav}`} aria-label="Breadcrumb">
      <Link href="/surveys" className={`wu-breadcrumb-link ${styles.link}`}>
        <WuTruncatedLabel label={folder?.name ?? 'My Surveys'} className="wu-breadcrumb-page" />
      </Link>
      <span className={`wu-breadcrumb-separator wm-arrow-forward-ios ${styles.separator}`} />
      <span className={styles.current}>
        <WuTruncatedLabel label={editorTitle} className="wu-breadcrumb-page" />
      </span>
    </nav>
  );
}
