'use client';

import { useId, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  DASHBOARD_SAVED_FILTER_OPTIONS,
  SHARED_LINK_LANGUAGE_OPTIONS,
  type SharedLinkSettings,
  type SharedLinkTitleAlignment,
} from '@/data/mock-shared-urls';
import styles from './CreateSharedLinkForm.module.css';

const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false });
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false });
const WuToggle = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })), { ssr: false });
const WuCheckbox = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })), { ssr: false });

const ALIGNMENTS: { value: SharedLinkTitleAlignment; label: string; icon: string }[] = [
  { value: 'left', label: 'Left', icon: 'wm-format-align-left' },
  { value: 'center', label: 'Center', icon: 'wm-format-align-center' },
  { value: 'right', label: 'Right', icon: 'wm-format-align-right' },
];
type FilterOption = (typeof DASHBOARD_SAVED_FILTER_OPTIONS)[number];
type BooleanSetting = 'showInsights' | 'allowComments' | 'enablePassword' | 'baseFilter' | 'savedFiltersEnabled' | 'dateFilter' | 'responseStatus';

interface Props {
  dashboardName: string;
  settings: SharedLinkSettings;
  onChange: (settings: SharedLinkSettings) => void;
  layout?: 'default' | 'link';
  nameField?: ReactNode;
}

export function DashboardShareSettingsFields({ dashboardName, settings, onChange, layout = 'link', nameField }: Props) {
  const id = useId();
  const patch = (partial: Partial<SharedLinkSettings>) => onChange({ ...settings, ...partial });
  const filterOptions = DASHBOARD_SAVED_FILTER_OPTIONS.filter((option) => !settings.baseFilter || option.value !== settings.baseFilterId);
  const selectedFilters = filterOptions.filter((option) => settings.selectedSavedFilterIds.includes(option.value));

  function toggle(label: string, key: BooleanSetting) {
    return <div className={styles.toggleRow}>
      <span className={styles.label}>{label}</span>
      <WuToggle checked={settings[key]} onChange={(checked) => {
        if (key === 'baseFilter' && checked) {
          patch({ baseFilter: true, selectedSavedFilterIds: settings.selectedSavedFilterIds.filter((filterId) => filterId !== settings.baseFilterId) });
        } else patch({ [key]: checked });
      }} aria-label={label} />
    </div>;
  }

  const titleFields = <>
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`${id}-title`}>Share title</label>
      <div className={styles.shareTitleRow}>
        <WuInput id={`${id}-title`} variant="flat" placeholder="Defaults to dashboard name" value={settings.shareTitle}
          disabled={!settings.showTitle} onInput={(event) => patch({ shareTitle: event.currentTarget.value })} className={styles.shareTitleInput} />
        <button type="button" className={styles.iconBtn} aria-label={settings.showTitle ? 'Hide share title' : 'Show share title'}
          aria-pressed={!settings.showTitle} onClick={() => patch({ showTitle: !settings.showTitle })}>
          <span className={settings.showTitle ? 'wm-visibility' : 'wm-visibility-off'} aria-hidden />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Reset share title"
          onClick={() => patch({ shareTitle: dashboardName, showTitle: true })}><span className="wm-refresh" aria-hidden /></button>
      </div>
    </div>
    <div className={styles.toggleRow}>
      <span className={styles.label}>Title alignment</span>
      <div className={styles.alignmentGroup} role="group" aria-label="Title alignment">
        {ALIGNMENTS.map((option) => <button key={option.value} type="button" aria-label={option.label}
          disabled={!settings.showTitle} aria-pressed={settings.titleAlignment === option.value}
          className={`${styles.alignmentBtn} ${settings.titleAlignment === option.value ? styles.alignmentBtnSelected : ''}`}
          onClick={() => patch({ titleAlignment: option.value })}><span className={option.icon} aria-hidden /></button>)}
      </div>
    </div>
    {toggle('Show insights', 'showInsights')}
    {toggle('Allow comments', 'allowComments')}
  </>;

  const passwordField = <div className={styles.field}>
    {toggle('Enable password', 'enablePassword')}
    {settings.enablePassword && <div className={styles.passwordRow}>
      <WuInput aria-label="Password" variant="flat" autoComplete="new-password" type="password"
        placeholder="Enter your password" value={settings.password} onInput={(event) => patch({ password: event.currentTarget.value })}
        className={styles.shareTitleInput} />
    </div>}
  </div>;

  const baseFilterField = <div className={styles.field}>
    {toggle('Base filter', 'baseFilter')}
    {settings.baseFilter && <WuSelect aria-label="Select base filter" data={[...DASHBOARD_SAVED_FILTER_OPTIONS]}
      accessorKey={{ value: 'value', label: 'label' }} placeholder="Select..." variant="outlined"
      value={DASHBOARD_SAVED_FILTER_OPTIONS.find((option) => option.value === settings.baseFilterId) ?? null}
      onSelect={(option) => {
        const selected = option as FilterOption;
        patch({ baseFilterId: selected.value, selectedSavedFilterIds: settings.selectedSavedFilterIds.filter((filterId) => filterId !== selected.value) });
      }} />}
  </div>;

  const savedFilterFields = <div className={styles.field}>
    {toggle('Saved filters', 'savedFiltersEnabled')}
    {settings.savedFiltersEnabled && <div className={styles.filterPanel}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-saved-filters`}>Filters available to viewers</label>
        <WuSelect id={`${id}-saved-filters`} aria-label="Saved filters available to viewers" multiple
          data={filterOptions} accessorKey={{ value: 'value', label: 'label' }} value={selectedFilters}
          placeholder="Select saved filters..." variant="outlined" selectAll={{ enable: true, label: 'Select all filters' }}
          onSelect={(options) => {
            const selected = (Array.isArray(options) ? options : [options]) as FilterOption[];
            // WickUI 1.39 calls multiple-selection handlers inside its state updater.
            // Defer the parent update until that render has finished.
            queueMicrotask(() => patch({ selectedSavedFilterIds: selected.map((option) => option.value) }));
          }} />
        {selectedFilters.length === 0 && <p className={styles.hint}>Select at least one saved filter to share.</p>}
      </div>
      <div className={styles.interactivityField}>
        <WuCheckbox Label="Allow interactivity" checked={settings.allowInteractivity} disabled={selectedFilters.length === 0}
          onChange={(checked) => patch({ allowInteractivity: checked })} aria-describedby={`${id}-interactivity-help`} />
        <p id={`${id}-interactivity-help`} className={styles.hint}>
          Viewers can change values in every selected filter and apply them together.
        </p>
      </div>
      <div className={styles.additionalFilters}>
        {toggle('Date filter', 'dateFilter')}
        {toggle('Response status', 'responseStatus')}
      </div>
    </div>}
  </div>;

  const languageField = <div className={styles.languageRow}>
    <span className={styles.label}>Language</span>
    <WuSelect aria-label="Language" data={[...SHARED_LINK_LANGUAGE_OPTIONS]} accessorKey={{ value: 'value', label: 'label' }}
      value={SHARED_LINK_LANGUAGE_OPTIONS.find((option) => option.value === settings.language) ?? SHARED_LINK_LANGUAGE_OPTIONS[0]}
      onSelect={(option) => patch({ language: (option as (typeof SHARED_LINK_LANGUAGE_OPTIONS)[number]).value })} variant="outlined" />
  </div>;

  return layout === 'default' ? <div className={`${styles.column} ${styles.defaultFields}`}>
    {titleFields}{baseFilterField}{savedFilterFields}{languageField}{passwordField}
  </div> : <div className={styles.columns}>
    <div className={styles.column}>{nameField}{titleFields}{passwordField}{baseFilterField}</div>
    <div className={styles.column}>{savedFilterFields}{languageField}</div>
  </div>;
}
