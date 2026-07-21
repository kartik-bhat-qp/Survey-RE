'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { NavLink } from '@/components/surveys/NavLink';
import {
  PublishLicenseConflictModal,
  type PublishLicenseModalView,
} from '@/components/surveys/PublishLicenseConflictModal';
import { useSurveyFooterBrand } from '@/components/surveys/useSurveyFooterBrand';
import { useSurveyWorkspaceSections } from '@/components/surveys/SurveyWorkspaceSectionsContext';
import {
  collectSurveyLicenseConflicts,
  getUserPlanLicense,
  type SurveyLicenseConflict,
} from '@/data/mock-add-question-types';
import {
  SURVEY_WORKSPACE_TOOLS,
  type SurveyWorkspaceTool,
} from '@/components/surveys/survey-workspace-tools';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const SURVEY_VERSION_TOOLTIP = 'Survey Version';

type PublishMode = 'draft' | 'publish';

function getToolHref(tool: SurveyWorkspaceTool, surveyId: number): string | null {
  if (tool === 'workspace') return `/surveys/${surveyId}`;
  if (tool === 'languages') return `/surveys/${surveyId}/languages`;
  if (tool === 'finish-options') return `/surveys/${surveyId}/finish-options`;
  if (tool === 'advance-quotas') return `/surveys/${surveyId}/advance-quotas`;
  if (tool === 'variables') return `/surveys/${surveyId}/variables`;
  if (tool === 'settings') return `/surveys/${surveyId}/settings`;
  return null;
}

function getActiveTool(pathname: string, surveyId: number): SurveyWorkspaceTool {
  if (pathname === `/surveys/${surveyId}/languages`) return 'languages';
  if (pathname === `/surveys/${surveyId}/finish-options`) return 'finish-options';
  if (pathname === `/surveys/${surveyId}/advance-quotas`) return 'advance-quotas';
  if (pathname === `/surveys/${surveyId}/variables`) return 'variables';
  if (pathname === `/surveys/${surveyId}/settings`) return 'settings';
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
  const footerBrand = useSurveyFooterBrand();
  const { sections, logicByQuestionKey, removeQuestions, clearShowHideLogic } =
    useSurveyWorkspaceSections();
  const [mode, setMode] = useState<PublishMode>('draft');
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseModalView, setLicenseModalView] =
    useState<PublishLicenseModalView>('conflicts');
  const [licenseConflicts, setLicenseConflicts] = useState<SurveyLicenseConflict[]>([]);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);

  useEffect(() => {
    if (!licenseModalOpen || licenseModalView !== 'conflicts') return;
    const nextConflicts = collectSurveyLicenseConflicts(
      sections,
      getUserPlanLicense(footerBrand),
      logicByQuestionKey
    );
    setLicenseConflicts(nextConflicts);
    if (nextConflicts.length === 0) {
      setLicenseModalView('publish-confirm');
    }
  }, [sections, logicByQuestionKey, licenseModalOpen, licenseModalView, footerBrand]);

  const handleLicenseModalOpenChange = useCallback((open: boolean) => {
    setLicenseModalOpen(open);
    if (!open) {
      setLicenseModalView('conflicts');
    }
  }, []);

  const handleConfirmPublish = useCallback(() => {
    setMode('publish');
    setLicenseModalOpen(false);
    setLicenseModalView('conflicts');
    showToast({ message: 'Survey published', variant: 'success' });
  }, [showToast]);

  const handleDeleteLicensedQuestion = useCallback(
    (conflict: SurveyLicenseConflict) => {
      const target = { sectionId: conflict.sectionId, questionId: conflict.questionId };

      if (conflict.conflictKind === 'show-hide-logic') {
        clearShowHideLogic([target]);
        showToast({
          message: 'Show/Hide Options logic removed',
          variant: 'success',
        });
        return;
      }

      removeQuestions([target]);
      showToast({
        message: `${conflict.typeLabel} question deleted`,
        variant: 'success',
      });
    },
    [clearShowHideLogic, removeQuestions, showToast]
  );

  const handleUpgradeLicense = useCallback(() => {
    setLicenseModalOpen(false);
    showToast({ message: 'Upgrade options opened', variant: 'success' });
  }, [showToast]);

  const handleConfirmDraft = useCallback(() => {
    setMode('draft');
    showToast({ message: 'Switched to Draft', variant: 'success' });
  }, [showToast]);

  function selectMode(next: PublishMode) {
    if (next === mode) return;

    if (next === 'publish') {
      const conflicts = collectSurveyLicenseConflicts(
        sections,
        getUserPlanLicense(footerBrand),
        logicByQuestionKey
      );
      if (conflicts.length > 0) {
        setLicenseConflicts(conflicts);
        setLicenseModalView('conflicts');
        setLicenseModalOpen(true);
        return;
      }

      setLicenseConflicts([]);
      setLicenseModalView('publish-confirm');
      setLicenseModalOpen(true);
      return;
    }

    setDraftConfirmOpen(true);
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
          imgOrIcon:
            tool.id === 'advance-quotas' || tool.id === 'advanced-quota' ? (
              <span className={styles.iconWithBadge}>
                <span className={tool.icon} aria-hidden />
                {tool.id === 'advance-quotas' ? (
                  <span className={styles.newBadge}>New</span>
                ) : (
                  <span className={styles.legacyBadge}>Legacy</span>
                )}
              </span>
            ) : (
              <span className={tool.icon} aria-hidden />
            ),
        };
      }),
    [activeTool, handleToolClick, surveyId]
  );

  const showPublishArea =
    activeTool !== 'advance-quotas' &&
    activeTool !== 'settings' &&
    activeTool !== 'languages' &&
    activeTool !== 'finish-options' &&
    activeTool !== 'variables';

  return (
    <>
      <WuSecondaryNavbar Links={links} className={styles.navbar}>
        {showPublishArea ? (
          <div className={styles.publishArea}>
            <WuTooltip content={SURVEY_VERSION_TOOLTIP} position="bottom">
              <button
                type="button"
                className={styles.surveyVersionBtn}
                aria-label={SURVEY_VERSION_TOOLTIP}
                onClick={() =>
                  showToast({ message: SURVEY_VERSION_TOOLTIP, variant: 'success' })
                }
              >
                <span className="wm-history" aria-hidden />
              </button>
            </WuTooltip>
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
      <PublishLicenseConflictModal
        open={licenseModalOpen}
        view={licenseModalView}
        onOpenChange={handleLicenseModalOpenChange}
        conflicts={licenseConflicts}
        onDeleteQuestion={handleDeleteLicensedQuestion}
        onUpgradeLicense={handleUpgradeLicense}
        onConfirmPublish={handleConfirmPublish}
      />
      <ConfirmModal
        open={draftConfirmOpen}
        onOpenChange={setDraftConfirmOpen}
        title="Switch to draft"
        description="Would you like to switch your survey to draft? Please note that data collection will be paused when the survey is in draft mode."
        confirmLabel="Draft"
        onConfirm={handleConfirmDraft}
      />
    </>
  );
}
