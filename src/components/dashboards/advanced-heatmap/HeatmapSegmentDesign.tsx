'use client';

import type { CSSProperties } from 'react';
import type { AdvancedHeatmapConfig } from '@/data/advanced-heatmap';
import { SENTIMENT_COLORS, defaultHeatMapSettings, resolveHeatMapDesign } from '@/data/heat-map-baseline';
import type { DashboardDesign } from '@/data/dashboard-design';
import { DesignColorPicker } from '../DesignColorPicker';
import { Select, Scope } from '../heat-map/HeatMapSettingsControls';
import { HeatMapSelect } from '../heat-map/HeatMapSelect';
import styles from '../heat-map/HeatMapBaseline.module.css';

export function segmentColors(config: AdvancedHeatmapConfig, dashboard?: DashboardDesign): string[] {
  if (config.designType !== 'Widget') return dashboard?.sentiment === 'custom' ? dashboard.customSentiment : SENTIMENT_COLORS;
  return config.sentimentColors ?? SENTIMENT_COLORS;
}

const fontSizes = [11,12,14,16,18];
const fontLabels = ['Extra small','Small','Medium','Large','Extra large'];
export function segmentWidgetStyle(config: AdvancedHeatmapConfig, dashboard?: DashboardDesign): CSSProperties {
  const design = resolveHeatMapDesign({...defaultHeatMapSettings(), designType:config.designType??'Dashboard', fontFamily:config.fontFamily??'Fira Sans', fontSize:fontLabels[fontSizes.indexOf(config.fontSize??14)]??'Medium', themeColor:config.themeColor??'#3f559a'},dashboard);
  return {'--advanced-title-color':design.themeColor,'--dashboard-widget-font-family':design.fontFamily,'--dashboard-widget-body-size':`${design.bodySize}px`,'--dashboard-widget-title-size':`${design.titleSize}px`} as CSSProperties;
}

export function HeatmapSegmentDesign({draft,update}:{draft:AdvancedHeatmapConfig;update:(patch:Partial<AdvancedHeatmapConfig>)=>void}) {
  return <>
    <Scope label="Design type" value={draft.designType??'Dashboard'} options={['Dashboard','Widget']} onChange={designType=>update({designType:designType as AdvancedHeatmapConfig['designType']})}/>
    {draft.designType==='Widget' && <div className={styles.designControls}>
      <Select label="Theme" value="Default" options={['Default']} onChange={()=>{}}/>
      <div className={styles.themeColorRow}><span>Theme color</span><DesignColorPicker variant="heat-map" label="Theme color" value={draft.themeColor??'#3f559a'} onChange={themeColor=>update({themeColor})}/></div>
      <Select label="Sentiment colors" value={draft.sentimentColors?'Custom':'Default'} options={['Default','Custom']} onChange={value=>update({sentimentColors:value==='Custom'?[...SENTIMENT_COLORS]:undefined})}/>
      {draft.sentimentColors && <div className={styles.swatches}>{draft.sentimentColors.map((color,index)=><DesignColorPicker key={index} variant="heat-map" label={`Sentiment color ${index+1}`} value={color} onChange={color=>update({sentimentColors:draft.sentimentColors!.map((c,i)=>i===index?color:c)})}/>)}</div>}
      <div className={styles.designFonts}>
        <label className={styles.field}><span>Font size</span><HeatMapSelect label="Font size" value={draft.fontSize??14} options={fontSizes} formatOption={value=>fontLabels[fontSizes.indexOf(Number(value))]??String(value)} onChange={fontSize=>update({fontSize:Number(fontSize)})}/></label>
        <Select label="Font family" value={draft.fontFamily??'Fira Sans'} options={['Fira Sans','Inter','Roboto','Segoe UI','IBM Plex Sans','Arial','Georgia']} onChange={fontFamily=>update({fontFamily})}/>
      </div>
    </div>}
  </>;
}
