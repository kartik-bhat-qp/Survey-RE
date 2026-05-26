'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
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

function getToolHref(tool: SurveyWorkspaceTool, surveyId: number): string | null {
  if (tool === 'workspace') return `/surveys/${surveyId}`;
  if (tool === 'advance-quotas') return `/surveys/${surveyId}/advance-quotas`;
  return null;
}

function getActiveTool(pathname: string, surveyId: number): SurveyWorkspaceTool {
  if (pathname === `/surveys/${surveyId}/advance-quotas`) return 'advance-quotas';
  return 'workspace';
}

interface SurveyEditorWorkspaceToolbarProps {
  surveyId: number;
}

export function SurveyEditorWorkspaceToolbar({
  surveyId,
}: SurveyEditorWorkspaceToolbarProps) {
  const { showToast } = useWuShowToast();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const activeTool = getActiveTool(pathname, surveyId);
  const [mode, setMode] = useState<PublishMode>('draft');

  function selectMode(next: PublishMode) {
    setMode(next);
    showToast({
      message: next === 'draft' ? 'Switched to Draft' : 'Switched to Publish',
      variant: 'success',
    });
  }

  const handleToolClick = useCallback(
    (tool: SurveyWorkspaceTool, label: string) => {
      const href = getToolHref(tool, surveyId);
      if (href) {
        router.push(href);
        return;
      }
      showToast({ message: `${label} is not available in this prototype`, variant: 'info' });
    },
    [router, showToast, surveyId]
  );

  const links = useMemo(
    () =>
      SURVEY_WORKSPACE_TOOLS.map((tool) => {
        const href = getToolHref(tool.id, surveyId);
        return {
          link: (
            <NavLink
              href={href ?? '#'}
              variant="secondary"
              active={activeTool === tool.id}
              onClick={(event) => {
                event.preventDefault();
                handleToolClick(tool.id, tool.label);
              }}
            >
              {tool.label}
            </NavLink>
          ),
          imgOrIcon: <span className={tool.icon} aria-hidden />,
        };
      }),
    [activeTool, handleToolClick, surveyId]
  );

  const showPublishArea = activeTool !== 'advance-quotas';

  return (
    <WuSecondaryNavbar Links={links} className={styles.navbar}>
      {showPublishArea ? (
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
      ) : null}
    </WuSecondaryNavbar>
  );
}
