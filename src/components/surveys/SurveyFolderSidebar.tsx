'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyFolder } from '@/data/mock-surveys';
import styles from './SurveyFolderSidebar.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface SurveyFolderSidebarProps {
  folders: SurveyFolder[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
}

export function SurveyFolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
}: SurveyFolderSidebarProps) {
  const { showToast } = useWuShowToast();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={collapsed ? styles.sidebarCollapsed : styles.sidebar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggleBtn}
          aria-label={collapsed ? 'Expand folders' : 'Collapse folders'}
          onClick={() => setCollapsed((value) => !value)}
        >
          <span className={collapsed ? 'wm-chevron-right' : 'wm-chevron-left'} />
        </button>
      </div>
      <ul className={styles.list}>
        {folders.map((folder) => (
          <li key={folder.id}>
            <button
              type="button"
              className={styles.folderItem}
              data-active={folder.id === selectedFolderId ? 'true' : undefined}
              title={folder.name}
              onClick={() => onSelectFolder(folder.id)}
            >
              <span className={styles.folderIcon} aria-hidden>
                <span className={`wm-folder ${styles.folderIconGlyph}`} />
                <span className={styles.folderIconLabel}>{folder.shortLabel}</span>
              </span>
              <span className={styles.folderName}>{folder.name}</span>
              <span className={styles.folderCount}>{folder.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        {collapsed ? (
          <button
            type="button"
            className={styles.addFolderIconBtn}
            aria-label="Add Folder"
            onClick={() => showToast({ message: 'Add folder', variant: 'success' })}
          >
            <span className="wm-add-2" />
          </button>
        ) : (
          <WuButton
            variant="secondary"
            size="sm"
            Icon={<span className="wm-add-2" />}
            onClick={() => showToast({ message: 'Add folder', variant: 'success' })}
            className={styles.addFolderBtn}
          >
            Add Folder
          </WuButton>
        )}
      </div>
    </aside>
  );
}
