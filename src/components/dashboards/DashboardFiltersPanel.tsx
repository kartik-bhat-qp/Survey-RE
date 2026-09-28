'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DASHBOARD_FILTER_QUESTIONS,
  type DashboardSavedFilter,
  type DashboardActiveFilter,
  type DashboardFilterQuestion,
} from '@/data/mock-dashboard-filters';
import styles from './DashboardFiltersPanel.module.css';
import { ReportingYearDateFilter } from './ReportingYearDateFilter';
import { isReportingYear, type DashboardDateSelection, type ReportingYear } from '@/data/reporting-year';

type FilterMode = 'extended' | 'compact';

interface DashboardFiltersPanelProps {
  dashboardId?: number;
  open: boolean;
  onFilterChange?: (filter: DashboardActiveFilter) => void;
  extraQuestions?: DashboardFilterQuestion[];
  onManageFilters: () => void;
  onSaveFilter: (filter: DashboardSavedFilter) => void;
}

function SaveFilterModal({
  open,
  onOpenChange,
  question,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  value: string;
  onSave: (name: string, isDefault: boolean) => void;
}) {
  const wick = useWickUILib();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="sm">
      <WuModalHeader>Save filter</WuModalHeader>
      <WuModalContent>
        <div className={styles.saveForm}>
          <label htmlFor="dashboard-filter-name">Filter name<span aria-hidden>*</span></label>
          <input
            id="dashboard-filter-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Filter name"
            autoFocus
          />
          <section className={styles.details} aria-label="Filter details">
            <strong>Details</strong>
            <span>Responses filtered where</span>
            <p>{question}{value ? ` is ${value}` : ''}</p>
          </section>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
            />
            Set as default filter
          </label>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton
          disabled={!name.trim()}
          onClick={() => {
            onSave(name.trim(), isDefault);
            setName('');
            setIsDefault(false);
            onOpenChange(false);
          }}
        >
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}

export function DashboardFiltersPanel({
  dashboardId = 0,
  open,
  onManageFilters,
  onSaveFilter,
  onFilterChange,
  extraQuestions,
}: DashboardFiltersPanelProps) {
  const { showToast } = useWuShowToast();
  const [mode, setMode] = useState<FilterMode>('extended');
  const [hasCriteria, setHasCriteria] = useState(false);
  const [questionId, setQuestionId] = useState('');
  const [operator, setOperator] = useState('is');
  const [value, setValue] = useState('');
  const [responseStatus, setResponseStatus] = useState('all');
  const [dateRange, setDateRange] = useState('');
  const [dateSelection, setDateSelection] = useState<DashboardDateSelection>({ startDate: '', endDate: '' });
  const reportingYearsKey = `survey-re:dashboard:${dashboardId}:reporting-years:v1`;
  const [reportingYears, setReportingYears] = useState<ReportingYear[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(reportingYearsKey) ?? '[]');
      return Array.isArray(stored) ? stored.filter(isReportingYear) : [];
    } catch { return []; }
  });

  function changeDateSelection(selection: DashboardDateSelection) {
    setDateSelection(selection);
    setDateRange(selection.startDate && selection.endDate ? `${selection.startDate} – ${selection.endDate}` : '');
  }
  const [saveOpen, setSaveOpen] = useState(false);

  const questions = useMemo(() => [...DASHBOARD_FILTER_QUESTIONS, ...(extraQuestions ?? [])], [extraQuestions]);
  useEffect(() => { onFilterChange?.({ hasCriteria, questionId, operator, value, responseStatus, dateRange, dateSelection }); }, [onFilterChange, hasCriteria, questionId, operator, value, responseStatus, dateRange, dateSelection]);

  const question = useMemo(
    () => questions.find((item) => item.id === questionId),
    [questionId, questions]
  );

  if (!open) return null;

  const reset = () => {
    setHasCriteria(false);
    setQuestionId('');
    setValue('');
    setOperator('is');
    setResponseStatus('all');
    setDateRange('');
    setDateSelection({ startDate: '', endDate: '' });
  };

  return (
    <>
      <section className={`${styles.panel} ${mode === 'compact' ? styles.compact : ''}`} aria-label="Dashboard filters">
        <div className={styles.topRow}>
          <div className={styles.primaryActions}>
            {hasCriteria || responseStatus !== 'all' || dateRange ? (
              <button type="button" className={styles.textButton} onClick={reset}>
                <span className="wm-refresh" aria-hidden /> Reset
              </button>
            ) : (
              <button type="button" className={styles.textButton} disabled>
                <span className="wm-add" aria-hidden /> Create new filter
              </button>
            )}
            <button
              type="button"
              className={styles.aiButton}
              onClick={() => showToast({ message: 'Describe a filter to Filter AI', variant: 'info' })}
            >
              <span className="wc-ai" aria-hidden /> Filter AI
            </button>
            {hasCriteria ? (
              <button
                type="button"
                className={styles.textButton}
                disabled={!questionId}
                onClick={() => setSaveOpen(true)}
              >
                <span className="wm-save" aria-hidden /> Save filter
              </button>
            ) : null}
          </div>
          <button type="button" className={styles.manageButton} onClick={onManageFilters}>
            Manage filter
          </button>
        </div>

        <div className={styles.commonRow}>
          <label>
            <span>Response status</span>
            <select value={responseStatus} onChange={(event) => setResponseStatus(event.target.value)}>
              <option value="all">All responses</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>
          <div className={styles.dateControl}>
            <span>Filter by date</span>
            <ReportingYearDateFilter selection={dateSelection} years={reportingYears} onChange={changeDateSelection} onSave={year => {
              const next = reportingYears.some(saved => saved.id === year.id)
                ? reportingYears.map(saved => saved.id === year.id ? year : saved)
                : [...reportingYears, year];
              setReportingYears(next);
              try {
                window.localStorage.setItem(reportingYearsKey, JSON.stringify(next));
                showToast({ message: `Reporting year '${year.name}' saved`, variant: 'success' });
              } catch { showToast({ message: 'Reporting year applied for this session. Browser storage is unavailable.', variant: 'info' }); }
            }} onDelete={year => {
              const next = reportingYears.filter(saved => saved.id !== year.id);
              setReportingYears(next);
              try {
                window.localStorage.setItem(reportingYearsKey, JSON.stringify(next));
                showToast({ message: `Reporting year '${year.name}' deleted`, variant: 'success' });
              } catch { showToast({ message: 'Deleted for this session. Browser storage is unavailable.', variant: 'info' }); }
            }} />
          </div>
          <div className={styles.modeSwitch} role="group" aria-label="Filter display mode">
            <button type="button" className={mode === 'extended' ? styles.activeMode : ''} onClick={() => setMode('extended')}>
              Extended mode
            </button>
            <button type="button" className={mode === 'compact' ? styles.activeMode : ''} onClick={() => setMode('compact')}>
              Compact mode
            </button>
          </div>
        </div>


        {mode === 'extended' ? (
          <div className={styles.criteriaArea}>
            {!hasCriteria ? (
              <button type="button" className={styles.addCriteria} onClick={() => setHasCriteria(true)}>
                <span className="wm-add" aria-hidden /> Add criteria
              </button>
            ) : (
              <section className={styles.criteriaCard} aria-label="Filter block 1">
                <div className={styles.criteriaHeader}>
                  <strong>Block 1</strong>
                  <span>1 condition</span>
                </div>
                <div className={styles.criteriaGrid}>
                  <span className={styles.ifLabel}>IF</span>
                  <label>
                    <span>Option</span>
                    <select aria-label="Filter option" defaultValue="question">
                      <option value="question">Question</option>
                    </select>
                  </label>
                  <label>
                    <span>Survey question</span>
                    <select
                      aria-label="Survey question"
                      value={questionId}
                      onChange={(event) => {
                        setQuestionId(event.target.value);
                        setValue('');
                      }}
                    >
                      <option value="">-Select-</option>
                      {questions.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  {question ? (
                    <>
                      <label>
                        <span>Operator</span>
                        <select value={operator} onChange={(event) => setOperator(event.target.value)}>
                          <option value="is">Is</option>
                          <option value="is-not">Is not</option>
                        </select>
                      </label>
                      <label>
                        <span>Question values</span>
                        <select value={value} onChange={(event) => setValue(event.target.value)} aria-label="Question values">
                          <option value="">Enter your value</option>
                          {question.values.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                    </>
                  ) : null}
                </div>
                <button type="button" className={styles.addOr} onClick={() => showToast({ message: 'OR condition added', variant: 'success' })}>
                  <span className="wm-add" aria-hidden /> Add OR condition
                </button>
              </section>
            )}
          </div>
        ) : null}
      </section>

      <SaveFilterModal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        question={question?.label ?? 'Question'}
        value={value}
        onSave={(name, isDefault) => {
          onSaveFilter({
            id: `filter-${Date.now()}`,
            name,
            summary: `${question?.label ?? 'Question'} ${operator === 'is-not' ? 'is not' : 'is'} ${value || 'any value'}`,
            isDefault,
          });
          showToast({ message: `Filter '${name}' saved`, variant: 'success' });
        }}
      />
    </>
  );
}
