'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { DataOrdering } from '@/data/mock-dashboard-global-settings';
import {
  DataOrderingAscendingIcon,
  DataOrderingDefaultIcon,
  DataOrderingDescendingIcon,
} from '@/components/dashboards/DashboardDataOrderingIcons';
import styles from './DashboardDataOrderingSwitcher.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const DATA_ORDERING_OPTIONS: {
  value: DataOrdering;
  label: string;
  Icon: ReactNode;
}[] = [
  { value: 'none', label: 'Default', Icon: <DataOrderingDefaultIcon /> },
  { value: 'descending', label: 'Descending', Icon: <DataOrderingDescendingIcon /> },
  { value: 'ascending', label: 'Ascending', Icon: <DataOrderingAscendingIcon /> },
];

interface DashboardDataOrderingSwitcherProps {
  value: DataOrdering;
  onChange: (value: DataOrdering) => void;
}

export function DashboardDataOrderingSwitcher({
  value,
  onChange,
}: DashboardDataOrderingSwitcherProps) {
  return (
    <div className={styles.group} role="group" aria-label="Data ordering">
      {DATA_ORDERING_OPTIONS.map((option) => (
        <WuButton
          key={option.value}
          variant="iconOnly"
          size="sm"
          selected={value === option.value}
          aria-label={option.label}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          Icon={option.Icon}
        />
      ))}
    </div>
  );
}
