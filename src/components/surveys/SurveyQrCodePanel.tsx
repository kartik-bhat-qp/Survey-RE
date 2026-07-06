'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  buildSurveyUrlWithVariables,
  copyBrandedQrCodeToClipboard,
  createManualQrEntry,
  createQrVariable,
  downloadBulkTemplateCsv,
  getNextQrVariableName,
  getQrCodeImageUrl,
  mockDownloadManualQrCodes,
  mockDownloadQrCodeZip,
  parseBulkQrImportFile,
  QR_BULK_IMPORT_ACCEPT,
  QR_LOGO_PATH,
  QR_VARIABLE_NAME_OPTIONS,
  SAMPLE_QR_VARIABLES,
  type BulkQrImportSummary,
  type ManualQrEntry,
  type QrCodeModalMode,
  type QrUrlVariable,
} from '@/data/mock-survey-qr-code';
import styles from './SurveyQrCodePanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface SurveyQrCodePanelProps {
  baseSurveyUrl: string;
}

function createInitialVariables(): QrUrlVariable[] {
  return SAMPLE_QR_VARIABLES.map((variable) => createQrVariable(variable));
}

function getDefaultDraftName(savedCount: number): string {
  return `QR code ${savedCount + 1}`;
}

export function SurveyQrCodePanel({ baseSurveyUrl }: SurveyQrCodePanelProps) {
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<QrCodeModalMode>('manual');
  const [savedQrs, setSavedQrs] = useState<ManualQrEntry[]>([]);
  const [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(() => getDefaultDraftName(0));
  const [draftVariables, setDraftVariables] = useState<QrUrlVariable[]>(createInitialVariables);
  const [bulkSummary, setBulkSummary] = useState<BulkQrImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyingQrKey, setCopyingQrKey] = useState<string | null>(null);

  const draftUrl = useMemo(
    () => buildSurveyUrlWithVariables(baseSurveyUrl, draftVariables),
    [baseSurveyUrl, draftVariables]
  );

  const draftQrImageUrl = useMemo(() => getQrCodeImageUrl(draftUrl), [draftUrl]);

  function updateDraftVariable(
    id: string,
    patch: Partial<Pick<QrUrlVariable, 'name' | 'value'>>
  ): void {
    setDraftVariables((current) =>
      current.map((variable) => (variable.id === id ? { ...variable, ...patch } : variable))
    );
  }

  function addDraftVariable(): void {
    setDraftVariables((current) => [
      ...current,
      createQrVariable({ name: getNextQrVariableName(current.map((variable) => variable.name)) }),
    ]);
  }

  function getVariableNameOptions(variable: QrUrlVariable, allVariables: QrUrlVariable[]) {
    return QR_VARIABLE_NAME_OPTIONS.filter(
      (option) =>
        option.value === variable.name ||
        !allVariables.some((entry) => entry.id !== variable.id && entry.name === option.value)
    );
  }

  function getSelectedVariableNameOption(variable: QrUrlVariable) {
    return (
      QR_VARIABLE_NAME_OPTIONS.find((option) => option.value === variable.name) ??
      QR_VARIABLE_NAME_OPTIONS[0]
    );
  }

  function removeDraftVariable(id: string): void {
    setDraftVariables((current) =>
      current.length === 1 ? current : current.filter((variable) => variable.id !== id)
    );
  }

  function handleCreateNewQr(): void {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      showToast({ message: 'Enter a name for this QR code', variant: 'error' });
      return;
    }

    const entry = createManualQrEntry(baseSurveyUrl, trimmedName, draftVariables);
    setSavedQrs((current) => [...current, entry]);
    setExpandedSavedId(null);
    setDraftName(getDefaultDraftName(savedQrs.length + 1));
    setDraftVariables(createInitialVariables());
    showToast({ message: `"${entry.name}" saved`, variant: 'success' });
  }

  function toggleSavedQrExpanded(id: string): void {
    setExpandedSavedId((current) => (current === id ? null : id));
  }

  function collectDownloadableEntries(): ManualQrEntry[] {
    const entries = [...savedQrs];
    const trimmedName = draftName.trim();
    if (trimmedName) {
      entries.push(createManualQrEntry(baseSurveyUrl, trimmedName, draftVariables));
    }
    return entries;
  }

  async function copyTextToClipboard(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: successMessage, variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy URL', variant: 'error' });
    }
  }

  async function handleCopyUrl(url: string): Promise<void> {
    await copyTextToClipboard(url, 'Survey URL copied');
  }

  async function handleCopyQrImage(url: string, copyKey: string): Promise<void> {
    if (copyingQrKey) return;

    setCopyingQrKey(copyKey);
    try {
      await copyBrandedQrCodeToClipboard(url);
      showToast({ message: 'QR code copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy QR code', variant: 'error' });
    } finally {
      setCopyingQrKey(null);
    }
  }

  async function handleDownloadManualQrs(): Promise<void> {
    const entries = collectDownloadableEntries();
    if (entries.length === 0) {
      showToast({ message: 'Create at least one QR code before downloading', variant: 'error' });
      return;
    }

    setIsDownloading(true);
    try {
      await mockDownloadManualQrCodes(entries);
      showToast({
        message:
          entries.length === 1
            ? 'QR code downloaded'
            : `Downloading ZIP with ${entries.length} QR codes`,
        variant: 'success',
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to download QR codes',
        variant: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  }

  function handleTemplateDownload(): void {
    downloadBulkTemplateCsv();
    showToast({ message: 'Bulk import template downloaded', variant: 'success' });
  }

  async function handleBulkFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const summary = await parseBulkQrImportFile(file, baseSurveyUrl);
      setBulkSummary(summary);
      showToast({
        message: `Imported ${summary.urlCount} rows with ${summary.variablesPerUrl} variables each`,
        variant: 'success',
      });
    } catch (error) {
      setBulkSummary(null);
      showToast({
        message: error instanceof Error ? error.message : 'Unable to import file',
        variant: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDownloadZip(): Promise<void> {
    if (!bulkSummary) {
      showToast({ message: 'Import a file to generate QR codes', variant: 'error' });
      return;
    }

    setIsDownloading(true);
    try {
      await mockDownloadQrCodeZip(bulkSummary);
      showToast({
        message: `Downloading ZIP with ${bulkSummary.urlCount} QR codes`,
        variant: 'success',
      });
    } catch {
      showToast({ message: 'Unable to download ZIP file', variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  }

  function renderQrPreview(
    surveyUrl: string,
    qrImageUrl: string,
    copyKey: string
  ): React.ReactNode {
    const isCopying = copyingQrKey === copyKey;

    return (
      <div className={styles.previewPanel}>
        <div className={styles.qrPreview}>
          <button
            type="button"
            className={styles.qrImageButton}
            aria-label="Copy QR code to clipboard"
            disabled={isCopying}
            onClick={() => void handleCopyQrImage(surveyUrl, copyKey)}
          >
            <div className={styles.qrImageWrap}>
              <img src={qrImageUrl} alt="" className={styles.qrImage} width={144} height={144} />
              <div className={styles.qrLogoBadge} aria-hidden>
                <img src={QR_LOGO_PATH} alt="" className={styles.qrLogoImage} />
              </div>
            </div>
            <span className={styles.qrCopyHint}>
              {isCopying ? 'Copying…' : 'Click to copy QR code'}
            </span>
          </button>
        </div>
        <div>
          <span className={styles.urlPreviewLabel}>Generated survey URL</span>
          <div className={styles.urlPreviewField}>
            <span className={styles.urlPreviewText}>{surveyUrl}</span>
            <button
              type="button"
              className={styles.urlCopyBtn}
              aria-label="Copy generated survey URL"
              onClick={() => void handleCopyUrl(surveyUrl)}
            >
              <span className="wm-content-copy" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderVariableEditor(
    variables: QrUrlVariable[],
    onUpdate: (id: string, patch: Partial<Pick<QrUrlVariable, 'name' | 'value'>>) => void,
    onAdd: () => void,
    onRemove: (id: string) => void
  ): React.ReactNode {
    return (
      <>
        <p className={styles.sectionTitle}>Survey variables</p>
        <div className={styles.variableTable}>
          <div className={styles.variableRow}>
            <span className={styles.variableHeader}>Variable name</span>
            <span className={styles.variableHeader}>Value</span>
            <span className={styles.variableHeader} aria-hidden />
          </div>
          {variables.map((variable) => (
            <div key={variable.id} className={styles.variableRow}>
              <WuSelect
                className={styles.variableNameSelect}
                data={getVariableNameOptions(variable, variables)}
                accessorKey={{ value: 'value', label: 'label' }}
                value={getSelectedVariableNameOption(variable)}
                onSelect={(item) =>
                  onUpdate(variable.id, {
                    name: (item as (typeof QR_VARIABLE_NAME_OPTIONS)[number]).value,
                  })
                }
                variant="outlined"
              />
              <WuInput
                value={variable.value}
                onChange={(event) => onUpdate(variable.id, { value: event.target.value })}
                placeholder="Value"
                variant="outlined"
              />
              <button
                type="button"
                className={styles.removeVarBtn}
                aria-label={`Remove ${variable.name || 'variable'}`}
                onClick={() => onRemove(variable.id)}
                disabled={variables.length === 1}
              >
                <span className="wm-close" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.addVarBtn} onClick={onAdd}>
          + Add variable
        </button>
      </>
    );
  }

  const manualDownloadCount = collectDownloadableEntries().length;

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.title}>QR codes</h2>
          <p className={styles.intro}>
            Name and generate QR codes from a survey URL with variables, or import a CSV of
            variables for this survey and download QR codes in bulk.
          </p>
        </header>

        <div className={styles.modeTabs} role="tablist" aria-label="QR code generation mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            className={`${styles.modeTab} ${mode === 'manual' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('manual')}
          >
            Manual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bulk'}
            className={`${styles.modeTab} ${mode === 'bulk' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('bulk')}
          >
            Bulk import
          </button>
        </div>

        {mode === 'manual' ? (
          <div className={styles.manualPanel} role="tabpanel">
            {savedQrs.length > 0 ? (
              <div className={styles.savedQrList}>
                {savedQrs.map((entry) => {
                  const isExpanded = expandedSavedId === entry.id;
                  const qrImageUrl = getQrCodeImageUrl(entry.surveyUrl);

                  return (
                    <div key={entry.id} className={styles.savedQrCard}>
                      <button
                        type="button"
                        className={styles.savedQrHeader}
                        aria-expanded={isExpanded}
                        onClick={() => toggleSavedQrExpanded(entry.id)}
                      >
                        <span className={`wm-qr-code-2 ${styles.savedQrIcon}`} aria-hidden />
                        <span className={styles.savedQrName}>{entry.name}</span>
                        <span className={styles.savedQrMeta}>
                          {entry.cid ? `cid: ${entry.cid}` : 'Base survey URL'}
                        </span>
                        <span
                          className={`${isExpanded ? 'wm-chevron-down' : 'wm-chevron-right'} ${styles.savedQrChevron}`}
                          aria-hidden
                        />
                      </button>
                      {isExpanded ? (
                        <div className={styles.savedQrBody}>
                          {renderQrPreview(entry.surveyUrl, qrImageUrl, entry.id)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className={styles.activeQrCard}>
              <p className={styles.activeQrTitle}>New QR code</p>

              <label className={styles.nameLabel} htmlFor="qr-code-name">
                QR code name
              </label>
              <WuInput
                id="qr-code-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="e.g. Store front display"
                variant="outlined"
              />

              {renderVariableEditor(
                draftVariables,
                updateDraftVariable,
                addDraftVariable,
                removeDraftVariable
              )}

              {renderQrPreview(draftUrl, draftQrImageUrl, 'draft')}

              <div className={styles.activeQrFooter}>
                <WuButton
                  onClick={() => void handleDownloadManualQrs()}
                  disabled={manualDownloadCount === 0 || isDownloading}
                >
                  {isDownloading
                    ? 'Preparing download…'
                    : manualDownloadCount <= 1
                      ? 'Download QR code'
                      : 'Download QR codes'}
                </WuButton>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.bulkPanel} role="tabpanel">
            <div className={styles.uploadBox}>
              <span className={`wm-upload-file ${styles.uploadIcon}`} aria-hidden />
              <p className={styles.uploadTitle}>Import variables</p>
              <p className={styles.uploadHint}>
                Upload a CSV with one row per QR code and one column per variable. Each row
                generates a QR code for this survey using the values in that row.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={QR_BULK_IMPORT_ACCEPT}
                className={styles.hiddenFileInput}
                aria-hidden
                tabIndex={-1}
                onChange={(event) => void handleBulkFileChange(event)}
              />
              <WuButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? 'Importing…' : 'Choose file'}
              </WuButton>
              <button type="button" className={styles.templateLink} onClick={handleTemplateDownload}>
                Download template CSV
              </button>
            </div>

            {bulkSummary ? (
              <p className={styles.importSummary}>
                Ready to generate <strong>{bulkSummary.urlCount} QR codes</strong> from{' '}
                <strong>{bulkSummary.fileName}</strong> with{' '}
                <strong>{bulkSummary.variablesPerUrl} variables</strong> per row.
              </p>
            ) : null}
          </div>
        )}

        <footer className={styles.footer}>
          {mode === 'manual' ? (
            <WuButton variant="secondary" onClick={handleCreateNewQr}>
              Create new QR
            </WuButton>
          ) : (
            <WuButton
              onClick={() => void handleDownloadZip()}
              disabled={!bulkSummary || isDownloading}
            >
              {isDownloading ? 'Preparing download…' : 'Download QR codes'}
            </WuButton>
          )}
        </footer>
      </div>
    </div>
  );
}
