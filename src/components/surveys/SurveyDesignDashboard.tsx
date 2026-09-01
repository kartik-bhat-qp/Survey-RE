'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyDesignPreview } from '@/components/surveys/SurveyDesignPreview';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS,
  SURVEY_DESIGN_FONT_FAMILY_OPTIONS,
  SURVEY_DESIGN_PANEL_TABS,
  SURVEY_DESIGN_THEMES,
  SURVEY_LAYOUT_OPTIONS,
  SURVEY_LAYOUT_RETIRING_NOTICE,
  getSurveyDesignThemeHero,
  normalizeSurveyDesignSettings,
  surveyDesignSettingsStorageKey,
  type SurveyDesignBehaviorSettings,
  type SurveyDesignCustomizeSettings,
  type SurveyDesignPanelTabId,
  type SurveyDesignPreviewDevice,
  type SurveyDesignSettings,
  type SurveyDesignTheme,
  type SurveyLayoutId,
} from '@/data/mock-survey-design';
import styles from './SurveyDesignDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyDesignDashboardProps {
  surveyId: number;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggleSwitch} ${checked ? styles.toggleSwitchOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

function LayoutThumbnail({ layout }: { layout: SurveyLayoutId }) {
  if (layout === 'focus') {
    return (
      <span className={`${styles.layoutThumb} ${styles.layoutThumbFocus}`} aria-hidden>
        <span className={styles.thumbTopBar} />
        <span className={styles.thumbFocusBody}>
          <span className={styles.thumbQ} />
          <span className={styles.thumbRadioRow} />
          <span className={styles.thumbRadioRow} />
        </span>
        <span className={styles.thumbNext} />
      </span>
    );
  }

  if (layout === 'visual') {
    return (
      <span className={`${styles.layoutThumb} ${styles.layoutThumbVisual}`} aria-hidden>
        <span className={styles.thumbVisualHero} />
        <span className={styles.thumbBody}>
          <span className={styles.thumbQ} />
          <span className={styles.thumbRadioRow} />
        </span>
        <span className={styles.thumbNext} />
      </span>
    );
  }

  if (layout === 'accessible') {
    return (
      <span className={`${styles.layoutThumb} ${styles.layoutThumbAccessible}`} aria-hidden>
        <span className={styles.thumbTopBarDark} />
        <span className={styles.thumbBody}>
          <span className={styles.thumbQDark} />
          <span className={styles.thumbRadioRowDark} />
          <span className={styles.thumbRadioRowDark} />
        </span>
        <span className={styles.thumbNextDark} />
      </span>
    );
  }

  return (
    <span className={`${styles.layoutThumb} ${styles.layoutThumbClassic}`} aria-hidden>
      <span className={styles.thumbTopBar} />
      <span className={styles.thumbBody}>
        <span className={styles.thumbQ} />
        <span className={styles.thumbRadioRow} />
        <span className={styles.thumbRadioRow} />
        <span className={styles.thumbQ} />
      </span>
      <span className={styles.thumbNext} />
    </span>
  );
}

function LayoutSunsetBadge() {
  return (
    <WuTooltip
      content={
        <div className={styles.sunsetTooltip}>
          <p className={styles.sunsetTooltipTitle}>{SURVEY_LAYOUT_RETIRING_NOTICE.title}</p>
          <p className={styles.sunsetTooltipBody}>{SURVEY_LAYOUT_RETIRING_NOTICE.body}</p>
        </div>
      }
      position="bottom"
    >
      <span
        className={styles.sunsetBadge}
        aria-label={SURVEY_LAYOUT_RETIRING_NOTICE.body}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
          <circle cx="12" cy="11" r="3.35" fill="currentColor" />
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
            d="M12 4.2v1.4M7.2 6.3l1 1M16.8 6.3l-1 1M4.4 11h1.4M18.2 11h1.4M5 15.6h14M7.2 18.4h9.6"
          />
        </svg>
      </span>
    </WuTooltip>
  );
}

function ThemeThumbnail({ theme }: { theme: SurveyDesignTheme }) {
  const hero = getSurveyDesignThemeHero(theme.hero);
  const hasHero = Boolean(hero);

  return (
    <span
      className={hasHero ? styles.themePreviewHero : styles.themePreview}
      style={{ background: hero ?? theme.backgroundColor }}
      aria-hidden
    >
      <span
        className={hasHero ? styles.themeMiniSurveyInset : styles.themeMiniSurvey}
        style={{ backgroundColor: theme.surfaceColor }}
      >
        <span className={styles.themeMiniTopBar} style={{ backgroundColor: theme.topBarColor }} />
        <span className={styles.themeMiniBody}>
          <span className={styles.themeMiniTitle} style={{ backgroundColor: theme.accentColor }} />
          <span className={styles.themeMiniQ} style={{ backgroundColor: theme.textColor }} />
          <span className={styles.themeMiniOpt}>
            <span
              className={styles.themeMiniRadio}
              style={{ borderColor: theme.optionAccentColor }}
            />
            <span className={styles.themeMiniOptLine} style={{ backgroundColor: theme.mutedColor }} />
          </span>
          <span className={styles.themeMiniOpt}>
            <span
              className={styles.themeMiniRadio}
              style={{ borderColor: theme.optionAccentColor }}
            />
            <span className={styles.themeMiniOptLine} style={{ backgroundColor: theme.mutedColor }} />
          </span>
          <span className={styles.themeMiniBtn} style={{ backgroundColor: theme.buttonColor }} />
        </span>
      </span>
    </span>
  );
}

export function SurveyDesignDashboard({ surveyId }: SurveyDesignDashboardProps) {
  const { showToast } = useWuShowToast();
  const [previewDevice, setPreviewDevice] = useState<SurveyDesignPreviewDevice>('desktop');
  const [settingsRaw, setSettings] = usePersistedState<SurveyDesignSettings>(
    surveyDesignSettingsStorageKey(surveyId),
    normalizeSurveyDesignSettings({})
  );
  const settings = useMemo(() => normalizeSurveyDesignSettings(settingsRaw), [settingsRaw]);
  const [draftSettings, setDraftSettings] = useState<SurveyDesignSettings>(settings);

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  function patchDraft(partial: Partial<SurveyDesignSettings>): void {
    setDraftSettings((prev) => normalizeSurveyDesignSettings({ ...prev, ...partial }));
  }

  function patchCustomize(partial: Partial<SurveyDesignCustomizeSettings>): void {
    setDraftSettings((prev) =>
      normalizeSurveyDesignSettings({
        ...prev,
        customize: { ...prev.customize, ...partial },
      })
    );
  }

  function patchBehavior(partial: Partial<SurveyDesignBehaviorSettings>): void {
    setDraftSettings((prev) =>
      normalizeSurveyDesignSettings({
        ...prev,
        behavior: { ...prev.behavior, ...partial },
      })
    );
  }

  function handleSaveAndApply(): void {
    setSettings(draftSettings);
    showToast({ message: 'Design saved and applied', variant: 'success' });
  }

  const backgroundStyleOption =
    SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS.find(
      (option) => option.value === draftSettings.customize.backgroundStyle
    ) ?? SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS[0];

  const fontFamilyOption =
    SURVEY_DESIGN_FONT_FAMILY_OPTIONS.find(
      (option) => option.value === draftSettings.customize.fontFamily
    ) ?? SURVEY_DESIGN_FONT_FAMILY_OPTIONS[0];

  const themesContent = (
    <div className={styles.themeGrid} role="list" aria-label="Survey themes">
      {SURVEY_DESIGN_THEMES.map((theme) => {
        const selected = draftSettings.selectedThemeId === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="listitem"
            className={selected ? styles.themeCardActive : styles.themeCard}
            aria-label={theme.label}
            aria-pressed={selected}
            onClick={() => patchDraft({ selectedThemeId: theme.id })}
          >
            <ThemeThumbnail theme={theme} />
          </button>
        );
      })}
    </div>
  );

  const customizeContent = (
    <div className={styles.customizeSection}>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Background style</span>
        <div className={styles.selectWrap}>
          <WuSelect
            data={[...SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS]}
            accessorKey={{ value: 'value', label: 'label' }}
            value={backgroundStyleOption}
            onSelect={(item) => {
              const selected = item as { value: SurveyDesignCustomizeSettings['backgroundStyle'] } | null;
              if (!selected) return;
              patchCustomize({ backgroundStyle: selected.value });
            }}
            variant="outlined"
            aria-label="Background style"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Font family</span>
        <div className={styles.selectWrap}>
          <WuSelect
            data={[...SURVEY_DESIGN_FONT_FAMILY_OPTIONS]}
            accessorKey={{ value: 'value', label: 'label' }}
            value={fontFamilyOption}
            onSelect={(item) => {
              const selected = item as { value: SurveyDesignCustomizeSettings['fontFamily'] } | null;
              if (!selected) return;
              patchCustomize({ fontFamily: selected.value });
            }}
            variant="outlined"
            aria-label="Font family"
          />
        </div>
      </div>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show progress bar</span>
        <ToggleSwitch
          checked={draftSettings.customize.showProgressBar}
          onChange={(checked) => patchCustomize({ showProgressBar: checked })}
          label="Show progress bar"
        />
      </div>
    </div>
  );

  const settingsContent = (
    <div className={styles.settingsSection}>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show question numbers</span>
        <ToggleSwitch
          checked={draftSettings.behavior.showQuestionNumbers}
          onChange={(checked) => patchBehavior({ showQuestionNumbers: checked })}
          label="Show question numbers"
        />
      </div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show required indicator</span>
        <ToggleSwitch
          checked={draftSettings.behavior.showRequiredIndicator}
          onChange={(checked) => patchBehavior({ showRequiredIndicator: checked })}
          label="Show required indicator"
        />
      </div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Allow back navigation</span>
        <ToggleSwitch
          checked={draftSettings.behavior.allowBackNavigation}
          onChange={(checked) => patchBehavior({ allowBackNavigation: checked })}
          label="Allow back navigation"
        />
      </div>
    </div>
  );

  return (
    <div className={styles.workspace}>
      <aside className={styles.configPane} aria-label="Survey design settings">
        <div className={styles.configScroll}>
          <section aria-labelledby="survey-layout-label">
            <div className={styles.sectionTitleRow}>
              <h2 id="survey-layout-label" className={styles.sectionTitle}>
                Survey layout
              </h2>
              <WuTooltip
                content="Choose how questions are presented to respondents."
                position="bottom"
              >
                <button
                  type="button"
                  className={styles.infoBtn}
                  aria-label="About survey layout"
                >
                  <span className="wm-info" aria-hidden />
                </button>
              </WuTooltip>
            </div>
            <div className={styles.layoutGrid}>
              {SURVEY_LAYOUT_OPTIONS.map((layout) => {
                const selected = draftSettings.layout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    className={selected ? styles.layoutCardActive : styles.layoutCard}
                    aria-pressed={selected}
                    aria-label={
                      layout.retiring
                        ? `${layout.label}. ${SURVEY_LAYOUT_RETIRING_NOTICE.body}`
                        : layout.label
                    }
                    title={layout.retiring ? undefined : layout.description}
                    onClick={() => patchDraft({ layout: layout.id as SurveyLayoutId })}
                  >
                    {layout.retiring ? <LayoutSunsetBadge /> : null}
                    <LayoutThumbnail layout={layout.id} />
                    <span className={styles.layoutCardLabel}>{layout.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.panelSection} aria-label="Design panel tabs">
            <div className={styles.tabRow}>
              <div className={styles.tabs} role="tablist" aria-label="Design options">
                {SURVEY_DESIGN_PANEL_TABS.map((tab) => {
                  const selected = draftSettings.panelTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={selected ? styles.tabActive : styles.tab}
                      onClick={() => patchDraft({ panelTab: tab.id })}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              {draftSettings.panelTab === 'themes' ? (
                <WuTooltip content="Theme settings" position="bottom">
                  <button
                    type="button"
                    className={styles.wrenchBtn}
                    aria-label="Theme settings"
                    onClick={() => patchDraft({ panelTab: 'customize' })}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M22.7 19.3 13.6 10.2a6 6 0 0 0-7.94-7.94l3.38 3.38-2.12 2.12-3.38-3.38A6 6 0 0 0 10.2 13.6l9.1 9.1c.39.39 1.02.39 1.41 0l1.99-1.99c.39-.39.39-1.02 0-1.41Z"
                      />
                    </svg>
                  </button>
                </WuTooltip>
              ) : null}
            </div>

            <div className={styles.tabPanel} role="tabpanel">
              {draftSettings.panelTab === 'themes'
                ? themesContent
                : draftSettings.panelTab === 'customize'
                  ? customizeContent
                  : settingsContent}
            </div>
          </section>
        </div>

        <div className={styles.footerBar}>
          <WuButton onClick={handleSaveAndApply}>Save &amp; Apply</WuButton>
        </div>
      </aside>

      <SurveyDesignPreview
        layout={draftSettings.layout}
        themeId={draftSettings.selectedThemeId}
        customize={draftSettings.customize}
        behavior={draftSettings.behavior}
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
      />
    </div>
  );
}
