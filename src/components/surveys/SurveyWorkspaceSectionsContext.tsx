'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SurveySection } from '@/data/mock-survey-detail';

export interface SurveyQuestionTarget {
  sectionId: string;
  questionId: string;
}

type RemoveQuestionsHandler = (targets: SurveyQuestionTarget[]) => void;

interface SurveyWorkspaceSectionsContextValue {
  sections: SurveySection[];
  setWorkspaceSections: (sections: SurveySection[]) => void;
  registerRemoveQuestions: (handler: RemoveQuestionsHandler | null) => void;
  removeQuestions: (targets: SurveyQuestionTarget[]) => void;
}

const SurveyWorkspaceSectionsContext =
  createContext<SurveyWorkspaceSectionsContextValue | null>(null);

export function SurveyWorkspaceSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SurveySection[]>([]);
  const removeHandlerRef = useRef<RemoveQuestionsHandler | null>(null);

  const setWorkspaceSections = useCallback((next: SurveySection[]) => {
    setSections(next);
  }, []);

  const registerRemoveQuestions = useCallback((handler: RemoveQuestionsHandler | null) => {
    removeHandlerRef.current = handler;
  }, []);

  const removeQuestions = useCallback((targets: SurveyQuestionTarget[]) => {
    removeHandlerRef.current?.(targets);
  }, []);

  const value = useMemo(
    () => ({
      sections,
      setWorkspaceSections,
      registerRemoveQuestions,
      removeQuestions,
    }),
    [sections, setWorkspaceSections, registerRemoveQuestions, removeQuestions]
  );

  return (
    <SurveyWorkspaceSectionsContext.Provider value={value}>
      {children}
    </SurveyWorkspaceSectionsContext.Provider>
  );
}

export function useSurveyWorkspaceSections(): SurveyWorkspaceSectionsContextValue {
  const context = useContext(SurveyWorkspaceSectionsContext);
  if (!context) {
    throw new Error(
      'useSurveyWorkspaceSections must be used within SurveyWorkspaceSectionsProvider'
    );
  }
  return context;
}
