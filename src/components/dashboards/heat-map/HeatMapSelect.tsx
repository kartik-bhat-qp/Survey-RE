'use client';

import dynamic from 'next/dynamic';
import styles from './HeatMapBaseline.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then(module => ({ default: module.WuSelect })),
  { ssr: false }
);
interface Option { value: string; label: string }
interface HeatMapSelectProps {
  label: string;
  value: string | number;
  options: (string | number)[];
  onChange: (value: string) => void;
  formatOption?: (value: string | number) => string;
}

/** Shared production-style select, with controlled values and WickUI keyboard handling. */
export function HeatMapSelect({ label, value, options, onChange, formatOption = String }: HeatMapSelectProps) {
  const data: Option[] = options.map(option => ({ value: String(option), label: formatOption(option) }));
  return <WuSelect
    aria-label={label}
    data={data}
    accessorKey={{ value: 'value', label: 'label' }}
    value={data.find(option => option.value === String(value)) ?? null}
    variant="outlined"
    className={styles.selectTrigger}
    onSelect={selected => {
      const option = selected as Option | Option[];
      if (!Array.isArray(option)) onChange(option.value);
    }}
  />;
}
