'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { RespondentAnonymityModal } from '@/components/surveys/RespondentAnonymityModal';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import {
  getDefaultSurveySettings,
  getSurveyDisplayId,
  RAA_CANNOT_DISABLE_MESSAGE,
  SURVEY_SETTINGS_TABS,
  SURVEY_STATUS_OPTIONS,
  type ParticipationLogic,
  type RespondentAnonymityConfig,
  type SurveyNotificationSettings,
  type SurveySecuritySettings,
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
  const [activeTab, setActiveTab] = useState<SurveySettingsTab>('security');
  const [security, setSecurity] = useState<SurveySecuritySettings>(
    () => getDefaultSurveySettings().security
  );
  const [notifications, setNotifications] = useState<SurveyNotificationSettings>(
    () => getDefaultSurveySettings().notifications
  );
  const [anonymityModalOpen, setAnonymityModalOpen] = useState(false);
  const [anonymityPendingEnable, setAnonymityPendingEnable] = useState(false);

  const displayId = useMemo(() => getSurveyDisplayId(surveyId), [surveyId]);
  const statusValue =
    SURVEY_STATUS_OPTIONS.find((option) => option.value === security.status) ??
    SURVEY_STATUS_OPTIONS[0];
  const raaLocked =
    security.respondentAnonymityAssurance && !anonymityPendingEnable;

  function patchSecurity(partial: Partial<SurveySecuritySettings>): void {
    setSecurity((prev) => ({ ...prev, ...partial }));
  }

  function patchNotifications(partial: Partial<SurveyNotificationSettings>): void {
    setNotifications((prev) => ({ ...prev, ...partial }));
  }

  function handleAnonymityToggle(checked: boolean): void {
    if (security.respondentAnonymityAssurance && !anonymityPendingEnable) {
      return;
    }
    if (checked) {
      patchSecurity({ respondentAnonymityAssurance: true });
      setAnonymityPendingEnable(true);
      setAnonymityModalOpen(true);
      return;
    }
    setAnonymityPendingEnable(false);
    setAnonymityModalOpen(false);
    patchSecurity({ respondentAnonymityAssurance: false });
  }

  function handleAnonymityView(): void {
    setAnonymityPendingEnable(false);
    setAnonymityModalOpen(true);
  }

  function handleAnonymityModalOpenChange(open: boolean): void {
    setAnonymityModalOpen(open);
    if (!open && anonymityPendingEnable) {
      setAnonymityPendingEnable(false);
      patchSecurity({ respondentAnonymityAssurance: false });
    }
  }

  function handleAnonymitySave(next: RespondentAnonymityConfig): void {
    const wasPendingEnable = anonymityPendingEnable;
    setAnonymityPendingEnable(false);
    patchSecurity({
      respondentAnonymityAssurance: true,
      respondentAnonymity: next,
    });
    setAnonymityModalOpen(false);
    showToast({
      message: wasPendingEnable
        ? 'Enabled RAA successfully'
        : 'Respondent Anonymity Assurance updated',
      variant: 'success',
    });
  }

  function handleSave(): void {
    showToast({ message: 'Settings saved', variant: 'success' });
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Settings">
        <h2 className={styles.sidebarTitle}>Settings</h2>
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
        {activeTab === 'security' ? (
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
                  Survey ID: {displayId}
                  <WuTooltip content={SURVEY_ID_TOOLTIP} position="bottom">
                    <span className={styles.infoIconWrap} aria-label={SURVEY_ID_TOOLTIP}>
                      <span className="wm-info" aria-hidden />
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
        value={security.respondentAnonymity}
        onSave={handleAnonymitySave}
        expandOnly={raaLocked}
      />
    </div>
  );
}
