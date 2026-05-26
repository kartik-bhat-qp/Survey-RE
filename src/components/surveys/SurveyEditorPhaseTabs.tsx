'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './SurveyEditorPhaseTabs.module.css';

type PhaseTab = 'edit' | 'distribute' | 'analytics' | 'integration';

const TABS: { id: PhaseTab; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integration', label: 'Integration' },
];

export function SurveyEditorPhaseTabs() {
  const { showToast } = useWuShowToast();

  return (
    <nav className={styles.nav} aria-label="Survey phases">
      <ul className={styles.tabs}>
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={styles.tab}
              data-active={tab.id === 'edit' ? 'true' : undefined}
              onClick={() => {
                if (tab.id !== 'edit') {
                  showToast({
                    message: `${tab.label} is not available in this prototype`,
                    variant: 'info',
                  });
                }
              }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.right}>
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
      </div>
    </nav>
  );
}
