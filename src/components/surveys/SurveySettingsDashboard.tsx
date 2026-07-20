'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmEnableRaaModal } from '@/components/surveys/ConfirmEnableRaaModal';
import { RespondentAnonymityModal } from '@/components/surveys/RespondentAnonymityModal';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  getDefaultSurveySettings,
  getSurveyDisplayId,
  RAA_CANNOT_DISABLE_MESSAGE,
  SURVEY_AUTHENTICATION_HELP,
  SURVEY_AUTHENTICATION_OPTIONS,
  SURVEY_SETTINGS_TABS,
  SURVEY_STATUS_OPTIONS,
  surveySettingsStorageKey,
  type ParticipationLogic,
  type RespondentAnonymityConfig,
  type SurveyAuthenticationMethod,
  type SurveyNotificationSettings,
  type SurveySecuritySettings,
  type SurveySettings,
  type SurveySettingsStatus,
  type SurveySettingsTab,
} from '@/data/mock-survey-settings';
import styles from './SurveySettingsDashboard.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const SURVEY_ID_TOOLTIP = 'Unique identifier for this survey.';
const COPY_SURVEY_ID_TOOLTIP = 'Copy Survey ID';

interface SurveySettingsDashboardProps {
  surveyId: number;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}

function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SurveySettingsDashboard({ surveyId }: SurveySettingsDashboardProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SurveySettingsTab>('settings');
  const [settings, setSettings] = usePersistedState<SurveySettings>(
    surveySettingsStorageKey(surveyId),
    getDefaultSurveySettings()
  );
  const security = settings.security;
  const notifications = settings.notifications;
  const authenticationMethod = settings.authenticationMethod ?? 'none';
  const [anonymityModalOpen, setAnonymityModalOpen] = useState(false);
  const [anonymityPendingEnable, setAnonymityPendingEnable] = useState(false);
  const [anonymityConfirmOpen, setAnonymityConfirmOpen] = useState(false);
  const [anonymityPendingConfig, setAnonymityPendingConfig] =
    useState<RespondentAnonymityConfig | null>(null);
  const transitioningToConfirmRef = useRef(false);

  const displayId = useMemo(() => getSurveyDisplayId(surveyId), [surveyId]);
  const statusValue =
    SURVEY_STATUS_OPTIONS.find((option) => option.value === security.status) ??
    SURVEY_STATUS_OPTIONS[0];
  const raaLocked =
    security.respondentAnonymityAssurance && !anonymityPendingEnable;

  function patchSecurity(partial: Partial<SurveySecuritySettings>): void {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, ...partial },
    }));
  }

  function patchNotifications(partial: Partial<SurveyNotificationSettings>): void {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...partial },
    }));
  }

  function setAuthenticationMethod(method: SurveyAuthenticationMethod): void {
    setSettings((prev) => ({
      ...prev,
      authenticationMethod: method,
    }));
  }

  function handleAnonymityToggle(checked: boolean): void {
    if (security.respondentAnonymityAssurance && !anonymityPendingEnable) {
      return;
    }
    if (checked) {
      setAnonymityPendingEnable(true);
      setAnonymityModalOpen(true);
      return;
    }
    setAnonymityPendingEnable(false);
    setAnonymityModalOpen(false);
  }

  function handleAnonymityView(): void {
    setAnonymityPendingEnable(false);
    setAnonymityModalOpen(true);
  }

  function handleAnonymityModalOpenChange(open: boolean): void {
    setAnonymityModalOpen(open);
    if (!open && anonymityPendingEnable) {
      if (transitioningToConfirmRef.current) {
        transitioningToConfirmRef.current = false;
        return;
      }
      setAnonymityPendingEnable(false);
      setAnonymityPendingConfig(null);
    }
  }

  function handleAnonymitySave(next: RespondentAnonymityConfig): void {
    if (anonymityPendingEnable) {
      transitioningToConfirmRef.current = true;
      setAnonymityPendingConfig(next);
      setAnonymityConfirmOpen(true);
      setAnonymityModalOpen(false);
      return;
    }
    patchSecurity({
      respondentAnonymityAssurance: true,
      respondentAnonymity: next,
    });
    setAnonymityModalOpen(false);
    showToast({
      message: 'Respondent Anonymity Assurance updated',
      variant: 'success',
    });
  }

  function handleAnonymityConfirmBack(): void {
    setAnonymityConfirmOpen(false);
    setAnonymityModalOpen(true);
  }

  function handleAnonymityConfirmOpenChange(open: boolean): void {
    setAnonymityConfirmOpen(open);
    if (!open && anonymityPendingEnable && !anonymityModalOpen) {
      setAnonymityPendingEnable(false);
      setAnonymityPendingConfig(null);
    }
  }

  function handleAnonymityConfirmEnable(): void {
    if (!anonymityPendingConfig) return;
    setAnonymityPendingEnable(false);
    patchSecurity({
      respondentAnonymityAssurance: true,
      respondentAnonymity: anonymityPendingConfig,
    });
    setAnonymityPendingConfig(null);
    setAnonymityConfirmOpen(false);
    setAnonymityModalOpen(false);
    showToast({ message: 'Enabled RAA successfully', variant: 'success' });
  }

  function handleSave(): void {
    showToast({ message: 'Settings saved', variant: 'success' });
  }

  async function handleCopySurveyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(String(displayId));
      showToast({ message: 'Survey ID copied', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy Survey ID', variant: 'error' });
    }
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Settings">
        <nav className={styles.sidebarNav}>
          {SURVEY_SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={
                activeTab === tab.id ? styles.sidebarItemActive : styles.sidebarItem
              }
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        {activeTab === 'settings' ? (
          <div className={styles.panel}>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Survey Status</span>
              <div className={styles.statusCluster}>
                <div className={styles.selectWrap}>
                  <WuSelect
                    data={SURVEY_STATUS_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={statusValue}
                    onSelect={(item) => {
                      const selected = item as { value: SurveySettingsStatus } | null;
                      if (!selected) return;
                      patchSecurity({ status: selected.value });
                    }}
                    variant="outlined"
                  />
                </div>
                <span className={styles.surveyId}>
                  <span>Survey ID:{' '}</span>
                  <WuTooltip content={COPY_SURVEY_ID_TOOLTIP} position="bottom">
                    <button
                      type="button"
                      className={styles.surveyIdCopyBtn}
                      onClick={() => void handleCopySurveyId()}
                      aria-label={`${COPY_SURVEY_ID_TOOLTIP}: ${displayId}`}
                    >
                      {displayId}
                    </button>
                  </WuTooltip>
                  <WuTooltip content={SURVEY_ID_TOOLTIP} position="bottom">
                    <span className={styles.infoIconWrap} aria-label={SURVEY_ID_TOOLTIP}>
                      <span className="wm-help-outline" aria-hidden />
                    </span>
                  </WuTooltip>
                </span>
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Response Quota</span>
              <div className={styles.controlStack}>
                <WuToggle
                  checked={security.responseQuotaEnabled}
                  onChange={(checked) => patchSecurity({ responseQuotaEnabled: checked })}
                  aria-label="Response Quota"
                />
                {security.responseQuotaEnabled ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.numberInput}
                    value={formatNumber(security.responseQuota)}
                    onChange={(event) =>
                      patchSecurity({
                        responseQuota: parseFormattedNumber(event.target.value),
                      })
                    }
                    aria-label="Response quota count"
                  />
                ) : null}
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Close Date &amp; Time</span>
              <div className={styles.controlStack}>
                <WuToggle
                  checked={security.closeDateTimeEnabled}
                  onChange={(checked) => patchSecurity({ closeDateTimeEnabled: checked })}
                  aria-label="Close Date & Time"
                />
                {security.closeDateTimeEnabled ? (
                  <input
                    type="datetime-local"
                    className={styles.dateInput}
                    value={security.closeDateTime}
                    onChange={(event) =>
                      patchSecurity({ closeDateTime: event.target.value })
                    }
                    aria-label="Close date and time"
                  />
                ) : null}
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Participation Logic</span>
              <div
                className={styles.radioGroup}
                role="radiogroup"
                aria-label="Participation Logic"
              >
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="participation-logic"
                    checked={security.participationLogic === 'allow-multiple'}
                    onChange={() =>
                      patchSecurity({ participationLogic: 'allow-multiple' as ParticipationLogic })
                    }
                  />
                  <span>Allow the survey to be taken more than once</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="participation-logic"
                    checked={security.participationLogic === 'once-only'}
                    onChange={() =>
                      patchSecurity({ participationLogic: 'once-only' as ParticipationLogic })
                    }
                  />
                  <span>
                    Only allow the survey to be taken once (prevents ballot box stuffing)
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Custom Variable Identification</span>
              <WuToggle
                checked={security.customVariableIdentification}
                onChange={(checked) =>
                  patchSecurity({ customVariableIdentification: checked })
                }
                aria-label="Custom Variable Identification"
              />
            </div>

            {security.participationLogic === 'once-only' ? (
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Multiple Responding Message</span>
                <SurveySettingsRichText
                  value={security.multipleRespondingMessage}
                  onChange={(next) => patchSecurity({ multipleRespondingMessage: next })}
                  ariaLabel="Multiple Responding Message"
                />
              </div>
            ) : null}

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Save and Continue</span>
              <div className={styles.controlStack}>
                <WuToggle
                  checked={security.saveAndContinue}
                  onChange={(checked) => patchSecurity({ saveAndContinue: checked })}
                  aria-label="Save and Continue"
                />
                <div className={styles.warningBanner} role="note">
                  Save and Continue will be disabled during block looping.
                </div>
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Survey Timer</span>
              <WuToggle
                checked={security.surveyTimer}
                onChange={(checked) => patchSecurity({ surveyTimer: checked })}
                aria-label="Survey Timer"
              />
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>SEO</span>
              <WuToggle
                checked={security.seo}
                onChange={(checked) => patchSecurity({ seo: checked })}
                aria-label="SEO"
              />
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Capture Location Data</span>
              <WuToggle
                checked={security.captureLocationData}
                onChange={(checked) => patchSecurity({ captureLocationData: checked })}
                aria-label="Capture Location Data"
              />
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Respondent Anonymity Assurance</span>
              <div className={styles.raaControls}>
                {raaLocked ? (
                  <WuTooltip content={RAA_CANNOT_DISABLE_MESSAGE} position="bottom">
                    <span className={styles.raaToggleLocked}>
                      <WuToggle
                        checked
                        onChange={() => undefined}
                        aria-label="Respondent Anonymity Assurance"
                      />
                    </span>
                  </WuTooltip>
                ) : (
                  <WuToggle
                    checked={security.respondentAnonymityAssurance}
                    onChange={handleAnonymityToggle}
                    aria-label="Respondent Anonymity Assurance"
                  />
                )}
                {raaLocked ? (
                  <button
                    type="button"
                    className={styles.raaViewBtn}
                    aria-label="View Respondent Anonymity Assurance"
                    onClick={handleAnonymityView}
                  >
                    <span className="wm-visibility" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Age Verification</span>
              <WuToggle
                checked={security.ageVerification}
                onChange={(checked) => patchSecurity({ ageVerification: checked })}
                aria-label="Age Verification"
              />
            </div>

            <div className={styles.actions}>
              <WuButton onClick={handleSave}>Save Changes</WuButton>
            </div>
          </div>
        ) : activeTab === 'security' ? (
          <div className={`${styles.panel} ${styles.authPanel}`}>
            <div className={styles.authHeader}>
              <h2 className={styles.authTitle}>Survey Authentication</h2>
              <WuTooltip content={SURVEY_AUTHENTICATION_HELP} position="top">
                <button
                  type="button"
                  className={styles.authHelpBtn}
                  aria-label={SURVEY_AUTHENTICATION_HELP}
                >
                  <span className="wm-help-outline" aria-hidden />
                </button>
              </WuTooltip>
            </div>

            <div
              className={styles.authOptions}
              role="radiogroup"
              aria-label="Survey Authentication"
            >
              {SURVEY_AUTHENTICATION_OPTIONS.map((option) => (
                <label key={option.id} className={styles.authOption}>
                  <input
                    type="radio"
                    name="survey-authentication"
                    checked={authenticationMethod === option.id}
                    onChange={() => setAuthenticationMethod(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className={styles.actions}>
              <WuButton onClick={handleSave}>Save Changes</WuButton>
            </div>
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Email on survey complete</span>
              <WuToggle
                checked={notifications.emailOnComplete}
                onChange={(checked) => patchNotifications({ emailOnComplete: checked })}
                aria-label="Email on survey complete"
              />
            </div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Email when quota is reached</span>
              <WuToggle
                checked={notifications.emailOnQuotaReached}
                onChange={(checked) =>
                  patchNotifications({ emailOnQuotaReached: checked })
                }
                aria-label="Email when quota is reached"
              />
            </div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Email on partial response</span>
              <WuToggle
                checked={notifications.emailOnPartialResponse}
                onChange={(checked) =>
                  patchNotifications({ emailOnPartialResponse: checked })
                }
                aria-label="Email on partial response"
              />
            </div>
            <div className={styles.actions}>
              <WuButton onClick={handleSave}>Save Changes</WuButton>
            </div>
          </div>
        )}
      </div>

      <RespondentAnonymityModal
        open={anonymityModalOpen}
        onOpenChange={handleAnonymityModalOpenChange}
        value={anonymityPendingConfig ?? security.respondentAnonymity}
        onSave={handleAnonymitySave}
        expandOnly={raaLocked}
      />

      <ConfirmEnableRaaModal
        open={anonymityConfirmOpen}
        onOpenChange={handleAnonymityConfirmOpenChange}
        onBack={handleAnonymityConfirmBack}
        onConfirm={handleAnonymityConfirmEnable}
      />
    </div>
  );
}
