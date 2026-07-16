'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACCOUNT_NAV_ITEMS } from '@/data/mock-compliance';
import { MOCK_SURVEY_FOLDERS } from '@/data/mock-survey-folders';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';
import { parseSurveyEditorIdFromPathname } from '@/lib/survey-editor-path';
import { SurveyEditorBreadcrumb } from '@/components/surveys/SurveyEditorBreadcrumb';
import { SurveysHeaderActions } from '@/components/surveys/SurveysHeaderActions';
import breadcrumbStyles from './SurveyEditorBreadcrumb.module.css';
import styles from './SurveysAppHeaderContent.module.css';

const WuTruncatedLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTruncatedLabel })),
  { ssr: false }
);

const DEFAULT_ACCOUNT_FOLDER =
  MOCK_SURVEY_FOLDERS.find((folder) => folder.id === 'demo-2026') ?? MOCK_SURVEY_FOLDERS[0];

function getAccountPageLabel(pathname: string): string | null {
  const match = ACCOUNT_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.label ?? null;
}

function AccountHeaderBreadcrumb({ pageLabel }: { pageLabel: string }) {
  return (
    <nav className={`wu-breadcrumb-nav ${breadcrumbStyles.nav}`} aria-label="Breadcrumb">
      <Link href="/surveys" className={`wu-breadcrumb-link ${breadcrumbStyles.link}`}>
        <WuTruncatedLabel
          label={DEFAULT_ACCOUNT_FOLDER?.name ?? 'My Surveys'}
          className="wu-breadcrumb-page"
        />
      </Link>
      <span
        className={`wu-breadcrumb-separator wm-arrow-forward-ios ${breadcrumbStyles.separator}`}
      />
      <span className={breadcrumbStyles.current}>
        <WuTruncatedLabel label={pageLabel} className="wu-breadcrumb-page" />
      </span>
    </nav>
  );
}

export function SurveysAppHeaderContent() {
  const pathname = usePathname();
  const surveyId = parseSurveyEditorIdFromPathname(pathname);
  const { survey, ready } = useSurveyById(surveyId ?? -999);
  const accountPageLabel = getAccountPageLabel(pathname);

  if (surveyId !== null && ready && survey) {
    const detail = getSurveyDetail(survey);
    return (
      <div className={styles.editorBar}>
        <SurveyEditorBreadcrumb survey={survey} editorTitle={detail.editorTitle} />
        <SurveysHeaderActions compact />
      </div>
    );
  }

  if (accountPageLabel) {
    return (
      <div className={styles.editorBar}>
        <AccountHeaderBreadcrumb pageLabel={accountPageLabel} />
        <SurveysHeaderActions compact />
      </div>
    );
  }

  return (
    <div className={styles.listBar}>
      <SurveysHeaderActions />
    </div>
  );
}
