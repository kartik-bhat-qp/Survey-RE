'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  availableSharedFilters, initialSharedViewerFilters, filterSharedResponses,
  SHARED_DASHBOARD_RESPONSES, SHARED_RESPONSE_STATUS_OPTIONS, shareSettingsError,
  type SharedLinkSettings, type SharedViewerFilters, type SharedResponseStatus,
} from '@/data/mock-shared-urls';
import { buildSharedChartPayload, sharedResponseMean } from '@/data/shared-dashboard-chart-data';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import type { AiWidgetConfig } from '@/data/mock-ai-widgets';
import { useDashboardSharing } from '@/hooks/useDashboardSharing';
import { useMounted } from '@/hooks/useMounted';
import { AiDashboardCanvas } from './AiDashboardCanvas';
import { AiWidgetRenderer } from './widgets/AiWidgetRenderer';
import { DashboardWidgetCard } from './widgets/DashboardWidgetCard';
import { SharedDashboardDateFilter } from './SharedDashboardDateFilter';
import styles from './SharedDashboardViewer.module.css';

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false });
const WuCombobox = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })), { ssr: false });
const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false });
const WuDrawer = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDrawer })), { ssr: false });

interface Option { value: string; label: string }
const optionFor = (value: string): Option => ({ value, label: value });
const TABS = ['Tab 1', 'Tab 2']; // The current prototype has two canvas tabs.

function ViewerContent({ settings, dashboardName }: { settings: SharedLinkSettings; dashboardName: string }) {
  const [filters, setFilters] = useState<SharedViewerFilters>(() => initialSharedViewerFilters(settings));
  const [filtersOpen, setFiltersOpen] = useState(settings.allowInteractivity);
  const [activeTab, setActiveTab] = useState(0);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(!settings.enablePassword);
  const [passwordError, setPasswordError] = useState(false);
  const [focusedWidget, setFocusedWidget] = useState<AiWidgetConfig | null>(null);
  const [comment, setComment] = useState('');
  const [insight, setInsight] = useState('');
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [insights, setInsights] = useState<Record<string, string[]>>({});
  const [likedWidgets, setLikedWidgets] = useState<string[]>([]);
  const available = availableSharedFilters(settings);
  const { responses, payload } = useMemo(() => {
    const responses = filterSharedResponses(settings, filters);
    return { responses, payload: buildSharedChartPayload(responses) };
  }, [settings, filters]);
  const update = (partial: Partial<SharedViewerFilters>) => setFilters((previous) => ({ ...previous, ...partial }));
  const activePreset = available.find((filter) => filter.id === filters.activeSavedFilterId);
  const hasFilterPanel = settings.allowInteractivity || settings.dateFilter || settings.responseStatus;
  const hasChanged = JSON.stringify(filters) !== JSON.stringify(initialSharedViewerFilters(settings));
  const focusedKey = focusedWidget ? `${activeTab}-${focusedWidget.id}` : '';
  const summary = responses.length
    ? `${responses.length} responses match the current filters. ${Math.round(payload.completed / responses.length * 100)}% are complete, with average satisfaction of ${sharedResponseMean(responses)} out of 5.`
    : 'No matching results. Try adjusting your filters.';

  function renderWidget(widget: AiWidgetConfig, focused = false) {
    if (!responses.length) return <div className={styles.noResults}><strong>No matching results.</strong><p>Try adjusting your filters.</p></div>;
    return <AiWidgetRenderer widgetId={widget.id} type={widget.type} data={payload}
      meanValue={sharedResponseMean(responses)} chartInstanceId={`${widget.id}-shared-${activeTab}${focused ? '-focused' : ''}`} />;
  }

  if (!unlocked) return <main className={styles.gateArea}><form className={styles.passwordGate} onSubmit={(event) => {
    event.preventDefault(); setPasswordError(password !== settings.password); setUnlocked(password === settings.password);
  }}>
    <h1>Password required</h1><p>Enter the password for this shared dashboard.</p>
    <WuInput aria-label="Dashboard password" type="password" value={password} onInput={(event) => setPassword(event.currentTarget.value)} />
    {passwordError && <p role="alert">Incorrect password. Try again.</p>}
    <WuButton type="submit">View dashboard</WuButton>
    <small>Local prototype only. This password prompt is not secure server authorization.</small>
  </form></main>;

  return <>
    {(settings.showTitle || settings.savedFiltersEnabled) && <header className={styles.titleBar}>
      {settings.showTitle && <h1 style={{ textAlign: settings.titleAlignment }}>{settings.shareTitle.trim() || dashboardName}</h1>}
      {settings.savedFiltersEnabled && <div className={styles.headerControls}>
        {hasFilterPanel && <button type="button" className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleActive : ''}`}
          aria-label="Filter" title="Show or hide filters" aria-expanded={filtersOpen} aria-controls="shared-filters"
          onClick={() => setFiltersOpen((previous) => !previous)}><span className="wm-filter-alt" aria-hidden />{!settings.allowInteractivity && 'Filter'}</button>}
        {!settings.allowInteractivity && <div className={styles.presetSelect}>
          <WuSelect aria-label="Saved filter" variant="outlined" data={available} placeholder="Saved filters"
            accessorKey={{ value: 'id', label: 'label' }} value={activePreset ?? null}
            onSelect={(option) => update({ activeSavedFilterId: (option as { id: string }).id })} />
        </div>}
        {!settings.allowInteractivity && hasChanged && <button type="button" className={styles.reset} onClick={() => setFilters(initialSharedViewerFilters(settings))}>
          <span className="wm-refresh" aria-hidden />Reset filters
        </button>}
      </div>}
    </header>}

    {settings.savedFiltersEnabled && hasFilterPanel && filtersOpen && <section id="shared-filters" className={styles.filterStrip} aria-label="Dashboard filters">
      {(settings.responseStatus || settings.dateFilter) && <div className={styles.commonFilters}>
        {settings.responseStatus && <div className={styles.inlineControl}>
          <span id="shared-status-label">Response status</span>
          <WuCombobox aria-label="Response status" multiple variant="outlined" enableSearch={false}
            data={SHARED_RESPONSE_STATUS_OPTIONS} accessorKey={{ value: 'value', label: 'label' }}
            value={SHARED_RESPONSE_STATUS_OPTIONS.filter((option) => filters.responseStatuses.includes(option.value))}
            selectAll={{ enable: true, label: 'All Responses' }} placeholder="Select..."
            onSelect={(options) => {
              const selected = (Array.isArray(options) ? options : [options]) as { value: SharedResponseStatus }[];
              queueMicrotask(() => update({ responseStatuses: selected.map((option) => option.value) }));
            }} />
        </div>}
        {settings.dateFilter && <div className={styles.inlineControl}>
          <span>Date</span><SharedDashboardDateFilter startDate={filters.startDate} endDate={filters.endDate} onChange={update} />
        </div>}
      </div>}
      {settings.allowInteractivity && <div className={styles.filterCards}>
        {available.map((filter) => <div key={filter.id} className={styles.filterCard}>
          <span className={styles.filterLabel}>{filter.label}</span>
          <WuCombobox aria-label={`${filter.label} values`}
            multiple enableSearch variant="outlined" data={filter.values.map(optionFor)}
            accessorKey={{ value: 'value', label: 'label' }} value={(filters.valuesByFilter[filter.id] ?? []).map(optionFor)}
            placeholder="Select..." selectAll={{ enable: true, label: 'Select all values' }}
            onSelect={(options) => {
              const selected = (Array.isArray(options) ? options : [options]) as Option[];
              queueMicrotask(() => setFilters((previous) => ({ ...previous, valuesByFilter: { ...previous.valuesByFilter, [filter.id]: selected.map((option) => option.value) } })));
            }} />
        </div>)}
        {hasChanged && <button type="button" className={styles.reset} onClick={() => setFilters(initialSharedViewerFilters(settings))}>
          <span className="wm-refresh" aria-hidden />Reset filters
        </button>}
      </div>}
    </section>}

    <div className={styles.srOnly} role="status">Showing {responses.length} of {SHARED_DASHBOARD_RESPONSES.length} sample responses{settings.baseFilter ? '. Base filter applied.' : ''}</div>
    <main id="shared-tab-panel" role="tabpanel" aria-labelledby={`shared-tab-${activeTab}`} className={styles.canvasArea}>
      <AiDashboardCanvas key={activeTab} readOnly renderWidget={renderWidget}
        renderWidgetActions={(widget) => settings.showInsights || settings.allowComments ? <button type="button" className={styles.insightButton}
          aria-label={`Insights for ${widget.title}`} onClick={() => { setFocusedWidget(widget); setComment(''); setInsight(''); }}>
          <span className="wm-lightbulb" aria-hidden /><span>{(settings.showInsights ? 1 : 0) + (insights[`${activeTab}-${widget.id}`]?.length ?? 0)}</span>
        </button> : null}
        footer={<footer className={styles.poweredBy}>Powered by <a href="https://www.questionpro.com/" target="_blank" rel="noreferrer">QuestionPro</a></footer>} />
    </main>
    <footer className={styles.bottomBar}>
      <div role="tablist" aria-label="Dashboard tabs" className={styles.tabs}>
        {TABS.map((tab, index) => <button key={tab} type="button" role="tab" id={`shared-tab-${index}`} aria-selected={activeTab === index}
          aria-controls="shared-tab-panel" tabIndex={activeTab === index ? 0 : -1}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (activeTab + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
            setActiveTab(next); document.getElementById(`shared-tab-${next}`)?.focus();
          }} onClick={() => setActiveTab(index)}>{tab}</button>)}
      </div>
      <span className={styles.prototypeNote} title="Synthetic responses. Sharing settings are stored in this browser; this link is not published online.">Local prototype · Sample data</span>
    </footer>

    <WuDrawer side="right" open={!!focusedWidget} onOpenChange={(open) => { if (!open) setFocusedWidget(null); }} hideCloseButton
      className={styles.insightsDrawer} aria-labelledby="shared-insights-title" aria-describedby="shared-insights-note">
      {focusedWidget && <>
        <div className={styles.focusedWidget}><DashboardWidgetCard shared title={focusedWidget.title} actions={null}>{renderWidget(focusedWidget, true)}</DashboardWidgetCard></div>
        <header className={styles.insightsHeader}><h2 id="shared-insights-title">Insights</h2>
          <button type="button" aria-label="Close insights" onClick={() => setFocusedWidget(null)}><span className="wm-close" aria-hidden /></button>
        </header>
        <div className={styles.insightsBody}>
          {settings.showInsights && <article className={styles.insightItem}>
            <h3><span className="wc-ai" aria-hidden />AI insight</h3><p>{summary}</p>
            <button type="button" className={styles.like} aria-label="Like insight" aria-pressed={likedWidgets.includes(focusedKey)}
              onClick={() => setLikedWidgets((previous) => previous.includes(focusedKey) ? previous.filter((key) => key !== focusedKey) : [...previous, focusedKey])}>
              <span className="wm-thumb-up" aria-hidden />{likedWidgets.includes(focusedKey) ? 1 : 0}
            </button>
          </article>}
          {(insights[focusedKey] ?? []).map((text, index) => <article key={index} className={styles.insightItem}><h3>Your insight</h3><p>{text}</p></article>)}
          {(comments[focusedKey] ?? []).map((text, index) => <p className={styles.comment} key={index}><strong>You</strong>{text}</p>)}
          {settings.allowComments && <form className={styles.commentForm} onSubmit={(event) => {
            event.preventDefault(); if (!comment.trim()) return;
            setComments((previous) => ({ ...previous, [focusedKey]: [...(previous[focusedKey] ?? []), comment.trim()] })); setComment('');
          }}><WuInput aria-label="Comment" placeholder="Comment" value={comment} onInput={(event) => setComment(event.currentTarget.value)} />
            {comment.trim() && <WuButton type="submit" size="sm">Post</WuButton>}
          </form>}
        </div>
        <footer className={styles.insightsFooter}>
          {settings.allowComments && <form onSubmit={(event) => {
            event.preventDefault(); if (!insight.trim()) return;
            setInsights((previous) => ({ ...previous, [focusedKey]: [...(previous[focusedKey] ?? []), insight.trim()] })); setInsight('');
          }}><WuInput aria-label="Add your insight" placeholder="Add your insight" value={insight} onInput={(event) => setInsight(event.currentTarget.value)} />
            <button type="submit" aria-label="Send insight" disabled={!insight.trim()}><span className="wm-send" aria-hidden /></button>
          </form>}
          <small id="shared-insights-note">Sample insight. Comments and likes stay in this preview session.</small>
        </footer>
      </>}
    </WuDrawer>
  </>;
}

export function SharedDashboardViewer({ dashboardId, profile }: { dashboardId: number; profile: string }) {
  const [sharing] = useDashboardSharing(dashboardId);
  const mounted = useMounted();
  const dashboard = getDashboardById(dashboardId);
  const link = sharing.links.find((item) => String(item.id) === profile);
  const settings = profile === 'default' ? sharing.settings : link?.settings;
  const enabled = profile === 'default' ? sharing.enabled : link?.status;
  return <div className={styles.page}>
    {!mounted ? <p className={styles.empty}>Loading dashboard…</p> : !dashboard || !enabled || !settings || shareSettingsError(settings) ? <main className={styles.empty}>
      <h1>Shared dashboard unavailable</h1><p>This link is inactive, has been deleted, or its sharing settings are incomplete.</p>
    </main> : <ViewerContent key={`${profile}-${JSON.stringify(settings)}`} settings={settings} dashboardName={dashboard.name} />}
  </div>;
}
