'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { formatNumber } from '@/data/mock-utils';
import type { SurveyFolder } from '@/data/mock-surveys';
import styles from './SurveyFolderSidebar.module.css';

export const SURVEY_FOLDERS_SHELL_SELECTOR = '[data-survey-folders-shell]';
export const SURVEY_FOLDERS_SHELL_COLLAPSED_SELECTOR = '[data-survey-folders-shell-collapsed]';

interface SurveyFolderSidebarProps {
  folders: SurveyFolder[];
  selectedFolderId: string;
  collapsed: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  onSelectFolder: (folderId: string) => void;
}

export function SurveyFolderSidebar({
  folders,
  selectedFolderId,
  collapsed,
  onCollapse,
  onExpand,
  onSelectFolder,
}: SurveyFolderSidebarProps) {
  const { showToast } = useWuShowToast();

  function handleAddFolder() {
    showToast({ message: 'Add folder', variant: 'success' });
  }

  if (collapsed) {
    return (
      <div className={styles.shellCollapsed} data-survey-folders-shell-collapsed>
        {onExpand ? (
          <button
            type="button"
            className={styles.expandEdgeFab}
            aria-label="Show survey folders"
            title="Show survey folders"
            onClick={onExpand}
          >
            <span className="wm-chevron-right" aria-hidden />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.shell} data-survey-folders-shell>
      {onCollapse ? (
        <button
          type="button"
          className={styles.edgeFab}
          aria-label="Hide survey folders"
          title="Hide survey folders"
          onClick={onCollapse}
        >
          <span className="wm-chevron-left" aria-hidden />
        </button>
      ) : null}
      <aside className={styles.sidebar} aria-label="Survey folders">
        <div className={styles.header}>
          <span className={styles.sectionLabel}>Folders</span>
        </div>

        <ul className={styles.list}>
          {folders.map((folder) => {
            const isActive = folder.id === selectedFolderId;
            return (
              <li key={folder.id} className={styles.listItem}>
                <button
                  type="button"
                  className={styles.folderItem}
                  data-active={isActive ? 'true' : undefined}
                  title={folder.name}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <span className={styles.folderName}>{folder.name}</span>
                  <span className={styles.folderCount}>{formatNumber(folder.count)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.footer}>
          <button type="button" className={styles.addFolderBtn} onClick={handleAddFolder}>
            <span className="wm-add-2" aria-hidden />
            Add folder
          </button>
        </div>
      </aside>
    </div>
  );
}
