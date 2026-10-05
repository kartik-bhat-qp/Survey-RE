'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CENSORED_CONFIGURATION_EVENT, OUTLIER_THEME_GROUP, getSharedOutlierResponses, isCensoredResponse, visibleCensoredResponses } from '@/data/text-ai-censored-subthemes';
import { parseTagAssignments, type TagAssignments } from '@/data/text-ai-tag-drafts';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import styles from './TextAiOutlierResponses.module.css';

export function TextAiOutlierResponses({ dashboardId, questionId, preferences }: {
  dashboardId: number; questionId: string; preferences: TextAiThemePreferences;
}) {
  const [assignments, setAssignments] = useState<TagAssignments>({});
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem(`bi-stats-text-ai-configuration-v2:${dashboardId}`);
        const snapshot = raw ? JSON.parse(raw) : null;
        setAssignments(parseTagAssignments(snapshot ? JSON.stringify(snapshot.assignments) : localStorage.getItem(`bi-stats-text-ai-tags-v1:${dashboardId}`)));
        setError('');
      } catch { setError('Saved Outlier responses could not be loaded. Reload to try again.'); }
    };
    refresh();
    window.addEventListener(CENSORED_CONFIGURATION_EVENT, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CENSORED_CONFIGURATION_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, [dashboardId]);
  const source = getSharedOutlierResponses(questionId, assignments);
  const visible = visibleCensoredResponses(source, preferences.showCensoredSubthemes);
  const censored = source.filter(isCensoredResponse).length;
  return <details className={styles.panel}>
    <summary>Outlier responses <span>{visible.length} visible · {censored} censored {preferences.showCensoredSubthemes ? 'included' : 'hidden'}</span></summary>
    {error ? <p role="alert">{error}</p> : <>
      <div className={styles.notice}><p>{preferences.showCensoredSubthemes ? 'Censored responses are included here and can receive additional sub-theme tags in Theme Configuration.' : 'Censored responses and their other tags are hidden. Review them under Outlier → Censored in Theme Configuration.'}</p><Link href={`/text-ai/${dashboardId}/theme-configuration`}>Theme Configuration →</Link></div>
      <div className={styles.counts}>{OUTLIER_THEME_GROUP.subThemes.filter(sub => sub.id !== 'censored' || preferences.showCensoredSubthemes).map(sub => <span key={sub.id}>{sub.name} <strong>{visible.filter(response => response.subthemes.some(tag => tag.id === `outlier:${sub.id}`)).length}</strong></span>)}</div>
      <div className={styles.responses}>{visible.map(response => <article key={response.id}><p>{response.text}</p><div>{response.subthemes.length ? response.subthemes.map(tag => <span key={tag.id}>{tag.label}</span>) : <span>Untagged · Ready for coding</span>}</div></article>)}</div>
    </>}
  </details>;
}
