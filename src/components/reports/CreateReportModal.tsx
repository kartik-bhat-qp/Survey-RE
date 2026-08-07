'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import {
  CreateReportStepBreadcrumb,
  type CreateReportWizardStep,
} from '@/components/reports/CreateReportStepBreadcrumb';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  CREATE_REPORT_TYPE_OPTIONS,
  type CreateReportTypeId,
  type CreateReportTypeOption,
} from '@/data/mock-create-report';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import styles from './CreateReportModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuHelpButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHelpButton })),
  { ssr: false }
);

interface CreateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onCreate: (payload: {
    name: string;
    typeId: CreateReportTypeId;
    survey: SurveyListItem;
  }) => void;
}

interface ReportTypeCardProps {
  option: CreateReportTypeOption;
  selected: boolean;
  onSelect: () => void;
  onHelp?: () => void;
}

function ReportTypeCard({ option, selected, onSelect, onHelp }: ReportTypeCardProps) {
  const isDisabled = Boolean(option.comingSoon);

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onSelect}
      className={`${styles.card} ${selected ? styles.cardSelected : ''} ${
        isDisabled ? styles.cardDisabled : ''
      }`}
      aria-pressed={selected}
    >
      <Image
        src={option.iconSrc}
        alt=""
        width={56}
        height={56}
        className={styles.icon}
      />
      <span className={styles.textContainer}>
        <span className={styles.titleRow}>
          {option.title}
          {option.showHelp ? (
            <span
              className={styles.helpWrap}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              role="presentation"
            >
              <WuHelpButton
                idOrSlugOrUrl="crosstab-report"
                variant="primary"
                onClick={() => onHelp?.()}
              />
            </span>
          ) : null}
          {option.comingSoon ? (
            <span className={styles.comingSoonBadge}>Coming Soon</span>
          ) : null}
        </span>
        <span className={styles.description}>{option.description}</span>
      </span>
    </button>
  );
}

export function CreateReportModal({
  open,
  onOpenChange,
  defaultName,
  onCreate,
}: CreateReportModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<CreateReportWizardStep>('report');
  const [name, setName] = useState(defaultName);
  const [nameError, setNameError] = useState(false);
  const [reportType, setReportType] = useState<CreateReportTypeId>('crosstab');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);

  useEffect(() => {
    if (open) {
      setStep('report');
      setName(defaultName);
      setNameError(false);
      setReportType('crosstab');
      setSelectedSurvey(null);
    }
  }, [open, defaultName]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const selectedType = CREATE_REPORT_TYPE_OPTIONS.find((option) => option.id === reportType);
  const modalClassName = step === 'survey' ? styles.modalWide : styles.modal;

  function handleClose(): void {
    onOpenChange(false);
  }

  function handleReportContinue(): void {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    const option = CREATE_REPORT_TYPE_OPTIONS.find((item) => item.id === reportType);
    if (!option || option.comingSoon) {
      showToast({
        message: `${option?.title ?? 'This report type'} will be available in a future update.`,
        variant: 'info',
      });
      return;
    }
    setStep('survey');
  }

  function handleSurveyContinue(): void {
    if (!selectedSurvey) {
      showToast({
        message: 'Select a survey to continue.',
        variant: 'error',
      });
      return;
    }
    setStep('confirmation');
  }

  function handleCreate(): void {
    const trimmed = name.trim();
    if (!trimmed || !selectedSurvey) return;
    onCreate({
      name: trimmed,
      typeId: reportType,
      survey: selectedSurvey,
    });
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={modalClassName} variant="action">
      <WuModalHeader className={styles.modalTitle}>Create report</WuModalHeader>

      {step === 'report' ? (
        <WuModalContent>
          <div className={styles.reportContent}>
            <WuFormGroup
              Label={<WuLabel>Report Name</WuLabel>}
              Error={nameError ? 'Report name is required' : undefined}
              Input={
                <WuInput
                  variant="outlined"
                  placeholder={defaultName}
                  value={name}
                  autoFocus
                  maxLength={100}
                  onChange={(event) => {
                    if (nameError && event.target.value.trim()) setNameError(false);
                    setName(event.target.value);
                  }}
                />
              }
            />

            <div className={styles.typeGrid} role="group" aria-label="Report type">
              {CREATE_REPORT_TYPE_OPTIONS.map((option) => (
                <ReportTypeCard
                  key={option.id}
                  option={option}
                  selected={reportType === option.id}
                  onSelect={() => setReportType(option.id)}
                  onHelp={() =>
                    showToast({
                      message: option.helpMessage ?? option.description,
                      variant: 'success',
                    })
                  }
                />
              ))}
            </div>
          </div>
        </WuModalContent>
      ) : null}

      {step === 'survey' ? (
        <WuModalContent className={styles.surveyContent}>
          <AiDataSourceSelection
            selectedSurveyId={selectedSurvey?.id ?? null}
            onSelectSurvey={setSelectedSurvey}
          />
        </WuModalContent>
      ) : null}

      {step === 'confirmation' && selectedSurvey && selectedType ? (
        <WuModalContent>
          <div className={styles.confirmationPanel}>
            <h3 className={styles.confirmationTitle}>Confirm report details</h3>
            <p className={styles.confirmationCopy}>
              Review the report name, type, and survey before creating.
            </p>
            <div className={styles.confirmationMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Report name</span>
                <span className={styles.metaValue}>{name.trim()}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Report type</span>
                <span className={styles.metaValue}>{selectedType.title}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Survey</span>
                <span className={styles.metaValue}>{selectedSurvey.name}</span>
              </div>
            </div>
          </div>
        </WuModalContent>
      ) : null}

      <WuModalFooter>
        <div className={styles.footer}>
          <CreateReportStepBreadcrumb
            currentStep={step}
            onStepClick={(nextStep) => setStep(nextStep)}
          />
          <div className={styles.footerActions}>
            {step === 'report' ? (
              <>
                <WuButton variant="secondary" onClick={handleClose}>
                  Cancel
                </WuButton>
                <WuButton onClick={handleReportContinue}>Continue</WuButton>
              </>
            ) : null}
            {step === 'survey' ? (
              <>
                <WuButton variant="secondary" onClick={() => setStep('report')}>
                  Back
                </WuButton>
                <WuButton onClick={handleSurveyContinue}>Continue</WuButton>
              </>
            ) : null}
            {step === 'confirmation' ? (
              <>
                <WuButton variant="secondary" onClick={() => setStep('survey')}>
                  Back
                </WuButton>
                <WuButton onClick={handleCreate}>Create</WuButton>
              </>
            ) : null}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
