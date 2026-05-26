'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  SURVEY_WORKSPACE_TOOLS,
  type SurveyWorkspaceTool,
} from '@/components/surveys/survey-workspace-tools';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

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

  return (
    <div className={styles.toolbar}>
      <div className={styles.tools}>
        {SURVEY_WORKSPACE_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={styles.toolBtn}
            data-active={activeTool === tool.id ? 'true' : undefined}
            onClick={() => handleToolClick(tool.id, tool.label)}
          >
            <span className={tool.icon} aria-hidden />
            {tool.label}
          </button>
        ))}
      </div>
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
    </div>
  );
}
