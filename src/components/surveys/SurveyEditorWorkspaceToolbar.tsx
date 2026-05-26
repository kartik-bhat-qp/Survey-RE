'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import {
  SURVEY_WORKSPACE_TOOLS,
  type SurveyWorkspaceTool,
} from '@/components/surveys/survey-workspace-tools';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
  { ssr: false }
);

type PublishMode = 'draft' | 'publish';

interface SurveyEditorWorkspaceToolbarProps {
  activeTool: SurveyWorkspaceTool;
  onToolChange: (tool: SurveyWorkspaceTool) => void;
}

export function SurveyEditorWorkspaceToolbar({
  activeTool,
  onToolChange,
}: SurveyEditorWorkspaceToolbarProps) {
  const { showToast } = useWuShowToast();
  const [mode, setMode] = useState<PublishMode>('draft');

  function selectMode(next: PublishMode) {
    setMode(next);
    showToast({
      message: next === 'draft' ? 'Switched to Draft' : 'Switched to Publish',
      variant: 'success',
    });
  }

  function handleToolClick(tool: SurveyWorkspaceTool, label: string) {
    if (tool === 'workspace' || tool === 'advance-quotas') {
      onToolChange(tool);
      return;
    }

    showToast({ message: `${label} is not available in this prototype`, variant: 'info' });
  }

  const handleToolClickStable = useCallback(handleToolClick, [onToolChange, showToast]);

  const links = useMemo(
    () =>
      SURVEY_WORKSPACE_TOOLS.map((tool) => ({
        link: (
          <NavLink
            href="#"
            variant="secondary"
            active={activeTool === tool.id}
            onClick={(event) => {
              event.preventDefault();
              handleToolClickStable(tool.id, tool.label);
            }}
          >
            {tool.label}
          </NavLink>
        ),
        imgOrIcon: <span className={tool.icon} aria-hidden />,
      })),
    [activeTool, handleToolClickStable]
  );

  return (
    <WuSecondaryNavbar Links={links} className={styles.navbar}>
      <div className={styles.publishArea}>
        <div className={styles.statusToggle} role="group" aria-label="Survey status">
          <button
            type="button"
            className={mode === 'draft' ? styles.toggleActive : styles.toggleInactive}
            aria-pressed={mode === 'draft'}
            onClick={() => selectMode('draft')}
          >
            Draft
          </button>
          <button
            type="button"
            className={mode === 'publish' ? styles.toggleActive : styles.toggleInactive}
            aria-pressed={mode === 'publish'}
            onClick={() => selectMode('publish')}
          >
            Publish
          </button>
        </div>
        <button
          type="button"
          className={styles.previewBtn}
          aria-label="Preview survey"
          onClick={() => showToast({ message: 'Preview survey', variant: 'success' })}
        >
          <span className="wm-visibility" />
        </button>
      </div>
    </WuSecondaryNavbar>
  );
}
