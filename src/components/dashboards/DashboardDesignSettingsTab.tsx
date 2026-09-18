'use client';

import { useState, type CSSProperties } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DesignColorPicker } from './DesignColorPicker';
import dynamic from 'next/dynamic';
import styles from './DashboardDesignSettingsTab.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

import {
  type DesignColorSettings,
  DEFAULT_DASHBOARD_DESIGN,
  DESIGN_PALETTES,
  type DesignSelectOption,
  type DesignTypographyOptions,
  DESIGN_THEME_OPTIONS,
  DESIGN_PALETTE_OPTIONS,
  DESIGN_SENTIMENT_OPTIONS,
  DESIGN_FONT_SIZE_OPTIONS,
  DESIGN_FONT_FAMILY_OPTIONS,
  getDashboardDesignColors,
  getReadableDesignColor,
} from '@/data/dashboard-design';
export {
  type DesignSelectOption,
  type DesignTypographyOptions,
  DESIGN_THEME_OPTIONS,
  DESIGN_PALETTE_OPTIONS,
  DESIGN_SENTIMENT_OPTIONS,
  DESIGN_FONT_SIZE_OPTIONS,
  DESIGN_FONT_STYLE_OPTIONS,
  DESIGN_FONT_FAMILY_OPTIONS,
  DEFAULT_DESIGN_TYPOGRAPHY
} from '@/data/dashboard-design';

const DESIGN_PREVIEW_BARS = [
  { label: 'Very Satisfied', value: '30%', width: 100 },
  { label: 'Satisfied', value: '20%', width: 67 },
  { label: 'Neutral', value: '20%', width: 67 },
  { label: 'Unsatisfied', value: '15%', width: 50 },
  { label: 'Very Unsatisfied', value: '20%', width: 67 },
];

type DashboardTypographyScale = 'preview';
type DashboardTypographyRole = 'title' | 'body' | 'metric';

interface DashboardDesignSettingsTabProps {
  colorSettings?: DesignColorSettings;
  onColorSettingsChange?: (settings: DesignColorSettings) => void;
  designTheme: DesignSelectOption;
  designPalette: DesignSelectOption;
  designSentiment: DesignSelectOption;
  designFontSize: DesignSelectOption;
  designFontStyle: DesignSelectOption;
  designFontFamily: DesignSelectOption;
  onDesignThemeChange: (option: DesignSelectOption) => void;
  onDesignPaletteChange: (option: DesignSelectOption) => void;
  onDesignSentimentChange: (option: DesignSelectOption) => void;
  onDesignFontSizeChange: (option: DesignSelectOption) => void;
  onDesignFontStyleChange: (option: DesignSelectOption) => void;
  onDesignFontFamilyChange: (option: DesignSelectOption) => void;
}

function getDashboardTypographyMetrics(
  typography: DesignTypographyOptions,
  scale: DashboardTypographyScale
) {
  void scale;
  const dashboardSizeMap = {
    'extra-small': { title: '16px', body: '11px', metric: '24px' },
    small: { title: '20px', body: '13px', metric: '28px' },
    medium: { title: '24px', body: '15px', metric: '34px' },
    large: { title: '28px', body: '18px', metric: '40px' },
    'extra-large': { title: '32px', body: '21px', metric: '46px' },
  };
  const sizes =
    dashboardSizeMap[typography.fontSize.value as keyof typeof dashboardSizeMap] ??
    dashboardSizeMap.medium;

  return {
    sizes,
    fontFamily: typography.fontFamily.value,
    fontStyle: typography.fontStyle.value === 'italic' ? 'italic' : 'normal',
    fontWeight: typography.fontStyle.value === 'bold' ? 600 : 400,
  };
}

export function getDashboardTypographyCssVars(
  typography: DesignTypographyOptions
) {
  const metrics = getDashboardTypographyMetrics(typography, 'preview');

  return {
    '--dashboard-widget-title-size': metrics.sizes.title,
    '--dashboard-widget-body-size': metrics.sizes.body,
    '--dashboard-widget-metric-size': metrics.sizes.metric,
    '--dashboard-widget-font-family': metrics.fontFamily,
    '--dashboard-widget-font-style': metrics.fontStyle,
    '--dashboard-widget-font-weight': String(metrics.fontWeight),
    fontFamily: metrics.fontFamily,
    fontStyle: metrics.fontStyle,
    fontWeight: metrics.fontWeight,
  } as CSSProperties;
}

function getDashboardTypographyStyle(
  typography: DesignTypographyOptions,
  scale: DashboardTypographyScale
) {
  const metrics = getDashboardTypographyMetrics(typography, scale);

  return {
    fontFamily: metrics.fontFamily,
    fontStyle: metrics.fontStyle,
    fontWeight: metrics.fontWeight,
  } as CSSProperties;
}

function getDashboardTextStyle(
  typography: DesignTypographyOptions,
  scale: DashboardTypographyScale,
  role: DashboardTypographyRole
) {
  const metrics = getDashboardTypographyMetrics(typography, scale);

  return {
    fontSize: `${parseFloat(metrics.sizes[role]) * (role === 'title' ? 0.75 : 0.93)}px`,
    fontFamily: metrics.fontFamily,
    fontStyle: metrics.fontStyle,
    fontWeight: metrics.fontWeight,
  } as CSSProperties;
}

function handleSelect(
  option: DesignSelectOption | DesignSelectOption[],
  onChange: (nextOption: DesignSelectOption) => void
) {
  if (Array.isArray(option)) return;
  onChange(option);
}

export function getNextDesignFontSizeOption(
  currentFontSize: DesignSelectOption,
  direction: -1 | 1
) {
  const currentIndex = DESIGN_FONT_SIZE_OPTIONS.findIndex(
    (option) => option.value === currentFontSize.value
  );
  const safeCurrentIndex = currentIndex === -1 ? 2 : currentIndex;
  const nextIndex = Math.min(
    DESIGN_FONT_SIZE_OPTIONS.length - 1,
    Math.max(0, safeCurrentIndex + direction)
  );

  return DESIGN_FONT_SIZE_OPTIONS[nextIndex];
}

export function DashboardDesignSettingsTab({
  colorSettings,
  onColorSettingsChange,
  designTheme,
  designPalette,
  designSentiment,
  designFontSize,
  designFontStyle,
  designFontFamily,
  onDesignThemeChange,
  onDesignPaletteChange,
  onDesignSentimentChange,
  onDesignFontSizeChange,
  onDesignFontFamilyChange,
}: DashboardDesignSettingsTabProps) {
  const [localColors, setLocalColors] = useState<DesignColorSettings>(DEFAULT_DASHBOARD_DESIGN);
  const settings = colorSettings ?? localColors;
  const changeColors = (patch: Partial<DesignColorSettings>) => {
    const next = { ...settings, ...patch }; setLocalColors(next); onColorSettingsChange?.(next);
  };
  const colors = getDashboardDesignColors({ ...settings, theme: designTheme.value, palette: designPalette.value, sentiment: designSentiment.value });
  const draftTypography = {
    fontSize: designFontSize,
    fontStyle: designFontStyle,
    fontFamily: designFontFamily,
  };
  const previewTypographyStyle = getDashboardTypographyStyle(draftTypography, 'preview');
  const previewTitleStyle = getDashboardTextStyle(draftTypography, 'preview', 'title');
  const previewBodyStyle = getDashboardTextStyle(draftTypography, 'preview', 'body');

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Theme</label>
          <WuSelect
            data={DESIGN_THEME_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={designTheme}
            aria-label="Theme"
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignThemeChange)
            }
            variant="outlined"
            className={styles.select}
          />
        </div>

        <div className={styles.themeColorRow}>
          <span className={styles.fieldLabel}>Theme color</span>
          <DesignColorPicker value={colors.accent} label="Theme color" onChange={themeColor => changeColors({ themeColor })} />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Color palette</label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className={styles.paletteTrigger} aria-label="Color palette">{designPalette.label}<span aria-hidden>▾</span></DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content className={styles.paletteMenu} sideOffset={4} align="start">
              <DropdownMenu.RadioGroup value={designPalette.value} onValueChange={value => onDesignPaletteChange(DESIGN_PALETTE_OPTIONS.find(option => option.value === value)!)}>
                {DESIGN_PALETTE_OPTIONS.map(option => <DropdownMenu.RadioItem className={styles.paletteOption} value={option.value} key={option.value}>
                  <span>{option.label}</span><span className={styles.miniSwatches} aria-hidden>{(DESIGN_PALETTES[option.value] ?? settings.customPalette).filter((_, index) => index % 2 === 0).slice(0, 9).map((color, index) => <i key={index} style={{ background: color }} />)}</span>
                </DropdownMenu.RadioItem>)}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>
          <div className={styles.swatches}>
            {colors.palette.map((color, index) => designPalette.value === 'custom' ?
              <DesignColorPicker key={index} value={color} label={`Palette color ${index + 1}`} onChange={value => changeColors({ customPalette: settings.customPalette.map((entry, i) => i === index ? value : entry) })} /> :
              <span key={index} className={styles.swatch} style={{ backgroundColor: color }} aria-label={`Palette color ${color}`} />)}
          </div>
          {designPalette.value === 'custom' && <button type="button" className={styles.addColor} aria-label="Add palette color" disabled={settings.customPalette.length >= 64} onClick={() => changeColors({ customPalette: [...settings.customPalette, '#000000'] })}>+</button>}

        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Sentiment colors</label>
          <WuSelect
            data={DESIGN_SENTIMENT_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={designSentiment}
            aria-label="Sentiment colors"
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignSentimentChange)
            }
            variant="outlined"
            className={`${styles.select} ${styles.sentimentSelect}`}
          />
          <div className={styles.swatches}>
            {colors.sentiment.map((color, index) => designSentiment.value === 'custom' ?
              <DesignColorPicker key={index} value={color} label={`Sentiment color ${index + 1}`} onChange={value => changeColors({ customSentiment: settings.customSentiment.map((entry, i) => i === index ? value : entry) })} /> :
              <span key={index} className={styles.swatch} style={{ backgroundColor: color }} aria-label={`Sentiment color ${color}`} />)}
          </div>
        </div>

        <div className={styles.fontGrid}>
          <div>
            <label className={styles.fieldLabel}>Font size</label>
            <WuSelect
              data={DESIGN_FONT_SIZE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={designFontSize}
            aria-label="Font size"
              onSelect={(option) =>
                handleSelect(
                  option as DesignSelectOption | DesignSelectOption[],
                  onDesignFontSizeChange
                )
              }
              variant="outlined"
              className={styles.select}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Font family</label>
            <WuSelect
              data={DESIGN_FONT_FAMILY_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={designFontFamily}
            aria-label="Font family"
              onSelect={(option) =>
                handleSelect(
                  option as DesignSelectOption | DesignSelectOption[],
                  onDesignFontFamilyChange
                )
              }
              variant="outlined"
              className={styles.select}
            />
          </div>
        </div>
      </div>

      <div className={styles.previewWrap}>
        <div className={styles.device} style={{ ...previewTypographyStyle, background: colors.canvas }}>
          <span className={styles.notch} aria-hidden />
          <div className={styles.previewHeader} style={{ ...previewTitleStyle, fontWeight: 600 }}>
            Dashboard name
          </div>

          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <div className={styles.previewCardTitle} style={{ color: colors.accent }}>
                <span style={previewTitleStyle}>First widget name</span>
                <span className="wm-lightbulb text-[18px] text-[#566173]" aria-hidden />
              </div>
              <div className={styles.barPreview}>
                <div className={styles.barLabels} style={previewBodyStyle}>
                  {DESIGN_PREVIEW_BARS.map((bar) => (
                    <div key={bar.label} className={styles.barLabel}>
                      {bar.label}
                    </div>
                  ))}
                </div>
                <div className={styles.barPlot}>
                  <span className={styles.barMidline} aria-hidden />
                  <div className={styles.bars}>
                    {DESIGN_PREVIEW_BARS.map((bar, index) => (
                      <div key={bar.label} className={styles.barTrack}>
                        <span
                          className={styles.barValue}
                          style={{ width: `${bar.width}%`, backgroundColor: colors.palette[index] }}
                        >
                          <span style={{ ...previewBodyStyle, color: getReadableDesignColor(colors.palette[index]) }}>
                            {bar.value}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.axis} style={previewBodyStyle}>
                    <span>0%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sideCards}>
              <div className={`${styles.previewCard} ${styles.smallCard}`}>
                <div className={styles.previewCardTitle} style={{ color: colors.accent }}>
                  <span style={previewTitleStyle}>Second widget name</span>
                  <span className="wm-lightbulb text-[18px] text-[#566173]" aria-hidden />
                </div>
                <div className={styles.chartCenter}>
                  <div className={styles.donut} style={{ background: `conic-gradient(${colors.palette.slice(0, 5).map((color, i) => `${color} ${i * 20}% ${(i + 1) * 20}%`).join(", ")})` }} aria-label="Donut chart preview" />
                </div>
              </div>

              <div className={`${styles.previewCard} ${styles.smallCard}`}>
                <div className={styles.previewCardTitle} style={{ color: colors.accent }}>
                  <span style={previewTitleStyle}>Third widget name</span>
                  <span className="wm-lightbulb text-[18px] text-[#566173]" aria-hidden />
                </div>
                <div className={styles.chartCenter}>
                  <div className={styles.gaugeClip}>
                    <div className={styles.gauge} style={{ background: `conic-gradient(from 270deg, ${colors.sentiment.map((color, i) => `${color} ${i * 36}deg ${(i + 1) * 36}deg`).join(", ")}, transparent 180deg 360deg)` }} aria-label="Gauge chart preview" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
