'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import { CreateDatasetStepBreadcrumb } from '@/components/datasets/CreateDatasetStepBreadcrumb';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DATASET_SUBTYPE_OPTIONS,
  type CreateDatasetWizardStep,
  type DatasetSubTypeId,
} from '@/data/mock-create-dataset';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import { PUBLIC_IMAGES } from '@/lib/public-images';
import styles from './CreateDatasetsModal.module.css';

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

export type DatasetCreateType = 'fresh' | 'map';

interface CreateDatasetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DatasetTypeCardProps {
  selected: boolean;
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  onSelect: () => void;
}

function DatasetTypeCard({
  selected,
  iconSrc,
  iconAlt,
  title,
  description,
  onSelect,
}: DatasetTypeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      aria-pressed={selected}
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={64}
        height={64}
        className={styles.icon}
      />
      <div className={styles.textContainer}>
        <div className={styles.title}>{title}</div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export function CreateDatasetsModal({ open, onOpenChange }: CreateDatasetsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CreateDatasetWizardStep>('type');
  const [createType, setCreateType] = useState<DatasetCreateType>('fresh');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);
  const [datasourceName, setDatasourceName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [subType, setSubType] = useState<DatasetSubTypeId>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setStep('type');
      setCreateType('fresh');
      setSelectedSurvey(null);
      setDatasourceName('');
      setNameError(false);
      setSubType('import');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const modalClassName =
    step === 'datasource' || step === 'subtype' ? styles.modalWide : styles.modal;
  const showStepper = createType === 'map' && step !== 'type';

  function handleClose(): void {
    onOpenChange(false);
  }

  function handleTypeNext(): void {
    if (createType === 'map') {
      setStep('datasource');
      return;
    }
    showToast({
      message: 'Fresh Data setup will be available in a future update.',
      variant: 'info',
    });
    onOpenChange(false);
  }

  function handleDatasourceNext(): void {
    if (!selectedSurvey) {
      showToast({
        message: 'Select a survey to continue.',
        variant: 'error',
      });
      return;
    }
    setDatasourceName(selectedSurvey.name);
    setNameError(false);
    setSubType('import');
    setStep('subtype');
  }

  function handleSubtypeNext(): void {
    const trimmed = datasourceName.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    if (subType === 'import') {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setStep('upload');
      return;
    }
    const label = DATASET_SUBTYPE_OPTIONS.find((option) => option.id === subType)?.title;
    showToast({
      message: `"${trimmed}" created as ${label} dataset from "${selectedSurvey?.name}".`,
      variant: 'success',
    });
    onOpenChange(false);
  }

  function handleUploadCreate(): void {
    if (!selectedFile) {
      showToast({
        message: 'Select a file to continue.',
        variant: 'error',
      });
      return;
    }
    showToast({
      message: `"${datasourceName.trim()}" created from "${selectedFile.name}".`,
      variant: 'success',
    });
    onOpenChange(false);
  }

  function handleBack(): void {
    if (step === 'datasource') {
      setStep('type');
      return;
    }
    if (step === 'subtype') {
      setStep('datasource');
      return;
    }
    if (step === 'upload') {
      setStep('subtype');
    }
  }

  function handleStepClick(target: CreateDatasetWizardStep): void {
    const order: CreateDatasetWizardStep[] = ['type', 'datasource', 'subtype', 'upload'];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(target);
    if (targetIndex >= 0 && targetIndex < currentIndex) {
      setStep(target);
    }
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={modalClassName} variant="action">
      <WuModalHeader className={styles.modalTitle}>Create Datasets</WuModalHeader>

      {step === 'type' ? (
        <WuModalContent className="!overflow-hidden !min-h-0">
          <div className={styles.typeGrid}>
            <DatasetTypeCard
              selected={createType === 'fresh'}
              iconSrc={PUBLIC_IMAGES.createDataset.freshData}
              iconAlt="Fresh Data"
              title="Fresh Data"
              description="Import an entirely new dataset"
              onSelect={() => setCreateType('fresh')}
            />
            <DatasetTypeCard
              selected={createType === 'map'}
              iconSrc={PUBLIC_IMAGES.createDataset.mapToSurvey}
              iconAlt="Map to survey"
              title="Map to survey"
              description="Map the survey responses with additional data"
              onSelect={() => setCreateType('map')}
            />
          </div>
        </WuModalContent>
      ) : null}

      {step === 'datasource' ? (
        <WuModalContent className={styles.surveyContent}>
          <AiDataSourceSelection
            selectedSurveyId={selectedSurvey?.id ?? null}
            onSelectSurvey={setSelectedSurvey}
          />
        </WuModalContent>
      ) : null}

      {step === 'subtype' ? (
        <WuModalContent>
          <div className={styles.subtypeContent}>
            <WuFormGroup
              Label={
                <WuLabel>
                  Datasource name <span className={styles.required}>*</span>
                </WuLabel>
              }
              Error={nameError ? 'Datasource name is required' : undefined}
              Input={
                <WuInput
                  variant="outlined"
                  value={datasourceName}
                  autoFocus
                  maxLength={100}
                  onChange={(event) => {
                    if (nameError && event.target.value.trim()) setNameError(false);
                    setDatasourceName(event.target.value);
                  }}
                />
              }
            />

            <div className={styles.subtypeGrid} role="group" aria-label="Datasource sub type">
              {DATASET_SUBTYPE_OPTIONS.map((option) => (
                <DatasetTypeCard
                  key={option.id}
                  selected={subType === option.id}
                  iconSrc={option.iconSrc}
                  iconAlt={option.title}
                  title={option.title}
                  description={option.description}
                  onSelect={() => setSubType(option.id)}
                />
              ))}
            </div>
          </div>
        </WuModalContent>
      ) : null}

      {step === 'upload' ? (
        <WuModalContent>
          <div className={styles.uploadContent}>
            <p className={styles.uploadHint}>
              Upload a file to map external data to &ldquo;{datasourceName.trim()}&rdquo;.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              className={styles.fileInput}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
              }}
            />
            <div className={styles.uploadActions}>
              <WuButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                Icon={<span className="wm-upload" />}
              >
                Choose file
              </WuButton>
              <span className={styles.fileName}>
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
            </div>
          </div>
        </WuModalContent>
      ) : null}

      <WuModalFooter>
        <div className={styles.footer}>
          {showStepper ? (
            <CreateDatasetStepBreadcrumb
              currentStep={step}
              onStepClick={handleStepClick}
            />
          ) : (
            <span />
          )}
          <div className={styles.footerActions}>
            {step === 'type' ? (
              <>
                <WuButton variant="secondary" onClick={handleClose}>
                  Cancel
                </WuButton>
                <WuButton onClick={handleTypeNext}>Next</WuButton>
              </>
            ) : null}
            {step === 'datasource' ? (
              <>
                <WuButton variant="secondary" onClick={handleBack}>
                  Back
                </WuButton>
                <WuButton onClick={handleDatasourceNext} disabled={!selectedSurvey}>
                  Next
                </WuButton>
              </>
            ) : null}
            {step === 'subtype' ? (
              <>
                <WuButton variant="secondary" onClick={handleBack}>
                  Back
                </WuButton>
                <WuButton onClick={handleSubtypeNext}>Next</WuButton>
              </>
            ) : null}
            {step === 'upload' ? (
              <>
                <WuButton variant="secondary" onClick={handleBack}>
                  Back
                </WuButton>
                <WuButton onClick={handleUploadCreate} disabled={!selectedFile}>
                  Create
                </WuButton>
              </>
            ) : null}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
