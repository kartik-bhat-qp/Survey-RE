'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';

type SurveyStack = {
  id: number;
  name: string;
  createdOn: string;
  completedResponses: number;
};

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

const SURVEY_STACKS: SurveyStack[] = [
  {
    id: 1,
    name: 'Customer Experience Portfolio',
    createdOn: 'May 05 2026',
    completedResponses: 6,
  },
  {
    id: 2,
    name: 'Market Insights Program',
    createdOn: 'May 05 2026',
    completedResponses: 6,
  },
  {
    id: 3,
    name: 'Brand Health Benchmark',
    createdOn: 'Apr 30 2026',
    completedResponses: 11,
  },
  {
    id: 4,
    name: 'Product Feedback Initiative',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 5,
    name: 'Employee Engagement Suite',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 6,
    name: 'Executive Pulse Tracker',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 7,
    name: 'Compliance Readiness Review',
    createdOn: 'Oct 31 2025',
    completedResponses: 6,
  },
];

export default function SurveyStacksPage() {
  const basePath = useBiProductBasePath();
  const surveyStacksPath = withBiProductBasePath(basePath, '/survey-stacks');
  const [searchTerm, setSearchTerm] = useState('');

  const columns: IWuTableColumnDef<SurveyStack>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      filterable: true,
      cell: ({ row }) => (
        <Link
          href={`${surveyStacksPath}/${row.original.id}`}
          className="font-medium text-[#0a2d8c] hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'createdOn',
      header: 'Created on',
      filterable: true,
    },
    {
      accessorKey: 'completedResponses',
      header: 'Completed responses',
      headerAlign: 'left',
      cellAlign: 'left',
      cell: ({ row }) => row.original.completedResponses,
    },
  ];

  const filteredStacks = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return SURVEY_STACKS;
    }

    return SURVEY_STACKS.filter((stack) =>
      stack.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [searchTerm]);

  return (
    <div className="min-h-[calc(100vh-46px)] bg-white font-['Fira_Sans',sans-serif] text-[#253449]">
      <div className="flex h-[66px] items-center justify-between border-b border-[#e7eaf0] px-[15px]">
        <h1 className="text-[18px] font-semibold leading-none text-[#515b6b]">
          Survey stacks
        </h1>
        <WuButton
          className="inline-flex h-8 items-center gap-2 rounded-[4px] bg-[#1e88e5] px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1976d2]"
          Icon={<span className="wm-add text-[16px]" aria-hidden="true" />}
        >
          New survey stack
        </WuButton>
      </div>

      <section className="px-[31px] pt-[33px]">
        <WuInput
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search"
          aria-label="Search survey stacks"
          variant="flat"
          Icon={<span className="wm-search text-[13px]" aria-hidden="true" />}
          iconPosition="left"
          className="h-8 w-[165px] rounded-[4px] border-0 border-b border-[#d7dbe2] bg-[#f3f3f4] text-[12px] text-[#253449]"
        />

        <div className="mt-4 overflow-x-auto">
          <WuTable
            data={filteredStacks as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="bordered"
            size="compact"
            sort={{ enabled: true }}
            NoDataContent="No survey stacks match your search."
            className="min-w-[900px] !border-0 text-[12px] [&_td]:!border-l-0 [&_td]:!border-r-0 [&_th]:!border-l-0 [&_th]:!border-r-0 [&_th]:bg-[#f0f0f0] [&_th]:text-[#5f6b7a]"
          />
        </div>
      </section>
    </div>
  );
}
