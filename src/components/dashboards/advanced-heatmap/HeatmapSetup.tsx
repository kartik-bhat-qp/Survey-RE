'use client';

import { WidgetQuestionSelection } from '../WidgetQuestionSelection';
import { constrainHeatmapSelection, heatmapQuestionUnavailableReason, heatmapSelectionError, MAX_ADVANCED_HEATMAP_QUESTIONS, ANALYSIS_MODES, type AnalysisMode, type HeatmapQuestion } from '@/data/advanced-heatmap';
import styles from './AdvancedHeatmap.module.css';

export { supportsAdvancedHeatmap } from '@/data/advanced-heatmap';
export function HeatmapQuestionPicker({ surveyId, questions, selected, onChange }: { surveyId: number; questions: HeatmapQuestion[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const unavailableReasons = Object.fromEntries(questions.flatMap(q => {
    const reason = heatmapQuestionUnavailableReason(q, questions, selected);
    return reason ? [[Number(q.id), reason]] : [];
  }));
  return <><WidgetQuestionSelection surveyId={surveyId} multiSelect wholeQuestionsOnly showSelectionCount selectionLimit={MAX_ADVANCED_HEATMAP_QUESTIONS}
    unavailableQuestionIds={Object.keys(unavailableReasons).map(Number)} unavailableQuestionReasons={unavailableReasons}
    selectedQuestionIds={questions.filter(q => q.rows.some(r => selected.includes(r.id))).map(q => Number(q.id))}
    onSelectionChange={ids => onChange(constrainHeatmapSelection(questions, selected, questions.filter(q => ids.includes(Number(q.id))).flatMap(q => q.rows.map(r => r.id))))} />{selected.length > 0 && heatmapSelectionError(questions, selected) && <p role="alert" className={styles.error}>{heatmapSelectionError(questions, selected)}</p>}</>;
}
export function HeatmapAnalysisPicker({ mode, onChange }: { mode: AnalysisMode; onChange: (mode: AnalysisMode) => void }) {
  return <div role="radiogroup" aria-label="Analysis type" className={styles.modes}>{ANALYSIS_MODES.map(item => <button key={item.id} type="button" role="radio" aria-checked={mode === item.id} onClick={() => onChange(item.id)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); onChange(mode === 'segments' ? 'distribution' : 'segments'); } }} className={styles.mode}>
    <div className={styles.mini} aria-hidden>{Array.from({length:15},(_,i) => <span key={i} />)}</div>
    <strong>{item.title}</strong><p>{item.description}</p>
  </button>)}</div>;
}
