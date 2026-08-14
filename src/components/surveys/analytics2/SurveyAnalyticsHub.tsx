'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AnalyticsOverview } from '@/components/surveys/analytics2/AnalyticsOverview';
import {
  AnalyticsComparison,
  AnalyticsConsolidate,
  AnalyticsConjoint,
  AnalyticsCorrelation,
  AnalyticsCrosstabDetail,
  AnalyticsCrosstabList,
  AnalyticsDelete,
  AnalyticsDeviceAudit,
  AnalyticsDownloads,
  AnalyticsExport,
  AnalyticsFilterModal,
  AnalyticsFilters,
  AnalyticsImport,
  AnalyticsMerge,
  AnalyticsQuality,
  AnalyticsScheduler,
  AnalyticsSearchText,
  AnalyticsToolScreen,
  AnalyticsTrend,
  AnalyticsWeighting,
  AnalyticsWordCloud,
} from '@/components/surveys/analytics2/AnalyticsScreens';
import { SurveyAnalyticsResponses } from '@/components/surveys/SurveyAnalyticsResponses';
import { useSurveyAnalyticsView } from '@/components/surveys/SurveyAnalyticsViewContext';
import { VideoAiAnalysis } from '@/components/surveys/VideoAiAnalysis';
import { consumeVideoAiRestoreState } from '@/components/video-ai/videoAiNavigation';
import type { SurveyDetail } from '@/data/mock-survey-detail';
import {
  ANALYTICS_2_NAV,
  ANALYTICS_2_TOOLS,
  isAnalytics2ToolScreen,
  type Analytics2ScreenId,
} from '@/data/mock-analytics-2';
import styles from './SurveyAnalyticsHub.module.css';

interface SurveyAnalyticsHubProps {
  detail: SurveyDetail;
}

export function SurveyAnalyticsHub({ detail }: SurveyAnalyticsHubProps) {
  const { showToast } = useWuShowToast();
  const { setAnalyticsSelection } = useSurveyAnalyticsView();
  const [screen, setScreen] = useState<Analytics2ScreenId>('overview');
  const [navSearch, setNavSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const toast = useCallback(
    (message: string) => showToast({ message, variant: 'success' }),
    [showToast]
  );

  useEffect(() => {
    const restored = consumeVideoAiRestoreState(detail.survey.id);
    if (restored) {
      setScreen('videoai');
      setAnalyticsSelection(restored.tab, restored.subView);
    }
  }, [detail.survey.id, setAnalyticsSelection]);

  const sections = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    return ANALYTICS_2_NAV.map((section) => {
      const items = query
        ? section.items.filter((item) => item.label.toLowerCase().includes(query))
        : section.items;
      const expanded = query ? items.length > 0 : collapsed[section.label] !== true;
      return { ...section, items, expanded };
    }).filter((section) => section.items.length > 0);
  }, [collapsed, navSearch]);

  function go(id: Analytics2ScreenId): void {
    setScreen(id);
  }

  function renderScreen(): React.ReactNode {
    if (screen === 'overview') {
      return (
        <AnalyticsOverview
          onGoResponses={() => go('responses')}
          onOpenFilter={() => {
            go('filters');
            setFilterModalOpen(true);
          }}
          onAction={toast}
        />
      );
    }
    if (screen === 'responses') {
      return (
        <div className={styles.responsesEmbed}>
          <SurveyAnalyticsResponses />
        </div>
      );
    }
    if (screen === 'crosstab') {
      return <AnalyticsCrosstabList onOpen={() => go('crosstabDetail')} onAction={toast} />;
    }
    if (screen === 'crosstabDetail') {
      return <AnalyticsCrosstabDetail onBack={() => go('crosstab')} onAction={toast} />;
    }
    if (screen === 'trend') return <AnalyticsTrend onAction={toast} />;
    if (screen === 'comparison') return <AnalyticsComparison onAction={toast} />;
    if (screen === 'consolidate') return <AnalyticsConsolidate onAction={toast} />;
    if (screen === 'conjoint') return <AnalyticsConjoint onAction={toast} />;
    if (screen === 'correlation') return <AnalyticsCorrelation onAction={toast} />;
    if (isAnalytics2ToolScreen(screen)) {
      return <AnalyticsToolScreen key={screen} tool={ANALYTICS_2_TOOLS[screen]} onAction={toast} />;
    }
    if (screen === 'wordcloud') return <AnalyticsWordCloud onAction={toast} />;
    if (screen === 'searchtext') return <AnalyticsSearchText onAction={toast} />;
    if (screen === 'videoai') {
      return <VideoAiAnalysis surveyId={detail.survey.id} embeddedInSurvey />;
    }
    if (screen === 'filters') {
      return (
        <AnalyticsFilters
          onAction={toast}
          onCreate={() => setFilterModalOpen(true)}
        />
      );
    }
    if (screen === 'weighting') return <AnalyticsWeighting onAction={toast} />;
    if (screen === 'quality') return <AnalyticsQuality onAction={toast} />;
    if (screen === 'deviceaudit') return <AnalyticsDeviceAudit onAction={toast} />;
    if (screen === 'exportdata') return <AnalyticsExport onAction={toast} />;
    if (screen === 'importdata') return <AnalyticsImport onAction={toast} />;
    if (screen === 'mergedata') return <AnalyticsMerge onAction={toast} />;
    if (screen === 'scheduler') return <AnalyticsScheduler onAction={toast} />;
    if (screen === 'downloads') return <AnalyticsDownloads onAction={toast} />;
    if (screen === 'deleteresponses') return <AnalyticsDelete onAction={toast} />;
    return null;
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Analytics 2.0">
        <div className={styles.searchWrap}>
          <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
          <input
            type="search"
            className={styles.searchInput}
            value={navSearch}
            onChange={(event) => setNavSearch(event.target.value)}
            placeholder="Search analytics tools"
            aria-label="Search analytics tools"
          />
        </div>
        <nav className={styles.nav}>
          {sections.map((section) => (
            <div key={section.label}>
              <button
                type="button"
                className={styles.sectionToggle}
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [section.label]: section.expanded,
                  }))
                }
              >
                <span className={styles.sectionLabel}>{section.label}</span>
                <span
                  className={`wm-expand-more ${styles.sectionChevron} ${
                    section.expanded ? '' : styles.sectionChevronCollapsed
                  }`}
                  aria-hidden
                />
              </button>
              {section.expanded
                ? section.items.map((item) => {
                    const active =
                      screen === item.id ||
                      (item.id === 'crosstab' && screen === 'crosstabDetail');
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={active ? styles.navItemActive : styles.navItem}
                        onClick={() => go(item.id)}
                      >
                        <span className={`${item.icon} ${styles.navIcon}`} aria-hidden />
                        {item.label}
                      </button>
                    );
                  })
                : null}
            </div>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{renderScreen()}</main>
      <AnalyticsFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onSave={(name) => {
          setFilterModalOpen(false);
          go('filters');
          toast(`Filter "${name}" saved`);
        }}
      />
    </div>
  );
}
