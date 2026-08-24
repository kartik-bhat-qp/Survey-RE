'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NewDistributeTemplateModal } from '@/components/surveys/NewDistributeTemplateModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import {
  DISTRIBUTE_TEMPLATE_TYPE_FILTERS,
  MOCK_DISTRIBUTE_TEMPLATES,
  type DistributeTemplate,
} from '@/data/mock-survey-distribute';
import styles from './SurveyDistributeTemplates.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

type TypeFilterOption = (typeof DISTRIBUTE_TEMPLATE_TYPE_FILTERS)[number];

export function SurveyDistributeTemplates() {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState<DistributeTemplate[]>(MOCK_DISTRIBUTE_TEMPLATES);
  const [typeFilter, setTypeFilter] = useState<TypeFilterOption>(
    DISTRIBUTE_TEMPLATE_TYPE_FILTERS[0]
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesSearch =
        query.length === 0 ||
        template.name.toLowerCase().includes(query) ||
        template.type.toLowerCase().includes(query);
      const matchesType =
        typeFilter.value === 'all' ||
        (typeFilter.value === 'sms' && template.type === 'SMS') ||
        (typeFilter.value === 'email' && template.type.toLowerCase().includes('email'));
      return matchesSearch && matchesType;
    });
  }, [search, templates, typeFilter]);

  const columns: IWuTableColumnDef<DistributeTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Template Name',
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className={styles.nameBtn}
          onClick={() =>
            showToast({ message: `Opened "${row.original.name}"`, variant: 'info' })
          }
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableSorting: true,
    },
    {
      accessorKey: 'defaultLanguage',
      header: 'Default Language',
      enableSorting: true,
    },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <WuButton
          Icon={<span className="wm-add" aria-hidden />}
          onClick={() => setIsNewTemplateOpen(true)}
        >
          New Template
        </WuButton>
        <div className={styles.toolbarRight}>
          <div className={styles.searchWrap}>
            <WuInput
              type="search"
              variant="outlined"
              placeholder="Search"
              aria-label="Search templates"
              Icon={<span className="wm-search" aria-hidden />}
              iconPosition="left"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.filterWrap}>
            <WuSelect
              data={[...DISTRIBUTE_TEMPLATE_TYPE_FILTERS]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={typeFilter}
              onSelect={(item) => setTypeFilter(item as TypeFilterOption)}
              variant="outlined"
            />
          </div>
        </div>
      </div>

      <TableScrollWrap className={styles.tableWrap}>
        <WuTable
          data={filteredTemplates as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No templates found"
              description="Try a different search or filter."
            />
          }
        />
      </TableScrollWrap>

      <NewDistributeTemplateModal
        open={isNewTemplateOpen}
        onOpenChange={setIsNewTemplateOpen}
        onSaved={(template) => {
          setTemplates((prev) => [template, ...prev]);
          setIsNewTemplateOpen(false);
        }}
      />
    </div>
  );
}
