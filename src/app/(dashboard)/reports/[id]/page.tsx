'use client';

import { useParams, usePathname } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import ConjointReportView from '@/components/reports/conjoint/ConjointReportView';
import CrosstabReportView from '@/components/reports/crosstab/CrosstabReportView';
import { MOCK_CONJOINT_REPORT } from '@/data/mock-conjoint-report';
import { MOCK_CROSSTAB_REPORT } from '@/data/mock-crosstab-report';
import { getReportById } from '@/data/mock-reports';
import { getSectionBasePath, withSectionBasePath } from '@/lib/section-base-path';

export default function ReportDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const { showToast } = useWuShowToast();
  const reportId = Number(params.id);
  const report = getReportById(reportId);
  const basePath = getSectionBasePath(pathname);
  const reportsPath = withSectionBasePath(basePath, '/reports');

  if (report?.typeId === 'conjoint') {
    return (
      <ConjointReportView
        reportName={report.name}
        questionLabel={report.questionLabel ?? MOCK_CONJOINT_REPORT.questionLabel}
        surveyName={report.surveyName ?? MOCK_CONJOINT_REPORT.surveyName}
        reportsHref={reportsPath}
        onExport={() => showToast({ message: 'Export started.', variant: 'success' })}
        onShare={() =>
          showToast({
            message: 'Share link copied.',
            variant: 'success',
          })
        }
      />
    );
  }

  return (
    <CrosstabReportView
      reportName={report?.name ?? MOCK_CROSSTAB_REPORT.title}
      surveyName={report?.surveyName ?? MOCK_CROSSTAB_REPORT.surveyName}
    />
  );
}
