'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SURVEY_FOLDERS_SHELL_COLLAPSED_SELECTOR,
  SURVEY_FOLDERS_SHELL_SELECTOR,
} from '@/components/surveys/SurveyFolderSidebar';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatNumber, formatRelativeDate } from '@/data/mock-utils';
import type { Survey, SurveyStatus } from '@/data/mock-surveys';
import { getSurveyEditorPhasePath } from '@/components/surveys/survey-editor-navigation';
import styles from './SurveysList.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

type SortField = 'modifiedAt' | 'createdAt' | 'name' | 'responses' | 'status';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'modifiedAt', label: 'Recently modified' },
  { value: 'createdAt', label: 'Recently created' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'responses', label: 'Most responses' },
  { value: 'status', label: 'Status' },
];

function statusClass(status: SurveyStatus): string {
  switch (status) {
    case 'Active - Published':
      return styles.statusPublished;
    case 'Active - Draft':
      return styles.statusDraft;
    case 'Closed':
      return styles.statusClosed;
    case 'Scheduled':
      return styles.statusScheduled;
    default:
      return styles.statusClosed;
  }
}

function statusShortLabel(status: SurveyStatus): string {
  switch (status) {
    case 'Active - Published':
      return 'Published';
    case 'Active - Draft':
      return 'Draft';
    case 'Closed':
      return 'Closed';
    case 'Scheduled':
      return 'Scheduled';
    default:
      return status;
  }
}

function SurveyRowActions({ survey }: { survey: Survey }) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  function action(label: string) {
    showToast({ message: `${label}: ${survey.name}`, variant: 'success' });
  }

  return (
    <div className={styles.rowActions}>
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-send" />}
        aria-label="Distribute"
        onClick={() => router.push(getSurveyEditorPhasePath(survey.id, 'distribute'))}
      />
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-bar-chart" />}
        aria-label="Analytics"
        onClick={() => action('Analytics')}
      />
      <WuMenu
        Trigger={
          <button type="button" className={styles.moreBtn} aria-label="More options">
            <span className="wm-more-vert" />
          </button>
        }
        align="end"
      >
        <WuMenuItem onSelect={() => router.push(`/surveys/${survey.id}`)}>Edit</WuMenuItem>
        <WuMenuItem onSelect={() => action('Copy')}>Copy</WuMenuItem>
        <WuMenuItem onSelect={() => action('Move to folder')}>Move to folder</WuMenuItem>
        <WuMenuItem onSelect={() => action('Export')}>Export</WuMenuItem>
        <WuMenuItem onSelect={() => action('Delete')}>Delete</WuMenuItem>
      </WuMenu>
    </div>
  );
}

function SurveysPagination({
  rangeEnd,
  displayTotal,
}: {
  rangeEnd: number;
  displayTotal: number;
}) {
  const { showToast } = useWuShowToast();

  return (
    <nav className={styles.pagination} aria-label="Survey list pagination">
      <span className={styles.paginationLabel}>
        1 - {formatNumber(rangeEnd)} of {formatNumber(displayTotal)}
      </span>
      <button type="button" className={styles.pageBtn} aria-label="Previous page" disabled>
        <span className="wm-chevron-left" />
      </button>
      <button
        type="button"
        className={styles.pageBtn}
        aria-label="Next page"
        onClick={() => showToast({ message: 'Next page', variant: 'info' })}
      >
        <span className="wm-chevron-right" />
      </button>
      <button
        type="button"
        className={styles.pageBtn}
        aria-label="Page size"
        onClick={() => showToast({ message: 'Page size', variant: 'info' })}
      >
        <span className="wm-arrow-drop-down" />
      </button>
    </nav>
  );
}

interface SurveysListProps {
  surveys: Survey[];
  displayTotal: number;
  rangeEnd: number;
  foldersCollapsed?: boolean;
  onExpandFolders?: () => void;
  onCollapseFolders?: () => void;
}

export function SurveysList({
  surveys,
  displayTotal,
  rangeEnd,
  foldersCollapsed = false,
  onExpandFolders,
  onCollapseFolders,
}: SurveysListProps) {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('modifiedAt');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    function syncFolderFabPositions() {
      const el = toolbarRef.current;
      if (!el) return;
      const toolbarRect = el.getBoundingClientRect();

      const collapsedShell = document.querySelector(
        SURVEY_FOLDERS_SHELL_COLLAPSED_SELECTOR
      ) as HTMLElement | null;
      if (foldersCollapsed && onExpandFolders && collapsedShell) {
        const shellRect = collapsedShell.getBoundingClientRect();
        const expandCenterY = toolbarRect.top + toolbarRect.height / 2 - shellRect.top;
        collapsedShell.style.setProperty('--survey-folders-expand-top', `${expandCenterY}px`);
      } else if (collapsedShell) {
        collapsedShell.style.removeProperty('--survey-folders-expand-top');
      }

      const shell = document.querySelector(SURVEY_FOLDERS_SHELL_SELECTOR) as HTMLElement | null;
      if (!foldersCollapsed && onCollapseFolders && shell) {
        const shellRect = shell.getBoundingClientRect();
        const collapseCenterY = toolbarRect.top + toolbarRect.height / 2 - shellRect.top;
        shell.style.setProperty('--survey-folders-collapse-top', `${collapseCenterY}px`);
      } else if (shell) {
        shell.style.removeProperty('--survey-folders-collapse-top');
      }
    }

    syncFolderFabPositions();

    const mainEl = document.querySelector('[data-surveys-main]');
    const observer = new ResizeObserver(syncFolderFabPositions);
    observer.observe(toolbar);
    window.addEventListener('resize', syncFolderFabPositions);
    mainEl?.addEventListener('scroll', syncFolderFabPositions, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncFolderFabPositions);
      mainEl?.removeEventListener('scroll', syncFolderFabPositions);
      const collapsedShell = document.querySelector(
        SURVEY_FOLDERS_SHELL_COLLAPSED_SELECTOR
      ) as HTMLElement | null;
      collapsedShell?.style.removeProperty('--survey-folders-expand-top');
      const shell = document.querySelector(SURVEY_FOLDERS_SHELL_SELECTOR) as HTMLElement | null;
      shell?.style.removeProperty('--survey-folders-collapse-top');
    };
  }, [foldersCollapsed, onExpandFolders, onCollapseFolders]);

  const filteredSurveys = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = term
      ? surveys.filter((s) => s.name.toLowerCase().includes(term))
      : [...surveys];

    matched.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'responses':
          return b.responses - a.responses;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'modifiedAt':
        default:
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      }
    });

    return matched;
  }, [surveys, search, sortField]);

  const allSelected =
    filteredSurveys.length > 0 && filteredSurveys.every((s) => selectedIds.has(s.id));

  const selectedCount = filteredSurveys.filter((s) => selectedIds.has(s.id)).length;

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filteredSurveys.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function bulkAction(label: string) {
    showToast({
      message: `${label} (${selectedCount} survey${selectedCount === 1 ? '' : 's'})`,
      variant: 'success',
    });
  }

  const sortValue = SORT_OPTIONS.find((o) => o.value === sortField) ?? SORT_OPTIONS[0];

  return (
    <section className={styles.section} aria-label="Your surveys">
      <div
        ref={toolbarRef}
        className={`${styles.toolbar} ${foldersCollapsed ? styles.toolbarFoldersCollapsed : ''}`}
      >
        <div className={styles.toolbarStart}>
          <h3 className={styles.title}>Your surveys</h3>
          <span className={styles.countBadge}>{formatNumber(displayTotal)} total</span>
        </div>
        <div className={styles.toolbarEnd}>
          <div className={styles.searchWrap}>
            <WuInput
              variant="outlined"
              placeholder="Search surveys"
              Icon={<span className="wm-search" />}
              iconPosition="left"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <WuSelect
            className={styles.sortSelect}
            data={SORT_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={sortValue}
            onSelect={(option) => {
              if (!option) return;
              setSortField((option as (typeof SORT_OPTIONS)[number]).value);
            }}
            variant="outlined"
          />
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className={styles.bulkBar} role="status">
          <span className={styles.bulkLabel}>
            {selectedCount} selected
          </span>
          <div className={styles.bulkActions}>
            <button type="button" className={styles.bulkActionBtn} onClick={() => bulkAction('Move')}>
              Move
            </button>
            <button type="button" className={styles.bulkActionBtn} onClick={() => bulkAction('Copy')}>
              Copy
            </button>
            <button
              type="button"
              className={styles.bulkActionBtn}
              onClick={() => bulkAction('Delete')}
            >
              Delete
            </button>
            <button
              type="button"
              className={styles.bulkActionBtn}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.listCard}>
        {filteredSurveys.length > 0 ? (
          <div className={styles.listScroll}>
            <div className={styles.listHeaderWrap}>
              <div className={styles.listHeader}>
                <WuCheckbox
                  checked={allSelected}
                  onChange={(checked) => toggleAll(checked)}
                  aria-label="Select all surveys"
                />
                <span className={styles.colSurvey}>Survey</span>
                <span className={styles.colStatus}>Status</span>
                <span className={styles.colResponses}>Responses</span>
                <span className={styles.colActions} aria-hidden />
              </div>
            </div>
            <ul className={styles.listBody}>
              {filteredSurveys.map((survey) => {
                const isSelected = selectedIds.has(survey.id);
                return (
                  <li
                    key={survey.id}
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                  >
                    <WuCheckbox
                      checked={isSelected}
                      onChange={(checked) => toggleOne(survey.id, checked)}
                      aria-label={`Select ${survey.name}`}
                    />
                    <div className={styles.surveyMain}>
                      <Link href={`/surveys/${survey.id}`} className={styles.surveyName}>
                        {survey.name}
                      </Link>
                      <p className={styles.surveyMeta}>
                        <span>Modified {formatRelativeDate(survey.modifiedAt)}</span>
                        <span className={styles.metaDot} aria-hidden>
                          ·
                        </span>
                        <span>Created {formatDate(survey.createdAt)}</span>
                      </p>
                    </div>
                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.statusBadge} ${statusClass(survey.status)}`}
                        title={survey.status}
                      >
                        {statusShortLabel(survey.status)}
                      </span>
                    </div>
                    <div className={styles.colResponses}>
                      <span
                        className={styles.responsesValue}
                        aria-label={`${formatNumber(survey.responses)} responses`}
                      >
                        {formatNumber(survey.responses)}
                      </span>
                    </div>
                    <div className={styles.colActions}>
                      <SurveyRowActions survey={survey} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon="wm-folder-open"
              title={search.trim() ? 'No matching surveys' : 'No surveys in this folder'}
              description={
                search.trim()
                  ? 'Try a different search term or clear the filter'
                  : 'Create a new survey or choose another folder'
              }
            />
          </div>
        )}

        {filteredSurveys.length > 0 ? (
          <footer className={styles.footer}>
            <label className={styles.selectAll}>
              <WuCheckbox
                checked={allSelected}
                onChange={(checked) => toggleAll(checked)}
                aria-label="Select all surveys on this page"
              />
              <span>Select all</span>
            </label>
            <SurveysPagination rangeEnd={rangeEnd} displayTotal={displayTotal} />
          </footer>
        ) : null}
      </div>
    </section>
  );
}
