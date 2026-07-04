'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
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
              activeChannel === channel.id ? styles.channelTabActive : ''
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
        <button
          type="button"
          className={styles.userCountBtn}
          onClick={() => showToast({ message: 'Collaborators', variant: 'success' })}
        >
          <span className="wm-group" aria-hidden />
          1K
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="QR code"
          onClick={() => showToast({ message: 'QR code', variant: 'info' })}
        >
          <span className="wm-qr-code-2" aria-hidden />
        </button>
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
        <button
          type="button"
          className={styles.previewBtn}
          aria-label="Preview survey"
          onClick={() => showToast({ message: 'Preview survey', variant: 'success' })}
        >
          <span className="wm-visibility" aria-hidden />
        </button>
      </div>
    </WuSecondaryNavbar>
  );
}
