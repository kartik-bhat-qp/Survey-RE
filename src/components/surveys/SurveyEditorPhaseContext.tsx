'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getSurveyEditorPhaseFromPathname,
  getSurveyEditorPhasePath,
} from '@/components/surveys/survey-editor-navigation';

export type SurveyEditorPhase = 'edit' | 'distribute' | 'analytics' | 'integration';

interface SurveyEditorPhaseContextValue {
  activePhase: SurveyEditorPhase;
  setActivePhase: (phase: SurveyEditorPhase) => void;
}

const SurveyEditorPhaseContext = createContext<SurveyEditorPhaseContextValue | null>(null);

interface SurveyEditorPhaseProviderProps {
  children: ReactNode;
  surveyId: number;
}

export function SurveyEditorPhaseProvider({ children, surveyId }: SurveyEditorPhaseProviderProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const phaseFromPath = getSurveyEditorPhaseFromPathname(pathname, surveyId);
  const [activePhase, setActivePhaseState] = useState<SurveyEditorPhase>(phaseFromPath);

  useEffect(() => {
    setActivePhaseState(phaseFromPath);
  }, [phaseFromPath]);

  const setActivePhase = useCallback(
    (phase: SurveyEditorPhase) => {
      if (phase === 'integration') {
        return;
      }

      const targetPath = getSurveyEditorPhasePath(surveyId, phase);
      if (pathname !== targetPath) {
        router.push(targetPath);
      }
      setActivePhaseState(phase);
    },
    [pathname, router, surveyId]
  );

  const value = useMemo(
    () => ({
      activePhase,
      setActivePhase,
    }),
    [activePhase, setActivePhase]
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
