'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  TextAiAddWidgetStepBreadcrumb,
  type TextAiAddWidgetStep,
} from '@/components/text-ai/TextAiAddWidgetStepBreadcrumb';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  MOCK_TEXT_AI_ANALYSIS_QUESTIONS,
  type TextAiAnalysisQuestion,
} from '@/data/mock-text-ai-questions';
import {
  DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID,
  TEXT_AI_WIDGET_CHART_TYPES,
  type TextAiWidgetChartTypeId,
} from '@/data/mock-text-ai-widget-chart-types';
import { TextAiKpiSetupFields } from './TextAiKpiSetupFields';
import { defaultTextAiKpiConfig, validateTextAiKpiConfig, type TextAiKpiConfig, type TextAiKpiSourceType } from '@/data/mock-text-ai-kpi-by-theme';
import { truncate } from '@/data/mock-utils';
import styles from './TextAiAddWidgetModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[200px]" /> }
);

interface TextAiAddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType?: TextAiKpiSourceType;
  questions?: TextAiAnalysisQuestion[];
  onAddWidget?: (question: TextAiAnalysisQuestion, chartTypeId: TextAiWidgetChartTypeId, kpi?: TextAiKpiConfig) => void;
}

export function TextAiAddWidgetModal({
  open,
  onOpenChange,
  onAddWidget,
  sourceType: initialSourceType = 'survey',
  questions = MOCK_TEXT_AI_ANALYSIS_QUESTIONS,
}: TextAiAddWidgetModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<TextAiAddWidgetStep>('chart');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [selectedQuestion, setSelectedQuestion] = useState<TextAiAnalysisQuestion | null>(
    null
  );
  const [widgetName, setWidgetName] = useState('');
  const sourceType = initialSourceType;
  const [kpiConfig, setKpiConfig] = useState<TextAiKpiConfig>(() => ({ ...defaultTextAiKpiConfig(), name: '', questionId: undefined, sourceType: initialSourceType }));
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [widgetDescription, setWidgetDescription] = useState('');
  const [selectedChartTypeId, setSelectedChartTypeId] = useState<TextAiWidgetChartTypeId>(
    DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID
  );

  function resetModalState(): void {
    setStep('chart');
    setKpiConfig({ ...defaultTextAiKpiConfig(), name: '', questionId: undefined, sourceType: initialSourceType });
    setSearch('');
    setPage(0);
    setSelectedQuestion(null);
    setWidgetName('');
    setDescriptionEnabled(false);
    setWidgetDescription('');
    setSelectedChartTypeId(DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID);
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      resetModalState();
    }
    onOpenChange(nextOpen);
  }

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const available = questions;
    if (!term) return available;
    return available.filter(
      (question) =>
        question.code.toLowerCase().includes(term) ||
        question.text.toLowerCase().includes(term) ||
        question.type.toLowerCase().includes(term)
    );
  }, [search, questions]);

  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rangeLabel = filteredQuestions.length
    ? `${safePage * pageSize + 1} - ${Math.min((safePage + 1) * pageSize, filteredQuestions.length)} of ${filteredQuestions.length}`
    : '0 - 0 of 0';

  const columns: IWuTableColumnDef<TextAiAnalysisQuestion>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
        size: 106,
      },
      {
        accessorKey: 'text',
        header: sourceType === 'dataset' ? 'Variables' : 'Questions',
        enableSorting: true,
        size: 695,
        cell: ({ row }) => {
          const question = row.original;
          const isSelected = selectedQuestion?.id === question.id;
          return (
            <button
              type="button"
              className={`${styles.questionLink} ${
                isSelected ? styles.questionLinkSelected : ''
              }`}
              onClick={() => {
                setSelectedQuestion(question);
                setKpiConfig(previous => ({ ...previous, textQuestionId: question.id }));
                if (selectedChartTypeId === 'kpi-by-theme') setStep('kpi');
              }}
            >
              {truncate(question.text, 96)}
            </button>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: true,
        size: 159,
      },
    ],
    [selectedQuestion, sourceType, selectedChartTypeId]
  );

  function handleBreadcrumbClick(target: TextAiAddWidgetStep): void {
    if (target === 'chart' || target === 'question') setStep(target);
  }

  function handleAddWidget(): void {
    if (!selectedQuestion) return;
    if (selectedChartTypeId === 'kpi-by-theme' && validateTextAiKpiConfig(kpiConfig)) return;
    onAddWidget?.(selectedQuestion, selectedChartTypeId,
      selectedChartTypeId === 'kpi-by-theme' ? kpiConfig : undefined);
    const chartLabel =
      TEXT_AI_WIDGET_CHART_TYPES.find((type) => type.id === selectedChartTypeId)?.label ??
      'widget';
    showToast({
      message: `Added ${chartLabel} for ${selectedQuestion.code}`,
      variant: 'success',
    });
    handleOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;

  return (
    <WuModal open onOpenChange={handleOpenChange} className={styles.modal}>
      <WuModalHeader className={styles.modalTitle}>Add widget</WuModalHeader>
      <WuModalContent className={styles.stepContent}>
        {step === 'question' ? (
          <div className={styles.questionStep}>
            <div className={styles.toolbar}>
              <div className={styles.searchInput}>
                <WuInput
                  variant="outlined"
                  placeholder={sourceType === 'dataset' ? 'Search variables' : 'Search questions'}
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearch(event.target.value); setPage(0);
                  }}
                  Icon={<span className="wm-search" aria-hidden />}
                  aria-label={sourceType === 'dataset' ? 'Search variables' : 'Search questions'}
                />
              </div>
              <nav className={styles.pagination} aria-label="Question pages">
                <button type="button" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><span className="wm-chevron-left" aria-hidden /></button>
                <span className={styles.rangeMeta} aria-live="polite">{rangeLabel}</span>
                <button type="button" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><span className="wm-chevron-right" aria-hidden /></button>
              </nav>
            </div>
            <div className={styles.tableArea}>
              <WuTable
                data={filteredQuestions as unknown[]}
                columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                variant="bordered"
                pagination={{ pageIndex: safePage, pageSize }}
              />
            </div>
          </div>
        ) : step === 'kpi' ? (
          <div className={styles.kpiStep}>
            <h3>KPI setup</h3>
            <TextAiKpiSetupFields value={kpiConfig} onChange={setKpiConfig} />
          </div>
        ) : (
          <div className={styles.chartStep}>
            <h3 className={styles.stepHeading}>Select widget</h3>

            {selectedChartTypeId !== 'kpi-by-theme' && <div className={styles.nameField}>
              <WuInput
                variant="standard"
                Label="Name"
                labelPosition="top"
                placeholder={selectedQuestion?.text ?? 'Widget name'}
                value={widgetName}
                maxLength={100}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setWidgetName(event.target.value)
                }
              />
            </div>}

            {selectedChartTypeId !== 'kpi-by-theme' && <div className={styles.descriptionRow}>
              <span className={styles.descriptionLabel}>Description</span>
              <WuToggle
                checked={descriptionEnabled}
                onChange={(checked) => setDescriptionEnabled(checked)}
                aria-label="Description"
              />
            </div>}

            {descriptionEnabled && selectedChartTypeId !== 'kpi-by-theme' ? (
              <div className={styles.descriptionField}>
                <WuInput
                  variant="standard"
                  placeholder="Add a description"
                  value={widgetDescription}
                  maxLength={200}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setWidgetDescription(event.target.value)
                  }
                />
              </div>
            ) : null}

            <div className={styles.chartGrid} role="listbox" aria-label="Chart type">
              {TEXT_AI_WIDGET_CHART_TYPES.map((chartType) => {
                const selected = chartType.id === selectedChartTypeId;
                return (
                  <button
                    key={chartType.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`${styles.chartCard} ${
                      selected ? styles.chartCardSelected : ''
                    }`}
                    onClick={() => setSelectedChartTypeId(chartType.id)}
                  >
                    <Image
                      src={chartType.imageSrc}
                      alt=""
                      width={80}
                      height={64}
                      className={styles.chartImage}
                    />
                    <span className={styles.chartCardLabel}>{chartType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.wizardFooter}>
          <TextAiAddWidgetStepBreadcrumb
            currentStep={step}
            includeKpi={selectedChartTypeId === 'kpi-by-theme'}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.wizardActions}>
            {step !== 'chart' && <button type="button" className={styles.backLink} onClick={() => setStep(step === 'kpi' ? 'question' : 'chart')}>Back</button>}
            {!(step === 'question' && selectedChartTypeId === 'kpi-by-theme') && <WuButton disabled={step === 'question' ? !selectedQuestion : step === 'kpi' ? Boolean(validateTextAiKpiConfig(kpiConfig)) : false}
              onClick={() => step === 'chart' ? setStep('question') : step === 'question' && selectedChartTypeId === 'kpi-by-theme' ? setStep('kpi') : handleAddWidget()}>
              {step === 'kpi' || (step === 'question' && selectedChartTypeId !== 'kpi-by-theme') ? 'Add widget' : 'Next'}
            </WuButton>}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
