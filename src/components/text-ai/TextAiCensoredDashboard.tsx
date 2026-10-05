'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { parseTagAssignments, type TagAssignments } from '@/data/text-ai-tag-drafts';
import { parseCodeFrames, type ThemeGroup } from '@/data/text-ai-code-frame-drafts';
import { CENSORED_CONFIGURATION_EVENT, CENSORED_DEMO_QUESTION_ID, RESTAURANT_THEME_GROUPS, ensureOutlierTheme, restaurantResponses, isCensoredResponse, visibleCensoredResponses } from '@/data/text-ai-censored-subthemes';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import styles from './TextAiCensoredDashboard.module.css';

export function TextAiCensoredDashboard({ dashboardId, preferences }: { dashboardId: number; preferences: TextAiThemePreferences }) {
  const [assignments, setAssignments] = useState<TagAssignments>({});
  const [groups, setGroups] = useState<ThemeGroup[]>(ensureOutlierTheme(RESTAURANT_THEME_GROUPS));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const scope = `${CENSORED_DEMO_QUESTION_ID}:medium:`;
  useEffect(() => {
    function refresh() {
      try {
        const raw = localStorage.getItem(`bi-stats-text-ai-configuration-v2:${dashboardId}`);
        const saved = raw ? JSON.parse(raw) : null;
        setAssignments(parseTagAssignments(saved ? JSON.stringify(saved.assignments) : localStorage.getItem(`bi-stats-text-ai-tags-v1:${dashboardId}`)));
        setGroups(ensureOutlierTheme(saved ? parseCodeFrames(saved.codeFrames)[scope] ?? RESTAURANT_THEME_GROUPS : RESTAURANT_THEME_GROUPS));
        setError(''); setReady(true);
      } catch (error) { setError(`Saved theme changes could not be loaded. ${error instanceof Error ? error.message : ''} Reload to try again.`); setReady(false); }
    }
    refresh();
    window.addEventListener('storage', refresh); window.addEventListener(CENSORED_CONFIGURATION_EVENT, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(CENSORED_CONFIGURATION_EVENT, refresh); };
  }, [dashboardId, scope]);
  const source = useMemo(() => restaurantResponses(assignments), [assignments]);
  const visible = visibleCensoredResponses(source, preferences.showCensoredSubthemes);
  const censoredCount = source.filter(isCensoredResponse).length;
  const labels = new Map<string, string>(groups.flatMap(group => group.subThemes.map(sub => [`${group.id}:${sub.id}`, sub.name] as const)));
  const selectedVisibleTag = selectedTag === 'outlier:censored' && !preferences.showCensoredSubthemes ? null : selectedTag;
  const rows = visible.filter(response => (!selectedVisibleTag || response.subthemes.some(tag => tag.id === selectedVisibleTag)) && response.text.toLowerCase().includes(search.toLowerCase()));
  const counts = groups.flatMap(group => group.subThemes.flatMap(sub => {
    if (sub.id === 'censored' && !preferences.showCensoredSubthemes) return [];
    const count = visible.filter(response => response.subthemes.some(tag => tag.id === `${group.id}:${sub.id}`)).length;
    if (!count && !preferences.showThemesWithNoResponses) return [];
    return [{ id: `${group.id}:${sub.id}`, name: sub.name, parent: group.name, count, percent: visible.length ? count / visible.length * 100 : 0 }];
  }));
  const assignmentCount = visible.reduce((sum, response) => sum + response.subthemes.length, 0);
  const sentiments = ['positive', 'neutral', 'negative'] as const;
  if (!ready) return <div className={styles.canvas} role="status">{error || 'Loading analysis…'}</div>;
  return <div className={styles.canvas}>
    <div className={styles.notice} role="status">
      <div><strong>{preferences.showCensoredSubthemes ? 'Censored sub-themes are visible' : 'Censored sub-themes are hidden'}</strong>
        <p>{preferences.showCensoredSubthemes ? `${censoredCount} censored responses are included. Additional sub-themes can be assigned in Theme Configuration. Turning visibility off excludes the entire response and all its tags.` : `${censoredCount} censored responses are excluded from every chart, count, summary and response below, including any other tags they carry.`}</p></div>
      <Link href={`/text-ai/${dashboardId}/theme-configuration`}>Review in Theme Configuration →</Link>
    </div>
    <div className={styles.metrics}>
      <article><span>Visible responses</span><strong>{visible.length}<small> / {source.length} analyzed</small></strong></article>
      <article><span>{preferences.showCensoredSubthemes ? 'Included censored responses' : 'Hidden censored responses'}</span><strong>{censoredCount}</strong></article>
      <article><span>Sub-theme assignments</span><strong>{assignmentCount}</strong></article>
      <article><span>Untagged visible responses</span><strong>{visible.filter(response => !response.subthemes.length).length}</strong></article>
    </div>
    <div className={styles.grid}>
      <section className={styles.card}><header><h2>Sub-theme comparison</h2><small>Base: {visible.length} visible responses</small></header>
        <div className={styles.bars}>{counts.map(row => <button type="button" key={row.id} className={`${styles.barRow} ${row.id === selectedVisibleTag ? styles.active : ''}`} onClick={() => setSelectedTag(row.id === selectedVisibleTag ? null : row.id)} aria-label={`View ${row.name} responses`}>
          <span>{row.name}<small>{row.parent}</small></span><span className={styles.track}><span style={{ width: `${row.percent}%`, background: row.id === 'outlier:censored' ? '#9a6700' : '#328de6' }} /></span><strong>{row.count}<small>{row.percent.toFixed(1)}%</small></strong>
        </button>)}</div><p className={styles.footnote}>A response can have multiple sub-themes. Percentages use visible responses and may total more than 100%.</p>
      </section>
      <section className={styles.card}><header><h2>Sentiment by assignment</h2><small>Base: {assignmentCount} visible assignments</small></header>
        <div className={styles.sentiments}>{sentiments.map(sentiment => {
          const count = visible.flatMap(response => response.subthemes).filter(tag => tag.sentiment.includes(sentiment)).length;
          return <div key={sentiment}><span>{sentiment}</span><div className={styles.track}><span style={{ width: `${assignmentCount ? count / assignmentCount * 100 : 0}%`, background: sentiment === 'positive' ? '#39956c' : sentiment === 'negative' ? '#d66a63' : '#8396ac' }} /></div><strong>{count}</strong></div>;
        })}</div>
        <h3>Analysis overview</h3><p className={styles.overview}>{visible.length} responses are included in this view. {counts.filter(row => row.count > 0).length} sub-themes have responses; {visible.filter(response => response.subthemes.length > 1).length} responses have multiple assignments. {visible.filter(response => !response.subthemes.length).length} responses are untagged and available for coding.</p>
        <p className={styles.footnote}>Censorship is a content classification, separate from sentiment. Negative restaurant feedback remains visible.</p>
      </section>
    </div>
    <section className={styles.card}><header><div><h2>Responses</h2><small>{rows.length} matching · {visible.length} visible of {source.length} analyzed</small></div><input type="search" aria-label="Search dashboard responses" placeholder="Search responses" value={search} onChange={event => setSearch(event.target.value)} /></header>
      {selectedVisibleTag && <div className={styles.filter}>Sub-theme: {labels.get(selectedVisibleTag)} <button type="button" onClick={() => setSelectedTag(null)}>Clear filter ×</button></div>}
      <div className={styles.tableWrap}><table><thead><tr><th>Response</th><th>Theme / sub-theme</th></tr></thead><tbody>{rows.map(response => <tr key={response.id}><td><small>Response {response.id}</small>{response.text}</td><td>{response.subthemes.length ? response.subthemes.map(tag => <span className={tag.id === 'outlier:censored' ? styles.censoredTag : styles.tag} key={tag.id}>{groups.find(group => tag.id.startsWith(`${group.id}:`))?.name} / {labels.get(tag.id) ?? tag.label}</span>) : <span className={styles.untagged}>Untagged · Ready for coding</span>}</td></tr>)}</tbody></table></div>
      {!rows.length && <p className={styles.overview}>No visible responses match this view.</p>}
    </section>
  </div>;
}
