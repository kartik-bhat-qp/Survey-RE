'use client';

import { useEffect, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { MultiEmailInput } from '@/components/surveys/MultiEmailInput';
import { MultiValueInput } from '@/components/surveys/MultiValueInput';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import {
  getMediaLibraryShareOptions,
  type MediaLibraryFolder,
  type MediaLibraryShareMode,
} from '@/data/mock-media-library';
import { MOCK_NOTIFICATION_ORG_USERS } from '@/data/mock-survey-notifications';
import styles from './MediaLibraryFolderModals.module.css';

interface MediaLibraryFolderModalsProps {
  modal: 'create-folder' | 'share' | 'move' | null;
  onCloseModal: () => void;
  onCreateFolder: (name: string) => void;
  shareMode: MediaLibraryShareMode;
  shareTeams: string[];
  shareUsers: string[];
  onSaveShare: (next: {
    mode: MediaLibraryShareMode;
    teams: string[];
    users: string[];
  }) => void;
  moveCount: number;
  moveTargets: MediaLibraryFolder[];
  onMoveTo: (folder: MediaLibraryFolder) => void;
}

export function MediaLibraryFolderModals({
  modal,
  onCloseModal,
  onCreateFolder,
  shareMode,
  shareTeams,
  shareUsers,
  onSaveShare,
  moveCount,
  moveTargets,
  onMoveTo,
}: MediaLibraryFolderModalsProps) {
  const wick = useWickUILib();
  const [folderName, setFolderName] = useState('');
  const [draftShareMode, setDraftShareMode] = useState<MediaLibraryShareMode>(shareMode);
  const [draftTeams, setDraftTeams] = useState<string[]>(shareTeams);
  const [draftUsers, setDraftUsers] = useState<string[]>(shareUsers);

  useEffect(() => {
    if (modal === 'create-folder') setFolderName('');
    if (modal === 'share') {
      setDraftShareMode(shareMode);
      setDraftTeams(shareTeams);
      setDraftUsers(shareUsers);
    }
  }, [modal, shareMode, shareTeams, shareUsers]);

  if (!modal || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  function handleOpenChange(open: boolean): void {
    if (!open) onCloseModal();
  }

  const orgName = MOCK_HEADER_USER.profile.companyName;
  const shareOptions = getMediaLibraryShareOptions(orgName);

  if (modal === 'create-folder') {
    const trimmed = folderName.trim();
    return (
      <WuModal open onOpenChange={handleOpenChange} size="sm" variant="action">
        <WuModalHeader>Create new folder</WuModalHeader>
        <WuModalContent>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="media-library-folder-name">
              Folder name
            </label>
            <input
              id="media-library-folder-name"
              type="text"
              className={styles.input}
              placeholder="e.g. Brand assets"
              value={folderName}
              autoFocus
              onChange={(event) => setFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && trimmed) onCreateFolder(trimmed);
              }}
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton disabled={!trimmed} onClick={() => onCreateFolder(trimmed)}>
            Create folder
          </WuButton>
        </WuModalFooter>
      </WuModal>
    );
  }

  if (modal === 'share') {
    return (
      <WuModal
        open
        onOpenChange={handleOpenChange}
        size="md"
        variant="action"
        className={styles.shareModal}
      >
        <WuModalHeader className={styles.shareHeader}>Folder Sharing</WuModalHeader>
        <WuModalContent className={styles.shareContent}>
          <div className={styles.shareBody}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="media-library-share-mode">
                Folder sharing options
              </label>
              <select
                id="media-library-share-mode"
                className={styles.shareSelect}
                value={draftShareMode}
                onChange={(event) =>
                  setDraftShareMode(event.target.value as MediaLibraryShareMode)
                }
              >
                {shareOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {draftShareMode === 'restricted' ? (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Share folder with teams</label>
                  <MultiValueInput
                    className={styles.shareChipField}
                    value={draftTeams}
                    onChange={setDraftTeams}
                    placeholder=""
                    aria-label="Share folder with teams"
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Share folder with users</span>
                  <MultiEmailInput
                    fieldClassName={styles.shareChipField}
                    value={draftUsers}
                    onChange={setDraftUsers}
                    placeholder=""
                    aria-label="Share folder with users"
                    orgUsers={MOCK_NOTIFICATION_ORG_USERS}
                  />
                </div>
              </>
            ) : null}
          </div>
        </WuModalContent>
        <WuModalFooter className={styles.shareFooter}>
          <button type="button" className={styles.cancelLink} onClick={onCloseModal}>
            Cancel
          </button>
          <WuButton
            onClick={() =>
              onSaveShare({
                mode: draftShareMode,
                teams: draftShareMode === 'restricted' ? draftTeams : [],
                users: draftShareMode === 'restricted' ? draftUsers : [],
              })
            }
          >
            Save Changes
          </WuButton>
        </WuModalFooter>
      </WuModal>
    );
  }

  return (
    <WuModal open onOpenChange={handleOpenChange} size="sm" variant="action">
      <WuModalHeader>
        {`Move ${moveCount} file${moveCount === 1 ? '' : 's'} to…`}
      </WuModalHeader>
      <WuModalContent>
        <div className={styles.moveList}>
          {moveTargets.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={styles.moveTarget}
              onClick={() => onMoveTo(folder)}
            >
              <span className="wm-folder" aria-hidden />
              <span className={styles.moveName}>{folder.name}</span>
              <span className={`wm-chevron-right ${styles.moveChevron}`} aria-hidden />
            </button>
          ))}
        </div>
      </WuModalContent>
    </WuModal>
  );
}
