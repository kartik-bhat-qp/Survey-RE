'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { BlockFlowModal } from '@/components/surveys/BlockFlowModal';
import { BulkEditModeIcon } from '@/components/surveys/BulkEditModeIcon';
import { CustomJsModal } from '@/components/surveys/CustomJsModal';
import { PreDefinedLogicCriteriaModal } from '@/components/surveys/PreDefinedLogicCriteriaModal';
import { RemoveAllLogicModal } from '@/components/surveys/RemoveAllLogicModal';
import { SearchReplaceIcon } from '@/components/surveys/SearchReplaceIcon';
import { SearchReplaceModal } from '@/components/surveys/SearchReplaceModal';
import { useSurveyEditorBulkEdit } from '@/components/surveys/SurveyEditorBulkEditContext';
import { DEFAULT_SURVEY_CUSTOM_JS } from '@/data/mock-survey-custom-js';
import styles from './SurveyWorkspaceQuickTools.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface QuickToolItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

interface SurveyWorkspaceQuickToolsProps {
  onAddBlock: () => void;
}

export function SurveyWorkspaceQuickTools({
  onAddBlock,
}: SurveyWorkspaceQuickToolsProps) {
  const { showToast } = useWuShowToast();
  const { bulkEditModeEnabled, enableBulkEditMode, disableBulkEditMode } =
    useSurveyEditorBulkEdit();
  const [searchReplaceOpen, setSearchReplaceOpen] = useState(false);
  const [logicCriteriaOpen, setLogicCriteriaOpen] = useState(false);
  const [blockFlowOpen, setBlockFlowOpen] = useState(false);
  const [customJsOpen, setCustomJsOpen] = useState(false);
  const [removeAllLogicOpen, setRemoveAllLogicOpen] = useState(false);
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

  const tools: QuickToolItem[] = [
    {
      id: 'bulk-edit',
      label: 'Bulk Edit Mode',
      icon: (
        <BulkEditModeIcon className={`${styles.toolSvgIcon} ${styles.bulkEditIcon}`} />
      ),
      active: bulkEditModeEnabled,
      onClick: handleBulkEditToggle,
    },
    {
      id: 'search-replace',
      label: 'Search & Replace',
      icon: <SearchReplaceIcon className={styles.toolSvgIcon} />,
      onClick: () => setSearchReplaceOpen(true),
    },
    {
      id: 'logic-criteria',
      label: 'View Logic Criteria',
      icon: <span className="wm-filter-list" aria-hidden />,
      onClick: () => setLogicCriteriaOpen(true),
    },
    {
      id: 'block-flow',
      label: 'Block Flow',
      icon: <span className="wm-call-split" aria-hidden />,
      onClick: () => setBlockFlowOpen(true),
    },
    {
      id: 'custom-js',
      label: 'Custom JS',
      icon: <span className={`wm-javascript ${styles.jsIcon}`} aria-hidden />,
      onClick: () => setCustomJsOpen(true),
    },
    {
      id: 'remove-all-logic',
      label: 'Remove All Logic',
      icon: <span className="wm-delete" aria-hidden />,
      onClick: () => setRemoveAllLogicOpen(true),
    },
  ];

  return (
    <>
      <div className={styles.tools} role="toolbar" aria-label="Workspace tools">
        <button type="button" className={styles.addBlockBtn} onClick={onAddBlock}>
          <span className="wm-add" aria-hidden />
          Add Block
        </button>
        <span className={styles.divider} aria-hidden />
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
      </div>

      {searchReplaceOpen ? (
        <SearchReplaceModal open onOpenChange={setSearchReplaceOpen} />
      ) : null}
      {logicCriteriaOpen ? (
        <PreDefinedLogicCriteriaModal open onOpenChange={setLogicCriteriaOpen} />
      ) : null}
      {blockFlowOpen ? (
        <BlockFlowModal open onOpenChange={setBlockFlowOpen} />
      ) : null}
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
    </>
  );
}
