'use client';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { widgetPayload, type BuiltWidget, type BuilderSettings } from '@/data/ai-widget-builder';
import type { DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import { WidgetFrame } from './WidgetFrame';
import { DashboardWidgetCard } from '../widgets/DashboardWidgetCard';
import styles from './Builder.module.css';
export function BuiltWidgetCard({ widget, onChange, dashboardFilter, dragHandleClassName }: { widget: BuiltWidget; onChange?: (next: BuiltWidget) => void; dashboardFilter?: DashboardActiveFilter; dragHandleClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('General');
  const [draft, setDraft] = useState(widget.settings);
  const { settings, output, source } = widget;
  const payload = widget.placeholder ? null : widgetPayload(widget, dashboardFilter);
  const fields = source.fields.filter(f => f.options.length > 0);
  const patch = (update: Partial<BuilderSettings>) => setDraft(prev => ({ ...prev, ...update }));
  const tabs = ['General', ...(output.capabilities.design ? ['Design'] : []), ...(output.capabilities.analytics || output.capabilities.weighting ? ['Analytics'] : []), ...(output.capabilities.labels ? ['Labels'] : [])];
  return <DashboardWidgetCard title={settings.name} dragHandleClassName={dragHandleClassName} showInsights={false}
    actions={onChange ? undefined : null}
    onOpenSettings={() => { setDraft(settings); setTab('General'); setOpen(true); }}>
    <div className={styles.widgetContent}>
    {settings.highlight && <p className={styles.highlight}>{settings.highlight}</p>}
    {output.capabilities.slicer && onChange && <div className={styles.slicer}><label htmlFor={`${widget.id}-slice`}>Slice by</label><select id={`${widget.id}-slice`} value={settings.sliceField} onChange={e => onChange({ ...widget, settings: { ...settings, sliceField: e.target.value, sliceValue: '' } })}><option value="">None</option>{fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>{settings.sliceField && <select aria-label="Slice value" value={settings.sliceValue} onChange={e => onChange({ ...widget, settings: { ...settings, sliceValue: e.target.value } })}><option value="">All answers</option>{fields.find(f => f.id === settings.sliceField)?.options.map(value => <option key={value}>{value}</option>)}</select>}</div>}
    {widget.placeholder ? <div className={styles.placeholder}>
      <span className={`wc-ai ${styles.placeholderIcon}`} aria-hidden />
      <strong>AI widget placeholder</strong>
      <p>Your widget will appear here once AI generation is connected.</p>
      <span>{source.name} · {source.fields.length} selected fields</span>
    </div> : <WidgetFrame widget={widget} dashboardFilter={dashboardFilter} />}
    <footer className={styles.widgetFooter}>{payload ? <>{payload.responseCount} responses{settings.weight === 'demo' && output.capabilities.weighting ? ` · Weighted base ${payload.weightedBase.toFixed(2)}` : ''} · Synthetic data · </> : <>Placeholder · </>}Session only</footer>
    </div>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.dialog}>
      <header className={styles.header}><Dialog.Title>Widget settings</Dialog.Title><Dialog.Close className={styles.iconButton} aria-label="Close widget settings">×</Dialog.Close></header><Dialog.Description className={styles.description}>{source.name} · {source.fields.length} selected questions</Dialog.Description>
      <nav className={styles.tabs} aria-label="Widget settings sections">{tabs.map(t => <button key={t} aria-current={tab === t ? 'page' : undefined} data-active={tab === t} onClick={() => setTab(t)}>{t}</button>)}</nav>
      <div className={styles.body}>
        {tab === 'General' && <><label className={styles.field}>Widget name<input maxLength={100} value={draft.name} onChange={e => patch({ name: e.target.value })} /></label><label className={styles.field}>Highlight text<textarea rows={2} maxLength={500} value={draft.highlight} onChange={e => patch({ highlight: e.target.value })} placeholder="Add a short takeaway" /></label>{!widget.placeholder && <><label className={styles.field}>Widget filter<select value={draft.filterField} onChange={e => patch({ filterField: e.target.value, filterValue: '' })}><option value="">All selected questions</option>{fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>{draft.filterField && <label className={styles.field}>Answer is<select value={draft.filterValue} onChange={e => patch({ filterValue: e.target.value })}><option value="">All answers</option>{fields.find(f => f.id === draft.filterField)?.options.map(value => <option key={value}>{value}</option>)}</select></label>}<p className={styles.note}>Dashboard filters, this widget filter, and the data slicer apply together.</p></>}</>}
        {tab === 'Design' && <label className={styles.field}>Accent color<input className={styles.swatch} type="color" value={draft.color} onChange={e => patch({ color: e.target.value })} /></label>}
        {tab === 'Analytics' && <>{output.capabilities.analytics && <label className={styles.field}>Display values<select value={draft.measure} onChange={e => patch({ measure: e.target.value as BuilderSettings['measure'] })}><option value="count">Count</option><option value="percent">Percent</option></select></label>}{output.capabilities.weighting && <label className={styles.field}>Weight scheme<select value={draft.weight} onChange={e => patch({ weight: e.target.value as BuilderSettings['weight'] })}><option value="none">No weighting</option><option value="demo">Demo respondent weights</option></select><span className={styles.note}>Synthetic weights of 0.75 or 1.5 per respondent. Aggregates are recalculated before rendering.</span></label>}</>}
        {tab === 'Labels' && <label className={styles.check}><input type="checkbox" checked={draft.showLabels} onChange={e => patch({ showLabels: e.target.checked })} />Show value labels</label>}
      </div><footer className={styles.footer}><button className={styles.secondary} onClick={() => setOpen(false)}>Cancel</button><button className={styles.primary} disabled={!draft.name.trim()} onClick={() => { onChange?.({ ...widget, settings: { ...draft, name: draft.name.trim() } }); setOpen(false); }}>Save settings</button></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </DashboardWidgetCard>;
}
