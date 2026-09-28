'use client';

import { WidgetQuestionSelection } from '../WidgetQuestionSelection';
import { ANALYSIS_MODES, type AnalysisMode, type HeatmapQuestion } from '@/data/advanced-heatmap';
import styles from './AdvancedHeatmap.module.css';

export function supportsAdvancedHeatmap(question: HeatmapQuestion) {
  return ['Single Select', 'Multiple Select', 'Matrix Uni choice', 'Flex Matrix', 'NPS'].includes(question.type);
}
export function HeatmapQuestionPicker({ surveyId, questions, selected, onChange }: { surveyId: number; questions: HeatmapQuestion[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return <WidgetQuestionSelection surveyId={surveyId} multiSelect wholeQuestionsOnly showSelectionCount
    unavailableQuestionIds={questions.filter(q => !supportsAdvancedHeatmap(q)).map(q => Number(q.id))}
    selectedQuestionIds={questions.filter(q => q.rows.some(r => selected.includes(r.id))).map(q => Number(q.id))}
    onSelectionChange={ids => onChange(questions.filter(q => ids.includes(Number(q.id))).flatMap(q => q.rows.map(r => r.id)))} />;
}
export function HeatmapAnalysisPicker({ mode, onChange }: { mode: AnalysisMode; onChange: (mode: AnalysisMode) => void }) {
  return <div role="radiogroup" aria-label="Analysis type" className={styles.modes}>{ANALYSIS_MODES.map(item => <button key={item.id} type="button" role="radio" aria-checked={mode === item.id} onClick={() => onChange(item.id)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); onChange(mode === 'segments' ? 'distribution' : 'segments'); } }} className={styles.mode}>
    <div className={styles.mini} aria-hidden>{Array.from({length:15},(_,i) => <span key={i} />)}</div>
    <strong>{item.title}</strong><p>{item.description}</p>
  </button>)}</div>;
}
