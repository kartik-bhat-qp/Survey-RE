'use client';

import { useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './DashboardWidgetSettingsModal.module.css';

export type DashboardWidgetFilterType = 'Dashboard' | 'Widget' | 'Combined' | 'None';

interface DashboardWidgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filterType: DashboardWidgetFilterType;
  onFilterTypeChange: (type: DashboardWidgetFilterType) => void;
}

const FILTER_TYPES: Array<{ value: DashboardWidgetFilterType; icon: string }> = [
  { value: 'Dashboard', icon: 'wm-dashboard' },
  { value: 'Widget', icon: 'wm-widgets' },
  { value: 'Combined', icon: 'wm-merge-type' },
  { value: 'None', icon: 'wm-block' },
];

export function DashboardWidgetSettingsModal({
  open,
  onOpenChange,
  title,
  filterType,
  onFilterTypeChange,
}: DashboardWidgetSettingsModalProps) {
  const wick = useWickUILib();
  const [activeTab, setActiveTab] = useState<'general' | 'analytics' | 'design'>('general');
  const [name, setName] = useState(title);
  const [highlightedInsight, setHighlightedInsight] = useState(false);

  if (!open || !wick) return null;
  const { WuModal, WuModalHeader, WuModalContent, WuToggle } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" maxWidth="760px" maxHeight="min(720px, calc(100dvh - 32px))">
      <WuModalHeader>Settings</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.tabs} role="tablist" aria-label="Widget settings">
          {(['general', 'analytics', 'design'] as const).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {activeTab === 'general' ? (
          <div className={styles.general}>
            <label>
              <span>Name</span>
              <div className={styles.nameRow}>
                <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Widget name" />
                <WuToggle checked aria-label="Show widget name" onChange={() => undefined} />
              </div>
            </label>
            <div className={styles.toggleRow}>
              <span>Highlighted insight</span>
              <WuToggle checked={highlightedInsight} onChange={setHighlightedInsight} aria-label="Highlighted insight" />
            </div>
            <section className={styles.filterOptions} aria-labelledby="widget-filter-options-title">
              <h3 id="widget-filter-options-title">Filter options</h3>
              <label>
                <span>Filter type</span>
                <select
                  value={filterType}
                  onChange={(event) => onFilterTypeChange(event.target.value as DashboardWidgetFilterType)}
                  aria-label="Filter type"
                >
                  {FILTER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.value}</option>
                  ))}
                </select>
              </label>
              <p>
                {filterType === 'Dashboard' && 'Use filters created at the dashboard level.'}
                {filterType === 'Widget' && 'Use filters configured specifically for this widget.'}
                {filterType === 'Combined' && 'Use both dashboard and widget filters.'}
                {filterType === 'None' && 'Do not apply dashboard or widget filters.'}
              </p>
            </section>
          </div>
        ) : (
          <p className={styles.placeholder}>Configure {activeTab} settings for this widget.</p>
        )}
      </WuModalContent>
    </WuModal>
  );
}
