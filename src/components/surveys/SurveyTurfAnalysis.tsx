'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  TURF_ANALYSIS_TABS,
  TURF_DEFAULT_COSTS,
  TURF_PRICE_COST_OPTIONS,
  TURF_SIMULATION_COUNT_OPTIONS,
  getTurfCostValue,
  type TurfAnalysisTabId,
} from '@/data/mock-turf-analysis';
import styles from './SurveyTurfAnalysis.module.css';

export function SurveyTurfAnalysis() {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<TurfAnalysisTabId>('price');
  const [budget, setBudget] = useState('0');
  const [tolerance, setTolerance] = useState('0');
  const [simCount, setSimCount] = useState('1');
  const [costs, setCosts] = useState<Record<string, string>>({ ...TURF_DEFAULT_COSTS });

  function handleTabSelect(tabId: TurfAnalysisTabId, label: string) {
    if (tabId === 'price') {
      setActiveTab(tabId);
      return;
    }
    showToast({ message: `${label} is not part of this redesign`, variant: 'info' });
  }

  function bumpTolerance(delta: number) {
    setTolerance(String(Math.max(0, (parseFloat(tolerance) || 0) + delta)));
  }

  function updateCost(option: string, value: string) {
    setCosts((prev) => ({ ...prev, [option]: value }));
  }

  return (
    <div className={styles.shell}>
      <div className={styles.main}>
        <div className={styles.panel}>
          <div className={styles.tabs} role="tablist" aria-label="TURF analysis views">
            {TURF_ANALYSIS_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                  onClick={() => handleTabSelect(tab.id, tab.label)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'price' ? (
            <div className={styles.body}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Price Modeling</h2>
                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={() =>
                    showToast({ message: 'XLS export started', variant: 'success' })
                  }
                >
                  <span className={`wm-download ${styles.exportIcon}`} aria-hidden />
                  XLS
                </button>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Estimated Budget</span>
                <input
                  className={styles.input}
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  aria-label="Estimated Budget"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tolerance %</span>
                <span className={styles.toleranceWrap}>
                  <input
                    className={styles.toleranceInput}
                    type="text"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    aria-label="Tolerance %"
                  />
                  <span className={styles.spinner}>
                    <button
                      type="button"
                      className={styles.spinnerBtn}
                      aria-label="Increase tolerance"
                      onClick={() => bumpTolerance(1)}
                    >
                      <span className="wm-arrow-drop-up" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.spinnerBtn}
                      aria-label="Decrease tolerance"
                      onClick={() => bumpTolerance(-1)}
                    >
                      <span className="wm-arrow-drop-down" aria-hidden />
                    </button>
                  </span>
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Simulation Count</span>
                <span className={styles.selectWrap}>
                  <select
                    className={styles.select}
                    value={simCount}
                    onChange={(e) => setSimCount(e.target.value)}
                    aria-label="Simulation Count"
                  >
                    {TURF_SIMULATION_COUNT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className={`wm-arrow-drop-down ${styles.selectChevron}`} aria-hidden />
                </span>
              </label>

              <div className={styles.costBlock}>
                <div className={styles.costIntro}>
                  <h2 className={styles.sectionTitle}>Weight/Cost</h2>
                  <p className={styles.costHint}>Per-answer cost. 0 means no cost.</p>
                </div>
                <div className={styles.costList}>
                  {TURF_PRICE_COST_OPTIONS.map((option) => {
                    const value = getTurfCostValue(costs, option);
                    const numeric = parseFloat(value);
                    const isNegative = !Number.isNaN(numeric) && numeric < 0;
                    const isZero = !isNegative && (Number.isNaN(numeric) || numeric === 0);
                    return (
                      <label key={option} className={styles.field}>
                        <span className={styles.fieldLabel}>{option}</span>
                        <input
                          className={`${styles.input} ${
                            isNegative ? styles.inputNegative : isZero ? styles.inputZero : ''
                          }`}
                          type="text"
                          value={value}
                          onChange={(e) => updateCost(option, e.target.value)}
                          aria-label={`Cost for ${option}`}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() =>
                    showToast({ message: 'Simulating price model…', variant: 'info' })
                  }
                >
                  Simulate price model
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.body}>
              <p className={styles.placeholder}>
                {TURF_ANALYSIS_TABS.find((tab) => tab.id === activeTab)?.label} is not part of
                this redesign yet. Use Price Modeling to continue.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
