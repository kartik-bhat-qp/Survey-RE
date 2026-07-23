'use client';

import { NavLink } from '@/components/surveys/NavLink';
import { SurveyEmailComposePanel } from '@/components/surveys/SurveyDistributeCompose';
import { SurveyMobileAppPanel } from '@/components/surveys/SurveyMobileAppPanel';
import { SurveyQrCodePanel } from '@/components/surveys/SurveyQrCodePanel';
import { useSurveyDistributeView } from '@/components/surveys/SurveyDistributeViewContext';
import { getDistributeChannelPath } from '@/components/surveys/survey-distribute-navigation';
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
  const { activeChannel, activeEmailSidebar } = useSurveyDistributeView();

  if (activeChannel === 'email') {
    return (
      <div className={styles.shell}>
        <SurveyEmailComposePanel
          surveyId={detail.survey.id}
          activeSidebar={activeEmailSidebar}
        />
      </div>
    );
  }

  if (activeChannel === 'mobile-app') {
    return (
      <div className={styles.shell}>
        <SurveyMobileAppPanel />
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
            <NavLink
              href={getDistributeChannelPath(detail.survey.id, 'email', 'compose')}
              className="text-sm text-[#1b87e6] underline"
            >
              Back to Email
            </NavLink>
          }
        />
      </div>
    </div>
  );
}
