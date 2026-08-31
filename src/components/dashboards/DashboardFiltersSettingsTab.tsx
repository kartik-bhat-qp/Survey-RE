'use client';

import { useState } from 'react';
import type { DashboardSavedFilter } from '@/data/mock-dashboard-filters';
import styles from './DashboardFiltersSettingsTab.module.css';

interface DashboardFiltersSettingsTabProps {
  filters: DashboardSavedFilter[];
}

export function DashboardFiltersSettingsTab({ filters }: DashboardFiltersSettingsTabProps) {
  const [section, setSection] = useState<'dashboard' | 'widget'>('dashboard');

  return (
    <div className={styles.panel}>
      <div className={styles.switcher} role="group" aria-label="Filter management type">
        <button type="button" className={section === 'dashboard' ? styles.active : ''} onClick={() => setSection('dashboard')}>
          Dashboard filters
        </button>
        <button type="button" className={section === 'widget' ? styles.active : ''} onClick={() => setSection('widget')}>
          Widget filters
        </button>
      </div>

      {section === 'dashboard' ? (
        filters.length ? (
          <div className={styles.list}>
            {filters.map((filter) => (
              <article key={filter.id} className={styles.row}>
                <div>
                  <div className={styles.nameRow}>
                    <h3>{filter.name}</h3>
                    {filter.isDefault ? <span>Default</span> : null}
                  </div>
                  <p>{filter.summary}</p>
                </div>
                <button type="button" aria-label={`More options for ${filter.name}`}><span className="wm-more-vert" aria-hidden /></button>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className="wm-filter-alt" aria-hidden />
            <h3>No dashboard filters present.</h3>
            <p>Try saving the filter on the dashboard and it will appear over here.</p>
          </div>
        )
      ) : (
        <div className={styles.empty}>
          <span className="wm-filter-alt" aria-hidden />
          <h3>No widget filter present.</h3>
          <p>Open widget settings to create a widget filter. These filters can be applied to one or more widgets.</p>
        </div>
      )}
    </div>
  );
}
