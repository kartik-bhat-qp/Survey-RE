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
import type { QuestionLogicState } from '@/data/mock-question-logic';

export interface SurveyQuestionTarget {
  sectionId: string;
  questionId: string;
}

type RemoveQuestionsHandler = (targets: SurveyQuestionTarget[]) => void;
type ClearShowHideLogicHandler = (targets: SurveyQuestionTarget[]) => void;

interface SurveyWorkspaceSectionsContextValue {
  sections: SurveySection[];
  logicByQuestionKey: Record<string, QuestionLogicState>;
  setWorkspaceSections: (sections: SurveySection[]) => void;
  setWorkspaceLogic: (logicByQuestionKey: Record<string, QuestionLogicState>) => void;
  registerRemoveQuestions: (handler: RemoveQuestionsHandler | null) => void;
  registerClearShowHideLogic: (handler: ClearShowHideLogicHandler | null) => void;
  removeQuestions: (targets: SurveyQuestionTarget[]) => void;
  clearShowHideLogic: (targets: SurveyQuestionTarget[]) => void;
}

const SurveyWorkspaceSectionsContext =
  createContext<SurveyWorkspaceSectionsContextValue | null>(null);

export function SurveyWorkspaceSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [logicByQuestionKey, setLogicByQuestionKey] = useState<
    Record<string, QuestionLogicState>
  >({});
  const removeHandlerRef = useRef<RemoveQuestionsHandler | null>(null);
  const clearShowHideLogicHandlerRef = useRef<ClearShowHideLogicHandler | null>(null);

  const setWorkspaceSections = useCallback((next: SurveySection[]) => {
    setSections(next);
  }, []);

  const setWorkspaceLogic = useCallback((next: Record<string, QuestionLogicState>) => {
    setLogicByQuestionKey(next);
  }, []);

  const registerRemoveQuestions = useCallback((handler: RemoveQuestionsHandler | null) => {
    removeHandlerRef.current = handler;
  }, []);

  const registerClearShowHideLogic = useCallback((handler: ClearShowHideLogicHandler | null) => {
    clearShowHideLogicHandlerRef.current = handler;
  }, []);

  const removeQuestions = useCallback((targets: SurveyQuestionTarget[]) => {
    removeHandlerRef.current?.(targets);
  }, []);

  const clearShowHideLogic = useCallback((targets: SurveyQuestionTarget[]) => {
    clearShowHideLogicHandlerRef.current?.(targets);
  }, []);

  const value = useMemo(
    () => ({
      sections,
      logicByQuestionKey,
      setWorkspaceSections,
      setWorkspaceLogic,
      registerRemoveQuestions,
      registerClearShowHideLogic,
      removeQuestions,
      clearShowHideLogic,
    }),
    [
      sections,
      logicByQuestionKey,
      setWorkspaceSections,
      setWorkspaceLogic,
      registerRemoveQuestions,
      registerClearShowHideLogic,
      removeQuestions,
      clearShowHideLogic,
    ]
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
