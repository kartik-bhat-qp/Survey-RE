'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface SurveyEditorBulkEditContextValue {
  bulkEditModeEnabled: boolean;
  enableBulkEditMode: () => void;
  disableBulkEditMode: () => void;
  selectAll: boolean;
  setSelectAll: (value: boolean) => void;
  expandAllLogic: boolean;
  setExpandAllLogic: (value: boolean) => void;
  totalQuestionCount: number;
  selectedQuestionCount: number;
  hasBulkSelection: boolean;
  setBulkEditQuestionCounts: (total: number, selected: number) => void;
}

const SurveyEditorBulkEditContext = createContext<SurveyEditorBulkEditContextValue | null>(null);

export function SurveyEditorBulkEditProvider({ children }: { children: ReactNode }) {
  const [bulkEditModeEnabled, setBulkEditModeEnabled] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [expandAllLogic, setExpandAllLogic] = useState(false);
  const [totalQuestionCount, setTotalQuestionCount] = useState(0);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(0);

  const enableBulkEditMode = useCallback(() => {
    setBulkEditModeEnabled(true);
  }, []);

  const disableBulkEditMode = useCallback(() => {
    setBulkEditModeEnabled(false);
    setSelectAll(false);
    setExpandAllLogic(false);
    setTotalQuestionCount(0);
    setSelectedQuestionCount(0);
  }, []);

  const setBulkEditQuestionCounts = useCallback((total: number, selected: number) => {
    setTotalQuestionCount(total);
    setSelectedQuestionCount(selected);
  }, []);

  const hasBulkSelection = selectedQuestionCount > 0;

  const value = useMemo(
    () => ({
      bulkEditModeEnabled,
      enableBulkEditMode,
      disableBulkEditMode,
      selectAll,
      setSelectAll,
      expandAllLogic,
      setExpandAllLogic,
      totalQuestionCount,
      selectedQuestionCount,
      hasBulkSelection,
      setBulkEditQuestionCounts,
    }),
    [
      bulkEditModeEnabled,
      disableBulkEditMode,
      enableBulkEditMode,
      expandAllLogic,
      hasBulkSelection,
      selectAll,
      selectedQuestionCount,
      setBulkEditQuestionCounts,
      totalQuestionCount,
    ]
  );

  return (
    <SurveyEditorBulkEditContext.Provider value={value}>
      {children}
    </SurveyEditorBulkEditContext.Provider>
  );
}

export function useSurveyEditorBulkEdit(): SurveyEditorBulkEditContextValue {
  const context = useContext(SurveyEditorBulkEditContext);
  if (!context) {
    throw new Error('useSurveyEditorBulkEdit must be used within SurveyEditorBulkEditProvider');
  }
  return context;
}
