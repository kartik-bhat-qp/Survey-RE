'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_SURVEY_FOLDERS,
  SHARED_SURVEY_FOLDER_ID,
  getSurveysByFolder,
  type SurveyListItem,
} from '@/data/mock-survey-folders';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { formatSmartDate } from '@/data/mock-utils';
import styles from './AiDataSourceSelection.module.css';

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

const DATA_SOURCE_OPTIONS = [{ value: 'surveys', label: 'Surveys' }];
interface AiDataSourceSelectionProps {
  selectedSurveyId: number | null;
  onSelectSurvey: (survey: SurveyListItem) => void;
}

function folderItemClass(isSelected: boolean): string {
  return [styles.folderItem, isSelected ? styles.folderItemSelected : ''].filter(Boolean).join(' ');
}

export function AiDataSourceSelection({
  selectedSurveyId,
  onSelectSurvey,
}: AiDataSourceSelectionProps) {
  const [folderId, setFolderId] = useState('demo-2026');
  const [search, setSearch] = useState('');
  const [dataSource] = useState(DATA_SOURCE_OPTIONS[0]);

  const surveys = useMemo(() => getSurveysByFolder(folderId), [folderId]);

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
            className={`${styles.surveyName} ${isSelected ? styles.surveyNameSelected : ''}`}
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
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <WuSelect
            data={DATA_SOURCE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={() => {}}
            variant="outlined"
          />
        </div>
        <ul className={styles.folderList}>
          {MOCK_SURVEY_FOLDERS.map((folder) => {
            const isSelected = folderId === folder.id;
            return (
              <li key={folder.id}>
                <button
                  type="button"
                  onClick={() => setFolderId(folder.id)}
                  className={folderItemClass(isSelected)}
                >
                  <span className={`wm-folder ${styles.folderIcon}`} />
                  <span className="truncate">{folder.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className={`${styles.sharedSurveys} ${isSharedSelected ? styles.sharedSurveysSelected : ''}`}
          onClick={() => setFolderId(SHARED_SURVEY_FOLDER_ID)}
        >
          <span className={`wm-group ${styles.sharedIcon}`} />
          Shared surveys
        </button>
      </aside>

      <div className={styles.surveyPanel}>
        <div className={styles.searchInputWrapper}>
          <WuInput
            variant="outlined"
            placeholder="Search"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.tableArea}>
          <WuTable
            data={surveys as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            sort={{ enabled: true }}
            filterText={search}
          />
        </div>
      </div>
    </div>
  );
}
