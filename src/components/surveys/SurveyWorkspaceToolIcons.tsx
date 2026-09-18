'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { BlockFlowModal } from '@/components/surveys/BlockFlowModal';
import { BulkEditModeIcon } from '@/components/surveys/BulkEditModeIcon';
import { CustomJsModal } from '@/components/surveys/CustomJsModal';
import { PreDefinedLogicCriteriaModal } from '@/components/surveys/PreDefinedLogicCriteriaModal';
import { RemoveAllLogicModal } from '@/components/surveys/RemoveAllLogicModal';
import { SearchReplaceModal } from '@/components/surveys/SearchReplaceModal';
import { SurveyApprovalsModal } from '@/components/surveys/SurveyApprovalsModal';
import { UpdateQuestionCodesModal } from '@/components/surveys/UpdateQuestionCodesModal';
import { useSurveyEditorBulkEdit } from '@/components/surveys/SurveyEditorBulkEditContext';
import { DEFAULT_SURVEY_CUSTOM_JS } from '@/data/mock-survey-custom-js';
import { surveyHasApprovalTab } from '@/data/mock-survey-approval';
import styles from './SurveyWorkspaceToolIcons.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface ToolIconItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export function SurveyWorkspaceToolIcons() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const showApprovals = surveyHasApprovalTab(surveyId);
  const { bulkEditModeEnabled, enableBulkEditMode, disableBulkEditMode } =
    useSurveyEditorBulkEdit();
  const [searchReplaceOpen, setSearchReplaceOpen] = useState(false);
  const [updateQuestionCodesOpen, setUpdateQuestionCodesOpen] = useState(false);
  const [logicCriteriaOpen, setLogicCriteriaOpen] = useState(false);
  const [blockFlowOpen, setBlockFlowOpen] = useState(false);
  const [customJsOpen, setCustomJsOpen] = useState(false);
  const [removeAllLogicOpen, setRemoveAllLogicOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [customJs, setCustomJs] = useState(DEFAULT_SURVEY_CUSTOM_JS);

  function handleBulkEditToggle(): void {
    if (bulkEditModeEnabled) {
      disableBulkEditMode();
      showToast({ message: 'Bulk Edit Mode disabled', variant: 'success' });
      return;
    }
    enableBulkEditMode();
    showToast({ message: 'Bulk Edit Mode enabled', variant: 'success' });
  }

  function handleClearCustomJs(): void {
    setCustomJs('');
  }

  const tools: ToolIconItem[] = [
    {
      id: 'bulk-edit',
      label: 'Bulk Edit Mode',
      icon: <BulkEditModeIcon className={`${styles.toolSvgIcon} ${styles.bulkEditIcon}`} />,
      active: bulkEditModeEnabled,
      onClick: handleBulkEditToggle,
    },
    {
      id: 'custom-js',
      label: 'Custom JS',
      icon: <span className={`wm-javascript ${styles.jsIcon}`} aria-hidden />,
      onClick: () => setCustomJsOpen(true),
    },
  ];

  const menuTools: ToolIconItem[] = [
    {
      id: 'search-replace',
      label: 'Search & Replace',
      icon: <span className={`wm-find-replace ${styles.menuItemIcon}`} aria-hidden />,
      onClick: () => setSearchReplaceOpen(true),
    },
    {
      id: 'update-question-codes',
      label: 'Update Question Codes',
      icon: <span className={`wm-pin ${styles.menuItemIcon}`} aria-hidden />,
      onClick: () => setUpdateQuestionCodesOpen(true),
    },
    {
      id: 'logic-criteria',
      label: 'View Logic Criteria',
      icon: <span className={`wc-logic ${styles.menuItemIcon}`} aria-hidden />,
      onClick: () => setLogicCriteriaOpen(true),
    },
    {
      id: 'block-flow',
      label: 'Block Flow',
      icon: <span className={`wm-call-split ${styles.menuItemIcon}`} aria-hidden />,
      onClick: () => setBlockFlowOpen(true),
    },
    {
      id: 'remove-all-logic',
      label: 'Remove All Logic',
      icon: (
        <span className={`${styles.removeLogicIcon} ${styles.menuItemIcon}`} aria-hidden>
          <span className="wc-logic" />
        </span>
      ),
      onClick: () => setRemoveAllLogicOpen(true),
    },
    ...(showApprovals
      ? [
          {
            id: 'approvals',
            label: 'Approvals',
            icon: <span className={`wm-verified ${styles.menuItemIcon}`} aria-hidden />,
            onClick: () => setApprovalsModalOpen(true),
          } satisfies ToolIconItem,
        ]
      : []),
  ];

  return (
    <>
      <div className={styles.tools} role="toolbar" aria-label="Workspace tools">
        {tools.map((tool) => (
          <WuTooltip key={tool.id} content={tool.label} position="bottom">
            <button
              type="button"
              className={`${styles.toolBtn} ${tool.active ? styles.toolBtnActive : ''}`}
              aria-label={tool.label}
              aria-pressed={tool.id === 'bulk-edit' ? tool.active : undefined}
              onClick={tool.onClick}
            >
              {tool.icon}
            </button>
          </WuTooltip>
        ))}
        <WuMenu
          align="end"
          Trigger={
            <button
              type="button"
              className={styles.toolBtn}
              aria-label="More tools"
              title="More tools"
            >
              <span className="wm-more-vert" aria-hidden />
            </button>
          }
        >
          {menuTools.map((tool) => (
            <WuMenuItem
              key={tool.id}
              className={styles.menuItem}
              onSelect={() => tool.onClick()}
            >
              <span className={styles.menuItemContent}>
                {tool.icon}
                <span>{tool.label}</span>
              </span>
            </WuMenuItem>
          ))}
        </WuMenu>
        <span className={styles.divider} aria-hidden />
      </div>

      {searchReplaceOpen ? (
        <SearchReplaceModal open onOpenChange={setSearchReplaceOpen} />
      ) : null}
      {updateQuestionCodesOpen ? (
        <UpdateQuestionCodesModal open onOpenChange={setUpdateQuestionCodesOpen} />
      ) : null}
      {logicCriteriaOpen ? (
        <PreDefinedLogicCriteriaModal open onOpenChange={setLogicCriteriaOpen} />
      ) : null}
      {blockFlowOpen ? <BlockFlowModal open onOpenChange={setBlockFlowOpen} /> : null}
      {customJsOpen ? (
        <CustomJsModal
          open
          value={customJs}
          onSave={setCustomJs}
          onOpenChange={setCustomJsOpen}
        />
      ) : null}
      {removeAllLogicOpen ? (
        <RemoveAllLogicModal
          open
          onClearCustomJs={handleClearCustomJs}
          onOpenChange={setRemoveAllLogicOpen}
        />
      ) : null}
      {approvalsModalOpen ? (
        <SurveyApprovalsModal
          open
          onOpenChange={setApprovalsModalOpen}
          surveyId={surveyId}
        />
      ) : null}
    </>
  );
}
