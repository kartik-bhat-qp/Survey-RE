'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  downloadVariableMappingTemplate,
  COPY_PASTE_VARIABLE_MAPPING_FORMAT,
  COPY_PASTE_VARIABLE_MAPPING_PLACEHOLDER,
  IMPORT_VARIABLE_MAPPING_STEPS,
  VARIABLE_MAPPING_SOURCE_SURVEYS,
  validateCopyPasteVariableMapping,
  type AddVariableMappingTabId,
} from '@/data/mock-survey-variables';
import styles from './AddVariableMappingModal.module.css';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);

interface AddVariableMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

export function AddVariableMappingModal({
  open,
  onOpenChange,
  onImported,
}: AddVariableMappingModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AddVariableMappingTabId>('import');
  const [skipHeader, setSkipHeader] = useState(true);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [sourceSurvey, setSourceSurvey] = useState<
    (typeof VARIABLE_MAPPING_SOURCE_SURVEYS)[number] | null
  >(null);
  const [pasteText, setPasteText] = useState('');
  const [copyOverrideAcknowledged, setCopyOverrideAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab('import');
    setSkipHeader(true);
    setSelectedFileName(null);
    setSourceSurvey(null);
    setPasteText('');
    setCopyOverrideAcknowledged(false);
  }, [open]);

  function handleBrowseClick(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setSelectedFileName(file?.name ?? null);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
  }

  function handleDownloadTemplate(): void {
    downloadVariableMappingTemplate();
    showToast({ message: 'Template downloaded', variant: 'success' });
  }

  function handlePrimaryAction(): void {
    if (!copyOverrideAcknowledged) {
      showToast({
        message: 'Confirm that copy mapping will override existing mapping',
        variant: 'info',
      });
      return;
    }

    if (activeTab === 'import') {
      if (!selectedFileName) {
        showToast({ message: 'Choose a file to import', variant: 'info' });
        return;
      }
      showToast({
        message: `Imported ${selectedFileName}${skipHeader ? ' (header skipped)' : ''} — existing mappings overridden`,
        variant: 'success',
      });
      onImported?.();
      onOpenChange(false);
      return;
    }

    if (activeTab === 'copy-survey') {
      if (!sourceSurvey) {
        showToast({ message: 'Select a survey to copy from', variant: 'info' });
        return;
      }
      showToast({
        message: `Mappings copied from ${sourceSurvey.label} — existing mappings overridden`,
        variant: 'success',
      });
      onImported?.();
      onOpenChange(false);
      return;
    }

    const formatError = validateCopyPasteVariableMapping(pasteText);
    if (formatError) {
      showToast({
        message: formatError,
        variant: formatError === 'Paste mapping data to continue' ? 'info' : 'error',
      });
      return;
    }
    showToast({ message: 'Paste mapping imported', variant: 'success' });
    onImported?.();
    onOpenChange(false);
  }

  const primaryLabel =
    activeTab === 'import' ? 'Import' : activeTab === 'copy-survey' ? 'Copy' : 'Save';

  const primaryDisabled =
    !copyOverrideAcknowledged ||
    (activeTab === 'copy-survey' && !sourceSurvey);

  const tabs: IWuTabItem[] = [
    {
      value: 'import',
      Trigger: 'Import Variable Mapping',
      Content: (
        <div className={styles.importLayout}>
          <div className={styles.importLeft}>
            <div
              className={styles.dropzone}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className={`wm-cloud-upload ${styles.dropzoneIcon}`} aria-hidden />
              <p className={styles.dropzoneText}>
                Drag your file here or{' '}
                <button type="button" className={styles.browseLink} onClick={handleBrowseClick}>
                  browse
                </button>
              </p>
              {selectedFileName ? (
                <p className={styles.selectedFile}>{selectedFileName}</p>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
            </div>

            <label className={styles.checkboxRow}>
              <WuCheckbox
                checked={skipHeader}
                onChange={(checked) => setSkipHeader(checked)}
              />
              <span>Skip First Line (Header)</span>
            </label>
          </div>

          <div className={styles.importRight}>
            <h3 className={styles.instructionsTitle}>To import variable mapping from file</h3>
            <ol className={styles.instructionsList}>
              {IMPORT_VARIABLE_MAPPING_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <button
              type="button"
              className={styles.templateLink}
              onClick={handleDownloadTemplate}
            >
              <span className={`wm-description ${styles.templateIcon}`} aria-hidden />
              <span className={styles.templateLabel}>Download template</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      value: 'copy-survey',
      Trigger: 'Copy from Survey',
      Content: (
        <div className={styles.copySurvey}>
          <p className={styles.copySurveyCopy}>
            Choose a survey to copy its system variable mappings into this survey.
          </p>
          <div className={styles.surveySelect}>
            <WuSelect
              data={[...VARIABLE_MAPPING_SOURCE_SURVEYS]}
              accessorKey={{ value: 'id', label: 'label' }}
              value={sourceSurvey}
              placeholder="Select survey"
              onSelect={(item) =>
                setSourceSurvey(item as (typeof VARIABLE_MAPPING_SOURCE_SURVEYS)[number])
              }
              variant="outlined"
            />
          </div>
        </div>
      ),
    },
    {
      value: 'copy-paste',
      Trigger: 'Copy/Paste Mapping',
      Content: (
        <div className={styles.copyPaste}>
          <WuTextarea
            value={pasteText}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setPasteText(event.target.value)
            }
            placeholder={COPY_PASTE_VARIABLE_MAPPING_PLACEHOLDER}
            className={styles.pasteArea}
            rows={10}
            aria-label="Paste variable mapping"
          />
          <p className={styles.pasteFormat}>
            Format: {COPY_PASTE_VARIABLE_MAPPING_FORMAT}
          </p>
        </div>
      ),
    },
  ];

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Add Variable Mapping</span>
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.tabs}>
          <WuTab
            items={tabs}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AddVariableMappingTabId)}
          />
        </div>
      </WuModalContent>

      <WuModalFooter>
        <div className={styles.footer}>
          <label className={styles.footerCheckbox}>
            <WuCheckbox
              checked={copyOverrideAcknowledged}
              onChange={(checked) => setCopyOverrideAcknowledged(checked)}
            />
            <span>
              I understand that copy mapping will override the existing mapping.
            </span>
          </label>
          <div className={styles.footerActions}>
            <WuModalClose variant="secondary">Cancel</WuModalClose>
            <WuButton onClick={handlePrimaryAction} disabled={primaryDisabled}>
              {primaryLabel}
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
