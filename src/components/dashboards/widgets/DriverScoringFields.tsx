'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';
import { KpiScoringFields } from '@/components/text-ai/TextAiKpiSetupFields';
import styles from '@/components/text-ai/TextAiKpiSetupFields.module.css';
import { validateKpiScoring, type KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import type { DriverOutcome } from '@/data/driver-scoring';

export function DriverScoringFields({ outcome, value, onChange, showPrimary = true }: {
  outcome: DriverOutcome;
  showPrimary?: boolean;
  value: KpiScoring;
  onChange: (value: KpiScoring) => void;
}) {
  const wick = useWickUILib();
  if (!wick) return null;
  const { WuInput } = wick;
  const error = validateKpiScoring(value, outcome.answers.map(a => a.score));
  return <div className={styles.fields}>
    {showPrimary && <p><strong>Primary question</strong><br />{outcome.label}</p>}
    <WuInput Label="KPI name" aria-label="KPI name" labelPosition="top" variant="outlined" maxLength={60}
      value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} />
    <KpiScoringFields value={value} answers={outcome.answers} onChange={onChange}
      defaultName={metric => metric === 'mean' ? 'Mean' : metric.toUpperCase()} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
