'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import ConjointReportView from '@/components/reports/conjoint/ConjointReportView';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_CONJOINT_REPORT } from '@/data/mock-conjoint-report';
import { getReportById } from '@/data/mock-reports';
import { getSectionBasePath, withSectionBasePath } from '@/lib/section-base-path';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export default function ReportDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const basePath = getSectionBasePath(pathname);
  const reportsPath = withSectionBasePath(basePath, '/reports');
  const reportId = Number(params.id);
  const report = getReportById(reportId);

  if (!report) {
    return (
      <div className="min-h-[calc(100vh-46px)] bg-white px-8 pt-8">
        <EmptyState
          icon="wm-search-off"
          title="Report not found"
          description="This report may have been deleted or you do not have access."
          action={
            <Link href={reportsPath}>
              <WuButton>Back to Reports</WuButton>
            </Link>
          }
        />
      </div>
    );
  }

  if (report.typeId === 'conjoint') {
    return (
      <ConjointReportView
        reportName={report.name}
        questionLabel={
          report.questionLabel ?? MOCK_CONJOINT_REPORT.questionLabel
        }
        surveyName={report.surveyName ?? MOCK_CONJOINT_REPORT.surveyName}
        reportsHref={reportsPath}
        onExport={() =>
          showToast({ message: 'Export started.', variant: 'success' })
        }
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
    <div className="min-h-[calc(100vh-46px)] bg-white px-8 pt-8">
      <EmptyState
        icon="wm-bar-chart"
        title={report.name}
        description="This report type detail view will be available in a future update."
        action={
          <WuButton variant="secondary" onClick={() => router.push(reportsPath)}>
            Back to Reports
          </WuButton>
        }
      />
    </div>
  );
}
