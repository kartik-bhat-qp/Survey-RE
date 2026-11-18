'use client';

import dynamic from 'next/dynamic';
import type { DriverQuestionChoice } from '@/data/driver-scoring';

const WuCombobox = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => m.WuCombobox), { ssr: false });

interface Props {
  choices: DriverQuestionChoice[];
  selected: string[];
  multiple?: boolean;
  onChange: (ids: string[]) => void;
}

export function DriverQuestionPicker({ choices, selected, multiple = false, onChange }: Props) {
  const label = multiple ? 'Driver questions' : 'Primary question';
  const options = choices.map(({ code, outcome, metric }) => ({
    value: outcome.rowId,
    label: `${code} · ${outcome.label}${metric === 'mean' ? '' : ' (' + metric.toUpperCase() + ')'}`,
    disabled: multiple && selected.length >= 10 && !selected.includes(outcome.rowId),
  }));
  const current = options.filter(option => selected.includes(option.value));
  return <WuCombobox
    Label={label} labelPosition="top" aria-label={label} variant="outlined" enableSearch
    multiple={multiple} data={options} accessorKey={{ value: 'value', label: 'label' }}
    placeholder={multiple ? 'Select up to 10 driver questions' : 'Select a primary question'}
    value={multiple ? current : current[0] ?? null}
    onSelect={selection => {
      const items = (Array.isArray(selection) ? selection : [selection]) as typeof options;
      const ids = items.filter(Boolean).map(option => option.value);
      if (ids.length <= 10) queueMicrotask(() => onChange(ids));
    }}
  />;
}
