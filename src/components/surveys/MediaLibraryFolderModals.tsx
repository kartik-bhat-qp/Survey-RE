'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { MultiEmailInput } from '@/components/surveys/MultiEmailInput';
import { MultiValueInput } from '@/components/surveys/MultiValueInput';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';
import {
  getMediaLibraryShareOptions,
  MOCK_MEDIA_LIBRARY_TEAMS,
  type MediaLibraryFolder,
  type MediaLibraryShareMode,
  type MediaLibraryShareOption,
} from '@/data/mock-media-library';
import { MOCK_NOTIFICATION_ORG_USERS } from '@/data/mock-survey-notifications';
import styles from './MediaLibraryFolderModals.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface MediaLibraryFolderModalsProps {
  modal: 'create-folder' | 'share' | 'move' | 'rename' | null;
  onCloseModal: () => void;
  onCreateFolder: (name: string) => void;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRename: (name: string) => void;
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
  renameValue,
  onRenameValueChange,
  onRename,
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
  const [moveFolderId, setMoveFolderId] = useState('');

  useEffect(() => {
    if (modal === 'create-folder') setFolderName('');
    if (modal === 'share') {
      setDraftShareMode(shareMode);
      setDraftTeams(shareTeams);
      setDraftUsers(shareUsers);
    }
    if (modal === 'move') {
      setMoveFolderId(moveTargets[0]?.id ?? '');
    }
  }, [modal, moveTargets, shareMode, shareTeams, shareUsers]);

  if (!modal || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  function handleOpenChange(open: boolean): void {
    if (!open) onCloseModal();
  }

  const orgName = MOCK_HEADER_USER.profile?.companyName ?? 'your organization';
  const shareOptions = getMediaLibraryShareOptions(orgName);
  const selectedShareOption =
    shareOptions.find((option) => option.value === draftShareMode) ?? shareOptions[0];

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

  if (modal === 'rename') {
    const trimmed = renameValue.trim();
    return (
      <WuModal open onOpenChange={handleOpenChange} size="sm" variant="action">
        <WuModalHeader>Rename file</WuModalHeader>
        <WuModalContent>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="media-library-rename">
              File name
            </label>
            <input
              id="media-library-rename"
              type="text"
              className={styles.input}
              value={renameValue}
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => onRenameValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && trimmed) onRename(trimmed);
              }}
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton disabled={!trimmed} onClick={() => onRename(trimmed)}>
            Rename
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
        maxWidth="32rem"
        allowExternalPortals
      >
        <WuModalHeader className={styles.shareHeader}>Folder Sharing</WuModalHeader>
        <WuModalContent className={styles.shareContent}>
          <div className={styles.shareBody}>
            <div className={styles.field}>
              <span className={styles.label}>Folder sharing options</span>
              <WuSelect
                data={shareOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedShareOption}
                variant="outlined"
                aria-label="Folder sharing options"
                onSelect={(item) => {
                  const selected = item as MediaLibraryShareOption | null;
                  if (!selected) return;
                  setDraftShareMode(selected.value);
                }}
              />
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
                    suggestions={MOCK_MEDIA_LIBRARY_TEAMS}
                    allowCustomValues={false}
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
                    internalOnly
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

  // WuSelect treats an `icon` field on a data item as its option icon, so pass
  // only the fields the select needs instead of the whole folder.
  const moveOptions = moveTargets.map((folder) => ({ id: folder.id, name: folder.name }));
  const selectedMoveOption = moveOptions.find((folder) => folder.id === moveFolderId) ?? null;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      size="sm"
      variant="action"
      allowExternalPortals
    >
      <WuModalHeader>
        {`Move ${moveCount} file${moveCount === 1 ? '' : 's'} to…`}
      </WuModalHeader>
      <WuModalContent>
        <div className={styles.field}>
          <span className={styles.label}>Destination folder</span>
          <WuSelect
            data={moveOptions}
            accessorKey={{ value: 'id', label: 'name' }}
            value={selectedMoveOption}
            variant="outlined"
            placeholder={moveOptions.length === 0 ? 'No folders available' : 'Select a folder'}
            disabled={moveOptions.length === 0}
            aria-label="Destination folder"
            onSelect={(item) => {
              const selected = item as { id: string } | null;
              if (!selected) return;
              setMoveFolderId(selected.id);
            }}
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton
          disabled={!moveFolderId}
          onClick={() => {
            const folder = moveTargets.find((item) => item.id === moveFolderId);
            if (folder) onMoveTo(folder);
          }}
        >
          Move
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
