'use client';

import { SurveyEmailComposePanel } from '@/components/surveys/SurveyDistributeCompose';
import { SurveyQrCodePanel } from '@/components/surveys/SurveyQrCodePanel';
import { useSurveyDistributeView } from '@/components/surveys/SurveyDistributeViewContext';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DISTRIBUTE_CHANNELS,
  getSurveyDistributionUrl,
} from '@/data/mock-survey-distribute';
import type { SurveyDetail } from '@/data/mock-survey-detail';
import styles from './SurveyDistributeDashboard.module.css';

interface SurveyDistributeDashboardProps {
  detail: SurveyDetail;
}

export function SurveyDistributeDashboard({ detail }: SurveyDistributeDashboardProps) {
  const { activeChannel, activeEmailSidebar, setActiveEmailSidebar, setActiveChannel } =
    useSurveyDistributeView();

  if (activeChannel === 'email') {
    return (
      <div className={styles.shell}>
        <SurveyEmailComposePanel
          activeSidebar={activeEmailSidebar}
          onSidebarChange={setActiveEmailSidebar}
        />
      </div>
    );
  }

  if (activeChannel === 'qr-codes') {
    return (
      <div className={styles.shell}>
        <SurveyQrCodePanel baseSurveyUrl={getSurveyDistributionUrl(detail.survey.id)} />
      </div>
    );
  }

  const channel = DISTRIBUTE_CHANNELS.find((entry) => entry.id === activeChannel);

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <EmptyState
          icon={channel?.icon ?? 'wm-share'}
          title={`${channel?.label ?? 'Channel'} distribution`}
          description={`Send "${detail.editorTitle}" through ${channel?.label.toLowerCase() ?? 'this channel'} in a future release.`}
          action={
            <button
              type="button"
              className="text-sm text-[#1b87e6] underline"
              onClick={() => setActiveChannel('email')}
            >
              Back to Email
            </button>
          }
        />
      </div>
    </div>
  );
}
