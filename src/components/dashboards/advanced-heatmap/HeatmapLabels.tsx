'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { heatmapAnswerSlots, type AdvancedHeatmapConfig, type HeatmapQuestion } from '@/data/advanced-heatmap';
import { supportsAdvancedHeatmap } from './HeatmapSetup';
import styles from './AdvancedHeatmap.module.css';

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuSelect })), { ssr: false });
const WuToggle = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuToggle })), { ssr: false });

type Kind = 'answer';
interface LabelItem { id: string; label: string }
interface Props { questions: HeatmapQuestion[]; draft: AdvancedHeatmapConfig; update: (patch: Partial<AdvancedHeatmapConfig>) => void }

export function HeatmapLabels({ questions, draft, update }: Props) {
  const [questionSearch, setQuestionSearch] = useState('');
  const selected = questions.filter(q => q.rows.some(r => draft.selected.includes(r.id)));
  const questionOptions = questions.map(q => ({ value: q.id, label: `${q.code}. ${q.label}${supportsAdvancedHeatmap(q) ? '' : ' — Unavailable'}`, disabled: !supportsAdvancedHeatmap(q) }));
  const slots = heatmapAnswerSlots(selected, draft);
  const answerItems = slots.map(s => ({ id: s.key, label: s.label }));
  const groups: {id:string; label:string; kind:Kind; members:string[]}[] = [];
  function rename(id: string, label: string, kind: Kind) {
    if (groups.some(g => g.id === id)) update({ labelGroups: groups.map(g => g.id === id ? { ...g, label } : g) });
    else if (kind === 'answer') update({ columnAliases: { ...draft.columnAliases, [id]: label } });
    else update({ aliases: { ...draft.aliases, [id]: label } });
  }
  function labelList(items: LabelItem[], kind: Kind) {
    const used = new Set<string>();
    const list = items.flatMap(item => {
      const group = groups.find(g => g.kind === kind && g.members.includes(item.id));
      if (!group) return [{ ...item, members: [item.id] }];
      if (used.has(group.id)) return [];
      used.add(group.id);
      return [{ id: group.id, label: group.label, members: group.members.filter(id => items.some(i => i.id === id)) }];
    });
    const order = (kind === 'answer' ? draft.columnOrder : draft.rowOrder) ?? [];
    list.sort((a,b) => (order.includes(a.id) ? order.indexOf(a.id) : order.length) - (order.includes(b.id) ? order.indexOf(b.id) : order.length));
    function move(from: string, to: string) {
      const ids = list.map(i => i.id).filter(id => id !== from);
      ids.splice(ids.indexOf(to), 0, from);
      update(kind === 'answer' ? { columnOrder: ids } : { rowOrder: ids });
    }
    return <ul className={styles.editableLabels}>{list.map((item,index) => {
      const excluded = kind === 'answer' ? draft.excludedColumns ?? [] : draft.excluded;
      return <li key={item.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', item.id)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'); if (list.some(i => i.id === from)) move(from,item.id); }}>
        <button type="button" className={styles.orderHandle} aria-label={`Move ${item.label} up`} disabled={index === 0} onClick={() => move(item.id,list[index-1].id)} title="Drag to reorder, or click to move up">⠿</button>
        <input aria-label={`Rename ${kind === 'answer' ? 'column' : 'row'} ${item.label}`} value={item.label} onChange={e => rename(item.id,e.target.value,kind)} />
        <WuToggle aria-label={`Exclude ${item.label} from analysis`} checked={item.members.every(id => excluded.includes(id))} onChange={checked => {
          const next = checked ? [...new Set([...excluded,...item.members])] : excluded.filter(id => !item.members.includes(id));
          update(kind === 'answer' ? { excludedColumns: next } : { excluded: next });
        }} />
      </li>;
    })}</ul>;
  }
  return <>
    <div className={styles.field}><span>Questions</span>
      <WuSelect aria-label="Select questions" multiple variant="outlined" className={styles.questionSelect} maxHeight={300} maxContentWidth="410px"
        accessorKey={{ value: 'value', label: 'label' }}
        data={questionOptions.filter(q => q.label.toLowerCase().includes(questionSearch.toLowerCase()))}
        value={questionOptions.filter(q => selected.some(s => s.id === q.value))}
        CustomTrigger={<span>{selected.length ? `${selected.length} out of ${questions.filter(supportsAdvancedHeatmap).length} selected` : 'Select questions'}</span>}
        Header={<div className={styles.questionSearch}><input aria-label="Search questions" placeholder="Search questions" value={questionSearch} onChange={e => setQuestionSearch(e.target.value)} onKeyDown={e => { if (e.key !== 'Escape' && e.key !== 'Tab') e.stopPropagation(); }} />{!questionOptions.some(q => q.label.toLowerCase().includes(questionSearch.toLowerCase())) && <p>No questions found</p>}</div>}
        onSelect={value => {
          const chosen = value as typeof questionOptions;
          const selected = questions.filter(q => supportsAdvancedHeatmap(q) && chosen.some(option => option.value === q.id)).flatMap(q => q.rows.map(row => row.id));
          // WickUI invokes multi-select callbacks inside its state updater.
          // Defer the parent update until that render has finished.
          queueMicrotask(() => update({ selected }));
        }} />
    </div>
    {draft.mode === 'distribution' && <div className={styles.labelsHeading}><span>Answer labels</span></div>}
    {draft.mode === 'distribution' && <div className={styles.excludeHeading}>Exclude from analysis</div>}
    {draft.mode === 'distribution' && labelList(answerItems,'answer')}
  </>;
}
