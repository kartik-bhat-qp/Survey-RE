'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import styles from './SurveyEditorPhaseTabs.module.css';

const WuPrimaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPrimaryNavbar })),
  { ssr: false }
);

type PhaseTab = 'edit' | 'distribute' | 'analytics' | 'integration';

const PHASE_TABS: { id: PhaseTab; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integration', label: 'Integration' },
];

export function SurveyEditorPhaseTabs() {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<PhaseTab>('edit');

  const links = useMemo(
    () =>
      PHASE_TABS.map((tab) => (
        <NavLink
          key={tab.id}
          href="#"
          active={activeTab === tab.id}
          onClick={(event) => {
            event.preventDefault();
            if (tab.id === 'edit') {
              setActiveTab(tab.id);
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
    [activeTab, showToast]
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
