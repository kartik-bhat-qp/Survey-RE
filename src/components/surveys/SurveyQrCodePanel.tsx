'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  allocateManualQrUrl,
  copyBrandedQrCodeToClipboard,
  createBulkQrHistoryEntry,
  createManualQrEntry,
  createQrVariable,
  downloadBulkTemplateCsv,
  getMockBulkQrGenerationHistory,
  getNextQrVariableName,
  getQrCodeImageUrl,
  mockDownloadBulkQrHistoryZip,
  mockDownloadManualQrCodes,
  mockDownloadQrCodeZip,
  parseBulkQrImportFile,
  QR_BULK_IMPORT_ACCEPT,
  QR_LOGO_PATH,
  QR_VARIABLE_NAME_OPTIONS,
  SAMPLE_QR_VARIABLES,
  updateManualQrEntry,
  type BulkQrGenerationHistoryEntry,
  type BulkQrImportSummary,
  type ManualQrEntry,
  type QrCodeModalMode,
  type QrUrlVariable,
} from '@/data/mock-survey-qr-code';
import { formatDate, formatRelativeDate, truncate } from '@/data/mock-utils';
import styles from './SurveyQrCodePanel.module.css';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const newDraftRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const [mode, setMode] = useState<QrCodeModalMode>('manual');
  const [savedQrs, setSavedQrs] = useState<ManualQrEntry[]>([]);
  const [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(() => getDefaultDraftName(0));
  const [draftVariables, setDraftVariables] = useState<QrUrlVariable[]>(createInitialVariables);
  const [draftLockedUrl, setDraftLockedUrl] = useState(() =>
    allocateManualQrUrl(baseSurveyUrl)
  );
  const [bulkSummary, setBulkSummary] = useState<BulkQrImportSummary | null>(null);
  const [bulkHistory, setBulkHistory] = useState<BulkQrGenerationHistoryEntry[]>(() =>
    getMockBulkQrGenerationHistory(baseSurveyUrl)
  );
  const [expandedBulkHistoryId, setExpandedBulkHistoryId] = useState<string | null>(null);
  const [downloadingHistoryId, setDownloadingHistoryId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyingQrKey, setCopyingQrKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManualQrEntry | null>(null);
  const [recentlySavedQrId, setRecentlySavedQrId] = useState<string | null>(null);
  const [highlightNewDraft, setHighlightNewDraft] = useState(false);
  const [scrollToDraftNonce, setScrollToDraftNonce] = useState(0);

  const draftUrl = draftLockedUrl.surveyUrl;
  const draftQrImageUrl = useMemo(() => getQrCodeImageUrl(draftUrl), [draftUrl]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  function scrollNewDraftIntoView(): void {
    const panel = panelRef.current;
    const draft = newDraftRef.current;
    if (!draft) return;

    if (panel) {
      const panelRect = panel.getBoundingClientRect();
      const draftRect = draft.getBoundingClientRect();
      const targetTop = panel.scrollTop + (draftRect.top - panelRect.top) - 20;
      panel.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
      return;
    }

    draft.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    if (scrollToDraftNonce === 0) return;

    let frameId = 0;
    let timeoutId = 0;

    const runScroll = () => {
      scrollNewDraftIntoView();
    };

    frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(runScroll);
    });
    timeoutId = window.setTimeout(runScroll, 150);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [scrollToDraftNonce]);

  function flashCreateNewQrFeedback(savedEntryId: string): void {
    setRecentlySavedQrId(savedEntryId);
    setHighlightNewDraft(true);

    if (highlightTimeoutRef.current !== null) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setRecentlySavedQrId(null);
      setHighlightNewDraft(false);
      highlightTimeoutRef.current = null;
    }, 2800);
  }

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

    const entry = createManualQrEntry(baseSurveyUrl, trimmedName, draftVariables, draftLockedUrl);
    const nextDraftName = getDefaultDraftName(savedQrs.length + 1);
    setSavedQrs((current) => [...current, entry]);
    setExpandedSavedId(null);
    setDraftName(nextDraftName);
    setDraftVariables(createInitialVariables());
    setDraftLockedUrl(allocateManualQrUrl(baseSurveyUrl));
    flashCreateNewQrFeedback(entry.id);
    setScrollToDraftNonce((current) => current + 1);
    showToast({
      message: `"${entry.name}" saved and collapsed above. You're now editing ${nextDraftName}.`,
      variant: 'success',
    });
  }

  function toggleSavedQrExpanded(id: string): void {
    setExpandedSavedId((current) => (current === id ? null : id));
  }

  function updateSavedQr(
    entryId: string,
    patch: { name?: string; variables?: QrUrlVariable[] }
  ): void {
    setSavedQrs((current) =>
      current.map((entry) =>
        entry.id === entryId ? updateManualQrEntry(entry, patch) : entry
      )
    );
  }

  function updateSavedQrVariable(
    entryId: string,
    variableId: string,
    patch: Partial<Pick<QrUrlVariable, 'name' | 'value'>>
  ): void {
    setSavedQrs((current) =>
      current.map((entry) => {
        if (entry.id !== entryId) return entry;
        return updateManualQrEntry(entry, {
          variables: entry.variables.map((variable) =>
            variable.id === variableId ? { ...variable, ...patch } : variable
          ),
        });
      })
    );
  }

  function addSavedQrVariable(entryId: string): void {
    setSavedQrs((current) =>
      current.map((entry) => {
        if (entry.id !== entryId) return entry;
        return updateManualQrEntry(entry, {
          variables: [
            ...entry.variables,
            createQrVariable({
              name: getNextQrVariableName(entry.variables.map((variable) => variable.name)),
            }),
          ],
        });
      })
    );
  }

  function removeSavedQrVariable(entryId: string, variableId: string): void {
    setSavedQrs((current) =>
      current.map((entry) => {
        if (entry.id !== entryId) return entry;
        if (entry.variables.length === 1) return entry;
        return updateManualQrEntry(entry, {
          variables: entry.variables.filter((variable) => variable.id !== variableId),
        });
      })
    );
  }

  function handleDeleteSavedQr(): void {
    if (!deleteTarget) return;

    const deletedName = deleteTarget.name;
    setSavedQrs((current) => current.filter((entry) => entry.id !== deleteTarget.id));
    setExpandedSavedId((current) => (current === deleteTarget.id ? null : current));
    setDeleteTarget(null);
    showToast({ message: `"${deletedName}" deleted`, variant: 'success' });
  }

  function collectDownloadableEntries(): ManualQrEntry[] {
    const entries = [...savedQrs];
    const trimmedName = draftName.trim();
    if (trimmedName) {
      entries.push(
        createManualQrEntry(baseSurveyUrl, trimmedName, draftVariables, draftLockedUrl)
      );
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

  function toggleBulkHistoryExpanded(id: string): void {
    setExpandedBulkHistoryId((current) => (current === id ? null : id));
  }

  async function handleDownloadHistoryZip(entry: BulkQrGenerationHistoryEntry): Promise<void> {
    setDownloadingHistoryId(entry.id);
    try {
      await mockDownloadBulkQrHistoryZip(entry);
      showToast({
        message: `Downloading ZIP with ${entry.urlCount} QR codes`,
        variant: 'success',
      });
    } catch {
      showToast({ message: 'Unable to download ZIP file', variant: 'error' });
    } finally {
      setDownloadingHistoryId(null);
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
      const historyEntry = createBulkQrHistoryEntry(bulkSummary);
      setBulkHistory((current) => [historyEntry, ...current]);
      setExpandedBulkHistoryId(historyEntry.id);
      showToast({
        message: `Downloading ZIP with ${bulkSummary.urlCount} QR codes. Added to generation history.`,
        variant: 'success',
      });
    } catch {
      showToast({ message: 'Unable to download ZIP file', variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  }

  function renderBulkGenerationHistory(): React.ReactNode {
    return (
      <div className={styles.bulkHistorySection}>
        <div className={styles.bulkHistorySectionHeader}>
          <p className={styles.bulkHistorySectionTitle}>Generation history</p>
          <p className={styles.bulkHistorySectionHint}>
            Previously generated bulk QR code files
          </p>
        </div>

        <div className={styles.bulkHistoryList}>
          {bulkHistory.map((entry) => {
            const isSelected = expandedBulkHistoryId === entry.id;

            return (
              <div
                key={entry.id}
                className={`${styles.bulkHistoryCard} ${isSelected ? styles.bulkHistoryCardSelected : ''}`}
              >
                <button
                  type="button"
                  className={styles.bulkHistoryHeaderToggle}
                  aria-expanded={isSelected}
                  onClick={() => toggleBulkHistoryExpanded(entry.id)}
                >
                  <span className={`wm-history ${styles.bulkHistoryIcon}`} aria-hidden />
                  <span className={styles.bulkHistoryFileName} title={entry.fileName}>
                    {truncate(entry.fileName, 42)}
                  </span>
                  <span className={styles.bulkHistoryMeta}>
                    {entry.urlCount} URL{entry.urlCount === 1 ? '' : 's'} ·{' '}
                    {formatRelativeDate(entry.generatedAt)}
                  </span>
                  <span
                    className={`${isSelected ? 'wm-chevron-down' : 'wm-chevron-right'} ${styles.bulkHistoryChevron}`}
                    aria-hidden
                  />
                </button>

                {isSelected ? (
                  <div className={styles.bulkHistoryDetailPanel}>
                    <dl className={styles.bulkHistorySummary}>
                      <div className={styles.bulkHistorySummaryRow}>
                        <dt>Generated</dt>
                        <dd>
                          {formatDate(entry.generatedAt)} ({formatRelativeDate(entry.generatedAt)})
                        </dd>
                      </div>
                      <div className={styles.bulkHistorySummaryRow}>
                        <dt>QR codes</dt>
                        <dd>{entry.urlCount}</dd>
                      </div>
                      <div className={styles.bulkHistorySummaryRow}>
                        <dt>Variables per row</dt>
                        <dd>{entry.variableNames.length}</dd>
                      </div>
                    </dl>
                    <div className={styles.bulkHistoryFooter}>
                      <WuButton
                        variant="secondary"
                        onClick={() => void handleDownloadHistoryZip(entry)}
                        disabled={downloadingHistoryId === entry.id}
                      >
                        {downloadingHistoryId === entry.id
                          ? 'Preparing download…'
                          : 'Download QR codes'}
                      </WuButton>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
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
    <div ref={panelRef} className={styles.panel}>
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
            Bulk creation
          </button>
        </div>

        {mode === 'manual' ? (
          <div className={styles.manualPanel} role="tabpanel">
            {savedQrs.length > 0 ? (
              <div className={styles.savedQrSection}>
                <div className={styles.savedQrSectionHeader}>
                  <p className={styles.savedQrSectionTitle}>Saved QR codes</p>
                  <p className={styles.savedQrSectionHint}>
                    {savedQrs.length} saved · collapsed — expand to edit
                  </p>
                </div>
                <div className={styles.savedQrList}>
                {savedQrs.map((entry) => {
                  const isExpanded = expandedSavedId === entry.id;
                  const qrImageUrl = getQrCodeImageUrl(entry.surveyUrl);
                  const isRecentlySaved = recentlySavedQrId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`${styles.savedQrCard} ${isRecentlySaved ? styles.savedQrCardRecent : ''}`}
                    >
                      <div className={styles.savedQrHeader}>
                        <button
                          type="button"
                          className={styles.savedQrHeaderToggle}
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
                        <button
                          type="button"
                          className={styles.savedQrDeleteBtn}
                          aria-label={`Delete ${entry.name}`}
                          onClick={() => setDeleteTarget(entry)}
                        >
                          <span className="wm-delete" aria-hidden />
                        </button>
                      </div>
                      {isExpanded ? (
                        <div className={styles.savedQrBody}>
                          <label className={styles.nameLabel} htmlFor={`qr-name-${entry.id}`}>
                            QR code name
                          </label>
                          <WuInput
                            id={`qr-name-${entry.id}`}
                            value={entry.name}
                            onChange={(event) =>
                              updateSavedQr(entry.id, { name: event.target.value })
                            }
                            variant="outlined"
                          />
                          {renderVariableEditor(
                            entry.variables,
                            (variableId, patch) =>
                              updateSavedQrVariable(entry.id, variableId, patch),
                            () => addSavedQrVariable(entry.id),
                            (variableId) => removeSavedQrVariable(entry.id, variableId)
                          )}
                          <p className={styles.lockedUrlNote}>
                            Survey URL and QR code stay the same after creation. You can update the
                            name and variables without changing the link.
                          </p>
                          {renderQrPreview(entry.surveyUrl, qrImageUrl, entry.id)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                </div>
              </div>
            ) : null}

            {savedQrs.length > 0 ? (
              <div className={styles.newQrDivider} role="status" aria-live="polite">
                <span className={styles.newQrDividerLine} aria-hidden />
                <span className={styles.newQrDividerLabel}>Create another QR code below</span>
                <span className={styles.newQrDividerLine} aria-hidden />
              </div>
            ) : null}

            <div
              ref={newDraftRef}
              className={`${styles.activeQrCard} ${highlightNewDraft ? styles.activeQrCardHighlight : ''}`}
            >
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

              <p className={styles.lockedUrlNote}>
                Survey URL and QR code are set when this QR is created. Editing variables updates
                metadata only and does not change the link.
              </p>

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
                Download template
              </button>
            </div>

            {bulkSummary ? (
              <p className={styles.importSummary}>
                Ready to generate <strong>{bulkSummary.urlCount} QR codes</strong> from{' '}
                <strong>{bulkSummary.fileName}</strong> with{' '}
                <strong>{bulkSummary.variablesPerUrl} variables</strong> per row.
              </p>
            ) : null}

            {renderBulkGenerationHistory()}
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

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete QR code?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDeleteSavedQr}
      />
    </div>
  );
}
