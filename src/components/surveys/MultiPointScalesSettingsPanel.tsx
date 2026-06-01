'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  CARDS_CAROUSEL_RESPONSE_LAYOUT_OPTIONS,
  DEFAULT_MULTI_POINT_SETTINGS,
  MATRIX_DISPLAY_ORDER_OPTIONS,
  MULTI_POINT_ANSWER_TYPE_OPTIONS,
  MULTI_POINT_QUESTION_DISPLAY_OPTIONS,
  MULTI_POINT_SCALE_TYPE_OPTIONS,
  MULTI_POINT_VIDEO_OPTIONS,
  QUESTION_WIDTH_PERCENT_OPTIONS,
  type MatrixDisplayOrder,
  type CardsCarouselResponseLayout,
  type MultiPointAnswerType,
  type MultiPointLayout,
  type MultiPointQuestionDisplay,
  type MultiPointScaleType,
  type MultiPointScalesSettings,
  type MultiPointVideoOption,
} from '@/data/mock-multi-point-settings';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './MultiPointScalesSettingsPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

type SettingsTab = 'metadata' | 'communities';

export interface MultiPointScalesSettingsPanelProps {
  settings: MultiPointScalesSettings;
  onChange: (settings: MultiPointScalesSettings) => void;
  onClose: () => void;
}

function FieldLabel({
  label,
  showHelp = false,
  onHelp,
}: {
  label: string;
  showHelp?: boolean;
  onHelp?: () => void;
}) {
  return (
    <span className={styles.fieldLabelRow}>
      <span className={panelStyles.fieldLabel}>{label}</span>
      {showHelp ? (
        <button
          type="button"
          className={styles.helpBtn}
          aria-label={`Help: ${label}`}
          onClick={onHelp}
        >
          <span className="wm-help-outline" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

function LayoutToggle({
  value,
  onChange,
}: {
  value: MultiPointLayout;
  onChange: (value: MultiPointLayout) => void;
}) {
  return (
    <div className={panelStyles.field}>
      <span className={panelStyles.fieldLabel}>Layout</span>
      <div className={styles.layoutToggle} role="group" aria-label="Layout">
        <button
          type="button"
          className={`${styles.layoutBtn} ${value === 'matrix' ? styles.layoutBtnActive : ''}`}
          aria-pressed={value === 'matrix'}
          onClick={() => onChange('matrix')}
        >
          Matrix
        </button>
        <button
          type="button"
          className={`${styles.layoutBtn} ${value === 'cards-carousel' ? styles.layoutBtnActive : ''}`}
          aria-pressed={value === 'cards-carousel'}
          onClick={() => onChange('cards-carousel')}
        >
          Cards carousel
          <span className={styles.newBadge}>New</span>
        </button>
      </div>
    </div>
  );
}

export function MultiPointScalesSettingsPanel({
  settings = DEFAULT_MULTI_POINT_SETTINGS,
  onChange,
  onClose,
}: MultiPointScalesSettingsPanelProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('metadata');

  function patch(partial: Partial<MultiPointScalesSettings>): void {
    onChange({ ...settings, ...partial });
  }

  function showHelp(topic: string): void {
    showToast({ message: `${topic} help`, variant: 'info' });
  }

  const rowOrderValue =
    MATRIX_DISPLAY_ORDER_OPTIONS.find((o) => o.value === settings.rowDisplayOrder) ?? null;
  const columnOrderValue =
    MATRIX_DISPLAY_ORDER_OPTIONS.find((o) => o.value === settings.columnDisplayOrder) ?? null;
  const questionDisplayValue =
    MULTI_POINT_QUESTION_DISPLAY_OPTIONS.find((o) => o.value === settings.questionDisplay) ??
    null;
  const videoValue =
    MULTI_POINT_VIDEO_OPTIONS.find((o) => o.value === settings.video) ?? null;
  const widthValue = {
    value: String(settings.questionWidthPercent),
    label: `${settings.questionWidthPercent}%`,
  };
  const widthOptions = QUESTION_WIDTH_PERCENT_OPTIONS.map((pct) => ({
    value: String(pct),
    label: `${pct}%`,
  }));
  const cardsCarouselResponseLayoutValue =
    CARDS_CAROUSEL_RESPONSE_LAYOUT_OPTIONS.find(
      (o) => o.value === settings.cardsCarouselResponseLayout
    ) ?? CARDS_CAROUSEL_RESPONSE_LAYOUT_OPTIONS[0];
  const isCardsCarousel = settings.layout === 'cards-carousel';

  return (
    <aside className={panelStyles.panel} aria-label="Multi-Point Scales settings">
      <header className={panelStyles.header}>
        <h2 className={panelStyles.title}>Multi-Point Scales</h2>
        <button type="button" className={panelStyles.closeBtn} onClick={onClose} aria-label="Close">
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={panelStyles.body}>
        <LayoutToggle value={settings.layout} onChange={(layout) => patch({ layout })} />

        <div className={panelStyles.field}>
          <FieldLabel
            label="Answer Type"
            showHelp
            onHelp={() => showHelp('Answer Type')}
          />
          <div className={styles.answerTypeGrid} role="group" aria-label="Answer Type">
            {MULTI_POINT_ANSWER_TYPE_OPTIONS.map((option) => {
              const active = settings.answerType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.answerTypeBtn} ${active ? styles.answerTypeBtnActive : ''}`}
                  aria-pressed={active}
                  onClick={() => patch({ answerType: option.value as MultiPointAnswerType })}
                >
                  <span className={`${option.icon} ${styles.answerTypeIcon}`} aria-hidden />
                  <span className={styles.answerTypeLabel}>{option.label}</span>
                  {active ? (
                    <span className={`wm-check ${styles.answerTypeCheck}`} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={panelStyles.field}>
          <div className={styles.toggleLabelRow}>
            <WuToggle
              Label="Bipolar"
              labelPosition="left"
              checked={settings.bipolar}
              onChange={(bipolar) => patch({ bipolar })}
            />
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="Help: Bipolar"
              onClick={() => showHelp('Bipolar')}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </div>
        </div>

        <div className={panelStyles.field}>
          <div className={styles.toggleLabelRow}>
            <WuToggle
              Label="Auto-focus"
              labelPosition="left"
              checked={settings.autoFocus}
              onChange={(autoFocus) => patch({ autoFocus })}
            />
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="Help: Auto-focus"
              onClick={() => showHelp('Auto-focus')}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Question Width (in %)</span>
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={widthOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={widthValue}
              onSelect={(item) => {
                const pct = Number.parseInt((item as { value: string }).value, 10);
                if (!Number.isNaN(pct)) patch({ questionWidthPercent: pct });
              }}
              variant="outlined"
            />
          </div>
        </div>

        {isCardsCarousel ? (
          <div className={panelStyles.field}>
            <span className={panelStyles.fieldLabel}>Response layout</span>
            <div className={panelStyles.selectWrap}>
              <WuSelect
                data={CARDS_CAROUSEL_RESPONSE_LAYOUT_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={cardsCarouselResponseLayoutValue}
                onSelect={(item) =>
                  patch({
                    cardsCarouselResponseLayout: (item as { value: CardsCarouselResponseLayout })
                      .value,
                  })
                }
                variant="outlined"
              />
            </div>
          </div>
        ) : null}

        <div className={panelStyles.field}>
          <div className={panelStyles.toggleRow}>
            <WuToggle
              Label="Mobile Rendering"
              labelPosition="left"
              checked={settings.mobileRendering}
              onChange={(mobileRendering) => patch({ mobileRendering })}
            />
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Repeat column headers every</span>
          <div className={styles.repeatRow}>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Decrease repeat interval"
                onClick={() =>
                  patch({
                    repeatColumnHeadersEvery: Math.max(
                      1,
                      settings.repeatColumnHeadersEvery - 1
                    ),
                  })
                }
              >
                <span className="wm-remove" aria-hidden />
              </button>
              <span className={styles.stepperValue}>{settings.repeatColumnHeadersEvery}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                aria-label="Increase repeat interval"
                onClick={() =>
                  patch({ repeatColumnHeadersEvery: settings.repeatColumnHeadersEvery + 1 })
                }
              >
                <span className="wm-add" aria-hidden />
              </button>
            </div>
            <span className={styles.repeatSuffix}>Rows</span>
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Row Display Order</span>
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={MATRIX_DISPLAY_ORDER_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={rowOrderValue}
              onSelect={(item) =>
                patch({ rowDisplayOrder: (item as { value: MatrixDisplayOrder }).value })
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={panelStyles.field}>
          <span className={panelStyles.fieldLabel}>Column Display Order</span>
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={MATRIX_DISPLAY_ORDER_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={columnOrderValue}
              onSelect={(item) =>
                patch({ columnDisplayOrder: (item as { value: MatrixDisplayOrder }).value })
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={panelStyles.field}>
          <div className={panelStyles.toggleRow}>
            <WuToggle
              Label="Alternate Colors"
              labelPosition="left"
              checked={settings.alternateColors}
              onChange={(alternateColors) => patch({ alternateColors })}
            />
          </div>
        </div>

        <div className={panelStyles.field}>
          <FieldLabel
            label="Question Display"
            showHelp
            onHelp={() => showHelp('Question Display')}
          />
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={MULTI_POINT_QUESTION_DISPLAY_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={questionDisplayValue}
              onSelect={(item) =>
                patch({
                  questionDisplay: (item as { value: MultiPointQuestionDisplay }).value,
                })
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={panelStyles.field}>
          <div className={styles.toggleLabelRow}>
            <WuToggle
              Label="Question Tips"
              labelPosition="left"
              checked={settings.questionTips}
              onChange={(questionTips) => patch({ questionTips })}
            />
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="Help: Question Tips"
              onClick={() => showHelp('Question Tips')}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </div>
        </div>

        <div className={panelStyles.field}>
          <FieldLabel label="Video" showHelp onHelp={() => showHelp('Video')} />
          <div className={panelStyles.selectWrap}>
            <WuSelect
              data={MULTI_POINT_VIDEO_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={videoValue}
              onSelect={(item) =>
                patch({ video: (item as { value: MultiPointVideoOption }).value })
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={panelStyles.tabs}>
          <div className={panelStyles.tabList} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'metadata'}
              className={`${panelStyles.tabBtn} ${
                activeTab === 'metadata' ? panelStyles.tabBtnActive : ''
              }`}
              onClick={() => setActiveTab('metadata')}
            >
              Metadata
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'communities'}
              className={`${panelStyles.tabBtn} ${
                activeTab === 'communities' ? panelStyles.tabBtnActive : ''
              }`}
              onClick={() => setActiveTab('communities')}
            >
              Communities
            </button>
          </div>

          {activeTab === 'metadata' ? (
            <div role="tabpanel">
              <div className={panelStyles.field}>
                <span className={panelStyles.fieldLabel}>Report Label</span>
                <div className={styles.reportLabelRow}>
                  <input
                    id="multi-point-report-label"
                    type="text"
                    className={panelStyles.textInput}
                    value={settings.reportLabel}
                    onChange={(event) => patch({ reportLabel: event.target.value })}
                  />
                  <button
                    type="button"
                    className={styles.externalLinkBtn}
                    aria-label="Open report label reference"
                    onClick={() => showToast({ message: 'Report label reference', variant: 'info' })}
                  >
                    <span className="wm-open-in-new" aria-hidden />
                  </button>
                </div>
              </div>

              <div className={panelStyles.field}>
                <span className={panelStyles.fieldLabel}>Scale Type</span>
                <ul className={styles.scaleTypeList}>
                  {MULTI_POINT_SCALE_TYPE_OPTIONS.map((option) => {
                    const active = settings.scaleType === option.value;
                    return (
                      <li key={option.value}>
                        <label
                          className={`${styles.scaleTypeItem} ${
                            active ? styles.scaleTypeItemActive : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="multi-point-scale-type"
                            checked={active}
                            onChange={() =>
                              patch({ scaleType: option.value as MultiPointScaleType })
                            }
                          />
                          <span className={styles.scaleTypeText}>
                            <span className={styles.scaleTypeLabel}>{option.label}</span>
                            {option.description ? (
                              <span className={styles.scaleTypeDescription}>
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <p className={panelStyles.placeholder}>
              Community targeting for this question is not configured in this prototype.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
