'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import {
  MOCK_SURVEY_FOLDERS,
  SHARED_SURVEY_FOLDER_ID,
  type SurveyListItem,
} from '@/data/mock-survey-folders';
import { getTextAiCreateSurveys } from '@/data/mock-text-ai-surveys';
import { formatSmartDate } from '@/data/mock-utils';
import selectionStyles from '@/components/dashboards/AiDataSourceSelection.module.css';
import styles from './TextAiSurveySelection.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[280px]" /> }
);

export type TextAiDataSourceType =
  | 'surveys'
  | 'customer-experience'
  | 'employee-experience'
  | 'datasets';

const DATA_SOURCE_OPTIONS: { value: TextAiDataSourceType; label: string }[] = [
  { value: 'surveys', label: 'Surveys' },
  { value: 'customer-experience', label: 'Customer Experience' },
  { value: 'employee-experience', label: 'Employee Experience' },
  { value: 'datasets', label: 'Datasets' },
];

const DEFAULT_DATA_SOURCE = DATA_SOURCE_OPTIONS[0];
const PAGE_SIZE = 100;

interface TextAiSurveySelectionProps {
  selectedSurveyId: number | null;
  onSelectSurvey: (survey: SurveyListItem) => void;
}

function folderItemClass(isSelected: boolean): string {
  return [selectionStyles.folderItem, isSelected ? selectionStyles.folderItemSelected : '']
    .filter(Boolean)
    .join(' ');
}

export function TextAiSurveySelection({
  selectedSurveyId,
  onSelectSurvey,
}: TextAiSurveySelectionProps) {
  const [folderId, setFolderId] = useState('my-surveys');
  const [search, setSearch] = useState('');
  const [dataSource, setDataSource] = useState(DEFAULT_DATA_SOURCE);
  const [page, setPage] = useState(0);

  const isSurveysSource = dataSource.value === 'surveys';

  const allSurveys = useMemo(
    () => (isSurveysSource ? getTextAiCreateSurveys(folderId) : []),
    [folderId, isSurveysSource]
  );

  const filteredSurveys = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allSurveys;
    return allSurveys.filter((s) => s.name.toLowerCase().includes(term));
  }, [allSurveys, search]);

  const pageCount = Math.max(1, Math.ceil(filteredSurveys.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageSurveys = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredSurveys.slice(start, start + PAGE_SIZE);
  }, [filteredSurveys, safePage]);

  const rangeStart = filteredSurveys.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filteredSurveys.length);

  const columns: IWuTableColumnDef<SurveyListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Survey',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => {
        const isSelected = selectedSurveyId === row.original.id;
        return (
          <button
            type="button"
            className={`${selectionStyles.surveyName} ${isSelected ? selectionStyles.surveyNameSelected : ''}`}
            onClick={() => onSelectSurvey(row.original)}
          >
            {row.original.name}
          </button>
        );
      },
    },
    {
      accessorKey: 'creationDate',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => formatSmartDate(row.original.creationDate),
    },
    {
      accessorKey: 'completedResponses',
      header: 'Completed responses',
      headerAlign: 'right',
      cellAlign: 'right',
      enableSorting: true,
      cell: ({ row }) => row.original.completedResponses.toLocaleString(),
    },
  ];

  const isSharedSelected = folderId === SHARED_SURVEY_FOLDER_ID;

  return (
    <div className={selectionStyles.root}>
      <aside className={`${selectionStyles.sidebar} ${styles.sidebar}`}>
        <div className={selectionStyles.sidebarHeader}>
          <WuSelect
            data={DATA_SOURCE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) => {
              if (!option) return;
              setDataSource(option as (typeof DATA_SOURCE_OPTIONS)[number]);
              setPage(0);
              setSearch('');
            }}
            variant="outlined"
          />
        </div>
        {isSurveysSource ? (
          <>
            <ul className={`${selectionStyles.folderList} ${styles.folderList}`}>
              {MOCK_SURVEY_FOLDERS.map((folder) => {
                const isSelected = folderId === folder.id;
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setFolderId(folder.id);
                        setPage(0);
                      }}
                      className={folderItemClass(isSelected)}
                    >
                      <span className={`wm-folder ${selectionStyles.folderIcon}`} />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className={`${selectionStyles.sharedSurveys} ${isSharedSelected ? selectionStyles.sharedSurveysSelected : ''}`}
              onClick={() => {
                setFolderId(SHARED_SURVEY_FOLDER_ID);
                setPage(0);
              }}
            >
              <span className={`wm-group ${selectionStyles.sharedIcon}`} />
              Shared surveys
            </button>
          </>
        ) : null}
      </aside>

      <div className={selectionStyles.surveyPanel}>
        <div className={selectionStyles.searchInputWrapper}>
          <WuInput
            variant="outlined"
            placeholder="Search"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className={selectionStyles.searchInput}
          />
        </div>

        {isSurveysSource ? (
        <div className={styles.paginationBar}>
          <button
            type="button"
            className={styles.pageNavBtn}
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            <span className="wm-chevron-left" />
          </button>
          <span className={styles.pageRange}>
            {rangeStart} - {rangeEnd || PAGE_SIZE}
          </span>
          <button
            type="button"
            className={styles.pageNavBtn}
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            aria-label="Next page"
          >
            <span className="wm-chevron-right" />
          </button>
          <WuSelect
            data={[{ value: '100', label: '100' }]}
            accessorKey={{ value: 'value', label: 'label' }}
            value={{ value: '100', label: '100' }}
            onSelect={() => {}}
            variant="outlined"
            className={styles.pageSizeSelect}
          />
        </div>
        ) : null}

        <div className={selectionStyles.tableArea}>
          {isSurveysSource ? (
            <WuTable
              data={pageSurveys as unknown[]}
              columns={columns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              sort={{ enabled: true }}
              filterText=""
            />
          ) : (
            <p className={styles.emptySource}>
              Select a source from {dataSource.label} to continue — available in a future
              release.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
