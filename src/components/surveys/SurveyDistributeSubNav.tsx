'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import { useSurveyDistributeView } from '@/components/surveys/SurveyDistributeViewContext';
import { getDistributeChannelPath } from '@/components/surveys/survey-distribute-navigation';
import {
  DISTRIBUTE_CHANNELS,
  getSurveyDistributionUrl,
} from '@/data/mock-survey-distribute';
import styles from './SurveyDistributeSubNav.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
  { ssr: false }
);

interface SurveyDistributeSubNavProps {
  surveyId: number;
}

export function SurveyDistributeSubNav({ surveyId }: SurveyDistributeSubNavProps) {
  const { showToast } = useWuShowToast();
  const { activeChannel } = useSurveyDistributeView();
  const surveyUrl = getSurveyDistributionUrl(surveyId);

  const links = useMemo(
    () =>
      DISTRIBUTE_CHANNELS.map((channel) => ({
        link: (
          <NavLink
            href={getDistributeChannelPath(surveyId, channel.id)}
            active={activeChannel === channel.id}
            variant="secondary"
            className={styles.channelLink}
          >
            {channel.label}
          </NavLink>
        ),
        imgOrIcon: <span className={`${channel.icon} ${styles.channelIcon}`} aria-hidden />,
      })),
    [activeChannel, surveyId]
  );

  return (
    <WuSecondaryNavbar Links={links} className={styles.navbar}>
      <div className={styles.utilityArea}>
        <span className={styles.urlField} title={surveyUrl}>
          {surveyUrl}
        </span>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Edit survey link"
          onClick={() => showToast({ message: 'Edit survey link', variant: 'info' })}
        >
          <span className="wm-edit" aria-hidden />
        </button>
      </div>
    </WuSecondaryNavbar>
  );
}
