'use client';

import { useEffect, useMemo, useState } from 'react';
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
  CREATE_REPORT_CATEGORIES,
  CREATE_REPORT_TYPE_OPTIONS,
  getCreateReportTypeOption,
  type CreateReportTypeId,
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
  const [typeSearch, setTypeSearch] = useState('');
  const [reportType, setReportType] = useState<CreateReportTypeId>('crosstab');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);

  useEffect(() => {
    if (open) {
      setStep('report');
      setName(defaultName);
      setNameError(false);
      setTypeSearch('');
      setReportType('crosstab');
      setSelectedSurvey(null);
    }
  }, [open, defaultName]);

  const typeGroups = useMemo(() => {
    const term = typeSearch.trim().toLowerCase();
    const pool = CREATE_REPORT_TYPE_OPTIONS.filter(
      (option) => !term || option.title.toLowerCase().includes(term)
    );
    return CREATE_REPORT_CATEGORIES.map((category) => ({
      category,
      items: pool.filter((option) => option.category === category),
    })).filter((group) => group.items.length > 0);
  }, [typeSearch]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const selectedOption = getCreateReportTypeOption(reportType);
  const isSelectionBlocked = Boolean(selectedOption.comingSoon);

  function handleClose(): void {
    onOpenChange(false);
  }

  function handleReportContinue(): void {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    if (isSelectionBlocked) {
      showToast({
        message: `${selectedOption.title} will be available in a future update.`,
        variant: 'info',
      });
      return;
    }
    setStep('survey');
  }

  function handleCreate(): void {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    if (!selectedSurvey) {
      showToast({
        message: 'Select a survey to continue.',
        variant: 'error',
      });
      return;
    }
    onCreate({
      name: trimmed,
      typeId: reportType,
      survey: selectedSurvey,
    });
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action">
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

            <div className={styles.typePicker}>
              <div className={styles.typeList}>
                <div className={styles.typeSearch}>
                  <WuInput
                    variant="outlined"
                    placeholder="Search report types"
                    Icon={<span className="wm-search" />}
                    iconPosition="left"
                    value={typeSearch}
                    onChange={(event) => setTypeSearch(event.target.value)}
                  />
                </div>
                <div
                  className={styles.typeScroll}
                  role="listbox"
                  aria-label="Report type"
                >
                  {typeGroups.length === 0 ? (
                    <p className={styles.typeEmpty}>No report types match your search.</p>
                  ) : null}
                  {typeGroups.map((group) => (
                    <div key={group.category}>
                      <div className={styles.categoryLabel}>{group.category}</div>
                      {group.items.map((option) => {
                        const isSelected = option.id === reportType;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={`${styles.typeRow} ${
                              isSelected ? styles.typeRowSelected : ''
                            } ${option.comingSoon ? styles.typeRowDisabled : ''}`}
                            onClick={() => setReportType(option.id)}
                          >
                            <Image
                              src={option.iconSrc}
                              alt=""
                              width={26}
                              height={26}
                              className={styles.typeRowIcon}
                            />
                            <span
                              className={`${styles.typeRowTitle} ${
                                isSelected ? styles.typeRowTitleSelected : ''
                              }`}
                            >
                              {option.title}
                            </span>
                            {option.comingSoon ? (
                              <span className={`${styles.comingSoonBadge} ml-auto`}>
                                Coming Soon
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <aside className={styles.preview} aria-label="Report type details">
                <Image
                  src={selectedOption.iconSrc}
                  alt=""
                  width={56}
                  height={56}
                  className={styles.previewIcon}
                />
                <div className={styles.previewTitleRow}>
                  <h3 className={styles.previewTitle}>{selectedOption.title}</h3>
                  {selectedOption.comingSoon ? (
                    <span className={styles.comingSoonBadge}>Coming Soon</span>
                  ) : null}
                  {selectedOption.showHelp ? (
                    <span className={styles.helpWrap}>
                      <WuHelpButton
                        idOrSlugOrUrl="crosstab-report"
                        variant="primary"
                        onClick={() =>
                          showToast({
                            message:
                              selectedOption.helpMessage ?? selectedOption.description,
                            variant: 'success',
                          })
                        }
                      />
                    </span>
                  ) : null}
                </div>
                <div className={styles.previewCategory}>{selectedOption.category}</div>
                <p className={styles.previewDescription}>{selectedOption.description}</p>
                <div className={styles.needsBlock}>
                  <div className={styles.needsTitle}>What you&apos;ll need</div>
                  {selectedOption.needs.map((need) => (
                    <div key={need} className={styles.needsItem}>
                      <span className={styles.needsDot} aria-hidden />
                      {need}
                    </div>
                  ))}
                </div>
              </aside>
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
                <WuButton onClick={handleReportContinue} disabled={isSelectionBlocked}>
                  Continue
                </WuButton>
              </>
            ) : (
              <>
                <WuButton variant="secondary" onClick={() => setStep('report')}>
                  Back
                </WuButton>
                <WuButton onClick={handleCreate} disabled={!selectedSurvey}>
                  Create
                </WuButton>
              </>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
