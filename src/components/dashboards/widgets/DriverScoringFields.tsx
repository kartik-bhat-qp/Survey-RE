'use client';

import { useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { KpiScoringFields } from '@/components/text-ai/TextAiKpiSetupFields';
import styles from '@/components/text-ai/TextAiKpiSetupFields.module.css';
import { validateKpiScoring, type KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import { driverDefaultScoring, type DriverOutcome } from '@/data/driver-scoring';

export function DriverScoringFields({ outcome, drivers, primaryScoring, driverScoring, onPrimaryChange, onDriverChange }: {
  outcome: DriverOutcome;
  drivers: DriverOutcome[];
  primaryScoring: KpiScoring;
  driverScoring: Record<string, KpiScoring>;
  onPrimaryChange: (value: KpiScoring) => void;
  onDriverChange: (id: string, value: KpiScoring) => void;
}) {
  const [selected, setSelected] = useState(outcome.rowId);
  const wick = useWickUILib();
  if (!wick) return null;
  const { WuInput } = wick;
  const question = drivers.find(driver => driver.rowId === selected) ?? outcome;
  const primary = question.rowId === outcome.rowId;
  const value = primary ? primaryScoring : driverScoring[question.rowId] ?? driverDefaultScoring(question, 'mean');
  const onChange = (next: KpiScoring) => primary ? onPrimaryChange(next) : onDriverChange(question.rowId, next);
  const error = validateKpiScoring(value, question.answers.map(a => a.score));
  return <div className={styles.fields}>
    <label className={styles.field}>Rating to configure
      <select value={question.rowId} onChange={event => setSelected(event.target.value)}>
        <optgroup label="Primary rating"><option value={outcome.rowId}>{outcome.label}</option></optgroup>
        <optgroup label="Driver ratings">{drivers.map(driver => <option key={driver.rowId} value={driver.rowId}>{driver.label}</option>)}</optgroup>
      </select>
    </label>
    <p>Answer scores and exclusions apply to both the rating and the diagnosis. Decimal precision controls the display.</p>
    <WuInput Label="KPI name" aria-label="KPI name" labelPosition="top" variant="outlined" maxLength={60}
      value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} />
    <KpiScoringFields value={value} answers={question.answers} onChange={onChange}
      defaultName={metric => metric === 'mean' ? 'Mean' : metric.toUpperCase()} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
