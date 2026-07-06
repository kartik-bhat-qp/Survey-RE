'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import { SearchReplaceModal } from '@/components/surveys/SearchReplaceModal';
import { SearchReplaceIcon } from '@/components/surveys/SearchReplaceIcon';
import { TestResponsesModal } from '@/components/surveys/TestResponsesModal';
import { RemoveAllLogicModal } from '@/components/surveys/RemoveAllLogicModal';
import { CustomJsModal } from '@/components/surveys/CustomJsModal';
import { PreDefinedLogicCriteriaModal } from '@/components/surveys/PreDefinedLogicCriteriaModal';
import { UpdateQuestionCodesModal } from '@/components/surveys/UpdateQuestionCodesModal';
import {
  useSurveyEditorPhase,
  type SurveyEditorPhase,
} from '@/components/surveys/SurveyEditorPhaseContext';
import { getSurveyEditorPhasePath } from '@/components/surveys/survey-editor-navigation';
import { useSurveyEditorBulkEdit } from '@/components/surveys/SurveyEditorBulkEditContext';
import { DEFAULT_SURVEY_CUSTOM_JS } from '@/data/mock-survey-custom-js';
import styles from './SurveyEditorPhaseTabs.module.css';

const WuPrimaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPrimaryNavbar })),
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

const WuMenuItemGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItemGroup })),
  { ssr: false }
);

const PHASE_TABS: { id: SurveyEditorPhase; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integration', label: 'Integration' },
];

function deferOpenChange(setOpen: (open: boolean) => void, open: boolean) {
  queueMicrotask(() => setOpen(open));
}

export function SurveyEditorPhaseTabs() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const { activePhase, setActivePhase } = useSurveyEditorPhase();
  const { bulkEditModeEnabled, enableBulkEditMode, disableBulkEditMode } =
    useSurveyEditorBulkEdit();
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [searchReplaceOpen, setSearchReplaceOpen] = useState(false);
  const [testResponsesOpen, setTestResponsesOpen] = useState(false);
  const [updateQuestionCodesOpen, setUpdateQuestionCodesOpen] = useState(false);
  const [logicCriteriaOpen, setLogicCriteriaOpen] = useState(false);
  const [customJsOpen, setCustomJsOpen] = useState(false);
  const [removeAllLogicOpen, setRemoveAllLogicOpen] = useState(false);
  const [customJs, setCustomJs] = useState(DEFAULT_SURVEY_CUSTOM_JS);

  const handleToolsMenuOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setToolsMenuOpen, open);
  }, []);

  const handleDownloadMenuOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setDownloadMenuOpen, open);
  }, []);

  const handleSearchReplaceOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setSearchReplaceOpen, open);
  }, []);

  const handleTestResponsesOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setTestResponsesOpen, open);
  }, []);

  const handleUpdateQuestionCodesOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setUpdateQuestionCodesOpen, open);
  }, []);

  const handleLogicCriteriaOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setLogicCriteriaOpen, open);
  }, []);

  const handleCustomJsOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setCustomJsOpen, open);
  }, []);

  const handleRemoveAllLogicOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setRemoveAllLogicOpen, open);
  }, []);

  function handleOpenUpdateQuestionCodes() {
    deferOpenChange(setToolsMenuOpen, false);
    deferOpenChange(setUpdateQuestionCodesOpen, true);
  }

  function handleOpenLogicCriteria() {
    deferOpenChange(setToolsMenuOpen, false);
    deferOpenChange(setLogicCriteriaOpen, true);
  }

  function handleOpenCustomJs() {
    deferOpenChange(setToolsMenuOpen, false);
    deferOpenChange(setCustomJsOpen, true);
  }

  function handleOpenRemoveAllLogic() {
    deferOpenChange(setToolsMenuOpen, false);
    deferOpenChange(setRemoveAllLogicOpen, true);
  }

  function handleClearCustomJs() {
    setCustomJs('');
  }

  function handleToolsAction(label: string) {
    showToast({ message: label, variant: 'success' });
    deferOpenChange(setToolsMenuOpen, false);
  }

  function handleDownloadAction(label: string) {
    showToast({ message: label, variant: 'success' });
    deferOpenChange(setDownloadMenuOpen, false);
  }

  function handleBulkEditModeToggle() {
    if (bulkEditModeEnabled) {
      disableBulkEditMode();
      showToast({ message: 'Bulk Edit Mode disabled', variant: 'success' });
    } else {
      enableBulkEditMode();
      showToast({ message: 'Bulk Edit Mode enabled', variant: 'success' });
    }
    deferOpenChange(setToolsMenuOpen, false);
  }

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
    <>
      <WuPrimaryNavbar Links={links}>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.iconBtn} ${searchReplaceOpen ? styles.iconBtnActive : ''}`}
            aria-label="Search and replace"
            onClick={() => setSearchReplaceOpen(true)}
          >
            <SearchReplaceIcon className={styles.actionIcon} />
          </button>
          <WuMenu
            open={downloadMenuOpen}
            onOpenChange={handleDownloadMenuOpenChange}
            align="end"
            variant="outlined"
            className={styles.toolsMenu}
            Trigger={
              <button
                type="button"
                className={`${styles.iconBtn} ${downloadMenuOpen ? styles.iconBtnActive : ''}`}
                aria-label="Download"
                aria-haspopup="menu"
                aria-expanded={downloadMenuOpen}
              >
                <span className={`wm-download ${styles.actionIcon}`} aria-hidden />
              </button>
            }
          >
            <WuMenuItemGroup
              className={styles.toolsMenuGroup}
              Label={
                <div className={styles.toolsMenuSectionLabel}>
                  <span className={styles.toolsMenuSectionHeading}>Download</span>
                  <div className={styles.toolsMenuSectionDivider} aria-hidden />
                </div>
              }
            >
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={() => handleDownloadAction('Download PDF V3')}
              >
                PDF V3
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={() => handleDownloadAction('Download Microsoft Word')}
              >
                Microsoft Word
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={() => handleDownloadAction('Download PDF')}
              >
                PDF
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={() => handleDownloadAction('Print')}
              >
                Print
              </WuMenuItem>
            </WuMenuItemGroup>
          </WuMenu>
          <WuMenu
            open={toolsMenuOpen}
            onOpenChange={handleToolsMenuOpenChange}
            align="end"
            variant="outlined"
            className={styles.toolsMenu}
            Trigger={
              <button
                type="button"
                className={`${styles.toolsBtn} ${toolsMenuOpen ? styles.toolsBtnActive : ''}`}
                aria-haspopup="menu"
                aria-expanded={toolsMenuOpen}
              >
                Tools
                <span className="wm-arrow-drop-down" />
              </button>
            }
          >
            <WuMenuItemGroup
              className={styles.toolsMenuGroup}
              Label={
                <div className={styles.toolsMenuSectionLabel}>
                  <span className={styles.toolsMenuSectionHeading}>Survey Options</span>
                  <div className={styles.toolsMenuSectionDivider} aria-hidden />
                </div>
              }
            >
              <WuMenuItem
                className={
                  bulkEditModeEnabled ? styles.toolsMenuItemExit : styles.toolsMenuItem
                }
                onSelect={handleBulkEditModeToggle}
              >
                {bulkEditModeEnabled ? 'Exit Bulk Edit Mode' : 'Bulk Edit Mode'}
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={handleOpenUpdateQuestionCodes}
              >
                Update Question Codes
              </WuMenuItem>
            </WuMenuItemGroup>
            <WuMenuItemGroup
              className={styles.toolsMenuGroup}
              Label={
                <div className={styles.toolsMenuSectionLabel}>
                  <span className={styles.toolsMenuSectionHeading}>Logic</span>
                  <div className={styles.toolsMenuSectionDivider} aria-hidden />
                </div>
              }
            >
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={handleOpenLogicCriteria}
              >
                View Logic Criteria
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={handleOpenCustomJs}
              >
                Custom JS
              </WuMenuItem>
              <WuMenuItem
                className={styles.toolsMenuItem}
                onSelect={handleOpenRemoveAllLogic}
              >
                Remove All Logic
              </WuMenuItem>
            </WuMenuItemGroup>
          </WuMenu>
          <button
            type="button"
            className={styles.testResponsesBtn}
            onClick={() => setTestResponsesOpen(true)}
          >
            Test Responses
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
      </WuPrimaryNavbar>
      {searchReplaceOpen ? (
        <SearchReplaceModal open onOpenChange={handleSearchReplaceOpenChange} />
      ) : null}
      {testResponsesOpen ? (
        <TestResponsesModal open onOpenChange={handleTestResponsesOpenChange} />
      ) : null}
      {updateQuestionCodesOpen ? (
        <UpdateQuestionCodesModal
          open
          onOpenChange={handleUpdateQuestionCodesOpenChange}
        />
      ) : null}
      {logicCriteriaOpen ? (
        <PreDefinedLogicCriteriaModal
          open
          onOpenChange={handleLogicCriteriaOpenChange}
        />
      ) : null}
      {customJsOpen ? (
        <CustomJsModal
          open
          value={customJs}
          onSave={setCustomJs}
          onOpenChange={handleCustomJsOpenChange}
        />
      ) : null}
      {removeAllLogicOpen ? (
        <RemoveAllLogicModal
          open
          onClearCustomJs={handleClearCustomJs}
          onOpenChange={handleRemoveAllLogicOpenChange}
        />
      ) : null}
    </>
  );
}
