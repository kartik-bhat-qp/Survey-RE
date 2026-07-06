'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  buildSurveyUrlWithVariables,
  copyBrandedQrCodeToClipboard,
  createQrVariable,
  downloadBulkTemplateCsv,
  getNextQrVariableName,
  getQrCodeImageUrl,
  mockDownloadQrCodeZip,
  mockDownloadSingleQrCode,
  parseBulkQrImportFile,
  QR_BULK_IMPORT_ACCEPT,
  QR_LOGO_PATH,
  QR_VARIABLE_NAME_OPTIONS,
  SAMPLE_QR_VARIABLES,
  type BulkQrImportSummary,
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

export function SurveyQrCodePanel({ baseSurveyUrl }: SurveyQrCodePanelProps) {
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<QrCodeModalMode>('single');
  const [variables, setVariables] = useState<QrUrlVariable[]>(createInitialVariables);
  const [bulkSummary, setBulkSummary] = useState<BulkQrImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingQr, setIsCopyingQr] = useState(false);

  const generatedUrl = useMemo(
    () => buildSurveyUrlWithVariables(baseSurveyUrl, variables),
    [baseSurveyUrl, variables]
  );

  const qrImageUrl = useMemo(() => getQrCodeImageUrl(generatedUrl), [generatedUrl]);

  function updateVariable(id: string, patch: Partial<Pick<QrUrlVariable, 'name' | 'value'>>): void {
    setVariables((current) =>
      current.map((variable) => (variable.id === id ? { ...variable, ...patch } : variable))
    );
  }

  function addVariable(): void {
    setVariables((current) => [
      ...current,
      createQrVariable({ name: getNextQrVariableName(current.map((variable) => variable.name)) }),
    ]);
  }

  function getVariableNameOptions(variable: QrUrlVariable) {
    return QR_VARIABLE_NAME_OPTIONS.filter(
      (option) =>
        option.value === variable.name ||
        !variables.some((entry) => entry.id !== variable.id && entry.name === option.value)
    );
  }

  function getSelectedVariableNameOption(variable: QrUrlVariable) {
    return (
      QR_VARIABLE_NAME_OPTIONS.find((option) => option.value === variable.name) ??
      QR_VARIABLE_NAME_OPTIONS[0]
    );
  }

  function removeVariable(id: string): void {
    setVariables((current) =>
      current.length === 1 ? current : current.filter((variable) => variable.id !== id)
    );
  }

  async function handleCopyUrl(): Promise<void> {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      showToast({ message: 'Survey URL copied', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy URL', variant: 'error' });
    }
  }

  async function handleCopyQrImage(): Promise<void> {
    if (isCopyingQr) return;

    setIsCopyingQr(true);
    try {
      await copyBrandedQrCodeToClipboard(generatedUrl);
      showToast({ message: 'QR code copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy QR code', variant: 'error' });
    } finally {
      setIsCopyingQr(false);
    }
  }

  async function handleDownloadSingleQr(): Promise<void> {
    setIsDownloading(true);
    try {
      await mockDownloadSingleQrCode(generatedUrl);
      showToast({ message: 'QR code downloaded', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to download QR code', variant: 'error' });
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
      const summary = await parseBulkQrImportFile(file);
      setBulkSummary(summary);
      showToast({
        message: `Imported ${summary.urlCount} URLs with ${summary.variablesPerUrl} variables each`,
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

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.title}>QR codes</h2>
          <p className={styles.intro}>
            Generate a QR code from a survey URL with variables, or import a file with multiple
            URLs and download a ZIP of QR codes.
          </p>
        </header>

        <div className={styles.modeTabs} role="tablist" aria-label="QR code generation mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'single'}
            className={`${styles.modeTab} ${mode === 'single' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('single')}
          >
            Single URL
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

        {mode === 'single' ? (
          <div role="tabpanel">
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
                    data={getVariableNameOptions(variable)}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={getSelectedVariableNameOption(variable)}
                    onSelect={(item) =>
                      updateVariable(variable.id, {
                        name: (item as (typeof QR_VARIABLE_NAME_OPTIONS)[number]).value,
                      })
                    }
                    variant="outlined"
                  />
                  <WuInput
                    value={variable.value}
                    onChange={(event) =>
                      updateVariable(variable.id, { value: event.target.value })
                    }
                    placeholder="Value"
                    variant="outlined"
                  />
                  <button
                    type="button"
                    className={styles.removeVarBtn}
                    aria-label={`Remove ${variable.name || 'variable'}`}
                    onClick={() => removeVariable(variable.id)}
                    disabled={variables.length === 1}
                  >
                    <span className="wm-close" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addVarBtn} onClick={addVariable}>
              + Add variable
            </button>

            <div className={styles.previewPanel}>
              <div className={styles.qrPreview}>
                <button
                  type="button"
                  className={styles.qrImageButton}
                  aria-label="Copy QR code to clipboard"
                  disabled={isCopyingQr}
                  onClick={() => void handleCopyQrImage()}
                >
                  <div className={styles.qrImageWrap}>
                    <img
                      src={qrImageUrl}
                      alt=""
                      className={styles.qrImage}
                      width={144}
                      height={144}
                    />
                    <div className={styles.qrLogoBadge} aria-hidden>
                      <img src={QR_LOGO_PATH} alt="" className={styles.qrLogoImage} />
                    </div>
                  </div>
                  <span className={styles.qrCopyHint}>
                    {isCopyingQr ? 'Copying…' : 'Click to copy QR code'}
                  </span>
                </button>
              </div>
              <div>
                <span className={styles.urlPreviewLabel}>Generated survey URL</span>
                <div className={styles.urlPreviewField}>
                  <span className={styles.urlPreviewText}>{generatedUrl}</span>
                  <button
                    type="button"
                    className={styles.urlCopyBtn}
                    aria-label="Copy generated survey URL"
                    onClick={() => void handleCopyUrl()}
                  >
                    <span className="wm-content-copy" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.bulkPanel} role="tabpanel">
            <div className={styles.uploadBox}>
              <span className={`wm-upload-file ${styles.uploadIcon}`} aria-hidden />
              <p className={styles.uploadTitle}>Import URLs with variables</p>
              <p className={styles.uploadHint}>
                Upload a CSV with one survey URL per row and one column per variable. For example,
                50 rows can produce 50 QR codes with 5 variables appended to each URL.
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
                <strong>{bulkSummary.variablesPerUrl} variables</strong> per URL.
              </p>
            ) : null}
          </div>
        )}

        <footer className={styles.footer}>
          {mode === 'single' ? (
            <WuButton onClick={() => void handleDownloadSingleQr()} disabled={isDownloading}>
              {isDownloading ? 'Downloading…' : 'Download QR code'}
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
