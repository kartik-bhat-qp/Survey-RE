'use client';

import { useState } from 'react';
import { TextAiDashboardCanvas } from './TextAiDashboardCanvas';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { useMounted } from '@/hooks/useMounted';
import { useTextAiDashboardShare } from '@/hooks/useTextAiDashboardShare';
import { getTextAiDashboardDesign } from '@/data/dashboard-design';
import { getTextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import { createTextAiComparativeChartWidget } from '@/data/mock-text-ai-topic-segment-widget';
import { createDefaultTextAiKpiWidget } from '@/data/mock-text-ai-kpi-by-theme';
import { getTextAiLanguageDemo } from '@/data/mock-text-ai-language-demos';
import type { TextAiSharingState } from '@/data/text-ai-sharing';
import gateStyles from '@/components/dashboards/SharedDashboardViewer.module.css';
import styles from './TextAiSharing.module.css';

function ViewerContent({ dashboardId, dashboard, password, showOriginalResponses }: {
  dashboardId: number;
  dashboard: NonNullable<TextAiSharingState['dashboard']>;
  password: string;
  showOriginalResponses: boolean;
}) {
  const wick = useWickUILib();
  const [enteredPassword, setEnteredPassword] = useState('');
  const [unlocked, setUnlocked] = useState(!password);
  const [passwordError, setPasswordError] = useState(false);

  if (!unlocked) {
    if (!wick) return <StandardLoader message="Loading dashboard…" />;
    const { WuButton, WuInput } = wick;
    return <main className={gateStyles.gateArea}>
      <form className={gateStyles.passwordGate} onSubmit={event => {
        event.preventDefault();
        const matches = enteredPassword === password;
        setUnlocked(matches);
        setPasswordError(!matches);
      }}>
        <h1>Password required</h1>
        <p>Enter the password for this shared dashboard.</p>
        <WuInput aria-label="Dashboard password" type="password" value={enteredPassword}
          onInput={event => setEnteredPassword(event.currentTarget.value)} />
        {passwordError && <p role="alert">Incorrect password. Try again.</p>}
        <WuButton type="submit">View dashboard</WuButton>
        <small>This password prompt applies to the browser preview.</small>
      </form>
    </main>;
  }

  // Older language-demo links were saved before the default KPI widget was included.
  const defaultKpi = getTextAiLanguageDemo(dashboardId) && createDefaultTextAiKpiWidget(dashboard.selectedQuestion.text);
  const kpiWidgets = defaultKpi && !dashboard.kpis.some(widget => widget.id === defaultKpi.id)
    ? [...dashboard.kpis, defaultKpi]
    : dashboard.kpis;

  return <>
    <header className={styles.viewerHeader}><h1>{dashboard.name}</h1></header>
    <main className={styles.viewerCanvas}>
      <TextAiDashboardCanvas
        dashboardId={dashboardId}
        censoredSubthemesEnabled={dashboard.censoredSubthemesEnabled}
        syncedCensoredResponses={dashboard.syncedCensoredResponses}
        dashboardFilter={dashboard.responseFilter}
        design={getTextAiDashboardDesign(dashboardId)}
        selectedQuestion={dashboard.selectedQuestion}
        questionIndex={dashboard.questionIndex}
        addedWidgets={dashboard.widgets}
        addedTopicSegmentWidgets={dashboard.comparisons.map(({ id, question }) => ({ ...createTextAiComparativeChartWidget(question), id }))}
        addedKpiWidgets={kpiWidgets}
        addedSubthemeTrendWidgets={dashboard.trends}
        themePreferences={getTextAiThemePreferences(dashboardId)}
        sharedCanvas={dashboard.canvas}
        showOriginalResponses={showOriginalResponses}
      />
    </main>
    <footer className={styles.footer}>Powered by <a href="https://www.questionpro.com/" rel="noreferrer" target="_blank">QuestionPro</a></footer>
  </>;
}

export function SharedTextAiDashboardViewer({ dashboardId }: { dashboardId: number }) {
  const [sharing] = useTextAiDashboardShare(dashboardId);
  const mounted = useMounted();

  return <div className={styles.viewer}>
    {!mounted ? <StandardLoader message="Loading dashboard…" />
      : !sharing.enabled || !sharing.dashboard ? <main className={gateStyles.empty}>
        <h1>Shared dashboard unavailable</h1>
        <p>Enable sharing for this TextAI dashboard in this browser.</p>
      </main>
      : <ViewerContent key={sharing.password} dashboardId={dashboardId} dashboard={sharing.dashboard}
        password={sharing.password} showOriginalResponses={sharing.showOriginalResponses} />}
  </div>;
}
