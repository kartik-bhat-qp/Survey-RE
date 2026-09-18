'use client';
import { useEffect, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import * as Dialog from '@radix-ui/react-dialog';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { DEFAULT_WORD_CLOUD_SETTINGS, parseStopWords, WordCloudWidget, type WordCloudSettings } from './WordCloudWidget';
import styles from './WordCloudWidget.module.css';

export function WordCloudDashboardCard({ dragHandleClassName, shared = false }: { dragHandleClassName?: string; shared?: boolean }) {
  const { showToast } = useWuShowToast();
  const [settings, setSettings] = useState<WordCloudSettings>(DEFAULT_WORD_CLOUD_SETTINGS);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('General');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(`wordcloud:${location.pathname}`); if (saved) setSettings({ ...DEFAULT_WORD_CLOUD_SETTINGS, ...JSON.parse(saved) }); } catch { /* Storage can be unavailable. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(`wordcloud:${location.pathname}`, JSON.stringify(settings)); } catch { /* Keep session changes usable. */ } } }, [settings, loaded]);
  function update<K extends keyof WordCloudSettings>(key: K, value: WordCloudSettings[K]) { setSettings(current => ({ ...current, [key]: value })); }
  function add(raw: string, remainder = '') {
    const existing = new Set(settings.stopWords.map(word => word.toLowerCase()));
    const duplicates: string[] = [];
    const additions = parseStopWords(raw).filter(word => { const key = word.toLowerCase(); if (existing.has(key)) { duplicates.push(word); return false; } existing.add(key); return true; });
    if (settings.stopWords.length + additions.length > 100) { setMessage(`Maximum 100 stop words. ${100 - settings.stopWords.length} spaces remaining.`); setDraft(raw + remainder); return; }
    update('stopWords', [...settings.stopWords, ...additions]); setDraft(remainder); setMessage('');
    if (duplicates.length) showToast({
      message: duplicates.length === 1
        ? `“${duplicates[0]}” already exists and wasn’t added.`
        : `${duplicates.length} duplicate stop words weren’t added because they already exist.`,
      variant: 'info',
    });
  }
  function handleTyping(value: string, composing = false) {
    setMessage('');
    if (composing) { setDraft(value); return; }
    // Only unescaped separators commit values. Keep the unfinished suffix editable.
    let end = -1;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '\\' && i + 1 < value.length && [',', '\n', '\r', '\\', 'n'].includes(value[i + 1])) { i++; continue; }
      if ([',', '\n', '\r', '\t'].includes(value[i])) end = i;
    }
    if (end >= 0) add(value.slice(0, end + 1), value.slice(end + 1));
    else setDraft(value);
  }
  const select = (label: string, key: 'filter' | 'theme' | 'palette' | 'fontSize' | 'fontFamily', options: string[]) => <label className={styles.field}>{label}<select value={settings[key]} onChange={event => update(key, event.target.value)}>{options.map(value => <option key={value}>{value}</option>)}</select></label>;
  const toggle = (label: string, key: 'showName' | 'highlighted' | 'stats') => <div className={styles.row}><span>{label}</span><button className={styles.toggle} role="switch" aria-label={label} aria-checked={settings[key]} onClick={() => update(key, !settings[key])}><span /></button></div>;
  const modes = (label: string, key: 'slicer' | 'design', options: string[]) => <div className={styles.row}><span>{label}</span><div className={styles.modes}>{options.map((value, i) => <button key={value} aria-label={`${label}: ${value}`} title={value} aria-pressed={settings[key] === value} onClick={() => update(key, value)}><span className={i === 0 ? 'wm-dashboard' : i === 1 ? 'wm-bar-chart' : 'wm-block'} /></button>)}</div></div>;
  return <>
    <DashboardWidgetCard title={settings.showName ? settings.name : ''} dragHandleClassName={dragHandleClassName} shared={shared} actions={shared ? null : undefined} onOpenSettings={() => { setTab('General'); setMessage(''); setOpen(true); }}><WordCloudWidget settings={settings} /></DashboardWidgetCard>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.dialog} aria-describedby={undefined}>
      <section className={styles.preview}><header>{settings.showName && <h3>{settings.name}</h3>}<span className="wm-lightbulb" /></header><WordCloudWidget settings={settings} /></section>
      <aside className={styles.panel}>
        <header className={styles.panelHeader}><Dialog.Title>Settings</Dialog.Title><Dialog.Close aria-label="Close word cloud settings">×</Dialog.Close></header>
        <div className={styles.tabs} role="tablist" aria-label="Word cloud settings">{['General', 'Analytics', 'Design'].map(value => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
        <div className={styles.panelBody} role="tabpanel">
          {tab === 'General' && <>
            {toggle('Name', 'showName')}<input aria-label="Widget name" className={styles.name} value={settings.name} onChange={event => update('name', event.target.value)} />
            {toggle('Highlighted insight', 'highlighted')}
            <h4>Chart types</h4><div className={styles.chartTypes}>{['Wordcloud', 'Text response', 'Sentiment stackbar', 'Sentiment Donut', 'Sentiment TrendLine', 'Topic Stackbar'].map((name, i) => <button key={name} aria-pressed={i === 0} title={i ? `${name} is a separate chart type; this prototype covers Wordcloud.` : 'Wordcloud'} disabled={i !== 0}><span>{name}</span><span className={['wm-cloud', 'wm-format-list-bulleted', 'wm-bar-chart', 'wm-pie-chart', 'wm-show-chart', 'wm-bar-chart'][i]} /></button>)}</div>
            <h4>Filter options</h4>{select('Filter type', 'filter', ['Dashboard', 'Widget', 'Combined', 'None'])}
          </>}
          {tab === 'Analytics' && <>
            <label className={styles.field}>Minimum word length<select value={settings.minimum} onChange={event => update('minimum', Number(event.target.value))}>{[3,4,5,6,7,8,9,10].map(value => <option key={value}>{value}</option>)}</select></label>
            <div className={styles.stopHeader}><div className={styles.stopLabel}><label htmlFor="wordcloud-stop-input">Stop words <span>{settings.stopWords.length}/100</span></label><span className={styles.helpTooltip}><button type="button" aria-label="Stop word entry help" aria-describedby="wordcloud-stop-help">ⓘ</button><span id="wordcloud-stop-help" role="tooltip">Type or paste; commas and Enter separate words. Keep characters: <code>{'\\,'}</code> for a comma, <code>{'\\n'}</code> for a line break, and <code>{'\\\\'}</code> for a backslash.</span></span></div><button disabled={!settings.stopWords.length} onClick={() => { update('stopWords', []); setDraft(''); setMessage(''); }}>Clear all</button></div>
            <div className={styles.entry}>{settings.stopWords.map(word => <span className={styles.chip} key={word}><span>{word.replace(/\n/g, '↵')}</span><button aria-label={`Remove ${word}`} onClick={() => update('stopWords', settings.stopWords.filter(item => item !== word))}>×</button></span>)}
              <textarea rows={1} id="wordcloud-stop-input" aria-label="Add stop words" aria-describedby="wordcloud-stop-help" placeholder="Enter or paste values" value={draft}
                onChange={event => handleTyping(event.target.value, (event.nativeEvent as InputEvent).isComposing)}
                onCompositionEnd={event => handleTyping(event.currentTarget.value)}
                onPaste={event => { event.preventDefault(); const input = event.currentTarget; add(draft.slice(0, input.selectionStart) + event.clipboardData.getData('text') + draft.slice(input.selectionEnd)); }}
                onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); const input = event.currentTarget; handleTyping(draft.slice(0, input.selectionStart) + '\n' + draft.slice(input.selectionEnd)); } }} />
            </div>
            {message && <p role="alert" className={styles.help}>{message}</p>}
            {toggle('Widget stats', 'stats')}<h4>Data slicer options</h4>{modes('Data slicer', 'slicer', ['Dashboard', 'Widget', 'None'])}
          </>}
          {tab === 'Design' && <>{modes('Design type', 'design', ['Dashboard', 'Widget'])}{settings.design === 'Widget' && <>
            {select('Theme', 'theme', ['Default'])}<label className={styles.row}>Theme color<input type="color" aria-label="Theme color" value={settings.color} onChange={event => update('color', event.target.value)} /></label>
            {select('Color palette', 'palette', ['Categorical'])}<div className={styles.swatches}>{['#655699','#6575aa','#55a1b5','#52b397','#8ac589','#d6ce5f','#d39a41','#b75e49','#934434','#82435d','#b48aba'].map(color => <button key={color} aria-label={`Use color ${color}`} style={{ background: color }} onClick={() => update('color', color)} />)}</div>
            <div className={styles.columns}>{select('Font size', 'fontSize', ['Extra small', 'Small', 'Medium', 'Large', 'Extra large'])}{select('Font family', 'fontFamily', ['Fira Sans', 'Arial', 'Georgia', 'Verdana'])}</div>
          </>}</>}
        </div>
      </aside>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
