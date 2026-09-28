'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  BASELINE_STORAGE_KEY, INITIAL_HEAT_MAP_SEGMENTS,
  defaultHeatMapSettings, matrixHeatMapSettings, mixedHeatMapSettings, fixtureQuestions, normalizeHeatMapSettings,
  resolveHeatMapDesign, resolveHeatMapActiveAnswers, equalThresholds, selectedSegments, heatMapCellColor, heatMapOverallScore, heatMapOverallAverage, heatMapSourceQuestions, heatMapDirectScore, heatMapResponseBase, resolveHeatMapFilter, heatMapCohortCount, heatMapCohortScore,
  type HeatMapSettings, type HeatMapSegment, type HeatMapQuestion,
} from '@/data/heat-map-baseline';
import type { DashboardDesign } from '@/data/dashboard-design';
import type { DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import styles from './HeatMapBaseline.module.css';
import { exportHeatMap } from './exportHeatMap';
import { HeatMapFilterEditor } from './HeatMapFilterEditor';
import { DesignColorPicker } from '@/components/dashboards/DesignColorPicker';
import { HeatMapSelect } from './HeatMapSelect';
import { HeatMapEditIntro } from './HeatMapEditIntro';

type SettingsTab = 'General' | 'Analytics' | 'Rows & Columns' | 'Design';
const tabs: SettingsTab[] = ['General', 'Analytics', 'Rows & Columns', 'Design'];
const toggleItem = (items: string[], id: string) => items.includes(id) ? items.filter(item => item !== id) : [...items, id];
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className={styles.toggle}><span>{label}</span><input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden className={styles.switch} /></label>;
}
function Select({ label, value, options, onChange }: { label: string; value: string | number; options: (string | number)[]; onChange: (value: string) => void }) {
  return <Field label={label}><HeatMapSelect label={label} value={value} options={options} onChange={onChange} formatOption={option => label === 'Decimal precision' ? `${option} (${Number(option) === 0 ? '0' : `0.${'1234'.slice(0, Number(option))}`})` : String(option)} /></Field>;
}
function Scope({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <fieldset className={styles.scope}><legend>{label}</legend><div>{options.map((option, index) => <button key={option} aria-label={`${label}: ${option}`} title={option} aria-pressed={value === option} onClick={() => onChange(option)}>{['▦', '▣', '⊘'][index]}<span>{option}</span></button>)}</div></fieldset>;
}

interface HeatMapBaselineProps {
  dashboardDesign?: DashboardDesign;
  dashboardFilter?: DashboardActiveFilter;
  embedded?: boolean;
  storageKey?: string;
  readOnly?: boolean;
  initialName?: string;
  showWidgetHeader?: boolean;
}
function OverlayPortal({ children }: { children: ReactNode }) {
  return typeof document === 'undefined' ? null : createPortal(<div className={`${styles.page} ${styles.portalRoot}`}>{children}</div>, document.body);
}
export function HeatMapBaseline({ dashboardDesign, dashboardFilter, embedded = false, storageKey = BASELINE_STORAGE_KEY, readOnly = false, initialName, showWidgetHeader = true }: HeatMapBaselineProps) {
  const widgetRef = useRef<HTMLElement>(null);
  const [settings, setSettings] = useState<HeatMapSettings>(() => ({ ...defaultHeatMapSettings(), ...(initialName ? { name: initialName } : {}) }));
  const [segments, setSegments] = useState<HeatMapSegment[]>(INITIAL_HEAT_MAP_SEGMENTS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [fullScreen, setFullScreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [rowPicker, setRowPicker] = useState(false);
  const [rowSearch, setRowSearch] = useState('');
  const [segmentSearch, setSegmentSearch] = useState('');
  const [segmentSort, setSegmentSort] = useState(false);
  const [segmentDraft, setSegmentDraft] = useState<HeatMapSegment | null>(null);
  const [filterDraftMode, setFilterDraftMode] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [sourceEditor, setSourceEditor] = useState(false);
  const [sourceStep, setSourceStep] = useState<'widget' | 'source' | 'questions'>('widget');
  const [nameDraft, setNameDraft] = useState('');
  const [sourceCategory, setSourceCategory] = useState('Surveys');
  const [surveyFolder, setSurveyFolder] = useState('Past Surveys');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceFixture, setSourceFixture] = useState('single');
  const [questionSort, setQuestionSort] = useState<{ field: 'code' | 'title' | 'type'; descending: boolean }>({ field: 'code', descending: false });
  const [questionDraft, setQuestionDraft] = useState<string[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightDraft, setInsightDraft] = useState('');
  const [downloadMenu, setDownloadMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [reverseSearch, setReverseSearch] = useState('');
  const [reversePickerOpen, setReversePickerOpen] = useState(false);
  const [weightingPickerOpen, setWeightingPickerOpen] = useState(false);

  useEffect(() => {
    // Hydrate only after the server-rendered default snapshot has mounted.
    let active = true;
    queueMicrotask(() => {
    if (!active) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(normalizeHeatMapSettings(parsed.settings));
        if (Array.isArray(parsed.segments) && parsed.segments.every((s: HeatMapSegment) => typeof s.id === 'string' && typeof s.name === 'string' && Number.isFinite(s.answer) && Number.isFinite(s.count) && Array.isArray(s.criteria))) setSegments(parsed.segments);
      }
    } catch { setNotice('Saved prototype settings could not be read. The production baseline has been restored.'); }
    setLoaded(true);
    });
    return () => { active = false; };
  }, [storageKey]);
  useEffect(() => {
    if (!loaded || readOnly) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ settings, segments })); queueMicrotask(() => setSaved('Saved locally')); }
    catch { queueMicrotask(() => setSaved('Not saved — browser storage is unavailable')); }
  }, [settings, segments, loaded, storageKey, readOnly]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // The shared select handles Escape and returns focus to its own trigger.
      if (event.target instanceof Element && event.target.closest('.wu-select-content')) return;
      if (segmentDraft) setSegmentDraft(null);
      else if (sourceEditor) setSourceEditor(false);
      else if (infoOpen) setInfoOpen(false);
      else if (insightsOpen) setInsightsOpen(false);
      else if (settingsOpen) setSettingsOpen(false);
      else setFullScreen(false);
      setMenuOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [segmentDraft, sourceEditor, infoOpen, insightsOpen, settingsOpen]);

  function update<K extends keyof HeatMapSettings>(key: K, value: HeatMapSettings[K]) { setSettings(current => ({ ...current, [key]: value })); }
  function reset(fixture: string) {
    setSettings(fixture === 'single' ? defaultHeatMapSettings() : fixture === 'matrix' ? matrixHeatMapSettings() : mixedHeatMapSettings());
    setSegments(INITIAL_HEAT_MAP_SEGMENTS); setExpanded([]); setNotice(''); setSourceFixture(fixture);
  }
  const questions = fixtureQuestions(settings.source).filter(question => settings.questions.includes(question.id));
  const visibleSegments = selectedSegments(settings.segments, segments);
  const activeFilter = resolveHeatMapActiveAnswers(settings, dashboardFilter);
  const activeAnswers = activeFilter.answers;
  const design = resolveHeatMapDesign(settings, dashboardDesign);
  const columns = [...(settings.overallColumn ? [{ id: 'overall', name: 'Overall', answer: 0, count: settings.source === 'matrix' ? 20 : heatMapCohortCount(activeAnswers), answers: activeAnswers }] : []), ...visibleSegments.map(segment => { const answers = (segment.answers ?? [segment.answer]).filter(answer => activeAnswers.includes(answer)); return { ...segment, answers, count: heatMapCohortCount(answers) }; })];
  const scoreMax = settings.range === '0–10' ? 10 : settings.range === '0–5' ? 5 : 5;
  const matrixFixture = settings.source !== 'single';
  const totalCount = settings.source === 'matrix' ? 20 : heatMapCohortCount(activeAnswers);
  const directPickerRows = heatMapSourceQuestions('mixed').filter(question => !question.children && !question.sourceDisclosure);
  const observedNullSelectionError = settings.questions.length === 15 && directPickerRows.every(question => settings.questions.includes(question.id));
  const tableSegments = [...segments].filter(segment => `${segment.name} ${segment.id}`.toLowerCase().includes(segmentSearch.toLowerCase())).sort((a, b) => segmentSort ? a.name.localeCompare(b.name) : 0);

  function cellValue(question: HeatMapQuestion, columnId: string, answer: number, childId?: string) {
    // Only the single-question answer segments and historical Overall snapshot have verified values.
    const column = columns.find(item => item.id === columnId);
    if (columnId === 'overall' && activeAnswers.length === 5) return heatMapOverallScore(question, settings, childId);
    if (childId) return null;
    return column ? heatMapCohortScore(question, settings, column.answers) : heatMapDirectScore(question, settings, answer);
  }
  function scoreCells(question: HeatMapQuestion, childId?: string) {
    return columns.map(column => {
      const value = cellValue(question, column.id, column.answer, childId);
      return <td key={column.id} title={value === null ? 'No verified score in this local fixture' : undefined} style={{ background: value === null ? '#f5f5f5' : heatMapCellColor(value, scoreMax, design.colorSettings) }}>{value === null ? '—' : value.toFixed(settings.precision)}{settings.responseCount && question.showBase !== false && value !== null && (!question.children || childId) && <small className={styles.cellCount}>n = {heatMapResponseBase(question, column.count, column.id === 'overall' ? undefined : column.answer)}</small>}</td>;
    });
  }
  function startEdit() { setQuestionDraft([...settings.questions]); setSourceFixture(settings.source); setNameDraft(settings.name); setSourceStep('widget'); setSourceEditor(true); setMenuOpen(false); }
  function openSegment(widgetFilter = false) {
    setFilterDraftMode(widgetFilter); setFilterError('');
    setSegmentDraft(widgetFilter && settings.widgetFilter ? structuredClone(settings.widgetFilter) : { id: `local-${Date.now()}`, name: '', answer: 0, count: 100, responseStatus: 'All responses', from: '', to: '', criteria: [] });
  }
  function saveSegment() {
    if (!segmentDraft) return;
    if (!segmentDraft.name.trim()) { setFilterError('Please enter a name.'); return; }
    const resolved = resolveHeatMapFilter(segmentDraft);
    if (resolved.error) { setFilterError(resolved.error); return; }
    if (settings.source === 'matrix') { setFilterError('Response-level filters are not available for the historical fixture.'); return; }
    const count = heatMapCohortCount(resolved.answers);
    const result = { ...segmentDraft, name: segmentDraft.name.trim(), answers: resolved.answers, count, answer: count ? INITIAL_HEAT_MAP_SEGMENTS.filter(segment => resolved.answers.includes(segment.answer)).reduce((sum, segment) => sum + segment.answer * segment.count, 0) / count : 0 };
    if (filterDraftMode) update('widgetFilter', result);
    else { setSegments(current => current.some(segment => segment.id === result.id) ? current.map(segment => segment.id === result.id ? result : segment) : [...current, result]); update('segments', settings.segments.includes(result.id) ? settings.segments : [...settings.segments, result.id]); }
    setSegmentDraft(null); setNotice('');
  }

  const widget = <article ref={widgetRef} className={`${styles.widget} ${settingsOpen ? styles.settingsPreview : fullScreen ? styles.fullScreen : ''} ${!showWidgetHeader ? styles.bodyOnly : ''}`} aria-label="Heat Map Chart" style={{ fontFamily: design.fontFamily, fontSize: design.bodySize }}>
        {showWidgetHeader && <header className={styles.widgetHeader}>{settings.showName ? <h2 style={{ color: design.themeColor, fontSize: design.titleSize }}>{settings.name}</h2> : <span />}<div>{!readOnly && <button aria-label="Highlighted insight" title="Highlighted insight" onClick={() => setInsightsOpen(true)}><span className="wm-lightbulb-outline" aria-hidden /></button>}{fullScreen && <button aria-label="Exit full screen" onClick={() => setFullScreen(false)}>↙</button>}{!readOnly && <button aria-label="Widget actions" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>⋮</button>}</div>
        {menuOpen && <div className={styles.menu} role="menu">{['Edit', 'Settings', 'Full screen', 'Duplicate', 'Copy to', 'Download', 'Info', 'Delete'].map(action => <button role="menuitem" key={action} onClick={() => { setMenuOpen(false); if (action === 'Settings') setSettingsOpen(true); else if (action === 'Full screen') setFullScreen(true); else if (action === 'Edit') startEdit(); else if (action === 'Info') setInfoOpen(true); else if (action === 'Download') setDownloadMenu(true); else setNotice(`${action} is a production management action outside this local baseline. No remote widget was changed.`); }}>{action}</button>)}</div>}
        </header>}
        {settings.highlightedInsight && <div className={styles.insight}>Highlighted insight</div>}
        <div className={styles.tableScroll}>{activeFilter.error ? <div className={styles.empty} role="status"><h3>Heat map unavailable</h3><p>{activeFilter.error}</p></div> : observedNullSelectionError ? <div className={styles.empty} role="alert"><h3>Oops! Something went wrong.</h3><p>Question is not found for Id null for Survey Id 13810910</p><button onClick={() => {}}>Retry</button></div> : <><table className={`${styles.heatTable} ${matrixFixture ? styles.matrixTable : ''}`} aria-label="Mean score heat map"><thead><tr><th style={{ width: `${100 / (columns.length + 1) + 5}%` }}>Statement</th>{columns.map(column => <th key={column.id} style={{ width: `${100 / (columns.length + 1)}%` }}>{column.name}</th>)}</tr></thead><tbody>
          <tr className={styles.countRow}><th>Response count</th>{columns.map(column => <td key={column.id} style={{ background: heatMapCellColor(column.count, scoreMax, design.colorSettings, true) }}>{column.count}</td>)}</tr>
          {settings.overallAverage && <tr><th>Overall average</th>{columns.map(column => { const values = questions.map(q => cellValue(q, column.id, column.answer)).filter((v): v is number => v !== null); const mean = column.id === 'overall' && activeAnswers.length === 5 ? heatMapOverallAverage(questions, settings) : values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; return <td key={column.id} style={{ background: mean === null ? '#f5f5f5' : heatMapCellColor(mean, scoreMax, design.colorSettings) }}>{mean === null ? '—' : mean.toFixed(settings.precision)}</td>; })}</tr>}
          {questions.map(question => <RowGroup key={question.id} question={question} expanded={expanded.includes(question.id)} onToggle={() => setExpanded(toggleItem(expanded, question.id))} cells={scoreCells} />)}
        </tbody></table>{!questions.length && <p className={styles.empty}>Select questions in Rows &amp; Columns.</p>}{!columns.length && <p className={styles.empty}>Select a segment or enable the Overall column.</p>}</>}</div>
        {!activeFilter.error && settings.widgetStats && settings.statsResponseCount && <footer className={styles.stats}>{settings.statsLabel}: <strong>{totalCount}</strong></footer>}
      </article>;

  return <div className={`${styles.page} ${embedded ? styles.embedded : ''}`}> 
    {!embedded && <div className={styles.toolbar}><h1>Dashboard 2</h1><div><select aria-label="Baseline fixture" value={settings.source} onChange={event => reset(event.target.value)}><option value="single">Current single-select fixture</option><option value="mixed">Current mixed-question fixture</option><option value="matrix">Audited mixed-matrix fixture</option></select><button onClick={() => setInfoOpen(true)}>Baseline notes</button><button onClick={() => reset(settings.source)}>Reset fixture</button><span role="status">{saved}</span></div></div>}
    {notice && <div className={styles.notice} role="alert">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}
    <div className={`${styles.canvas} ${settingsOpen ? styles.canvasWithSettings : ''}`}>
      {fullScreen || settingsOpen ? <OverlayPortal>{widget}</OverlayPortal> : widget}
      {!settingsOpen && !embedded && !readOnly && <button className={styles.settingsButton} onClick={() => setSettingsOpen(true)}>Settings</button>}
    </div>
    {!embedded && <div className={styles.bottomTab}>＋ <span>Tab 1</span> ⋮</div>}
    {settingsOpen && !readOnly && <OverlayPortal><aside className={styles.settings} aria-label="Widget settings"><header><h2>Settings</h2><button aria-label="Close settings" onClick={() => setSettingsOpen(false)}>×</button></header><nav aria-label="Settings tabs">{tabs.map(tab => <button key={tab} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav><div className={styles.settingsBody}>
      {activeTab === 'General' && <>
        <Toggle label="Name" checked={settings.showName} onChange={value => update('showName', value)} /><input aria-label="Widget name" value={settings.name} onChange={event => update('name', event.target.value)} />
        <Toggle label="Highlighted insight" checked={settings.highlightedInsight} onChange={value => update('highlightedInsight', value)} />
        <h3>Filter options</h3><Select label="Filter type" value={settings.filterType} options={['Dashboard', 'Widget', 'Combined', 'None']} onChange={value => update('filterType', value as HeatMapSettings['filterType'])} />{['Widget', 'Combined'].includes(settings.filterType) && <button onClick={() => openSegment(true)}>{settings.widgetFilter ? settings.widgetFilter.name : 'Create filter'}</button>}
      </>}
      {activeTab === 'Analytics' && <>
        <Select label="Decimal precision" value={settings.precision} options={[0, 1, 2, 3, 4]} onChange={value => update('precision', Number(value))} />
        <Toggle label="Overall column" checked={settings.overallColumn} onChange={value => update('overallColumn', value)} />
        <Toggle label="Response count" checked={settings.responseCount} onChange={value => update('responseCount', value)} />
        <Toggle label="Overall average" checked={settings.overallAverage} onChange={value => update('overallAverage', value)} />
        <Select label="Show mean values in range" value={settings.range} options={['Default', '0–5', '0–10']} onChange={value => update('range', value as HeatMapSettings['range'])} />
        <div className={styles.reverseField}><span>Reverse weightage for questions</span><button aria-label="Reverse weightage for questions" aria-expanded={reversePickerOpen} className={styles.reverseTrigger} onClick={() => setReversePickerOpen(!reversePickerOpen)}>{settings.reversed.length ? questions.filter(question => settings.reversed.includes(question.id)).map(question => question.title).join(', ') : 'Add question'}<span aria-hidden>▾</span></button>{reversePickerOpen && <div className={styles.reverseOptions}><input aria-label="Search reverse weightage questions" placeholder="Search" value={reverseSearch} onChange={event => setReverseSearch(event.target.value)} />{questions.filter(question => question.title.toLowerCase().includes(reverseSearch.toLowerCase())).map(question => <label key={question.id}><input type="checkbox" checked={settings.reversed.includes(question.id)} onChange={() => update('reversed', toggleItem(settings.reversed, question.id))} />{question.title}</label>)}</div>}</div>
        <div className={styles.thresholdHeading}><span>Assign threshold values</span><HeatMapSelect label="Assign threshold values" value={settings.bands} options={[2, 3, 4, 5]} onChange={value => setSettings(current => ({ ...current, bands: Number(value), thresholds: equalThresholds(Number(value)) }))} /></div>
        <div className={styles.thresholdSlider} style={{ background: `linear-gradient(to right, ${Array.from({ length: settings.bands }, (_, index) => `${design.colorSettings.colors[Math.min(index, design.colorSettings.colors.length - 1)]} ${index ? settings.thresholds[index - 1] : 0}%, ${design.colorSettings.colors[Math.min(index, design.colorSettings.colors.length - 1)]} ${settings.thresholds[index] ?? 100}%`).join(', ')})` }}>{settings.thresholds.map((threshold, index) => <input key={index} type="range" aria-label={`Threshold ${index + 1}`} min="0" max="100" step="0.1" value={threshold} onChange={event => { const value = Math.max((settings.thresholds[index - 1] ?? 0) + .1, Math.min((settings.thresholds[index + 1] ?? 100) - .1, Number(event.target.value))); update('thresholds', settings.thresholds.map((existing, boundary) => boundary === index ? value : existing)); }} />)}</div>
        <div className={styles.bands}>{Array.from({ length: settings.bands }, (_, index) => { const from = index ? settings.thresholds[index - 1] : 0; const to = settings.thresholds[index] ?? 100; const names = settings.bands === 2 ? ['Unfavorable', 'Neutral'] : settings.bands === 3 ? ['Unfavorable', 'Neutral', 'Favorable'] : settings.bands === 4 ? ['Highly unfavorable', 'Unfavorable', 'Favorable', 'Highly favorable'] : ['Highly unfavorable', 'Unfavorable', 'Neutral', 'Favorable', 'Highly favorable']; return <div key={index}><span>{names[index]} <b>{settings.source !== 'single' && settings.bands === 2 ? '33.3' : (to - from).toFixed(1)}%</b><small>({from}–{to})</small></span></div>; })}</div>
        <Toggle label="Widget stats" checked={settings.widgetStats} onChange={value => update('widgetStats', value)} />
        {settings.widgetStats && <div className={styles.nested}><Toggle label="Response count statistic" checked={settings.statsResponseCount} onChange={value => update('statsResponseCount', value)} /><Field label="Statistic label"><input value={settings.statsLabel} onChange={event => update('statsLabel', event.target.value)} /></Field></div>}
        <h3>Weighting schemes</h3><Scope label="Scheme type" value={settings.weighting} options={['Dashboard', 'Widget', 'None']} onChange={value => update('weighting', value as HeatMapSettings['weighting'])} />
        {settings.weighting === 'Widget' && <div className={styles.reverseField}><button className={styles.reverseTrigger} aria-label="Weighting scheme" aria-expanded={weightingPickerOpen} onClick={() => setWeightingPickerOpen(!weightingPickerOpen)}>-Select-<span aria-hidden>▾</span></button>{weightingPickerOpen && <div className={styles.reverseOptions}><input aria-label="Search weighting schemes" placeholder="Search" /><p>No results found.</p></div>}</div>}
      </>}
      {activeTab === 'Rows & Columns' && <>
        <Field label="Manage rows (questions)"><button aria-expanded={rowPicker} onClick={() => setRowPicker(!rowPicker)}>{questions[0]?.title ?? 'Select questions'}{questions.length > 1 ? ` +${questions.length}` : ''} ▾</button></Field>
        {rowPicker && <div className={styles.picker}><input aria-label="Search included questions" placeholder="Search" value={rowSearch} onChange={event => setRowSearch(event.target.value)} />{fixtureQuestions(settings.source).filter(q => q.title.toLowerCase().includes(rowSearch.toLowerCase())).map(question => <label key={question.id}><input type="checkbox" checked={settings.questions.includes(question.id)} onChange={() => update('questions', toggleItem(settings.questions, question.id))} />{question.title}</label>)}</div>}
        <h3>Manage columns (segments) to display</h3><div className={styles.searchRow}><input aria-label="Search segments" placeholder="Search by segment name or id" value={segmentSearch} onChange={event => setSegmentSearch(event.target.value)} /><button onClick={() => openSegment()}>Create segment</button></div>
        <table className={styles.segmentTable}><thead><tr><th><input aria-label="Select all segments" type="checkbox" checked={segments.length > 0 && segments.every(s => settings.segments.includes(s.id))} onChange={event => update('segments', event.target.checked ? segments.map(s => s.id) : [])} /></th><th>#</th><th><button onClick={() => setSegmentSort(!segmentSort)}>Segment name ↕</button></th><th /></tr></thead><tbody>{tableSegments.map((segment, index) => <tr key={segment.id}><td><input aria-label={`Show ${segment.name}`} type="checkbox" checked={settings.segments.includes(segment.id)} onChange={() => update('segments', toggleItem(settings.segments, segment.id))} /></td><td>{index + 1}</td><td>{segment.name}</td><td className={styles.segmentActions}><button aria-label={`Edit ${segment.name}`} onClick={() => { setFilterDraftMode(false); setFilterError(''); setSegmentDraft(structuredClone(segment)); }}>✎</button><button aria-label={`Delete ${segment.name}`} onClick={() => { setSegments(current => current.filter(item => item.id !== segment.id)); update('segments', settings.segments.filter(id => id !== segment.id)); }}>×</button></td></tr>)}</tbody></table>
      </>}
      {activeTab === 'Design' && <>
        <Scope label="Design type" value={settings.designType} options={['Dashboard', 'Widget']} onChange={value => update('designType', value as HeatMapSettings['designType'])} />
        {settings.designType === 'Widget' && <div className={styles.designControls}><Select label="Theme" value="Default" options={['Default']} onChange={() => {}} /><div className={styles.themeColorRow}><span>Theme color</span><DesignColorPicker variant="heat-map" label="Theme color" value={settings.themeColor} onChange={color => update('themeColor', color)} /></div><Select label="Sentiment colors" value={settings.sentiment} options={['Default', 'Custom']} onChange={value => update('sentiment', value as HeatMapSettings['sentiment'])} />{settings.sentiment === 'Custom' && <div className={styles.swatches}>{settings.colors.map((color, index) => <DesignColorPicker variant="heat-map" key={index} label={`Sentiment color ${index + 1}`} value={color} onChange={color => update('colors', settings.colors.map((c, i) => index === i ? color : c))} />)}</div>}<div className={styles.designFonts}><Select label="Font size" value={settings.fontSize} options={['Extra small', 'Small', 'Medium', 'Large', 'Extra large']} onChange={value => update('fontSize', value)} /><Select label="Font family" value={settings.fontFamily} options={['Fira Sans', 'Inter', 'Roboto', 'Segoe UI', 'IBM Plex Sans', 'Arial', 'Georgia']} onChange={value => update('fontFamily', value)} /></div></div>}
      </>}
    </div></aside></OverlayPortal>}
    {sourceEditor && !readOnly && <OverlayPortal><div className={styles.overlay}><section className={`${styles.dialog} ${styles.sourceDialog}`} role="dialog" aria-modal="true" aria-label="Edit Heat Map Chart"><header><h2>Edit widget</h2><button aria-label="Close source editor" onClick={() => setSourceEditor(false)}>×</button></header><div className={styles.sourceStepBody}>{sourceStep === 'widget' ? <HeatMapEditIntro name={nameDraft} onNameChange={setNameDraft} /> : sourceStep === 'source' ? <><nav className={styles.sourceCategories}><HeatMapSelect label="Source category" value={sourceCategory} options={['Surveys', 'Customer Experience', 'Employee Experience', 'My survey stacks', 'Recently Used']} onChange={setSourceCategory} /></nav>{sourceCategory === 'Surveys' || sourceCategory === 'Recently Used' ? <><div className={styles.sourceFolders}>{['My Surveys', 'Past Surveys'].map(folder => <button key={folder} aria-pressed={surveyFolder === folder} onClick={() => setSurveyFolder(folder)}>{folder}</button>)}</div><input aria-label="Search surveys" placeholder="Search surveys" value={sourceSearch} onChange={event => setSourceSearch(event.target.value)} /><table className={styles.sourceTable}><thead><tr><th>Survey ↕</th><th>Created on ↕</th><th>Completed responses ↕</th></tr></thead><tbody>{[{ id: 'mixed', name: 'QA Heat Map | All Types and Matrix Variants | 2026-09-25', count: 100 }, { id: 'matrix', name: 'CODEX QA CSAT Matrix Metrics — 2026-09-02', count: 20 }].filter(s => s.name.toLowerCase().includes(sourceSearch.toLowerCase())).map(survey => <tr key={survey.id} tabIndex={0} role="button" aria-label={survey.name} onClick={() => { if ((sourceFixture === 'single' ? 'mixed' : sourceFixture) !== survey.id) setQuestionDraft(survey.id === 'matrix' ? fixtureQuestions('matrix').map(question => question.id) : ['single']); setSourceFixture(survey.id); setSourceStep('questions'); setSourceSearch(''); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.click(); }}><td>{survey.name}</td><td>{survey.id === 'mixed' ? '3 hours ago' : 'Sep 02 2026'}</td><td>{survey.count}</td></tr>)}</tbody></table></> : <p className={styles.empty}>No verified source fixture in this category.</p>}</> : <><input aria-label="Search source questions" placeholder="Search questions" value={sourceSearch} onChange={event => setSourceSearch(event.target.value)} /><p>{sourceFixture === 'matrix' && questionDraft.length === 4 ? 9 : questionDraft.length}/20 selected</p><table className={styles.sourceTable}><thead><tr><th />{(['code', 'title', 'type'] as const).map(field => <th key={field}><button onClick={() => setQuestionSort(current => ({ field, descending: current.field === field && !current.descending }))}>{field === 'code' ? 'Code' : field === 'title' ? 'Questions' : 'Type'} ↕</button></th>)}</tr></thead><tbody>{heatMapSourceQuestions(sourceFixture as HeatMapSettings['source']).filter(q => `${q.code} ${q.title}`.toLowerCase().includes(sourceSearch.toLowerCase())).sort((a, b) => (questionSort.field === 'code' ? (Number(a.code.slice(1)) || 22) - (Number(b.code.slice(1)) || 22) : a[questionSort.field].localeCompare(b[questionSort.field])) * (questionSort.descending ? -1 : 1)).map(question => <tr key={question.id}><td>{question.children || question.sourceDisclosure ? <button aria-label={`Expand ${question.code} in source editor`} onClick={() => {}}>▸</button> : <input type="checkbox" aria-label={`Include ${question.code || question.title}`} checked={questionDraft.includes(question.id)} onChange={() => setQuestionDraft(toggleItem(questionDraft, question.id))} />}</td><td>{question.code}</td><td>{question.title}</td><td>{question.type}</td></tr>)}</tbody></table></>}
    </div><nav className={styles.editorProgress} aria-label="Edit widget progress">{['Widget', 'Chart', 'Survey', 'Question'].map((step, index) => <span key={step} aria-current={(sourceStep === 'widget' ? 0 : sourceStep === 'source' ? 2 : 3) === index ? 'step' : undefined}>{index > 0 && <span aria-hidden>› </span>}{step}</span>)}</nav><footer><button onClick={() => sourceStep === 'questions' ? setSourceStep('source') : sourceStep === 'source' ? setSourceStep('widget') : setSourceEditor(false)}>{sourceStep === 'widget' ? 'Cancel' : 'Back'}</button>{sourceStep !== 'source' && <button className={styles.primary} disabled={sourceStep === 'questions' && !questionDraft.length} onClick={() => { if (sourceStep === 'widget') { setSourceSearch(''); setSourceStep('source'); } else { const resolvedSource = sourceFixture === 'matrix' ? 'matrix' : questionDraft.some(id => id !== 'single') ? 'mixed' : 'single'; setSettings(current => ({ ...current, name: nameDraft, source: resolvedSource as HeatMapSettings['source'], questions: questionDraft, ...(resolvedSource === 'matrix' && current.source !== 'matrix' ? { overallColumn: true, segments: [] } : {}) })); setExpanded([]); setSourceEditor(false); } }}>{sourceStep === 'questions' ? 'Save widget' : 'Next'}</button>}</footer></section></div></OverlayPortal>}
    {segmentDraft && !readOnly && <OverlayPortal><div className={styles.overlay}><HeatMapFilterEditor draft={segmentDraft} onChange={setSegmentDraft} onCancel={() => setSegmentDraft(null)} onSave={saveSegment} widgetFilter={filterDraftMode} error={filterError} /></div></OverlayPortal>}
    {downloadMenu && <OverlayPortal><div className={styles.overlay} onClick={() => setDownloadMenu(false)}><section className={styles.downloadDialog} role="menu" aria-label="Download">{['Image', 'PDF'].map(format => <button key={format} role="menuitem" onClick={async () => { setDownloadMenu(false); if (widgetRef.current) try { await exportHeatMap(widgetRef.current, format as 'Image' | 'PDF', settings.name); } catch (error) { setNotice(error instanceof Error ? error.message : 'Export failed.'); } }}>{format}</button>)}</section></div></OverlayPortal>}
    {infoOpen && <OverlayPortal><div className={styles.overlay}><section className={`${styles.dialog} ${styles.infoDialog}`} role="dialog" aria-modal="true" aria-label="Info"><header><h2>Info</h2><button aria-label="Close info" onClick={() => setInfoOpen(false)}>×</button></header><dl><dt>Owner</dt><dd>Prabal</dd><dt>Date created</dt><dd>September 25, 2026 at 13:16 PM</dd><dt>Last modified</dt><dd>September 25, 2026 at 15:16 PM</dd><dt>Data source</dt><dd>▤ My Surveys<br />{settings.source === 'matrix' ? 'CODEX QA CSAT Matrix Metrics — 2026-09-02' : 'QA Heat Map | All Types and Matrix Variants | 2026-09-25'}</dd><dt>Total responses</dt><dd>{totalCount}</dd></dl></section></div></OverlayPortal>}
    {insightsOpen && <OverlayPortal><aside className={styles.settings} aria-label="Insights"><header><h2>Insights</h2><button aria-label="Close insights" onClick={() => setInsightsOpen(false)}>×</button></header><div className={styles.emptyInsights}><span className="wm-lightbulb-outline" aria-hidden /><p>There are no insights yet.</p><p>Start a new thread adding your insight.</p></div><textarea aria-label="Insight draft" placeholder="Add your insight" value={insightDraft} onChange={event => setInsightDraft(event.target.value)} /></aside></OverlayPortal>}

  </div>;
}
function RowGroup({ question, expanded, onToggle, cells }: { question: HeatMapQuestion; expanded: boolean; onToggle: () => void; cells: (question: HeatMapQuestion, childId?: string) => ReactNode }) {
  return <><tr><th>{question.children ? <button className={styles.expand} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${question.title}`} aria-expanded={expanded} onClick={onToggle}>{expanded ? '▾' : '▸'}</button> : null}{question.renderedTitle ?? question.title}</th>{cells(question)}</tr>{expanded && question.children?.map(child => <tr key={child.id}><th className={styles.childRow}>{child.title}</th>{cells(question, child.id)}</tr>)}</>;
}
