'use client';

import styles from './SurveyWorkspaceQuickTools.module.css';

interface SurveyWorkspaceQuickToolsProps {
  onAddBlock: () => void;
}

export function SurveyWorkspaceQuickTools({
  onAddBlock,
}: SurveyWorkspaceQuickToolsProps) {
  return (
    <div className={styles.tools} role="toolbar" aria-label="Workspace tools">
      <button type="button" className={styles.addBlockBtn} onClick={onAddBlock}>
        <span className="wm-add" aria-hidden />
        Add Block
      </button>
    </div>
  );
}
