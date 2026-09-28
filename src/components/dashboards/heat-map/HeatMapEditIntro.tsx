'use client';

import Image from 'next/image';
import { ADVANCED_WIDGET_TYPES } from '@/data/mock-advanced-widget-types';
import styles from './HeatMapBaseline.module.css';

/** The production editor's first step is a sample preview, not response data. */
export function HeatMapEditIntro({ name, onNameChange }: { name: string; onNameChange: (name: string) => void }) {
  return <div className={styles.editIntro}>
    <label className={styles.field}><span>Name</span><input aria-label="Edit widget name" value={name} onChange={event => onNameChange(event.target.value)} /></label>
    <div className={styles.editIntroColumns}>
      <div className={styles.widgetTypes} aria-label="Widget types">
        {ADVANCED_WIDGET_TYPES.filter(type => type.id !== 'driver-analysis').map(type => <button key={type.id} aria-pressed={type.id === 'heat-map'} disabled={type.id !== 'heat-map'} title={type.id === 'heat-map' ? 'Heat map' : 'This fixed prototype retains its Heat Map Chart type'}><Image src={type.imageSrc} alt="" width={80} height={70} style={{ width:80, height:70, objectFit:'contain' }} /><span>{type.name}</span></button>)}
      </div>
      <div className={styles.editPreview} aria-label="Sample heat map preview">
        <h3>{name || 'Name'}<span className="wm-lightbulb-outline" aria-hidden /></h3>
        <table><thead><tr><th>Statement</th><th>Overall</th></tr></thead><tbody><tr><th>Response count</th><td>124</td></tr><tr><th>Gender</th><td>1</td></tr><tr><th>Colors you like</th><td>2</td></tr></tbody></table>
      </div>
    </div>
  </div>;
}
