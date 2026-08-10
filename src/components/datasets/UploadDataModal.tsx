'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { MOCK_TEXT_AI_DASHBOARDS } from '@/data/mock-text-ai-dashboards';
import styles from './UploadDataModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

export type UploadSource = 'manual' | 'textai';
export type UploadMode = 'reupload' | 'upsert';
export type UploadFileType = 'excel' | 'csv';

interface UploadDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  initialSource?: UploadSource;
  /** When false, hide Manual/TextAI picker and lock to initialSource. */
  showSourcePicker?: boolean;
  /** When false, hide Reupload/Upsert (first-time import). */
  showUploadMode?: boolean;
  onManualImport?: (fileName: string) => void;
  onTextAiImport?: () => void;
}

interface SourceCardProps {
  selected: boolean;
  iconClass: string;
  title: string;
  description: string;
  onSelect: () => void;
}

function SourceCard({ selected, iconClass, title, description, onSelect }: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${styles.sourceCard} ${selected ? styles.sourceCardSelected : ''}`}
      aria-pressed={selected}
    >
      <span className={`${iconClass} ${styles.sourceIcon}`} aria-hidden />
      <span className={styles.sourceText}>
        <span className={styles.sourceTitle}>{title}</span>
        <span className={styles.sourceDescription}>{description}</span>
      </span>
    </button>
  );
}

function SegmentedToggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.modeToggle} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            value === option.value ? styles.modeToggleActive : styles.modeToggleInactive
          }
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const UPLOAD_MODE_HELP =
  'Reupload replaces existing data. Upsert updates matching rows and adds new ones.';
const TEMPLATE_HELP =
  'Download the template, fill in your data, then upload the saved file.';

const TEXT_AI_OPTIONS = MOCK_TEXT_AI_DASHBOARDS.map((dashboard) => ({
  label: dashboard.name,
  value: String(dashboard.id),
}));

type TextAiOption = (typeof TEXT_AI_OPTIONS)[number];

export function UploadDataModal({
  open,
  onOpenChange,
  datasetName,
  initialSource = 'manual',
  showSourcePicker = true,
  showUploadMode = true,
  onManualImport,
  onTextAiImport,
}: UploadDataModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<UploadSource>(initialSource);
  const [uploadMode, setUploadMode] = useState<UploadMode>('upsert');
  const [fileType, setFileType] = useState<UploadFileType>('excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textAiOption, setTextAiOption] = useState<TextAiOption | null>(null);

  useEffect(() => {
    if (open) {
      setSource(initialSource);
      setUploadMode('upsert');
      setFileType('excel');
      setSelectedFile(null);
      setTextAiOption(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open, initialSource]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const activeSource = showSourcePicker ? source : initialSource;
  const accept = fileType === 'excel' ? '.xls,.xlsx' : '.csv';
  const canUpdate =
    activeSource === 'manual' ? Boolean(selectedFile) : Boolean(textAiOption);
  const fileTypeStep = showUploadMode ? 2 : 1;
  const downloadStep = showUploadMode ? 3 : 2;
  const fillStep = showUploadMode ? 4 : 3;
  const uploadStep = showUploadMode ? 5 : 4;

  function handleDownloadTemplate(): void {
    const extension = fileType === 'excel' ? 'xlsx' : 'csv';
    showToast({
      message: `Template (${extension}) download started.`,
      variant: 'success',
    });
  }

  function handleChooseFile(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  function handleUpdate(): void {
    if (activeSource === 'manual') {
      if (!selectedFile) return;
      onManualImport?.(selectedFile.name);
      showToast({
        message: `"${selectedFile.name}" uploaded to "${datasetName}".`,
        variant: 'success',
      });
    } else {
      if (!textAiOption) return;
      onTextAiImport?.();
      showToast({
        message: `TextAI data from "${textAiOption.label}" is processing.`,
        variant: 'success',
      });
    }
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action">
      <WuModalHeader className={styles.modalTitle}>
        {activeSource === 'textai' && !showSourcePicker ? 'Import TextAI data' : 'Upload data'}
      </WuModalHeader>
      <WuModalContent>
        <div className={styles.content}>
          {showSourcePicker ? (
            <div className={styles.sourceGrid} role="group" aria-label="Upload source">
              <SourceCard
                selected={source === 'manual'}
                iconClass="wm-description"
                title="Manual"
                description="Upload a file using the template"
                onSelect={() => setSource('manual')}
              />
              <SourceCard
                selected={source === 'textai'}
                iconClass="wc-ai"
                title="TextAI"
                description="Import the themes, sub-themes and sentiment for this dataset"
                onSelect={() => setSource('textai')}
              />
            </div>
          ) : null}

          {activeSource === 'manual' ? (
            <>
              {showUploadMode ? (
                <div className={styles.stepRow}>
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>Step 1</span>
                    <span className={styles.stepInstruction}>Select upload mode</span>
                    <WuTooltip content={UPLOAD_MODE_HELP} position="top">
                      <button
                        type="button"
                        className={styles.infoButton}
                        aria-label="Upload mode help"
                      >
                        <span className="wm-info" aria-hidden />
                      </button>
                    </WuTooltip>
                  </div>
                  <SegmentedToggle
                    label="Upload mode"
                    value={uploadMode}
                    onChange={setUploadMode}
                    options={[
                      { value: 'reupload', label: 'Reupload' },
                      { value: 'upsert', label: 'Upsert' },
                    ]}
                  />
                </div>
              ) : null}

              <div className={styles.stepRow}>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Step {fileTypeStep}</span>
                  <span className={styles.stepInstruction}>Select file type.</span>
                </div>
                <SegmentedToggle
                  label="File type"
                  value={fileType}
                  onChange={(next) => {
                    setFileType(next);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  options={[
                    { value: 'excel', label: 'Excel' },
                    { value: 'csv', label: 'CSV' },
                  ]}
                />
              </div>

              <div className={styles.stepRow}>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Step {downloadStep}</span>
                  <span className={styles.stepInstruction}>Download template file.</span>
                  <WuTooltip content={TEMPLATE_HELP} position="top">
                    <button type="button" className={styles.infoButton} aria-label="Template help">
                      <span className="wm-info" aria-hidden />
                    </button>
                  </WuTooltip>
                </div>
                <button
                  type="button"
                  className={styles.downloadButton}
                  aria-label="Download template file"
                  onClick={handleDownloadTemplate}
                >
                  <span className="wm-download" aria-hidden />
                </button>
              </div>

              <div className={styles.stepRow}>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Step {fillStep}</span>
                  <span className={styles.stepInstruction}>
                    Fill data in the downloaded template file and save it.
                  </span>
                </div>
              </div>

              <div className={styles.stepRow}>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>Step {uploadStep}</span>
                  <span className={styles.stepInstruction}>
                    Select the saved template file and click &apos;Upload&apos; button.
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className={styles.hiddenInput}
                onChange={handleFileChange}
                aria-hidden
                tabIndex={-1}
              />

              <button
                type="button"
                className={`${styles.dropzone} ${selectedFile ? styles.dropzoneHasFile : ''}`}
                onClick={handleChooseFile}
              >
                <span className={`wm-cloud-upload ${styles.dropzoneIcon}`} aria-hidden />
                <span className={styles.fileName}>
                  {selectedFile ? selectedFile.name : 'Choose File to Upload'}
                </span>
              </button>
              <p className={styles.supportedFiles}>Files supported: .xls, .xlsx, .csv</p>
            </>
          ) : (
            <div className={styles.textAiPanel}>
              <p className={styles.textAiDescription}>
                Choose a TextAI dashboard to import the themes, sub-themes and sentiment for
                this dataset.
              </p>
              <WuCombobox
                data={TEXT_AI_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={textAiOption}
                onSelect={(item) => {
                  if (!item || Array.isArray(item)) return;
                  setTextAiOption(item as TextAiOption);
                }}
                placeholder="Select TextAI dashboard"
                variant="outlined"
                enableSearch
                maxHeight={280}
                noDataContent="No TextAI dashboards found"
                aria-label="Select TextAI dashboard"
              />
            </div>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton onClick={handleUpdate} disabled={!canUpdate}>
          {activeSource === 'textai'
            ? 'Import'
            : showUploadMode
              ? 'Update'
              : 'Upload'}
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
