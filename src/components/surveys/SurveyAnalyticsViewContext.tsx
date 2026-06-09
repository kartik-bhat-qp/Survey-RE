'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getDefaultAnalyticsSubView,
  type AnalyticsTabId,
} from '@/data/mock-survey-analytics';

interface SurveyAnalyticsViewContextValue {
  activeTab: AnalyticsTabId;
  activeSubView: string;
  setAnalyticsSelection: (tab: AnalyticsTabId, subView: string) => void;
}

const SurveyAnalyticsViewContext = createContext<SurveyAnalyticsViewContextValue | null>(
  null
);

export function SurveyAnalyticsViewProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('dashboard');
  const [activeSubView, setActiveSubView] = useState<string>(
    getDefaultAnalyticsSubView('dashboard')
  );

  const setAnalyticsSelection = useCallback((tab: AnalyticsTabId, subView: string) => {
    setActiveTab(tab);
    setActiveSubView(subView);
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      activeSubView,
      setAnalyticsSelection,
    }),
    [activeTab, activeSubView, setAnalyticsSelection]
  );

  return (
    <SurveyAnalyticsViewContext.Provider value={value}>
      {children}
    </SurveyAnalyticsViewContext.Provider>
  );
}

export function useSurveyAnalyticsView(): SurveyAnalyticsViewContextValue {
  const context = useContext(SurveyAnalyticsViewContext);
  if (!context) {
    throw new Error(
      'useSurveyAnalyticsView must be used within SurveyAnalyticsViewProvider'
    );
  }
  return context;
}
