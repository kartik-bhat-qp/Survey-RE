'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import {
  useSurveyEditorPhase,
  type SurveyEditorPhase,
} from '@/components/surveys/SurveyEditorPhaseContext';
import { getSurveyEditorPhasePath } from '@/components/surveys/survey-editor-navigation';
import styles from './SurveyEditorPhaseTabs.module.css';

const WuPrimaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPrimaryNavbar })),
  { ssr: false }
);

const PHASE_TABS: { id: SurveyEditorPhase; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integration', label: 'Integration' },
];

export function SurveyEditorPhaseTabs() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const { activePhase, setActivePhase } = useSurveyEditorPhase();

  const links = useMemo(
    () =>
      PHASE_TABS.map((tab) => (
        <NavLink
          key={tab.id}
          href={
            tab.id === 'integration'
              ? '#'
              : getSurveyEditorPhasePath(surveyId, tab.id as SurveyEditorPhase)
          }
          active={activePhase === tab.id}
          onClick={(event) => {
            event.preventDefault();
            if (tab.id === 'edit' || tab.id === 'analytics' || tab.id === 'distribute') {
              setActivePhase(tab.id);
              return;
            }
            showToast({
              message: `${tab.label} is not available in this prototype`,
              variant: 'info',
            });
          }}
        >
          {tab.label}
        </NavLink>
      )),
    [activePhase, setActivePhase, showToast, surveyId]
  );

  return (
    <WuPrimaryNavbar Links={links}>
      <button
        type="button"
        className={styles.toolsBtn}
        onClick={() => showToast({ message: 'Tools menu', variant: 'success' })}
      >
        Tools
        <span className="wm-arrow-drop-down" />
      </button>
      <button
        type="button"
        className={styles.userCountBtn}
        onClick={() => showToast({ message: 'Collaborators', variant: 'success' })}
      >
        <span className="wm-group" />
        1.8K
      </button>
    </WuPrimaryNavbar>
  );
}
