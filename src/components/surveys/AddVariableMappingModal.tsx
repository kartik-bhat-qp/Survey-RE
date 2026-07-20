'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  downloadVariableMappingTemplate,
  IMPORT_VARIABLE_MAPPING_STEPS,
  VARIABLE_MAPPING_SOURCE_SURVEYS,
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
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
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
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [sourceSurvey, setSourceSurvey] = useState<
    (typeof VARIABLE_MAPPING_SOURCE_SURVEYS)[number] | null
  >(null);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (!open) return;
    setActiveTab('import');
    setSkipHeader(true);
    setOverrideExisting(false);
    setSelectedFileName(null);
    setSourceSurvey(null);
    setPasteText('');
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
    if (activeTab === 'import') {
      if (!selectedFileName) {
        showToast({ message: 'Choose a file to import', variant: 'info' });
        return;
      }
      showToast({
        message: `Imported ${selectedFileName}${skipHeader ? ' (header skipped)' : ''}${
          overrideExisting ? ' — existing mappings overridden' : ''
        }`,
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
        message: `Mappings copied from ${sourceSurvey.label}`,
        variant: 'success',
      });
      onImported?.();
      onOpenChange(false);
      return;
    }

    if (!pasteText.trim()) {
      showToast({ message: 'Paste mapping data to continue', variant: 'info' });
      return;
    }
    showToast({ message: 'Paste mapping imported', variant: 'success' });
    onImported?.();
    onOpenChange(false);
  }

  const primaryLabel =
    activeTab === 'import' ? 'Import' : activeTab === 'copy-survey' ? 'Copy' : 'Import';

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

            <div className={styles.overrideRow}>
              <WuToggle
                Label="Override existing mapping"
                labelPosition="left"
                checked={overrideExisting}
                onChange={setOverrideExisting}
              />
            </div>
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
          <p className={styles.copySurveyCopy}>
            Paste mappings as CSV lines: Custom Variable, Display Name, Code.
          </p>
          <WuTextarea
            value={pasteText}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setPasteText(event.target.value)
            }
            placeholder={'Custom 1,Name,name\nCustom 2,Profile,profile'}
            className={styles.pasteArea}
            rows={8}
          />
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
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton onClick={handlePrimaryAction}>{primaryLabel}</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
