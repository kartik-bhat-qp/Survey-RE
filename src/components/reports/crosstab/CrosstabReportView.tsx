'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CROSSTAB_SETTINGS,
  MOCK_CROSSTAB_REPORT,
  formatMetric,
  formatPercent,
  type CrosstabDisplaySettings,
} from '@/data/mock-crosstab-report';
import {
  createCrosstabWorkbook,
  makeCrosstabExportFilename,
} from '@/lib/crosstab-xlsx';
import styles from './CrosstabReportView.module.css';

type SettingsTab = 'rows' | 'analytics' | 'labels' | 'filters';

interface ExportJob {
  status: 'running' | 'complete';
  filename?: string;
  url?: string;
}

interface CrosstabReportViewProps {
  reportName: string;
  surveyName: string;
}

const ANALYTICS_SWITCHES: Array<{
  key: keyof CrosstabDisplaySettings;
  label: string;
  section: 'display' | 'metric';
}> = [
  { key: 'count', label: 'Count', section: 'display' },
  { key: 'rowPercentage', label: 'Row percentage', section: 'display' },
  { key: 'columnPercentage', label: 'Column percentage', section: 'display' },
  { key: 'rowOverall', label: 'Row overall', section: 'display' },
  { key: 'columnOverall', label: 'Column overall', section: 'display' },
  { key: 'rowTotal', label: 'Row total', section: 'display' },
  { key: 'columnTotal', label: 'Column total', section: 'display' },
  {
    key: 'totalRowPercentage',
    label: 'Total row percentage',
    section: 'display',
  },
  {
    key: 'totalColumnPercentage',
    label: 'Total column percentage',
    section: 'display',
  },
  { key: 'heatmapRows', label: 'Heatmap rows', section: 'display' },
  { key: 'heatmapColumns', label: 'Heatmap columns', section: 'display' },
  { key: 'rowMetric', label: 'Row metric', section: 'metric' },
  { key: 'columnMetric', label: 'Column metric', section: 'metric' },
];

function heatColor(value: number): string | undefined {
  if (value <= 0) return undefined;
  const alpha = 0.06 + Math.min(1, value / 100) * 0.28;
  return `rgba(69, 184, 91, ${alpha.toFixed(2)})`;
}

function DataCell({
  count,
  rowTotal,
  columnTotal,
  settings,
}: {
  count: number;
  rowTotal: number;
  columnTotal: number;
  settings: CrosstabDisplaySettings;
}) {
  const rowPercent = rowTotal ? (count / rowTotal) * 100 : 0;
  const columnPercent = columnTotal ? (count / columnTotal) * 100 : 0;
  const heatPercent = settings.heatmapRows ? rowPercent : columnPercent;
  const backgroundColor =
    settings.heatmapRows || settings.heatmapColumns ? heatColor(heatPercent) : undefined;

  return (
    <td className={styles.dataCell} style={{ backgroundColor }}>
      {settings.count ? <span className={styles.count}>{count}</span> : null}
      {settings.rowPercentage ? (
        <span className={styles.rowPercentage}>R% {formatPercent(count, rowTotal)}</span>
      ) : null}
      {settings.columnPercentage ? (
        <span className={styles.columnPercentage}>C% {formatPercent(count, columnTotal)}</span>
      ) : null}
    </td>
  );
}

function SettingsSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.switchRow}>
      <span className={styles.switchLabel}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function SummaryDataCell({
  count,
  denominator,
  kind,
  showCount,
  showPercentage,
  showBaseLabel = false,
}: {
  count: number;
  denominator: number;
  kind: 'row' | 'column' | 'base';
  showCount: boolean;
  showPercentage: boolean;
  showBaseLabel?: boolean;
}) {
  const percentageLabel = denominator ? formatPercent(count, denominator) : '—';

  return (
    <td className={`${styles.metricCell} ${styles.summaryDataCell}`}>
      {showCount ? <span className={styles.count}>{count}</span> : null}
      {showPercentage ? (
        <span
          className={
            kind === 'row'
              ? styles.rowPercentage
              : kind === 'column'
                ? styles.columnPercentage
                : styles.basePercentage
          }
        >
          {showBaseLabel ? 'Base ' : kind === 'row' ? 'R% ' : 'C% '}
          {percentageLabel}
        </span>
      ) : null}
    </td>
  );
}

export default function CrosstabReportView({
  reportName,
}: CrosstabReportViewProps) {
  const [title, setTitle] = useState(reportName || MOCK_CROSSTAB_REPORT.title);
  const [settings, setSettings] = useState<CrosstabDisplaySettings>(
    DEFAULT_CROSSTAB_SETTINGS
  );
  const [draftSettings, setDraftSettings] = useState(settings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('rows');
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);

  const dirtySettings = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(draftSettings),
    [draftSettings, settings]
  );

  useEffect(() => {
    return () => {
      if (exportJob?.url) URL.revokeObjectURL(exportJob.url);
    };
  }, [exportJob]);

  function updateDraft(key: keyof CrosstabDisplaySettings, checked: boolean): void {
    setDraftSettings((current) => {
      const next = { ...current, [key]: checked };
      if (checked && key === 'heatmapRows') next.heatmapColumns = false;
      if (checked && key === 'heatmapColumns') next.heatmapRows = false;
      return next;
    });
  }

  function closeSettings(): void {
    if (dirtySettings) {
      setConfirmClose(true);
      return;
    }
    setSettingsOpen(false);
  }

  function queueExport(): void {
    setExportJob({ status: 'running' });
    window.setTimeout(() => {
      const workbook = createCrosstabWorkbook(MOCK_CROSSTAB_REPORT, settings);
      const filename = makeCrosstabExportFilename();
      const workbookBuffer = workbook.buffer.slice(
        workbook.byteOffset,
        workbook.byteOffset + workbook.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([workbookBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      setExportJob({ status: 'complete', filename, url: URL.createObjectURL(blob) });
    }, 900);
  }

  function downloadCompletedExport(): void {
    if (!exportJob?.url || !exportJob.filename) return;
    const anchor = document.createElement('a');
    anchor.href = exportJob.url;
    anchor.download = exportJob.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const rowOverallOffset = settings.rowOverall ? 1 : 0;
  const leadingSpan = 3 + rowOverallOffset;
  const showRowTotalColumn = settings.rowTotal || settings.totalRowPercentage;
  const showColumnTotalRow = settings.columnTotal || settings.totalColumnPercentage;

  return (
    <div className={styles.root}>
      <main className={styles.workspace}>
        <div className={styles.toolbar}>
          <input
            className={styles.reportTitle}
            aria-label="Report name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={`${styles.toolbarButton} ${filterOpen ? styles.toolbarButtonActive : ''}`}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <span className="wm-filter" aria-hidden /> Filter
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Export to Excel"
              title="Export to Excel"
              data-testid="crosstabReportExcelDownload"
              onClick={queueExport}
            >
              <span className="wm-download" aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${settingsOpen ? styles.iconButtonActive : ''}`}
              aria-label="Report settings"
              data-testid="crosstabReportSettings"
              onClick={() => {
                if (settingsOpen) closeSettings();
                else {
                  setDraftSettings(settings);
                  setSettingsOpen(true);
                }
              }}
            >
              <span className="wm-settings" aria-hidden />
            </button>
          </div>
        </div>

        {filterOpen ? (
          <section className={styles.filterBar} aria-label="Report filters">
            <span className={styles.filterLabel}>Base</span>
            <button type="button" className={styles.selectButton}>
              All respondents <span className="wm-chevron-down" aria-hidden />
            </button>
            <span className={styles.filterMeta}>299 respondents</span>
          </section>
        ) : null}

        {settingsOpen ? (
          <section className={styles.settingsPanel} aria-label="Report settings panel">
            <nav className={styles.settingsNav} aria-label="Report settings">
              {([
                ['rows', 'Rows and columns'],
                ['analytics', 'Analytics'],
                ['labels', 'Labels'],
                ['filters', 'Filters'],
              ] as Array<[SettingsTab, string]>).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={settingsTab === id ? styles.settingsTabActive : styles.settingsTab}
                  onClick={() => setSettingsTab(id)}
                >
                  {label}
                </button>
              ))}
              <div className={styles.settingsNavSpacer} />
              {dirtySettings ? (
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={() => {
                    setSettings(draftSettings);
                    setSettingsOpen(false);
                  }}
                >
                  Apply
                </button>
              ) : null}
              <button type="button" className={styles.closeButton} onClick={closeSettings}>
                <span className="wm-close" aria-hidden />
                <span className="sr-only">Close settings</span>
              </button>
            </nav>

            {settingsTab === 'rows' ? (
              <div className={styles.axisSettings}>
                <aside className={styles.questionPicker}>
                  <button type="button" className={styles.questionTypeButton}>
                    Question <span className="wm-chevron-down" aria-hidden />
                  </button>
                  <label className={styles.questionSearch}>
                    <span className="wm-search" aria-hidden />
                    <input type="search" placeholder="Search" aria-label="Search questions" />
                  </label>
                  <div className={styles.bulkAddHint}>Select items to bulk add</div>
                </aside>
                <div className={styles.axisDropZones}>
                  <section className={styles.axisDropZone}>
                    <h3>Drag and drop rows (Banners) here</h3>
                    {MOCK_CROSSTAB_REPORT.rowGroups.slice(0, 1).map((group, index) => (
                      <div className={styles.axisItemRow} key={group.question}>
                        <div className={styles.axisItem}>
                          <span>Q{index + 1}-</span> {group.question}
                        </div>
                        <button type="button" className={styles.drilldownButton}>Add drilldown</button>
                      </div>
                    ))}
                  </section>
                  <section className={styles.axisDropZone}>
                    <h3>Drag and drop columns (Stubs) here</h3>
                    {MOCK_CROSSTAB_REPORT.columnGroups.slice(0, 1).map((group, index) => (
                      <div className={styles.axisItemRow} key={group.question}>
                        <div className={styles.axisItem}>
                          <span>Q{index + 2}-</span> {group.question}
                        </div>
                        <button type="button" className={styles.drilldownButton}>Add drilldown</button>
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            ) : null}

            {settingsTab === 'analytics' ? (
              <div className={styles.analyticsSettings}>
                <div className={styles.analyticsColumn}>
                  <h3>Display data</h3>
                  {ANALYTICS_SWITCHES.filter((item) => item.section === 'display').map(
                    (item) => (
                      <SettingsSwitch
                        key={item.key}
                        label={item.label}
                        checked={draftSettings[item.key]}
                        onChange={(checked) => updateDraft(item.key, checked)}
                      />
                    )
                  )}
                </div>
                <div className={styles.analyticsColumn}>
                  <h3>Data options</h3>
                  <SettingsSwitch checked={false} label="Fisher's Exact Test" onChange={() => undefined} />
                  <SettingsSwitch checked={false} label="Chi-Square" onChange={() => undefined} />
                  <label className={styles.inlineSelectField}>
                    <span>Column proportions test</span>
                    <button type="button" className={styles.underlineSelect}>Disabled <span className="wm-chevron-down" aria-hidden /></button>
                  </label>
                  <label className={styles.selectField}>
                    <span>Percentage calculation mode</span>
                    <button type="button" className={styles.selectButton}>
                      Respondent answered the question <span className="wm-chevron-down" aria-hidden />
                    </button>
                  </label>
                  <h3>Metric</h3>
                  <label className={styles.inlineSelectField}>
                    <span>Metric type</span>
                    <button type="button" className={styles.underlineSelect}>Mean <span className="wm-chevron-down" aria-hidden /></button>
                  </label>
                  {ANALYTICS_SWITCHES.filter((item) => item.section === 'metric').map(
                    (item) => (
                      <SettingsSwitch
                        key={item.key}
                        label={item.label}
                        checked={draftSettings[item.key]}
                        onChange={(checked) => updateDraft(item.key, checked)}
                      />
                    )
                  )}
                  <label className={styles.selectField}>
                    <span>Decimal precision</span>
                    <button type="button" className={styles.selectButton}>1 (0.1) <span className="wm-chevron-down" aria-hidden /></button>
                  </label>
                </div>
                <div className={styles.analyticsColumn}>
                  <h3>Weighting schemes</h3>
                  <div className={styles.schemeTypeRow}>
                    <span>Scheme type</span>
                    <div className={styles.segmentedControl}>
                      <button type="button" className={styles.segmentedActive}>
                        <span className="wm-bar-chart" aria-hidden /> Report
                      </button>
                      <button type="button" className={styles.segmentedButton}>None</button>
                    </div>
                  </div>
                  <button type="button" className={styles.selectButton}>-Select- <span className="wm-chevron-down" aria-hidden /></button>
                </div>
              </div>
            ) : null}

            {settingsTab === 'labels' ? (
              <div className={styles.labelSettings}>
                <section className={styles.labelSection}>
                  <h3>Rows</h3>
                  <div className={styles.labelHeader}><span>Original label</span><span>New label</span></div>
                  <div className={styles.labelRow}>
                    <span><span className="wm-chevron-right" aria-hidden /> Preferred beverage</span>
                    <input aria-label="New row label" defaultValue="Preferred beverage" />
                  </div>
                </section>
                <section className={styles.labelSection}>
                  <h3>Columns</h3>
                  <div className={styles.labelHeader}><span>Original label</span><span>New label</span></div>
                  <div className={styles.labelRow}>
                    <span><span className="wm-chevron-right" aria-hidden /> What type of cuisine do you prefer while dining with us?</span>
                    <input aria-label="New column label" defaultValue="What type of cuisine do you prefer while dining with us?" />
                  </div>
                </section>
              </div>
            ) : null}

            {settingsTab === 'filters' ? (
              <div className={styles.placeholderSettings}>
                <strong>No report filters present</strong>
                <span>Try saving filter report appear over here</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {!settingsOpen ? (
          <section className={styles.reportCanvas}>
            <div className={styles.tableScroller}>
              <table className={styles.crosstabTable}>
                <thead>
                  <tr>
                    <th colSpan={leadingSpan} className={styles.emptyHeader} />
                    {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group) => [
                      <th
                        key={group.question}
                        colSpan={group.options.length}
                        className={styles.columnQuestion}
                      >
                        {group.question}
                      </th>,
                      ...((settings.columnMetric ? 1 : 0) +
                        (showRowTotalColumn ? 1 : 0) >
                      0
                        ? [
                            <th
                              key={`${group.question}-header-spacer`}
                              colSpan={
                                (settings.columnMetric ? 1 : 0) +
                                (showRowTotalColumn ? 1 : 0)
                              }
                              className={styles.emptyHeader}
                            />,
                          ]
                        : []),
                    ])}
                  </tr>
                  <tr>
                    <th colSpan={leadingSpan} className={styles.emptyHeader} />
                    {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group) => [
                      ...group.options.map((option) => (
                        <th key={`${group.question}-${option}`} className={styles.optionHeader}>
                          {option}
                        </th>
                      )),
                      ...(settings.columnMetric
                        ? [
                            <th key={`${group.question}-metric`} className={styles.summaryHeader}>
                              {settings.columnOverall ? '' : 'NPS'}
                            </th>,
                          ]
                        : []),
                      ...(showRowTotalColumn
                        ? [
                            <th key={`${group.question}-total`} className={styles.summaryHeader}>
                              {settings.columnOverall ? '' : 'Total'}
                            </th>,
                          ]
                        : []),
                    ])}
                  </tr>
                  {settings.columnOverall ? (
                    <tr>
                      <th colSpan={3} className={styles.emptyHeader} />
                      {settings.rowOverall ? <th className={styles.summaryHeader}>Overall</th> : null}
                      {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group) => [
                        ...group.overallCounts.map((value, index) => (
                          <th key={`${group.question}-overall-${index}`} className={styles.overallValue}>
                            {value}
                          </th>
                        )),
                        ...(settings.columnMetric
                          ? [
                              <th key={`${group.question}-overall-metric`} className={styles.summaryHeader}>
                                NPS
                              </th>,
                            ]
                          : []),
                        ...(showRowTotalColumn
                          ? [
                              <th key={`${group.question}-overall-total`} className={styles.summaryHeader}>
                                Total
                              </th>,
                            ]
                          : []),
                      ])}
                    </tr>
                  ) : null}
                </thead>
                <tbody>
                  {MOCK_CROSSTAB_REPORT.rowGroups.flatMap((rowGroup) => {
                    const answerRows = rowGroup.answers.map((answer, answerIndex) => (
                      <tr key={`${rowGroup.question}-${answer.label}`}>
                        {answerIndex === 0 ? (
                          <th rowSpan={rowGroup.answers.length} colSpan={2} className={styles.rowQuestion}>
                            {rowGroup.question}
                          </th>
                        ) : null}
                        <th className={styles.answerCell}>{answer.label}</th>
                        {settings.rowOverall ? (
                          <td className={styles.overallCell}>{answer.overall}</td>
                        ) : null}
                        {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group, groupIndex) => [
                          ...answer.counts[groupIndex].map((count, optionIndex) => (
                            <DataCell
                              key={`${group.question}-${optionIndex}`}
                              count={count}
                              rowTotal={answer.totals[groupIndex]}
                              columnTotal={rowGroup.columnTotals[groupIndex][optionIndex]}
                              settings={settings}
                            />
                          )),
                          ...(settings.columnMetric
                            ? [
                                <td key={`${group.question}-metric`} className={styles.metricCell}>
                                  {formatMetric(answer.metrics[groupIndex])}
                                </td>,
                              ]
                            : []),
                          ...(showRowTotalColumn
                            ? [
                                <SummaryDataCell
                                  key={`${group.question}-total`}
                                  count={answer.totals[groupIndex]}
                                  denominator={rowGroup.bases[groupIndex]}
                                  kind="row"
                                  showCount={settings.rowTotal}
                                  showPercentage={settings.totalRowPercentage}
                                />,
                              ]
                            : []),
                        ])}
                      </tr>
                    ));

                    const metricRow = settings.rowMetric ? (
                      <tr key={`${rowGroup.question}-metric`}>
                        <td colSpan={settings.rowOverall ? 3 : 2} className={styles.emptySummary} />
                        <th className={styles.summaryRowLabel}>NPS</th>
                        {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group, groupIndex) => [
                          ...rowGroup.columnMetrics[groupIndex].map((value, index) => (
                            <td key={`${group.question}-metric-${index}`} className={styles.metricCell}>
                              {formatMetric(value)}
                            </td>
                          )),
                          ...(settings.columnMetric
                            ? [<td key={`${group.question}-metric-blank`} className={styles.metricCell} />]
                            : []),
                          ...(showRowTotalColumn
                            ? [<td key={`${group.question}-metric-total-blank`} className={styles.metricCell} />]
                            : []),
                        ])}
                      </tr>
                    ) : null;

                    const totalRow = showColumnTotalRow ? (
                      <tr key={`${rowGroup.question}-total`}>
                        <td colSpan={settings.rowOverall ? 3 : 2} className={styles.emptySummary} />
                        <th className={styles.summaryRowLabel}>Total</th>
                        {MOCK_CROSSTAB_REPORT.columnGroups.flatMap((group, groupIndex) => [
                          ...rowGroup.columnTotals[groupIndex].map((value, index) => (
                            <SummaryDataCell
                              key={`${group.question}-total-${index}`}
                              count={value}
                              denominator={rowGroup.bases[groupIndex]}
                              kind="column"
                              showCount={settings.columnTotal}
                              showPercentage={settings.totalColumnPercentage}
                            />
                          )),
                          ...(settings.columnMetric
                            ? [<td key={`${group.question}-total-metric-blank`} className={styles.metricCell} />]
                            : []),
                          ...(showRowTotalColumn
                            ? [
                                <SummaryDataCell
                                  key={`${group.question}-grand-total`}
                                  count={rowGroup.bases[groupIndex]}
                                  denominator={rowGroup.bases[groupIndex]}
                                  kind="base"
                                  showCount={settings.rowTotal && settings.columnTotal}
                                  showPercentage={
                                    settings.totalColumnPercentage || settings.totalRowPercentage
                                  }
                                  showBaseLabel
                                />,
                              ]
                            : []),
                        ])}
                      </tr>
                    ) : null;

                    return [...answerRows, metricRow, totalRow].filter(Boolean);
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>

      {exportJob ? (
        <aside className={styles.progressPanel} aria-label="Export progress">
          <div className={styles.progressTitle}>Progress</div>
          {exportJob.status === 'running' ? (
            <div className={styles.progressItem}>Crosstab (XLSX) Report - 0.00%</div>
          ) : null}
          {exportJob.status === 'complete' ? (
            <button type="button" className={styles.progressItemButton} onClick={downloadCompletedExport}>
              {exportJob.filename} - 100%
            </button>
          ) : null}
        </aside>
      ) : (
        <button type="button" className={styles.processingButton} aria-label="Processing items">
          <span className="wm-grid-view" aria-hidden />
        </button>
      )}

      {confirmClose ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <div className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="settings-alert-title">
            <h2 id="settings-alert-title">Alert!</h2>
            <p>You have unsaved changes in crosstab report settings. Do you want to proceed without saving?</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirmClose(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setDraftSettings(settings);
                  setConfirmClose(false);
                  setSettingsOpen(false);
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
