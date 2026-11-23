'use client';

import { use, useEffect, useState } from 'react';
import { TextAiDashboardCanvas } from '@/components/text-ai/TextAiDashboardCanvas';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { createTextAiComparativeChartWidget } from '@/data/mock-text-ai-topic-segment-widget';
import { type TextAiShareView } from '@/data/text-ai-sharing';
import gateStyles from '@/components/dashboards/SharedDashboardViewer.module.css';
import styles from '@/components/text-ai/TextAiSharing.module.css';

type SharedResult = { view?: TextAiShareView; passwordRequired?: boolean; error?: string };

function Viewer({ view }: { view: TextAiShareView }) {
  const dashboard = view.dashboard;
  return <div className={styles.viewer}>
    <header className={styles.viewerHeader}><h1>{dashboard.name}</h1></header>
    <main className={styles.viewerCanvas}><TextAiDashboardCanvas
      dashboardId={dashboard.dashboardId}
      censoredSubthemesEnabled={dashboard.censoredSubthemesEnabled}
      syncedCensoredResponses={dashboard.syncedCensoredResponses}
      dashboardFilter={dashboard.responseFilter}
      design={dashboard.design}
      selectedQuestion={dashboard.selectedQuestion}
      questionIndex={dashboard.questionIndex}
      addedWidgets={dashboard.widgets}
      addedTopicSegmentWidgets={dashboard.comparisons.map(({ id, question }) => ({ ...createTextAiComparativeChartWidget(question), id }))}
      addedKpiWidgets={dashboard.kpis}
      addedSubthemeTrendWidgets={dashboard.trends}
      themePreferences={dashboard.themePreferences}
      sharedCanvas={dashboard.canvas}
      showOriginalResponses={view.showOriginalResponses}
    /></main>
    <footer className={styles.footer}>Powered by <a href="https://www.questionpro.com/" rel="noreferrer" target="_blank">QuestionPro</a></footer>
  </div>;
}

function SharedTextAiDashboard({ token }: { token: string }) {
  const wick = useWickUILib();
  const [result, setResult] = useState<SharedResult | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const url = `/api/text-ai-shares/${encodeURIComponent(token)}`;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(url, { signal: controller.signal })
      .then(response => response.json())
      .then(setResult)
      .catch(() => { if (!controller.signal.aborted) setResult({ error: 'Dashboard cannot be loaded.' }); });
    return () => controller.abort();
  }, [url]);

  if (result?.view) return <Viewer view={result.view} />;
  if (!result || (result.passwordRequired && !wick)) return <StandardLoader message="Loading dashboard…" />;
  if (!result.passwordRequired || !wick) return <main className={gateStyles.empty}><h1>{result.error || 'Dashboard cannot be loaded.'}</h1></main>;

  const { WuButton, WuInput } = wick;
  return <main className={gateStyles.gateArea}>
    <form className={gateStyles.passwordGate} onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        const next = await response.json() as SharedResult;
        setResult(response.status === 401 ? { passwordRequired: true, error: next.error } : next);
        if (next.view) setPassword('');
      } catch {
        setResult({ passwordRequired: true, error: 'Dashboard could not be opened. Try again.' });
      } finally {
        setBusy(false);
      }
    }}>
      <h1>Password required</h1>
      <p>Enter the password for this shared dashboard.</p>
      <WuInput Label="Dashboard password" aria-label="Dashboard password" type="password" autoComplete="current-password"
        value={password} maxLength={128} onInput={event => setPassword(event.currentTarget.value)} />
      {result.error && <p role="alert">{result.error}</p>}
      <WuButton type="submit" disabled={!password || busy}>View dashboard</WuButton>
    </form>
  </main>;
}

export default function SharedTextAiDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <SharedTextAiDashboard key={token} token={token} />;
}
