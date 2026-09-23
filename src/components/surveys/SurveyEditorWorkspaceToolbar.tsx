'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { NavLink } from '@/components/surveys/NavLink';
import { TestResponsesTrigger } from '@/components/surveys/TestResponsesTrigger';
import { SurveyWorkspaceToolIcons } from '@/components/surveys/SurveyWorkspaceToolIcons';
import {
  PublishLicenseConflictModal,
  type PublishLicenseModalView,
} from '@/components/surveys/PublishLicenseConflictModal';
import { useSurveyFooterBrand } from '@/components/surveys/useSurveyFooterBrand';
import { useSurveyWorkspaceSections } from '@/components/surveys/SurveyWorkspaceSectionsContext';
import { useEssentialsSurveyReviewing } from '@/hooks/useEssentialsAccountUnderReview';
import {
  collectSurveyLicenseConflicts,
  getUserPlanLicense,
  type SurveyLicenseConflict,
} from '@/data/mock-add-question-types';
import {
  SURVEY_WORKSPACE_TOOLS,
  type SurveyWorkspaceTool,
} from '@/components/surveys/survey-workspace-tools';
import { surveyHasDesignTab } from '@/data/mock-survey-design';
import {
  readSurveyApprovalState,
  subscribeSurveyApprovalState,
  surveyHasApprovalTab,
  writeSurveyApprovalState,
} from '@/data/mock-survey-approval';
import { isAiLensSurvey, MOCK_AI_LENS_FINDINGS, summarizeAiLensFindings } from '@/data/mock-ai-lens';
import {
  ESSENTIALS_SURVEY_REVIEWING_TOOLTIP,
  essentialsPublishShouldBeBlocked,
  runEssentialsPhishingReview,
} from '@/data/mock-essentials-phishing-review';
import styles from './SurveyEditorWorkspaceToolbar.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const WuLoader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLoader })),
  { ssr: false }
);

const SURVEY_VERSION_TOOLTIP = 'Survey Version';
const PATH_SIMULATOR_TOOLTIP = 'Path Simulator';

type PublishMode = 'draft' | 'publish';

function getToolHref(tool: SurveyWorkspaceTool, surveyId: number): string | null {
  if (tool === 'workspace') return `/surveys/${surveyId}`;
  if (tool === 'design' && surveyHasDesignTab(surveyId)) return `/surveys/${surveyId}/design`;
  if (tool === 'media-library') return `/surveys/${surveyId}/media-library`;
  if (tool === 'advance-quotas') return `/surveys/${surveyId}/advance-quotas`;
  if (tool === 'settings') return `/surveys/${surveyId}/settings`;
  return null;
}

function getActiveTool(pathname: string, surveyId: number): SurveyWorkspaceTool {
  if (pathname === `/surveys/${surveyId}/design`) return 'design';
  if (pathname === `/surveys/${surveyId}/media-library`) return 'media-library';
  if (pathname === `/surveys/${surveyId}/advance-quotas`) return 'advance-quotas';
  if (pathname === `/surveys/${surveyId}/settings`) return 'settings';
  if (
    pathname === `/surveys/${surveyId}/languages` ||
    pathname === `/surveys/${surveyId}/finish-options` ||
    pathname === `/surveys/${surveyId}/variables`
  ) {
    return 'settings';
  }
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
  const surveyReviewing = useEssentialsSurveyReviewing();
  const requiresApproval = surveyHasApprovalTab(surveyId);

  const blockEssentialsPublish = useCallback((): boolean => {
    if (!essentialsPublishShouldBeBlocked(sections, surveyId)) return false;
    setLicenseModalOpen(false);
    return runEssentialsPhishingReview(showToast);
  }, [sections, showToast, surveyId]);

  useEffect(() => {
    if (!requiresApproval) return;
    const applyPublished = (published: boolean): void => {
      setMode(published ? 'publish' : 'draft');
    };
    applyPublished(readSurveyApprovalState(surveyId).published);
    return subscribeSurveyApprovalState(surveyId, (state) => {
      applyPublished(state.published);
    });
  }, [requiresApproval, surveyId]);

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
    if (blockEssentialsPublish()) return;
    setMode('publish');
    setLicenseModalOpen(false);
    setLicenseModalView('conflicts');
    showToast({ message: 'Survey published', variant: 'success' });
  }, [blockEssentialsPublish, showToast]);

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
    if (requiresApproval) {
      const current = readSurveyApprovalState(surveyId);
      writeSurveyApprovalState(surveyId, { ...current, published: false });
    }
    showToast({ message: 'Switched to Draft', variant: 'success' });
  }, [requiresApproval, showToast, surveyId]);

  function selectMode(next: PublishMode) {
    if (next === mode) return;

    if (next === 'publish') {
      if (requiresApproval) return;
      if (blockEssentialsPublish()) return;

      if (isAiLensSurvey(surveyId)) {
        const summary = summarizeAiLensFindings(MOCK_AI_LENS_FINDINGS);
        if (summary.allOpen > 0 && !sessionStorage.getItem('ai-lens-publish-anyway')) {
          window.dispatchEvent(new Event('questionpro-ai-lens-open'));
          showToast({
            message:
              'Outstanding Pro Insights findings. Resolve them in Pro Insights, or choose Publish anyway.',
            variant: 'info',
          });
          return;
        }
        sessionStorage.removeItem('ai-lens-publish-anyway');
      }

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

  useEffect(() => {
    if (!isAiLensSurvey(surveyId)) return;
    const onPublishAnyway = () => {
      sessionStorage.setItem('ai-lens-publish-anyway', '1');
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
    };
    window.addEventListener('questionpro-ai-lens-publish-anyway', onPublishAnyway);
    return () =>
      window.removeEventListener('questionpro-ai-lens-publish-anyway', onPublishAnyway);
  }, [footerBrand, logicByQuestionKey, sections, surveyId]);

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

  const showAiLens = isAiLensSurvey(surveyId);

  const showPublishArea =
    activeTool !== 'advance-quotas' &&
    activeTool !== 'settings' &&
    activeTool !== 'media-library' &&
    activeTool !== 'design';
  const showDesignPreview = activeTool === 'design';
  const showMediaLibraryPreview = activeTool === 'media-library';

  const isPathSimulator = pathname === `/surveys/${surveyId}/path-simulator`;

  const pathSimulatorButton = (
    <WuTooltip content={PATH_SIMULATOR_TOOLTIP} position="bottom">
      <button
        type="button"
        className={`${styles.previewBtn} ${isPathSimulator ? styles.previewBtnActive : ''}`}
        aria-label={PATH_SIMULATOR_TOOLTIP}
        aria-pressed={isPathSimulator}
        onClick={() => {
          if (isPathSimulator) {
            router.push(`/surveys/${surveyId}`);
            return;
          }
          router.push(`/surveys/${surveyId}/path-simulator`);
        }}
      >
        <span className="wm-share" aria-hidden />
      </button>
    </WuTooltip>
  );

  const previewButton = (
    <WuTooltip
      content={surveyReviewing ? ESSENTIALS_SURVEY_REVIEWING_TOOLTIP : 'Preview survey'}
      position="bottom"
    >
      <button
        type="button"
        className={`${styles.previewBtn} ${surveyReviewing ? styles.previewBtnReviewing : ''}`}
        aria-label={surveyReviewing ? ESSENTIALS_SURVEY_REVIEWING_TOOLTIP : 'Preview survey'}
        aria-busy={surveyReviewing}
        disabled={surveyReviewing}
        onClick={() => {
          if (surveyReviewing) return;
          showToast({ message: 'Preview survey', variant: 'success' });
        }}
      >
        {surveyReviewing ? (
          <WuLoader variant="spinner" size="sm" color="#ffffff" aria-hidden />
        ) : (
          <span className="wm-visibility" aria-hidden />
        )}
      </button>
    </WuTooltip>
  );

  return (
    <>
      <WuSecondaryNavbar Links={links} className={styles.navbar}>
        {showPublishArea ? (
          <div className={styles.publishArea}>
            <SurveyWorkspaceToolIcons />
            {showAiLens ? (
              <WuTooltip content="Pro Insights" position="bottom">
                <button
                  type="button"
                  className={styles.reviewBtn}
                  aria-label="Pro Insights"
                  onClick={() =>
                    window.dispatchEvent(new Event('questionpro-ai-lens-open'))
                  }
                >
                  <span className={`wc-ai ${styles.reviewAiIcon}`} aria-hidden />
                  Pro Insights
                </button>
              </WuTooltip>
            ) : (
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
            )}
            <TestResponsesTrigger />
            <div className={styles.statusToggle} role="group" aria-label="Survey status">
              <button
                type="button"
                className={mode === 'draft' ? styles.toggleActive : styles.toggleInactive}
                aria-pressed={mode === 'draft'}
                onClick={() => selectMode('draft')}
              >
                Draft
              </button>
              {requiresApproval ? (
                <WuTooltip
                  content="A reviewer publishes this survey after they approve it."
                  position="bottom"
                >
                  <span>
                    <button
                      type="button"
                      className={`${mode === 'publish' ? styles.toggleActive : styles.toggleInactive} ${styles.toggleDisabled}`}
                      aria-pressed={mode === 'publish'}
                      aria-disabled="true"
                      disabled
                    >
                      Publish
                    </button>
                  </span>
                </WuTooltip>
              ) : (
                <button
                  type="button"
                  className={mode === 'publish' ? styles.toggleActive : styles.toggleInactive}
                  aria-pressed={mode === 'publish'}
                  onClick={() => selectMode('publish')}
                >
                  Publish
                </button>
              )}
            </div>
            {pathSimulatorButton}
            {previewButton}
          </div>
        ) : showMediaLibraryPreview ? (
          <div className={styles.publishArea}>{previewButton}</div>
        ) : showDesignPreview ? (
          <div className={styles.publishArea}>
            <TestResponsesTrigger />
            {pathSimulatorButton}
            {previewButton}
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
