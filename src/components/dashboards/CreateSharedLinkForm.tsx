'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  DEFAULT_SHARED_LINK_CREATE_DRAFT,
  SHARED_LINK_LANGUAGE_OPTIONS,
  type SharedLinkCreateDraft,
  type SharedLinkTitleAlignment,
} from '@/data/mock-shared-urls';
import styles from './CreateSharedLinkForm.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const TITLE_ALIGNMENTS: {
  value: SharedLinkTitleAlignment;
  label: string;
  icon: string;
}[] = [
  { value: 'left', label: 'Left', icon: 'wm-format-align-left' },
  { value: 'center', label: 'Center', icon: 'wm-format-align-center' },
  { value: 'right', label: 'Right', icon: 'wm-format-align-right' },
];

interface CreateSharedLinkFormProps {
  dashboardName: string;
  onCancel: () => void;
  onCreate: (draft: SharedLinkCreateDraft) => void;
}

export function CreateSharedLinkForm({
  dashboardName,
  onCancel,
  onCreate,
}: CreateSharedLinkFormProps) {
  const { showToast } = useWuShowToast();
  const [draft, setDraft] = useState<SharedLinkCreateDraft>(DEFAULT_SHARED_LINK_CREATE_DRAFT);

  useEffect(() => {
    setDraft(DEFAULT_SHARED_LINK_CREATE_DRAFT);
  }, []);

  const languageOption = useMemo(
    () =>
      SHARED_LINK_LANGUAGE_OPTIONS.find((option) => option.value === draft.language) ??
      SHARED_LINK_LANGUAGE_OPTIONS[0],
    [draft.language]
  );

  const canCreate = draft.name.trim().length > 0;
  const effectiveShareTitle = draft.shareTitle.trim() || dashboardName;

  function patch(partial: Partial<SharedLinkCreateDraft>): void {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function handlePreviewShareTitle(): void {
    showToast({
      message: `Share title: ${effectiveShareTitle}`,
      variant: 'info',
    });
  }

  function handleResetShareTitle(): void {
    patch({ shareTitle: '' });
    showToast({ message: 'Share title reset to dashboard name', variant: 'success' });
  }

  return (
    <div className={styles.form}>
      <div className={styles.scrollBody}>
        <button type="button" className={styles.backBtn} onClick={onCancel}>
          <span className="wm-chevron-left" aria-hidden />
          <span>Create link</span>
        </button>

        <div className={styles.field}>
          <WuLabel className={styles.label}>
            Name <span className={styles.required}>*</span>
          </WuLabel>
          <WuInput
            variant="outlined"
            placeholder="e.g. Client Review Dashboard"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-required
            className={styles.nameInput}
          />
        </div>

        <div className={styles.settingsStack}>
          <section className={styles.settingsSection}>
            <div className={styles.settingsHeader}>
              <span id="shared-link-view-settings" className={styles.settingsTitle}>
                View settings
              </span>
              <WuToggle
                checked={draft.viewSettingsEnabled}
                onChange={(checked) => patch({ viewSettingsEnabled: checked })}
                aria-label="View settings"
                aria-controls="shared-link-view-settings-panel"
              />
            </div>

            {draft.viewSettingsEnabled ? (
              <div
                id="shared-link-view-settings-panel"
                className={styles.settingsPanel}
                role="region"
                aria-labelledby="shared-link-view-settings"
              >
                <div className={styles.columns}>
                  <div className={styles.column}>
                    <div className={styles.field}>
                      <WuLabel className={styles.label}>Share title</WuLabel>
                      <div className={styles.shareTitleRow}>
                        <WuInput
                          variant="outlined"
                          placeholder="Defaults to dashboard name"
                          value={draft.shareTitle}
                          onChange={(event) => patch({ shareTitle: event.target.value })}
                          className={styles.shareTitleInput}
                        />
                        <WuTooltip content="Preview share title" position="top">
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Preview share title"
                            onClick={handlePreviewShareTitle}
                          >
                            <span className="wm-visibility" aria-hidden />
                          </button>
                        </WuTooltip>
                        <WuTooltip content="Reset to dashboard name" position="top">
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Reset share title"
                            onClick={handleResetShareTitle}
                          >
                            <span className="wm-refresh" aria-hidden />
                          </button>
                        </WuTooltip>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <WuLabel className={styles.label}>Title alignment</WuLabel>
                      <div
                        className={styles.alignmentGroup}
                        role="group"
                        aria-label="Title alignment"
                      >
                        {TITLE_ALIGNMENTS.map((option) => {
                          const selected = draft.titleAlignment === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`${styles.alignmentBtn} ${
                                selected ? styles.alignmentBtnSelected : ''
                              }`}
                              aria-label={option.label}
                              aria-pressed={selected}
                              onClick={() => patch({ titleAlignment: option.value })}
                            >
                              <span className={option.icon} aria-hidden />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.toggleList}>
                      <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Show insights</span>
                        <WuToggle
                          checked={draft.showInsights}
                          onChange={(checked) => patch({ showInsights: checked })}
                          aria-label="Show insights"
                        />
                      </div>
                      <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Allow comments</span>
                        <WuToggle
                          checked={draft.allowComments}
                          onChange={(checked) => patch({ allowComments: checked })}
                          aria-label="Allow comments"
                        />
                      </div>
                      <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Enable password</span>
                        <WuToggle
                          checked={draft.enablePassword}
                          onChange={(checked) => patch({ enablePassword: checked })}
                          aria-label="Enable password"
                        />
                      </div>
                      <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Base filter</span>
                        <WuToggle
                          checked={draft.baseFilter}
                          onChange={(checked) => patch({ baseFilter: checked })}
                          aria-label="Base filter"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.column}>
                    <div className={styles.toggleRow}>
                      <span className={styles.toggleLabel}>Dynamic filters</span>
                      <WuToggle
                        checked={draft.dynamicFilters}
                        onChange={(checked) => patch({ dynamicFilters: checked })}
                        aria-label="Dynamic filters"
                      />
                    </div>

                    <div className={styles.field}>
                      <WuLabel className={styles.label}>Language</WuLabel>
                      <WuSelect
                        data={[...SHARED_LINK_LANGUAGE_OPTIONS]}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={languageOption}
                        onSelect={(option) => {
                          if (!option) return;
                          const next = option as (typeof SHARED_LINK_LANGUAGE_OPTIONS)[number];
                          patch({ language: next.value });
                        }}
                        variant="outlined"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.settingsSection}>
            <div className={styles.settingsHeader}>
              <span id="shared-link-text-ai-settings" className={styles.settingsTitle}>
                TextAI settings
              </span>
              <WuToggle
                checked={draft.textAiSettingsEnabled}
                onChange={(checked) => patch({ textAiSettingsEnabled: checked })}
                aria-label="TextAI settings"
                aria-controls="shared-link-text-ai-settings-panel"
              />
            </div>

            {draft.textAiSettingsEnabled ? (
              <div
                id="shared-link-text-ai-settings-panel"
                className={styles.settingsPanel}
                role="region"
                aria-labelledby="shared-link-text-ai-settings"
              >
                <div className={styles.toggleList}>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Show themes</span>
                    <WuToggle
                      checked={draft.showThemes}
                      onChange={(checked) => patch({ showThemes: checked })}
                      aria-label="Show themes"
                    />
                  </div>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Show topics</span>
                    <WuToggle
                      checked={draft.showTopics}
                      onChange={(checked) => patch({ showTopics: checked })}
                      aria-label="Show topics"
                    />
                  </div>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Show sentiment</span>
                    <WuToggle
                      checked={draft.showSentiment}
                      onChange={(checked) => patch({ showSentiment: checked })}
                      aria-label="Show sentiment"
                    />
                  </div>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Show emerging themes</span>
                    <WuToggle
                      checked={draft.showEmergingThemes}
                      onChange={(checked) => patch({ showEmergingThemes: checked })}
                      aria-label="Show emerging themes"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className={styles.footer}>
        <WuButton variant="link" onClick={onCancel}>
          Cancel
        </WuButton>
        <WuButton
          disabled={!canCreate}
          onClick={() =>
            onCreate({
              ...draft,
              name: draft.name.trim(),
              shareTitle: draft.shareTitle.trim(),
            })
          }
        >
          Create
        </WuButton>
      </div>
    </div>
  );
}
