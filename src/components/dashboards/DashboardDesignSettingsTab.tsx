'use client';

import type { CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import styles from './DashboardDesignSettingsTab.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export type DesignSelectOption = {
  value: string;
  label: string;
};

export type DesignTypographyOptions = {
  fontSize: DesignSelectOption;
  fontStyle: DesignSelectOption;
  fontFamily: DesignSelectOption;
};

export const DESIGN_THEME_OPTIONS: DesignSelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
];

export const DESIGN_PALETTE_OPTIONS: DesignSelectOption[] = [
  { value: 'categorical', label: 'Categorical' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'diverging', label: 'Diverging' },
];

export const DESIGN_SENTIMENT_OPTIONS: DesignSelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'soft', label: 'Soft' },
  { value: 'high-contrast', label: 'High contrast' },
];

export const DESIGN_FONT_SIZE_OPTIONS: DesignSelectOption[] = [
  { value: 'extra-small', label: 'Extra small' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
];

export const DESIGN_FONT_STYLE_OPTIONS: DesignSelectOption[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
];

export const DESIGN_FONT_FAMILY_OPTIONS: DesignSelectOption[] = [
  { value: '"Fira Sans Dashboard", Arial, sans-serif', label: 'Fira Sans' },
  { value: 'Inter, "Segoe UI", Roboto, Arial, sans-serif', label: 'Inter' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: '"Segoe UI", Arial, sans-serif', label: 'Segoe UI' },
  { value: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif', label: 'IBM Plex Sans' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

export const DEFAULT_DESIGN_TYPOGRAPHY: DesignTypographyOptions = {
  fontSize: DESIGN_FONT_SIZE_OPTIONS[1],
  fontStyle: DESIGN_FONT_STYLE_OPTIONS[0],
  fontFamily: DESIGN_FONT_FAMILY_OPTIONS[0],
};

const DESIGN_PALETTE_COLORS = [
  '#4f63a2',
  '#6680b5',
  '#3ea2b5',
  '#3fb6a3',
  '#8ed09a',
  '#bbc65a',
  '#e6963d',
  '#d7654f',
  '#9d3c31',
  '#9d637f',
];

const DESIGN_SENTIMENT_COLORS = ['#ff5470', '#ff967e', '#f2d46f', '#99d493', '#3dc481'];

const DESIGN_PREVIEW_BARS = [
  { label: 'Very Satisfied', value: '30%', width: 100, color: '#52649d', textColor: '#ffffff' },
  { label: 'Satisfied', value: '20%', width: 67, color: '#6684b8', textColor: '#ffffff' },
  { label: 'Neutral', value: '20%', width: 67, color: '#45a5b8', textColor: '#ffffff' },
  { label: 'Unsatisfied', value: '15%', width: 50, color: '#45b7a3', textColor: '#ffffff' },
  { label: 'Very Unsatisfied', value: '20%', width: 67, color: '#9bd79b', textColor: '#253449' },
];

type DashboardTypographyScale = 'preview';
type DashboardTypographyRole = 'title' | 'body' | 'metric';

interface DashboardDesignSettingsTabProps {
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
    fontSize: metrics.sizes[role],
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
  onDesignFontStyleChange,
  onDesignFontFamilyChange,
}: DashboardDesignSettingsTabProps) {
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
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignThemeChange)
            }
            variant="outlined"
            className={styles.select}
          />
        </div>

        <div className={styles.themeColorRow}>
          <span className={styles.fieldLabel}>Theme color</span>
          <span className={styles.themeSwatch} aria-label="Theme color swatch" />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Color palette</label>
          <WuSelect
            data={DESIGN_PALETTE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={designPalette}
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignPaletteChange)
            }
            variant="outlined"
            className={styles.select}
          />
          <div className={styles.swatches}>
            {DESIGN_PALETTE_COLORS.map((color) => (
              <span
                key={color}
                className={styles.swatch}
                style={{ backgroundColor: color }}
                aria-label={`Palette color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Sentiment colors</label>
          <WuSelect
            data={DESIGN_SENTIMENT_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={designSentiment}
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignSentimentChange)
            }
            variant="outlined"
            className={`${styles.select} ${styles.sentimentSelect}`}
          />
          <div className={styles.swatches}>
            {DESIGN_SENTIMENT_COLORS.map((color) => (
              <span
                key={color}
                className={styles.swatch}
                style={{ backgroundColor: color }}
                aria-label={`Sentiment color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.fontGrid}>
          <div>
            <label className={styles.fieldLabel}>Font size</label>
            <WuSelect
              data={DESIGN_FONT_SIZE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={designFontSize}
              onSelect={(option) =>
                handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignFontSizeChange)
              }
              variant="outlined"
              className={styles.select}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Font style</label>
            <WuSelect
              data={DESIGN_FONT_STYLE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={designFontStyle}
              onSelect={(option) =>
                handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignFontStyleChange)
              }
              variant="outlined"
              className={styles.select}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Font family</label>
          <WuSelect
            data={DESIGN_FONT_FAMILY_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={designFontFamily}
            onSelect={(option) =>
              handleSelect(option as DesignSelectOption | DesignSelectOption[], onDesignFontFamilyChange)
            }
            variant="outlined"
            className={styles.select}
          />
        </div>

        <p className={styles.hint}>
          Enable Accessibility shortcuts in General settings to adjust font size and other dashboard settings.
        </p>
      </div>

      <div className={styles.previewWrap}>
        <div className={styles.device} style={previewTypographyStyle}>
          <span className={styles.notch} aria-hidden />
          <div className={styles.previewHeader} style={previewTitleStyle}>
            Dashboard name
          </div>

          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <div className={styles.previewCardTitle}>
                <span style={previewTitleStyle}>First widget name</span>
                <span className="wm-lightbulb text-[24px] text-[#566173]" aria-hidden />
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
                    {DESIGN_PREVIEW_BARS.map((bar) => (
                      <div key={bar.label} className={styles.barTrack}>
                        <span
                          className={styles.barValue}
                          style={{ width: `${bar.width}%`, backgroundColor: bar.color }}
                        >
                          <span style={{ ...previewBodyStyle, color: bar.textColor }}>
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
                <div className={styles.previewCardTitle}>
                  <span style={previewTitleStyle}>Second widget name</span>
                  <span className="wm-lightbulb text-[24px] text-[#566173]" aria-hidden />
                </div>
                <div className={styles.chartCenter}>
                  <div className={styles.donut} aria-label="Donut chart preview" />
                </div>
              </div>

              <div className={`${styles.previewCard} ${styles.smallCard}`}>
                <div className={styles.previewCardTitle}>
                  <span style={previewTitleStyle}>Third widget name</span>
                  <span className="wm-lightbulb text-[24px] text-[#566173]" aria-hidden />
                </div>
                <div className={styles.chartCenter}>
                  <div className={styles.gaugeClip}>
                    <div className={styles.gauge} aria-label="Gauge chart preview" />
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
