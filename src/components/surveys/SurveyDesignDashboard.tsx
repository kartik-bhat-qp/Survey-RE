'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyDesignPreview, SurveyDesignPreviewToolbar } from '@/components/surveys/SurveyDesignPreview';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS,
  SURVEY_DESIGN_FONT_FAMILY_OPTIONS,
  SURVEY_DESIGN_THEMES,
  SURVEY_LAYOUT_OPTIONS,
  normalizeSurveyDesignSettings,
  surveyDesignSettingsStorageKey,
  type SurveyDesignBehaviorSettings,
  type SurveyDesignCustomizeSettings,
  type SurveyDesignPanelTabId,
  type SurveyDesignPreviewDevice,
  type SurveyDesignSettings,
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

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
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
            {selected ? (
              <span className={styles.themeCheck} aria-hidden>
                <span className="wm-check" />
              </span>
            ) : null}
            <span className={styles.themePreview} aria-hidden>
              <span
                className={styles.themePreviewHeader}
                style={{ backgroundColor: theme.headerColor }}
              />
              <span
                className={styles.themePreviewBody}
                style={{ backgroundColor: theme.backgroundColor }}
              />
              <span className={styles.themePreviewFooter}>
                <span
                  className={styles.themePreviewDot}
                  style={{ backgroundColor: theme.buttonColor }}
                />
                <span
                  className={styles.themePreviewDot}
                  style={{ backgroundColor: theme.accentColor }}
                />
              </span>
            </span>
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

  const panelTabs: IWuTabItem[] = [
    { value: 'themes', Trigger: 'Themes', Content: themesContent },
    { value: 'customize', Trigger: 'Customize', Content: customizeContent },
    { value: 'settings', Trigger: 'Settings', Content: settingsContent },
  ];

  return (
    <div className={styles.workspace}>
      <aside className={styles.configPane} aria-label="Survey design settings">
        <div className={styles.configScroll}>
          <section aria-labelledby="survey-layout-label">
            <h2 id="survey-layout-label" className={styles.sectionTitle}>
              Survey Layout
            </h2>
            <div className={styles.layoutGrid}>
              {SURVEY_LAYOUT_OPTIONS.map((layout) => {
                const selected = draftSettings.layout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    className={selected ? styles.layoutCardActive : styles.layoutCard}
                    aria-pressed={selected}
                    onClick={() => patchDraft({ layout: layout.id as SurveyLayoutId })}
                  >
                    {selected ? (
                      <span className={styles.layoutCheck} aria-hidden>
                        <span className="wm-check" />
                      </span>
                    ) : null}
                    <span className={`${layout.icon} ${styles.layoutCardIcon}`} aria-hidden />
                    <span className={styles.layoutCardLabel}>{layout.label}</span>
                    <span className={styles.layoutCardDescription}>{layout.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.panelTabs} aria-label="Design panel tabs">
            <WuTab
              items={panelTabs}
              value={draftSettings.panelTab}
              onValueChange={(value) =>
                patchDraft({ panelTab: value as SurveyDesignPanelTabId })
              }
            />
          </section>
        </div>

        <div className={styles.footerBar}>
          <WuButton onClick={handleSaveAndApply}>Save &amp; Apply</WuButton>
        </div>
      </aside>

      <div className={styles.previewColumn}>
        <SurveyDesignPreviewToolbar device={previewDevice} onDeviceChange={setPreviewDevice} />
        <SurveyDesignPreview
          layout={draftSettings.layout}
          themeId={draftSettings.selectedThemeId}
          customize={draftSettings.customize}
          behavior={draftSettings.behavior}
          device={previewDevice}
        />
      </div>
    </div>
  );
}
