'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ANALYTICS_2_CORR_COLS,
  ANALYTICS_2_CORR_ROWS,
  ANALYTICS_2_CROSSTAB_REPORTS,
  ANALYTICS_2_CT_COL_LABELS,
  ANALYTICS_2_CT_ROWS,
  ANALYTICS_2_CT_TOTALS,
  ANALYTICS_2_CJ_IMPORTANCE,
  ANALYTICS_2_DEVICE_AUDIT,
  ANALYTICS_2_DOWNLOAD_JOBS,
  ANALYTICS_2_EXPORT_SECTIONS,
  ANALYTICS_2_MERGE_SURVEYS,
  ANALYTICS_2_OTHER_SURVEYS,
  ANALYTICS_2_QUALITY_FLAGS,
  ANALYTICS_2_SEARCH_ROWS,
  ANALYTICS_2_WEIGHT_QUESTIONS,
  ANALYTICS_2_WEIGHT_ROWS,
  ANALYTICS_2_WORD_CLOUDS,
  type Analytics2ToolDef,
} from '@/data/mock-analytics-2';
import styles from './SurveyAnalyticsHub.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface ActionProps {
  onAction: (message: string) => void;
}

function ScreenHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.screenHeader}>
      <h1 className={styles.title}>{title}</h1>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
      <span className={styles.headerSpacer} />
      {children}
    </div>
  );
}

export function AnalyticsCrosstabList({
  onOpen,
  onAction,
}: ActionProps & { onOpen: () => void }) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Cross-Tabulation" meta="1 report">
        <button type="button" className={styles.primaryBtn} onClick={onOpen}>
          <span className="wm-add" aria-hidden />
          New report
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        {ANALYTICS_2_CROSSTAB_REPORTS.map((report) => (
          <button key={report.id} type="button" className={styles.listRow} onClick={onOpen}>
            <span className="wm-table-chart" aria-hidden />
            <span style={{ flex: 1, textAlign: 'left' }}>{report.name}</span>
            <span className={styles.muted}>{report.created}</span>
            <span
              className="wm-delete"
              role="button"
              tabIndex={0}
              aria-label="Delete report"
              onClick={(event) => {
                event.stopPropagation();
                onAction('Report deleted');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.stopPropagation();
                  onAction('Report deleted');
                }
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsCrosstabDetail({
  onBack,
  onAction,
}: ActionProps & { onBack: () => void }) {
  const [showCount, setShowCount] = useState(true);
  const [showPct, setShowPct] = useState(true);
  const [heatmap, setHeatmap] = useState(false);
  const maxCount = 365;

  return (
    <div className={styles.screen}>
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.linkBtn} onClick={onBack}>
          Cross-Tabulation
        </button>
        <span className="wm-chevron-right" aria-hidden />
        <span>Demo survey 2026 — Sample Crosstabulation Report</span>
      </div>
      <ScreenHeader title="Gender × Age">
        <WuToggle Label="Count" labelPosition="right" checked={showCount} onChange={setShowCount} />
        <WuToggle
          Label="Column percentage"
          labelPosition="right"
          checked={showPct}
          onChange={setShowPct}
        />
        <WuToggle Label="Heatmap cells" labelPosition="right" checked={heatmap} onChange={setHeatmap} />
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Report updated')}>
          Update
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Report link copied')}>
          Copy link
        </button>
      </ScreenHeader>
      <div className={styles.card} style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Gender</th>
              {ANALYTICS_2_CT_COL_LABELS.map((col) => (
                <th key={col} scope="col" className={styles.right}>
                  {col}
                </th>
              ))}
              <th scope="col" className={styles.right}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {ANALYTICS_2_CT_ROWS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {row.counts.map((count, i) => (
                  <td
                    key={ANALYTICS_2_CT_COL_LABELS[i]}
                    className={styles.heatmapCell}
                    style={{
                      background: heatmap
                        ? `rgba(27,135,230,${(0.02 + (count / maxCount) * 0.45).toFixed(2)})`
                        : undefined,
                    }}
                  >
                    {showCount ? <div className={styles.num}>{count.toLocaleString()}</div> : null}
                    {showPct ? <div className={styles.muted}>{row.pcts[i]}</div> : null}
                  </td>
                ))}
                <td className={styles.right}>{row.total}</td>
              </tr>
            ))}
            <tr>
              <td>Total</td>
              {ANALYTICS_2_CT_TOTALS.map((cell, i) => (
                <td key={ANALYTICS_2_CT_COL_LABELS[i]} className={styles.right}>
                  <div className={styles.num}>{cell.count}</div>
                  <div className={styles.muted}>{cell.pct}</div>
                </td>
              ))}
              <td className={styles.right}>2,637</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsTrend({ onAction }: ActionProps) {
  const [freq, setFreq] = useState('Weekly');
  const freqs = ['Daily', 'Weekly', 'Monthly'];
  const series = [22, 30, 42, 48, 61, 58, 66, 72];
  const xs = series.map((_, i) => 40 + i * ((700 - 40) / (series.length - 1)));
  const ys = series.map((v) => 112 - (v / 100) * 102);
  const pts = xs.map((x, i) => `${x},${ys[i].toFixed(1)}`).join(' ');
  const labels =
    freq === 'Daily'
      ? ['Aug 7', 'Aug 8', 'Aug 9', 'Aug 10', 'Aug 11', 'Aug 12', 'Aug 13', 'Aug 14']
      : freq === 'Monthly'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
        : ['Jun 22', 'Jun 29', 'Jul 6', 'Jul 13', 'Jul 20', 'Jul 27', 'Aug 3', 'Aug 10'];

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Trend Analysis">
        <div className={styles.rangeGroup}>
          {freqs.map((item) => (
            <button
              key={item}
              type="button"
              className={freq === item ? styles.rangeBtnActive : styles.rangeBtn}
              onClick={() => setFreq(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Trend exported')}>
          <span className="wm-download" aria-hidden />
          Export
        </button>
      </ScreenHeader>
      {['1. [Q3] Question 3 Row 1', '2. [Q3] Question 3 Row 2'].map((title) => (
        <section key={title} className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{title}</h2>
            <button type="button" className={styles.ghostBtn} onClick={() => onAction('Chart type: Bar')}>
              Area spline chart
            </button>
          </div>
          <div className={styles.cardBody}>
            <svg viewBox="0 0 720 140" className={styles.chart} aria-hidden>
              <polyline points={`40,112 ${pts} 700,112`} fill="rgba(27,135,230,0.10)" />
              <polyline points={pts} fill="none" stroke="#1b87e6" strokeWidth="2" />
              {labels.map((label, i) => (
                <text key={label} x={xs[i]} y="132" fontSize="9" fill="#94a3b8" textAnchor="middle">
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </section>
      ))}
    </div>
  );
}

export function AnalyticsComparison({ onAction }: ActionProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Survey Comparison" />
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="comp-name">
              Report name
            </label>
            <input
              id="comp-name"
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Wave 1 vs Wave 2"
            />
          </div>
        </div>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Compare with</h2>
        </div>
        {ANALYTICS_2_OTHER_SURVEYS.map((survey) => (
          <button
            key={survey.name}
            type="button"
            className={selected === survey.name ? styles.surveyPickActive : styles.surveyPick}
            style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}
            onClick={() => setSelected(survey.name)}
          >
            <span>{survey.name}</span>
            <span className={styles.muted} style={{ marginLeft: 'auto' }}>
              {survey.responses.toLocaleString()} responses
            </span>
          </button>
        ))}
        <div className={styles.cardBody}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              if (!name.trim() || !selected) {
                onAction('Name the report and pick a survey to compare');
                return;
              }
              onAction('Comparison report saved');
            }}
          >
            Save comparison
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsConsolidate({ onAction }: ActionProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const count = Object.values(selected).filter(Boolean).length;

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Consolidated Report">
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() =>
            onAction(count ? 'Consolidated report running' : 'Select at least one survey')
          }
        >
          Run report
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        {ANALYTICS_2_OTHER_SURVEYS.map((survey) => {
          const on = !!selected[survey.name];
          return (
            <button
              key={survey.name}
              type="button"
              className={styles.listRow}
              onClick={() => setSelected((prev) => ({ ...prev, [survey.name]: !on }))}
            >
              <span className={on ? styles.checkBoxOn : styles.checkBox}>
                {on ? <span className="wm-check" aria-hidden /> : null}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{survey.name}</span>
              <span className={styles.muted}>{survey.responses.toLocaleString()} responses</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsCorrelation({ onAction }: ActionProps) {
  const [threshold, setThreshold] = useState(0.7);
  const [direct, setDirect] = useState(true);
  const [inverse, setInverse] = useState(false);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Correlation Analysis">
        <WuToggle Label="Direct" labelPosition="right" checked={direct} onChange={setDirect} />
        <WuToggle Label="Inverse" labelPosition="right" checked={inverse} onChange={setInverse} />
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Matrix exported')}>
          Export
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Pearson correlation</h2>
          <label className={styles.toggleRow}>
            Threshold {threshold.toFixed(1)}
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              aria-label="Correlation threshold"
            />
          </label>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" />
              {ANALYTICS_2_CORR_COLS.map((col) => (
                <th key={col} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ANALYTICS_2_CORR_ROWS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {row.vals.map((value, i) => {
                  const hit = value >= threshold && value < 1;
                  return (
                    <td
                      key={`${row.label}-${i}`}
                      style={{
                        background: value === 1 ? '#f8fafc' : hit ? 'rgba(27,135,230,0.14)' : undefined,
                        color: hit ? '#1570c2' : undefined,
                        fontWeight: hit ? 600 : undefined,
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsToolScreen({
  tool,
  onAction,
}: ActionProps & { tool: Analytics2ToolDef }) {
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState(tool.questions[0] ?? tool.listRows[0]?.label ?? '');
  const options = (tool.questions.length ? tool.questions : tool.listRows.map((row) => row.label)).map(
    (label) => ({ value: label, label })
  );
  const selected = options.find((item) => item.value === question) ?? options[0];

  if (tool.mode === 'list' && step === 1) {
    return (
      <div className={styles.screen}>
        <ScreenHeader title={tool.title} meta={tool.subtitle} />
        <div className={styles.card}>
          {tool.listRows.map((row) => (
            <button
              key={row.label}
              type="button"
              className={styles.listRow}
              onClick={() => {
                setQuestion(row.label);
                setStep(2);
              }}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>{row.label}</span>
              <span className={styles.muted}>{row.responses} responses</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className={styles.screen}>
        <ScreenHeader title={tool.title} meta={tool.subtitle} />
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <p className={styles.muted}>{tool.hint}</p>
            <div className={styles.field} style={{ marginTop: '0.75rem' }}>
              <span className={styles.fieldLabel}>Question</span>
              <WuSelect
                data={options}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selected}
                variant="outlined"
                aria-label="Question"
                onSelect={(item) => {
                  const next = item as { value: string } | null;
                  if (next) setQuestion(next.value);
                }}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button type="button" className={styles.primaryBtn} onClick={() => setStep(2)}>
                Run analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.linkBtn} onClick={() => setStep(1)}>
          {tool.title}
        </button>
        <span className="wm-chevron-right" aria-hidden />
        <span>{question}</span>
      </div>
      <ScreenHeader title={tool.resultTitle}>
        <button type="button" className={styles.ghostBtn} onClick={() => onAction(`${tool.title} exported`)}>
          Export
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              {tool.cols.map((col) => (
                <th key={col} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tool.rows.map((cells) => (
              <tr key={cells.join('-')}>
                {cells.map((cell, i) => (
                  <td key={`${cell}-${i}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsConjoint({ onAction }: ActionProps) {
  const [tab, setTab] = useState('importance');
  const tabs = [
    { id: 'importance', label: 'Attribute Importance' },
    { id: 'profiles', label: 'Profiles' },
    { id: 'sim', label: 'Market Share Simulation' },
    { id: 'premium', label: 'Brand Premium' },
  ];

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Conjoint Analysis">
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Conjoint exported')}>
          Export
        </button>
      </ScreenHeader>
      <div className={styles.rangeGroup}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? styles.rangeBtnActive : styles.rangeBtn}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'importance' ? (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Attribute</th>
                <th scope="col">Importance</th>
                <th scope="col">Level</th>
                <th scope="col">Utility</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {ANALYTICS_2_CJ_IMPORTANCE.map((row, index) => (
                <tr key={`${row.level}-${index}`}>
                  <td style={{ fontWeight: row.attr ? 600 : 400 }}>{row.attr}</td>
                  <td>{row.importance}</td>
                  <td>{row.level}</td>
                  <td>
                    {row.utility > 0 ? '+' : ''}
                    {row.utility.toFixed(2)}
                  </td>
                  <td>
                    <div className={styles.utilBar}>
                      {row.utility < 0 ? (
                        <div className={styles.utilNeg} style={{ width: `${Math.abs(row.utility) * 160}px` }} />
                      ) : (
                        <div className={styles.utilPos} style={{ width: `${row.utility * 160}px` }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'sim' ? (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Market share</h2>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onAction('Simulation updated')}
            >
              Run simulation
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Concept</th>
                <th scope="col">Spec</th>
                <th scope="col" className={styles.right}>
                  Votes
                </th>
                <th scope="col" className={styles.right}>
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Concept - 1</td>
                <td>5ft 7 inches · 86 KG · 9/10 · 8/10</td>
                <td className={styles.right}>816.5</td>
                <td className={styles.right}>49.45%</td>
              </tr>
              <tr>
                <td>Concept - 2</td>
                <td>6 ft · 76 Kg · 7/10 · 9/10</td>
                <td className={styles.right}>834.5</td>
                <td className={styles.right}>50.55%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.splitEqual}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Best profile</h2>
            </div>
            <div className={styles.cardBody}>
              <p>6ft 3 inches · 86 KG · 10/10 · 10/10</p>
              <p className={styles.muted}>+186% vs average</p>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Worst profile</h2>
            </div>
            <div className={styles.cardBody}>
              <p>5ft 7 inches · 66 Kg · 7/10 · 7/10</p>
              <p className={styles.muted}>−100% vs average</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsWordCloud({ onAction }: ActionProps) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Word Cloud">
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Word cloud exported')}>
          Export
        </button>
      </ScreenHeader>
      {ANALYTICS_2_WORD_CLOUDS.map((cloud) => (
        <section key={cloud.title} className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{cloud.title}</h2>
          </div>
          <div className={styles.wordCloud}>
            {cloud.words.map((word) => (
              <span
                key={word.word}
                className={styles.word}
                style={{ fontSize: `${word.size / 16}rem`, color: word.color }}
              >
                {word.word}
              </span>
            ))}
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Word</th>
                <th scope="col" className={styles.right}>
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {cloud.counts.map((row) => (
                <tr key={row.word}>
                  <td>{row.word}</td>
                  <td className={styles.num}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

export function AnalyticsSearchText({ onAction }: ActionProps) {
  const [query, setQuery] = useState('');
  const rows = ANALYTICS_2_SEARCH_ROWS.filter(
    (row) =>
      !query.trim() ||
      row.code.toLowerCase().includes(query.toLowerCase()) ||
      row.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Search Open Ended Text" meta={`${rows.length} questions`}>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => onAction('Text index refresh started')}
        >
          Refresh index
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <input
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
          />
        </div>
        {rows.map((row) => (
          <button
            key={`${row.code}-${row.label}`}
            type="button"
            className={styles.listRow}
            onClick={() => onAction(`Searching ${row.code}`)}
          >
            <span className={styles.muted} style={{ width: '4.5rem' }}>
              {row.code}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{row.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsFilters({
  onAction,
  onCreate,
}: ActionProps & { onCreate: () => void }) {
  const [filters, setFilters] = useState([
    { id: 1, name: 'kartik', status: 'All responses', quality: 'All responses', time: '—', responses: 0 },
  ]);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Data Filters" meta={`${filters.length} filter${filters.length === 1 ? '' : 's'}`}>
        <button type="button" className={styles.primaryBtn} onClick={onCreate}>
          <span className="wm-add" aria-hidden />
          New filter
        </button>
      </ScreenHeader>
      {filters.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <EmptyState
              icon="wm-filter-alt"
              title="No data filters"
              description="Create a filter to slice responses by question, status, or system variable."
            />
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Quality</th>
                <th scope="col">Time</th>
                <th scope="col" className={styles.right}>
                  Responses
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {filters.map((filter) => (
                <tr key={filter.id}>
                  <td>
                    <button type="button" className={styles.linkBtn} onClick={onCreate}>
                      {filter.name}
                    </button>
                  </td>
                  <td>{filter.status}</td>
                  <td>{filter.quality}</td>
                  <td>{filter.time}</td>
                  <td className={styles.right}>{filter.responses}</td>
                  <td className={styles.right}>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => {
                        setFilters((prev) => prev.filter((item) => item.id !== filter.id));
                        onAction('Filter deleted');
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AnalyticsWeighting({ onAction }: ActionProps) {
  const [added, setAdded] = useState(false);
  const [vals, setVals] = useState<Record<string, number>>({
    Male: 0,
    Female: 0,
    Other: 0,
    NA: 0,
  });
  const sum = Math.round(Object.values(vals).reduce((total, value) => total + value, 0) * 100) / 100;
  const valid = sum === 100;

  if (!added) {
    return (
      <div className={styles.screen}>
        <ScreenHeader title="Weighting & Balancing" />
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <p className={styles.muted}>Add a question to set target proportions.</p>
            <div className={styles.field} style={{ marginTop: '0.75rem' }}>
              <span className={styles.fieldLabel}>Question</span>
              <WuSelect
                data={ANALYTICS_2_WEIGHT_QUESTIONS.map((label) => ({ value: label, label }))}
                accessorKey={{ value: 'value', label: 'label' }}
                variant="outlined"
                placeholder="Select a question"
                aria-label="Weighting question"
                onSelect={(item) => {
                  const next = item as { value: string } | null;
                  if (!next) return;
                  setAdded(true);
                  onAction('Question added successfully');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Weighting & Balancing">
        <span className={styles.meta} style={{ color: valid ? '#16a34a' : '#dc2626' }}>
          Sum {sum}
        </span>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() =>
            onAction(valid ? 'Weighting saved' : 'Balance proportion must add up to 100')
          }
        >
          Save
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col" className={styles.right}>
                Current %
              </th>
              <th scope="col" className={styles.right}>
                Count
              </th>
              <th scope="col" className={styles.right}>
                Target %
              </th>
            </tr>
          </thead>
          <tbody>
            {ANALYTICS_2_WEIGHT_ROWS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className={styles.right}>{row.current}</td>
                <td className={styles.right}>{row.count}</td>
                <td className={styles.right}>
                  <input
                    className={styles.input}
                    type="number"
                    style={{ width: '5rem', height: '1.75rem' }}
                    value={vals[row.label]}
                    onChange={(event) =>
                      setVals((prev) => ({
                        ...prev,
                        [row.label]: parseFloat(event.target.value) || 0,
                      }))
                    }
                    aria-label={`${row.label} target percent`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsQuality({ onAction }: ActionProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(ANALYTICS_2_QUALITY_FLAGS.map((item) => [item.key, item.defaultOn]))
  );

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Data Quality">
        <button type="button" className={styles.primaryBtn} onClick={() => onAction('Data quality settings saved')}>
          Save
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        {ANALYTICS_2_QUALITY_FLAGS.map((item) => (
          <div key={item.key} className={styles.listRow}>
            <span style={{ flex: 1 }}>{item.label}</span>
            <WuToggle
              Label=""
              checked={!!flags[item.key]}
              onChange={(checked) => setFlags((prev) => ({ ...prev, [item.key]: checked }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDeviceAudit({ onAction }: ActionProps) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Device Audit">
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Device audit exported')}>
          Export
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Browser</th>
              <th scope="col">OS</th>
              <th scope="col">Device</th>
              <th scope="col" className={styles.right}>
                Count
              </th>
              <th scope="col" className={styles.right}>
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {ANALYTICS_2_DEVICE_AUDIT.map((row) => (
              <tr key={`${row.browser}-${row.os}`}>
                <td>{row.browser}</td>
                <td>{row.os}</td>
                <td>{row.device}</td>
                <td className={styles.num}>{row.count}</td>
                <td className={styles.right}>{row.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsExport({ onAction }: ActionProps) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Export Data" />
      <div className={styles.exportGrid}>
        {ANALYTICS_2_EXPORT_SECTIONS.map((section) => (
          <section key={section.title} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>{section.title}</h2>
                <p className={styles.muted} style={{ margin: '0.25rem 0 0' }}>
                  {section.subtitle}
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => onAction(`${section.title} started — you will get an email when ready`)}
              >
                Export
              </button>
            </div>
            <div className={styles.cardBody}>
              {section.fields.map((field) => (
                <div key={field.label} className={styles.field} style={{ marginBottom: '0.75rem' }}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <div className={styles.input} style={{ display: 'flex', alignItems: 'center' }}>
                    {field.value}
                  </div>
                </div>
              ))}
              {section.toggles.length > 0 ? (
                <div className={styles.exportToggles}>
                  {section.toggles.map((toggle) => (
                    <WuToggle
                      key={toggle.label}
                      Label={toggle.label}
                      labelPosition="right"
                      checked={toggle.defaultOn}
                      onChange={() => onAction(`${toggle.label} updated`)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsImport({ onAction }: ActionProps) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Import Data" />
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <p className={styles.muted}>
            Download a template, fill it with responses, then upload it to append data.
          </p>
          <div className={styles.toolbar} style={{ marginTop: '1rem' }}>
            <button type="button" className={styles.ghostBtn} onClick={() => onAction('Template downloaded')}>
              Download template
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => onAction('Choose a file first')}>
              Upload file
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onAction('Choose the filled template file first')}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsMerge({ onAction }: ActionProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    focus: true,
    'Issue. take': true,
    Tourism: true,
  });
  const names = ANALYTICS_2_MERGE_SURVEYS.filter((name) => selected[name]);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Merge Data 2.0">
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() =>
            onAction(
              names.length ? 'Merge started — you will be notified when complete' : 'Select at least one survey'
            )
          }
        >
          Merge
        </button>
      </ScreenHeader>
      <div className={styles.card}>
        {ANALYTICS_2_MERGE_SURVEYS.map((name) => {
          const on = !!selected[name];
          return (
            <button
              key={name}
              type="button"
              className={styles.listRow}
              onClick={() => setSelected((prev) => ({ ...prev, [name]: !on }))}
            >
              <span className={on ? styles.checkBoxOn : styles.checkBox}>
                {on ? <span className="wm-check" aria-hidden /> : null}
              </span>
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsScheduler({ onAction }: ActionProps) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<{ name: string; freq: string; next: string }[]>([]);
  const freqOptions = ['Daily', 'Weekly', 'Monthly'].map((label) => ({ value: label, label }));
  const [freq, setFreq] = useState(freqOptions[2]);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Scheduler" meta={`${rows.length} event${rows.length === 1 ? '' : 's'}`} />
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.splitEqual}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="sch-name">
                Schedule name
              </label>
              <input
                id="sch-name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Monthly raw data"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Frequency</span>
              <WuSelect
                data={freqOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={freq}
                variant="outlined"
                aria-label="Frequency"
                onSelect={(item) => {
                  const next = item as { value: string; label: string } | null;
                  if (next) setFreq(next);
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                const trimmed = name.trim();
                if (!trimmed) {
                  onAction('Give the schedule a name');
                  return;
                }
                setRows((prev) => [
                  ...prev,
                  {
                    name: trimmed,
                    freq: freq.label,
                    next:
                      freq.value === 'Daily'
                        ? 'Aug 15, 2026 · 12:00 AM'
                        : freq.value === 'Weekly'
                          ? 'Aug 18, 2026 · 12:00 AM'
                          : 'Sep 1, 2026 · 12:00 AM',
                  },
                ]);
                setName('');
                onAction('Scheduler event created');
              }}
            >
              Create schedule
            </button>
          </div>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Frequency</th>
                <th scope="col">Next run</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.name}-${row.next}`}>
                  <td>{row.name}</td>
                  <td>{row.freq}</td>
                  <td>{row.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <EmptyState
              icon="wm-event"
              title="No scheduled reports"
              description="Create a schedule to email exports on a daily, weekly, or monthly cadence."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsDownloads({ onAction }: ActionProps) {
  return (
    <div className={styles.screen}>
      <ScreenHeader title="Download Center" meta={`${ANALYTICS_2_DOWNLOAD_JOBS.length} jobs`}>
        <button type="button" className={styles.ghostBtn} onClick={() => onAction('Job list refreshed')}>
          Refresh
        </button>
      </ScreenHeader>
      <div className={styles.card} style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Job ID</th>
              <th scope="col">Date</th>
              <th scope="col">Report</th>
              <th scope="col">File</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {ANALYTICS_2_DOWNLOAD_JOBS.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.date}</td>
                <td>{job.report}</td>
                <td>{job.file}</td>
                <td>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => onAction(`Downloading ${job.file}`)}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalyticsDelete({ onAction }: ActionProps) {
  const sections = [
    {
      title: 'Clear all responses',
      cta: 'Clear responses',
      message: 'This permanently deletes all responses — confirmation required',
    },
    {
      title: 'Clear all test responses',
      cta: 'Clear responses',
      message: 'This permanently deletes all test responses — confirmation required',
    },
    {
      title: 'Clear audit data',
      cta: 'Clear data',
      message: 'This permanently deletes audit data — confirmation required',
    },
  ];

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Delete Responses" />
      {sections.map((section) => (
        <section key={section.title} className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>{section.title}</h2>
            <button type="button" className={styles.ghostBtn} onClick={() => onAction(section.message)}>
              {section.cta}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

export function AnalyticsFilterModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('kartik');
  if (!open) return null;

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgb(15 23 42 / 45%)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
        zIndex: 80,
      }}
      onClick={onClose}
    >
      <div
        className={styles.card}
        style={{ width: '32rem', maxWidth: 'calc(100vw - 3rem)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Data Filter</h2>
          <button type="button" className={styles.linkBtn} onClick={onClose} aria-label="Close">
            <span className="wm-close" aria-hidden />
          </button>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="nf-name">
              Filter name
            </label>
            <input
              id="nf-name"
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
          <p className={styles.muted} style={{ marginTop: '0.75rem' }}>
            IF Question 1. [Q3] Question 3 Row 1 is Column 1, Column 2
          </p>
        </div>
        <div className={styles.cardHeader}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              if (!name.trim()) return;
              onSave(name.trim());
            }}
          >
            Save filter
          </button>
        </div>
      </div>
    </div>
  );
}
