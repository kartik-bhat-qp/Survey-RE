'use client';
import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as wc from '@amcharts/amcharts5/wc';
import styles from './WordCloudWidget.module.css';

export interface WordCloudSettings {
  name: string; showName: boolean; highlighted: boolean; minimum: number;
  stopWords: string[]; stats: boolean; slicer: string; filter: string;
  design: string; theme: string; color: string; palette: string; fontSize: string; fontFamily: string;
}
export const DEFAULT_WORD_CLOUD_SETTINGS: WordCloudSettings = {
  name: 'Suggestions/ Comments', showName: true, highlighted: false, minimum: 4,
  stopWords: [], stats: false, slicer: 'Dashboard', filter: 'Dashboard',
  design: 'Dashboard', theme: 'Default', color: '#6575aa', palette: 'Categorical', fontSize: 'Medium', fontFamily: 'Fira Sans',
};
export const WORD_CLOUD_MAX_STOP_WORDS = 100;
export function parseStopWords(raw: string): string[] {
  const words: string[] = []; let word = '';
  const push = () => { if (word.trim()) words.push(word.trim()); word = ''; };
  const value = raw.replace(/\r\n?/g, '\n');
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\' && i + 1 < value.length) {
      const next = value[i + 1];
      if ([',', '\n', '\\', 'n'].includes(next)) { word += next === 'n' ? '\n' : next; i++; }
      else word += c;
    } else if (c === ',' || c === '\n' || c === '\t') push();
    else word += c;
  }
  push(); return words;
}
const TERMS = [
  { word: 'auto-generated', value: 140 }, { word: 'response', value: 140 }, { word: 'suggestion', value: 140 },
  ...['verification', 'feedback', 'customer', 'questions', 'answered', 'completed', 'exactly', 'three', 'five', 'answers', 'test', 'text', 'asdfasdf'].map((word, i) => ({ word, value: 4 + i % 4 })),
  ...Array.from({ length: 40 }, (_, i) => ({ word: `#${100 + i}`, value: 1 })),
];
export function WordCloudWidget({ settings = DEFAULT_WORD_CLOUD_SETTINGS }: { settings?: WordCloudSettings }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const root = am5.Root.new(ref.current);
    const series = root.container.children.push(wc.WordCloud.new(root, {
      categoryField: 'word', valueField: 'value', angles: [0, -90],
      minFontSize: 7, maxFontSize: settings.fontSize === 'Large' ? 88 : settings.fontSize === 'Extra large' ? 100 : settings.fontSize === 'Small' ? 52 : settings.fontSize === 'Extra small' ? 40 : 72,
    }));
    series.labels.template.setAll({ fill: am5.color(settings.design === 'Dashboard' ? '#6575aa' : settings.color), fontFamily: settings.fontFamily, tooltipText: '{category}: {value}' });
    const stops = new Set(settings.stopWords.map(word => word.toLowerCase()));
    series.data.setAll(TERMS.filter(item => item.word.length >= settings.minimum && !stops.has(item.word.toLowerCase())));
    return () => root.dispose();
  }, [settings]);
  return <div className={styles.visual}>
    {settings.slicer !== 'None' && <div className={styles.slicers}><span>Overall</span></div>}
    <div ref={ref} className={styles.cloud} role="img" aria-label="Suggestions and comments word cloud" />
    {settings.stats && <div className={styles.stats}>Answered&nbsp; 143</div>}
    {settings.highlighted && <p className={styles.stats}>The most frequent terms are shown in larger text.</p>}
  </div>;
}
