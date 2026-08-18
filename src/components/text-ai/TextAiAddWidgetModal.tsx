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
  onAddWidget?: (question: TextAiAnalysisQuestion, chartTypeId: TextAiWidgetChartTypeId) => void;
}

export function TextAiAddWidgetModal({
  open,
  onOpenChange,
  onAddWidget,
}: TextAiAddWidgetModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<TextAiAddWidgetStep>('question');
  const [search, setSearch] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<TextAiAnalysisQuestion | null>(
    null
  );
  const [widgetName, setWidgetName] = useState('');
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [widgetDescription, setWidgetDescription] = useState('');
  const [selectedChartTypeId, setSelectedChartTypeId] = useState<TextAiWidgetChartTypeId>(
    DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID
  );

  function resetModalState(): void {
    setStep('question');
    setSearch('');
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
    if (!term) return MOCK_TEXT_AI_ANALYSIS_QUESTIONS;
    return MOCK_TEXT_AI_ANALYSIS_QUESTIONS.filter(
      (question) =>
        question.code.toLowerCase().includes(term) ||
        question.text.toLowerCase().includes(term) ||
        question.type.toLowerCase().includes(term)
    );
  }, [search]);

  const rangeLabel =
    filteredQuestions.length === 0
      ? '0 - 0 of 0'
      : `1 - ${filteredQuestions.length} of ${filteredQuestions.length}`;

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
        header: 'Questions',
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
                setWidgetName('');
                setSelectedChartTypeId(DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID);
                setStep('chart');
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
    [selectedQuestion]
  );

  function handleBreadcrumbClick(target: TextAiAddWidgetStep): void {
    if (target === 'question') {
      setStep('question');
    }
  }

  function handleAddWidget(): void {
    if (!selectedQuestion) return;
    onAddWidget?.(selectedQuestion, selectedChartTypeId);
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
                  placeholder="Search by Question name"
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(event.target.value)
                  }
                  Icon={<span className="wm-search" aria-hidden />}
                  aria-label="Search by Question name"
                />
              </div>
              <span className={styles.rangeMeta}>
                {rangeLabel}
                <span className="wm-arrow-drop-down" aria-hidden />
              </span>
            </div>
            <div className={styles.tableArea}>
              <WuTable
                data={filteredQuestions as unknown[]}
                columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                variant="bordered"
              />
            </div>
          </div>
        ) : (
          <div className={styles.chartStep}>
            <p className={styles.questionContext}>
              {selectedQuestion?.text ?? 'Select a question'}
            </p>

            <div className={styles.nameField}>
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
            </div>

            <div className={styles.descriptionRow}>
              <span className={styles.descriptionLabel}>Description</span>
              <WuToggle
                checked={descriptionEnabled}
                onChange={(checked) => setDescriptionEnabled(checked)}
                aria-label="Description"
              />
            </div>

            {descriptionEnabled ? (
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
            onStepClick={handleBreadcrumbClick}
          />
          {step === 'chart' ? (
            <div className={styles.wizardActions}>
              <button
                type="button"
                className={styles.backLink}
                onClick={() => setStep('question')}
              >
                Back
              </button>
              <WuButton onClick={handleAddWidget} disabled={!selectedQuestion}>
                Add widget
              </WuButton>
            </div>
          ) : null}
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
