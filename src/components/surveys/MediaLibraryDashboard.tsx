'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { MediaLibraryFolderModals } from '@/components/surveys/MediaLibraryFolderModals';
import { formatDate } from '@/data/mock-utils';
import {
  buildMediaFileUrl,
  getMediaTypeFromFileName,
  getMediaTypeMeta,
  matchesMediaLibraryFilter,
  MEDIA_LIBRARY_FILTERS,
  MEDIA_LIBRARY_FOLDERS,
  MEDIA_LIBRARY_PAGE_SIZE,
  MEDIA_LIBRARY_STORAGE,
  MEDIA_LIBRARY_SYSTEM_FOLDERS,
  MOCK_MEDIA_LIBRARY_FILES,
  type MediaLibraryFile,
  type MediaLibraryFilter,
  type MediaLibraryFolder,
  type MediaLibraryShareMode,
  type MediaLibraryView,
} from '@/data/mock-media-library';
import styles from './MediaLibraryDashboard.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface MediaLibraryDashboardProps {
  surveyId: number;
}

interface UploadItem {
  id: string;
  name: string;
  percent: number;
  /** Per-file progress increment, so each tick stays a pure state update. */
  speed: number;
}

interface FilterOption {
  value: MediaLibraryFilter;
  label: string;
}

interface PageRangeOption {
  value: number;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = MEDIA_LIBRARY_FILTERS.map((value) => ({
  value,
  label: value,
}));

const FILE_MENU_WIDTH = 184;
const FILE_MENU_VIEWPORT_MARGIN = 8;
const FILE_MENU_GAP = 4;

type MediaLibraryModal = 'create-folder' | 'share' | 'move' | 'rename' | null;

interface FileMenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

export function MediaLibraryDashboard({ surveyId: _surveyId }: MediaLibraryDashboardProps) {
  const { showToast } = useWuShowToast();

  const [files, setFiles] = useState<MediaLibraryFile[]>(MOCK_MEDIA_LIBRARY_FILES);
  const [folders, setFolders] = useState<MediaLibraryFolder[]>(MEDIA_LIBRARY_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState('my-files');
  const [view, setView] = useState<MediaLibraryView>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MediaLibraryFilter>('All files');
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<FileMenuPosition | null>(null);
  const [detailsFileId, setDetailsFileId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [modal, setModal] = useState<MediaLibraryModal>(null);
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [shareMode, setShareMode] = useState<MediaLibraryShareMode>('restricted');
  const [shareTeams, setShareTeams] = useState<string[]>([]);
  const [shareUsers, setShareUsers] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [page, setPage] = useState(1);

  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadSeqRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toast = useCallback(
    (message: string) => showToast({ message, variant: 'success' }),
    [showToast]
  );

  useEffect(() => {
    if (menuFileId === null) return;
    function onDocumentPointerDown(event: PointerEvent): void {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target)) return;
      if (menuAnchorRef.current?.contains(target)) return;
      setMenuFileId(null);
      setMenuPosition(null);
      menuAnchorRef.current = null;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setMenuFileId(null);
        setMenuPosition(null);
        menuAnchorRef.current = null;
      }
    }
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuFileId]);

  useLayoutEffect(() => {
    if (menuFileId === null) return;

    function updateMenuPosition(): void {
      const anchor = menuAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 320;
      const spaceBelow = window.innerHeight - rect.bottom - FILE_MENU_VIEWPORT_MARGIN;
      const spaceAbove = rect.top - FILE_MENU_VIEWPORT_MARGIN;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        160,
        openUpward ? spaceAbove - FILE_MENU_GAP : spaceBelow - FILE_MENU_GAP
      );
      const top = openUpward
        ? Math.max(
            FILE_MENU_VIEWPORT_MARGIN,
            rect.top - Math.min(menuHeight, maxHeight) - FILE_MENU_GAP
          )
        : rect.bottom + FILE_MENU_GAP;
      const left = Math.min(
        Math.max(FILE_MENU_VIEWPORT_MARGIN, rect.right - FILE_MENU_WIDTH),
        window.innerWidth - FILE_MENU_WIDTH - FILE_MENU_VIEWPORT_MARGIN
      );
      setMenuPosition((prev) => {
        if (
          prev &&
          prev.top === top &&
          prev.left === left &&
          prev.maxHeight === maxHeight
        ) {
          return prev;
        }
        return { top, left, maxHeight };
      });
    }

    updateMenuPosition();
    const rafId = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [menuFileId]);

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
      if (uploadDoneTimerRef.current) clearTimeout(uploadDoneTimerRef.current);
    };
  }, []);

  const uploadsComplete = uploads.length > 0 && uploads.every((item) => item.percent >= 100);

  useEffect(() => {
    if (!uploadsComplete) return;

    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }

    uploadDoneTimerRef.current = setTimeout(() => {
      const uploadedAt = new Date().toISOString();
      const newFiles: MediaLibraryFile[] = uploads.map((item) => {
        const type = getMediaTypeFromFileName(item.name);
        return {
          id: `media-${item.id}`,
          name: item.name,
          type,
          size: `${(Math.round((0.2 + Math.random() * 2) * 10) / 10).toFixed(1)} MB`,
          resolution:
            type === 'image' ? '1600 × 900' : type === 'video' ? '1920 × 1080' : undefined,
          uploadedAt,
          folderId: activeFolderId,
        };
      });
      setFiles((current) => [...newFiles, ...current]);
      setUploads([]);
      toast(`${newFiles.length} file${newFiles.length === 1 ? '' : 's'} uploaded`);
    }, 800);

    return () => {
      if (uploadDoneTimerRef.current) {
        clearTimeout(uploadDoneTimerRef.current);
        uploadDoneTimerRef.current = null;
      }
    };
  }, [activeFolderId, toast, uploads, uploadsComplete]);

  const allFolders = useMemo(
    () => [...MEDIA_LIBRARY_SYSTEM_FOLDERS, ...folders],
    [folders]
  );

  const countsByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((file) => {
      counts[file.folderId] = (counts[file.folderId] ?? 0) + 1;
    });
    return counts;
  }, [files]);

  const activeFolderName =
    allFolders.find((folder) => folder.id === activeFolderId)?.name ?? 'this folder';

  const visibleFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return files.filter(
      (file) =>
        file.folderId === activeFolderId &&
        matchesMediaLibraryFilter(file, filter) &&
        (!query || file.name.toLowerCase().includes(query))
    );
  }, [activeFolderId, files, filter, search]);

  const pageCount = Math.max(1, Math.ceil(visibleFiles.length / MEDIA_LIBRARY_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedFiles = useMemo(() => {
    const start = (currentPage - 1) * MEDIA_LIBRARY_PAGE_SIZE;
    return visibleFiles.slice(start, start + MEDIA_LIBRARY_PAGE_SIZE);
  }, [currentPage, visibleFiles]);
  const pageRangeOptions = useMemo<PageRangeOption[]>(() => {
    if (visibleFiles.length === 0) return [];
    return Array.from({ length: pageCount }, (_, index) => {
      const start = index * MEDIA_LIBRARY_PAGE_SIZE + 1;
      const end = Math.min((index + 1) * MEDIA_LIBRARY_PAGE_SIZE, visibleFiles.length);
      return {
        value: index + 1,
        label: `${start} - ${end} of ${visibleFiles.length}`,
      };
    });
  }, [pageCount, visibleFiles.length]);
  const selectedPageRange =
    pageRangeOptions.find((option) => option.value === currentPage) ?? null;
  const selectedFilterOption =
    FILTER_OPTIONS.find((option) => option.value === filter) ?? FILTER_OPTIONS[0];

  useEffect(() => {
    setPage(1);
  }, [activeFolderId, filter, search]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const detailsFile = files.find((file) => file.id === detailsFileId) ?? null;
  const selectionCount = selectedIds.length;
  const isEmpty = visibleFiles.length === 0 && uploads.length === 0;

  function selectFolder(folderId: string): void {
    setActiveFolderId(folderId);
    setSelectedIds([]);
    setDetailsFileId(null);
    setRenamingId(null);
    setMenuFileId(null);
    setMenuPosition(null);
    menuAnchorRef.current = null;
    setPage(1);
  }

  function toggleSelected(fileId: string): void {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  }

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []).map((file) => file.name);
    event.target.value = '';
    if (selected.length === 0) return;
    startUpload(selected);
  }

  function startUpload(names: string[]): void {
    const items: UploadItem[] = names.map((name) => {
      uploadSeqRef.current += 1;
      return {
        id: `upload-${Date.now()}-${uploadSeqRef.current}`,
        name,
        percent: 0,
        speed: 6 + Math.random() * 12,
      };
    });
    setUploads(items);
    setModal(null);
    setPage(1);

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    uploadTimerRef.current = setInterval(() => {
      setUploads((prev) =>
        prev.map((item) => ({
          ...item,
          percent: Math.min(100, item.percent + item.speed),
        }))
      );
    }, 160);
  }

  function handleDeleteFile(file: MediaLibraryFile): void {
    setFiles((prev) => prev.filter((item) => item.id !== file.id));
    setSelectedIds((prev) => prev.filter((id) => id !== file.id));
    if (detailsFileId === file.id) setDetailsFileId(null);
    closeFileMenu();
    toast(`"${file.name}" deleted`);
  }

  function handleDeleteSelected(): void {
    setFiles((prev) => prev.filter((file) => !selectedIds.includes(file.id)));
    if (detailsFileId && selectedIds.includes(detailsFileId)) setDetailsFileId(null);
    toast(`${selectionCount} file${selectionCount === 1 ? '' : 's'} deleted`);
    setSelectedIds([]);
  }

  function handleCommitRename(name: string): void {
    const value = name.trim();
    if (!renamingId || !value) return;
    setFiles((prev) =>
      prev.map((file) => (file.id === renamingId ? { ...file, name: value } : file))
    );
    setRenamingId(null);
    setRenameValue('');
    setModal(null);
    toast('File renamed');
  }

  function openFileMenu(fileId: string, anchor: HTMLElement): void {
    if (menuFileId === fileId) {
      closeFileMenu();
      return;
    }
    menuAnchorRef.current = anchor;
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - FILE_MENU_VIEWPORT_MARGIN;
    const spaceAbove = rect.top - FILE_MENU_VIEWPORT_MARGIN;
    const estimatedHeight = 320;
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      160,
      openUpward ? spaceAbove - FILE_MENU_GAP : spaceBelow - FILE_MENU_GAP
    );
    const top = openUpward
      ? Math.max(
          FILE_MENU_VIEWPORT_MARGIN,
          rect.top - Math.min(estimatedHeight, maxHeight) - FILE_MENU_GAP
        )
      : rect.bottom + FILE_MENU_GAP;
    const left = Math.min(
      Math.max(FILE_MENU_VIEWPORT_MARGIN, rect.right - FILE_MENU_WIDTH),
      window.innerWidth - FILE_MENU_WIDTH - FILE_MENU_VIEWPORT_MARGIN
    );
    setMenuPosition({ top, left, maxHeight });
    setMenuFileId(fileId);
  }

  function closeFileMenu(): void {
    setMenuFileId(null);
    setMenuPosition(null);
    menuAnchorRef.current = null;
  }

  function handleStartRename(file: MediaLibraryFile): void {
    setRenamingId(file.id);
    setRenameValue(file.name);
    closeFileMenu();
    setModal('rename');
  }

  function handleCreateFolder(name: string): void {
    const folder: MediaLibraryFolder = { id: `folder-${Date.now()}`, name };
    setFolders((prev) => [...prev, folder]);
    setModal(null);
    selectFolder(folder.id);
    toast(`Folder "${name}" created`);
  }

  function handleMoveTo(folder: MediaLibraryFolder): void {
    const ids = moveIds;
    setFiles((prev) =>
      prev.map((file) => (ids.includes(file.id) ? { ...file, folderId: folder.id } : file))
    );
    setModal(null);
    setMoveIds([]);
    setSelectedIds([]);
    setDetailsFileId(null);
    toast(`${ids.length} file${ids.length === 1 ? '' : 's'} moved to ${folder.name}`);
  }

  function handleCopyUrl(file: MediaLibraryFile): void {
    void navigator.clipboard?.writeText(buildMediaFileUrl(file.name)).catch(() => undefined);
    toast('Link copied to clipboard');
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer?.files ?? []).map((file) => file.name);
    if (dropped.length === 0) return;
    startUpload(dropped);
  }

  function renderFileMenu(file: MediaLibraryFile): React.ReactNode {
    if (!menuPosition || typeof document === 'undefined') return null;

    return createPortal(
      <div
        ref={menuRef}
        className={styles.menu}
        role="menu"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          maxHeight: menuPosition.maxHeight,
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            setDetailsFileId(file.id);
            closeFileMenu();
          }}
        >
          <span className="wm-info" aria-hidden />
          View details
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            handleCopyUrl(file);
            closeFileMenu();
          }}
        >
          <span className="wm-link" aria-hidden />
          Get link
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            toast('HTML snippet copied');
            closeFileMenu();
          }}
        >
          <span className="wm-code" aria-hidden />
          Get HTML
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            toast('Set as survey logo');
            closeFileMenu();
          }}
        >
          <span className="wm-open-with" aria-hidden />
          Set as logo
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => handleStartRename(file)}
        >
          <span className="wm-edit" aria-hidden />
          Rename
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            toast(`Downloading ${file.name}`);
            closeFileMenu();
          }}
        >
          <span className="wm-download" aria-hidden />
          Download
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => {
            setMoveIds([file.id]);
            setModal('move');
            closeFileMenu();
          }}
        >
          <span className="wm-drive-file-move" aria-hidden />
          Move
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={styles.menuItemDanger}
          onClick={() => {
            handleDeleteFile(file);
            closeFileMenu();
          }}
        >
          <span className="wm-delete" aria-hidden />
          Delete
        </button>
      </div>,
      document.body
    );
  }

  return (
    <div
      className={styles.workspace}
      onDragOver={(event) => {
        event.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.target === event.currentTarget) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className={styles.fileInput}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.ttf,.otf,.woff,.woff2,.svg"
        aria-hidden
        tabIndex={-1}
        onChange={handleFileInputChange}
      />
      <aside className={styles.sidebar} aria-label="Media Library folders">
        <nav className={styles.sidebarNav}>
          {MEDIA_LIBRARY_SYSTEM_FOLDERS.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={
                activeFolderId === folder.id ? styles.navItemActive : styles.navItem
              }
              onClick={() => selectFolder(folder.id)}
            >
              <span className={folder.icon} aria-hidden />
              <span className={styles.navLabel}>{folder.name}</span>
              <span className={styles.navCount}>{countsByFolder[folder.id] ?? 0}</span>
            </button>
          ))}
        </nav>

        <div className={styles.foldersHeader}>
          <span className={styles.foldersTitle}>Folders</span>
          <button
            type="button"
            className={styles.newFolderBtn}
            aria-label="New folder"
            onClick={() => setModal('create-folder')}
          >
            <span className="wm-add" aria-hidden />
          </button>
        </div>

        <div className={styles.folderList}>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={
                activeFolderId === folder.id ? styles.navItemActive : styles.navItem
              }
              onClick={() => selectFolder(folder.id)}
            >
              <span className="wm-folder" aria-hidden />
              <span className={styles.navLabel}>{folder.name}</span>
              <span className={styles.navCount}>{countsByFolder[folder.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.storage}>
          <div className={styles.storageRow}>
            <span className={styles.storageTitle}>
              <span className="wm-cloud" aria-hidden />
              Storage
            </span>
            <span className={styles.storageMeta}>
              {MEDIA_LIBRARY_STORAGE.usedPercent}% used
            </span>
          </div>
          <div className={styles.storageTrack}>
            <div
              className={styles.storageFill}
              style={{ width: `${MEDIA_LIBRARY_STORAGE.usedPercent}%` }}
            />
          </div>
          <div className={styles.storageRow}>
            <span className={styles.storageMeta}>
              {MEDIA_LIBRARY_STORAGE.usedLabel} of {MEDIA_LIBRARY_STORAGE.totalLabel}
            </span>
            <button
              type="button"
              className={styles.upgradeLink}
              onClick={() => toast('Upgrade options opened')}
            >
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search files"
              aria-label="Search files"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.filterWrap}>
            <WuSelect
              data={FILTER_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedFilterOption}
              variant="outlined"
              aria-label="Filter files by type"
              onSelect={(item) => {
                const selected = item as FilterOption | null;
                if (!selected) return;
                setFilter(selected.value);
                closeFileMenu();
              }}
            />
          </div>

          <div className={styles.viewToggle} role="group" aria-label="View">
            <button
              type="button"
              className={view === 'grid' ? styles.viewBtnActive : styles.viewBtn}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <span className="wm-grid-view" aria-hidden />
            </button>
            <button
              type="button"
              className={view === 'list' ? styles.viewBtnActive : styles.viewBtn}
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <span className="wm-view-list" aria-hidden />
            </button>
          </div>

          <div className={styles.toolbarSpacer} />

          <div className={styles.pagination}>
            <div className={styles.pagePicker}>
              <WuSelect
                data={pageRangeOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedPageRange}
                variant="flat"
                placeholder="0 of 0"
                disabled={pageRangeOptions.length === 0}
                aria-label="Showing Files"
                Header={<span className={styles.pageMenuTitle}>Showing Files</span>}
                onSelect={(item) => {
                  const selected = item as PageRangeOption | null;
                  if (!selected) return;
                  setPage(selected.value);
                  closeFileMenu();
                }}
              />
            </div>
            <button
              type="button"
              className={styles.pageBtn}
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <span className="wm-chevron-left" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              aria-label="Next page"
              disabled={currentPage >= pageCount || visibleFiles.length === 0}
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            >
              <span className="wm-chevron-right" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setModal('share')}
          >
            <span className="wm-person-add" aria-hidden />
            Share Folder
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={openFilePicker}
          >
            <span className="wm-upload" aria-hidden />
            Upload
          </button>
        </div>

        {selectionCount > 0 ? (
          <div className={styles.selectionBar}>
            <span className={styles.selectionCount}>
              <span className={`wm-check-box ${styles.selectionIcon}`} aria-hidden />
              {selectionCount} selected
            </span>
            <button
              type="button"
              className={styles.selectionAction}
              onClick={() => {
                setMoveIds(selectedIds);
                setModal('move');
              }}
            >
              <span className="wm-drive-file-move" aria-hidden />
              Move
            </button>
            <button
              type="button"
              className={styles.selectionAction}
              onClick={() => {
                toast(`Downloading ${selectionCount} files`);
                setSelectedIds([]);
              }}
            >
              <span className="wm-download" aria-hidden />
              Download
            </button>
            <button
              type="button"
              className={styles.selectionActionDanger}
              onClick={handleDeleteSelected}
            >
              <span className="wm-delete" aria-hidden />
              Delete
            </button>
            <div className={styles.toolbarSpacer} />
            <button
              type="button"
              className={styles.clearSelection}
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
        ) : null}

        <div className={styles.content}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <span className={`wm-cloud-upload ${styles.emptyIcon}`} aria-hidden />
              <p className={styles.emptyTitle}>No files in {activeFolderName}</p>
              <p className={styles.emptyCopy}>
                Drag and drop files anywhere on this page, or upload from your computer.
              </p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={openFilePicker}
              >
                <span className="wm-upload" aria-hidden />
                Upload files
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className={styles.grid}>
              {pagedFiles.map((file) => {
                const meta = getMediaTypeMeta(file.type);
                const selected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    className={selected ? styles.cardSelected : styles.card}
                  >
                    <button
                      type="button"
                      className={selected ? styles.checkboxOn : styles.checkbox}
                      aria-label={`Select ${file.name}`}
                      aria-pressed={selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSelected(file.id);
                      }}
                    >
                      {selected ? <span className="wm-check" aria-hidden /> : null}
                    </button>
                    <button
                      type="button"
                      className={styles.thumb}
                      onClick={() => setDetailsFileId(file.id)}
                    >
                      <span className={`${meta.icon} ${styles.thumbIcon}`} aria-hidden />
                      <span className={styles.thumbLabel}>{meta.label}</span>
                    </button>
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.cardName}
                        title={file.name}
                        onClick={() => setDetailsFileId(file.id)}
                      >
                        {file.name}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`More actions for ${file.name}`}
                        aria-expanded={menuFileId === file.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          openFileMenu(file.id, event.currentTarget);
                        }}
                      >
                        <span className="wm-more-vert" aria-hidden />
                      </button>
                    </div>
                    {menuFileId === file.id ? renderFileMenu(file) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.listWrap}>
              <div className={styles.listHeader}>
                <span />
                <span />
                <span>Name</span>
                <span>Type</span>
                <span>Size</span>
                <span>Resolution</span>
                <span>Uploaded</span>
                <span />
              </div>
              {pagedFiles.map((file) => {
                const meta = getMediaTypeMeta(file.type);
                const selected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    className={selected ? styles.listRowSelected : styles.listRow}
                  >
                    <button
                      type="button"
                      className={selected ? styles.checkboxOn : styles.checkbox}
                      aria-label={`Select ${file.name}`}
                      aria-pressed={selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSelected(file.id);
                      }}
                    >
                      {selected ? <span className="wm-check" aria-hidden /> : null}
                    </button>
                    <button
                      type="button"
                      className={styles.listThumb}
                      aria-label={`Open ${file.name}`}
                      onClick={() => setDetailsFileId(file.id)}
                    >
                      <span className={meta.icon} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.listName}
                      title={file.name}
                      onClick={() => setDetailsFileId(file.id)}
                    >
                      {file.name}
                    </button>
                    <span className={styles.listCell}>{meta.label}</span>
                    <span className={styles.listCell}>{file.size}</span>
                    <span className={styles.listCell}>{file.resolution ?? '—'}</span>
                    <span className={styles.listCell}>{formatDate(file.uploadedAt)}</span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`More actions for ${file.name}`}
                      aria-expanded={menuFileId === file.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        openFileMenu(file.id, event.currentTarget);
                      }}
                    >
                      <span className="wm-more-vert" aria-hidden />
                    </button>
                    {menuFileId === file.id ? renderFileMenu(file) : null}
                  </div>
                );
              })}
            </div>
          )}

          {dragging ? (
            <div className={styles.dropOverlay}>
              <span className={`wm-upload ${styles.dropIcon}`} aria-hidden />
              <span className={styles.dropLabel}>Drop files to upload</span>
            </div>
          ) : null}
        </div>
      </main>

      {detailsFile ? (
        <aside className={styles.details} aria-label="File details">
          <div className={styles.detailsHeader}>
            <span className={styles.detailsTitle}>File details</span>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close file details"
              onClick={() => setDetailsFileId(null)}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>
          <div className={styles.detailsBody}>
            <div className={styles.detailsPreview}>
              <span
                className={`${getMediaTypeMeta(detailsFile.type).icon} ${styles.detailsPreviewIcon}`}
                aria-hidden
              />
              <span className={styles.detailsPreviewLabel}>
                {getMediaTypeMeta(detailsFile.type).label} preview
              </span>
            </div>
            <div className={styles.detailsSection}>
              <p className={styles.detailsName}>{detailsFile.name}</p>

              <div className={styles.detailsField}>
                <span className={styles.detailsLabel}>URL</span>
                <div className={styles.detailsUrlRow}>
                  <input
                    type="text"
                    className={styles.detailsUrlInput}
                    readOnly
                    value={buildMediaFileUrl(detailsFile.name)}
                    aria-label="File URL"
                  />
                  <button
                    type="button"
                    className={styles.detailsCopyBtn}
                    aria-label="Copy link"
                    onClick={() => handleCopyUrl(detailsFile)}
                  >
                    <span className="wm-content-copy" aria-hidden />
                  </button>
                </div>
              </div>

              <div className={styles.detailsMeta}>
                <div className={styles.detailsField}>
                  <span className={styles.detailsLabel}>Type</span>
                  <span className={styles.detailsValue}>
                    {getMediaTypeMeta(detailsFile.type).label}
                  </span>
                </div>
                <div className={styles.detailsField}>
                  <span className={styles.detailsLabel}>Size</span>
                  <span className={styles.detailsValue}>{detailsFile.size}</span>
                </div>
                <div className={styles.detailsField}>
                  <span className={styles.detailsLabel}>Resolution</span>
                  <span className={styles.detailsValue}>{detailsFile.resolution ?? '—'}</span>
                </div>
                <div className={styles.detailsField}>
                  <span className={styles.detailsLabel}>Uploaded</span>
                  <span className={styles.detailsValue}>
                    {formatDate(detailsFile.uploadedAt)}
                  </span>
                </div>
              </div>

              <div className={styles.detailsDivider} />

              <div className={styles.detailsActions}>
                <button
                  type="button"
                  className={styles.detailsAction}
                  onClick={() => handleCopyUrl(detailsFile)}
                >
                  <span className="wm-link" aria-hidden />
                  Get link
                </button>
                <button
                  type="button"
                  className={styles.detailsAction}
                  onClick={() => toast('HTML snippet copied')}
                >
                  <span className="wm-code" aria-hidden />
                  Get HTML
                </button>
                <button
                  type="button"
                  className={styles.detailsAction}
                  onClick={() => toast('Set as survey logo')}
                >
                  <span className="wm-open-with" aria-hidden />
                  Set as logo
                </button>
                <button
                  type="button"
                  className={styles.detailsAction}
                  onClick={() => toast(`Downloading ${detailsFile.name}`)}
                >
                  <span className="wm-download" aria-hidden />
                  Download
                </button>
                <button
                  type="button"
                  className={styles.detailsAction}
                  onClick={() => {
                    setMoveIds([detailsFile.id]);
                    setModal('move');
                  }}
                >
                  <span className="wm-drive-file-move" aria-hidden />
                  Move
                </button>
                <button
                  type="button"
                  className={styles.detailsActionDanger}
                  onClick={() => handleDeleteFile(detailsFile)}
                >
                  <span className="wm-delete" aria-hidden />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      {uploads.length > 0 ? (
        <div className={styles.uploadTray} aria-live="polite">
          <div className={styles.uploadHeader}>
            {uploadsComplete ? 'Upload complete' : `Uploading ${uploads.length} files…`}
          </div>
          {uploads.map((item) => {
            const percent = Math.round(item.percent);
            return (
              <div key={item.id} className={styles.uploadRow}>
                <div className={styles.uploadMeta}>
                  <span
                    className={getMediaTypeMeta(getMediaTypeFromFileName(item.name)).icon}
                    aria-hidden
                  />
                  <span className={styles.uploadName}>{item.name}</span>
                  {percent >= 100 ? (
                    <span className={`wm-check-circle ${styles.uploadDone}`} aria-hidden />
                  ) : (
                    <span className={styles.uploadPercent}>{percent}%</span>
                  )}
                </div>
                <div className={styles.uploadTrack}>
                  <div className={styles.uploadFill} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <MediaLibraryFolderModals
        modal={modal}
        onCloseModal={() => {
          setModal(null);
          setMoveIds([]);
          setRenamingId(null);
          setRenameValue('');
        }}
        onCreateFolder={handleCreateFolder}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onRename={handleCommitRename}
        shareMode={shareMode}
        shareTeams={shareTeams}
        shareUsers={shareUsers}
        onSaveShare={(next) => {
          setShareMode(next.mode);
          setShareTeams(next.teams);
          setShareUsers(next.users);
          setModal(null);
          toast('Sharing settings saved');
        }}
        moveCount={moveIds.length}
        moveTargets={allFolders.filter((folder) => folder.id !== activeFolderId)}
        onMoveTo={handleMoveTo}
      />
    </div>
  );
}
