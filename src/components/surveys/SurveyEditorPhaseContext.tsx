'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type SurveyEditorPhase = 'edit' | 'distribute' | 'analytics' | 'integration';

interface SurveyEditorPhaseContextValue {
  activePhase: SurveyEditorPhase;
  setActivePhase: (phase: SurveyEditorPhase) => void;
}

const SurveyEditorPhaseContext = createContext<SurveyEditorPhaseContextValue | null>(null);

export function SurveyEditorPhaseProvider({ children }: { children: ReactNode }) {
  const [activePhase, setActivePhase] = useState<SurveyEditorPhase>('edit');

  const value = useMemo(
    () => ({
      activePhase,
      setActivePhase,
    }),
    [activePhase]
  );

  return (
    <SurveyEditorPhaseContext.Provider value={value}>{children}</SurveyEditorPhaseContext.Provider>
  );
}

export function useSurveyEditorPhase(): SurveyEditorPhaseContextValue {
  const context = useContext(SurveyEditorPhaseContext);
  if (!context) {
    throw new Error('useSurveyEditorPhase must be used within SurveyEditorPhaseProvider');
  }
  return context;
}
