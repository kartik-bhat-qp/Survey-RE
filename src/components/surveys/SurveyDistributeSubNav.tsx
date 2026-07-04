'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useSurveyDistributeView } from '@/components/surveys/SurveyDistributeViewContext';
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
  const { activeChannel, setActiveChannel } = useSurveyDistributeView();
  const surveyUrl = getSurveyDistributionUrl(surveyId);

  const links = useMemo(
    () =>
      DISTRIBUTE_CHANNELS.map((channel) => ({
        link: (
          <button
            type="button"
            className={`${styles.channelLink} ${
              activeChannel === channel.id ? 'wu-secondary-nav-active-link' : ''
            }`}
            aria-current={activeChannel === channel.id ? 'page' : undefined}
            onClick={() => setActiveChannel(channel.id)}
          >
            {channel.label}
          </button>
        ),
        imgOrIcon: <span className={`${channel.icon} ${styles.channelIcon}`} aria-hidden />,
      })),
    [activeChannel, setActiveChannel]
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
