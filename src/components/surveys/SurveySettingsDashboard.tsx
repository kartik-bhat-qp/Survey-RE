'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AgeVerificationModal } from '@/components/surveys/AgeVerificationModal';
import { ConfirmEnableRaaModal } from '@/components/surveys/ConfirmEnableRaaModal';
import { CustomVariableIdentificationModal } from '@/components/surveys/CustomVariableIdentificationModal';
import { RespondentAnonymityModal } from '@/components/surveys/RespondentAnonymityModal';
import { SaveAndContinueEmailModal } from '@/components/surveys/SaveAndContinueEmailModal';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import { MOCK_EMAIL_LISTS } from '@/data/mock-survey-distribute';
import {
  getDefaultSurveySettings,
  getSurveyDisplayId,
  normalizeSurveySettings,
  RAA_CANNOT_DISABLE_MESSAGE,
  SURVEY_AUTHENTICATION_HELP,
  SURVEY_AUTHENTICATION_OPTIONS,
  SURVEY_SETTINGS_TABS,
  SURVEY_STATUS_OPTIONS,
  SURVEY_TIMER_EXPIRY_OPTIONS,
  surveySettingsStorageKey,
  type AgeVerificationSettings,
  type EmailPasswordAuthenticationSettings,
  type ParticipationLogic,
  type ParticipantIdAuthenticationSettings,
  type RespondentAnonymityConfig,
  type SaveAndContinueEmailSettings,
  type SurveyAuthenticationMethod,
  type SurveyTimerExpiryAction,
  type UsernamePasswordAuthenticationSettings,
  type SurveyNotificationSettings,
  type SurveySecuritySettings,
  type SurveySettings,
  type SurveySettingsStatus,
  type SurveySettingsTab,
} from '@/data/mock-survey-settings';
import {
  createSurveyNotificationItem,
  SURVEY_NOTIFICATION_HELP,
  SURVEY_NOTIFICATION_LIST_VIEW_OPTIONS,
  type SurveyNotificationItem,
  type SurveyNotificationListView,
} from '@/data/mock-survey-notifications';
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
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTimePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTimePicker })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
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

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCloseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getTimezoneLabel(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const longName =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'long',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
  return `(${offset}) ${longName} - ${city}`;
}

/** WuTimePicker keeps selection in local state; sync it out without overriding its onChange. */
function SyncedWuTimePicker({
  time,
  onTimeChange,
  ariaLabel,
  className,
}: {
  time: string;
  onTimeChange: (time: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(time);
  const onTimeChangeRef = useRef(onTimeChange);
  timeRef.current = time;
  onTimeChangeRef.current = onTimeChange;

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const readTime = (): string => {
      const input = root.querySelector<HTMLInputElement>('input[type="time"]');
      return input?.value?.slice(0, 5) || '00:00';
    };

    const commit = () => {
      const next = readTime();
      if (next !== timeRef.current) {
        onTimeChangeRef.current(next);
      }
    };

    const onInteract = () => {
      window.setTimeout(commit, 0);
    };

    root.addEventListener('input', commit, true);
    root.addEventListener('change', commit, true);
    root.addEventListener('pointerup', onInteract);
    root.addEventListener('keyup', onInteract);

    return () => {
      root.removeEventListener('input', commit, true);
      root.removeEventListener('change', commit, true);
      root.removeEventListener('pointerup', onInteract);
      root.removeEventListener('keyup', onInteract);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className ?? styles.closeTimePicker}>
      <WuTimePicker time={time || '00:00'} aria-label={ariaLabel} />
    </div>
  );
}

export function SurveySettingsDashboard({ surveyId }: SurveySettingsDashboardProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SurveySettingsTab>('settings');
  const [settingsRaw, setSettings] = usePersistedState<SurveySettings>(
    surveySettingsStorageKey(surveyId),
    getDefaultSurveySettings()
  );
  const [anonymityModalOpen, setAnonymityModalOpen] = useState(false);
  const [anonymityPendingEnable, setAnonymityPendingEnable] = useState(false);
  const [anonymityConfirmOpen, setAnonymityConfirmOpen] = useState(false);
  const [customVariableModalOpen, setCustomVariableModalOpen] = useState(false);
  const [saveAndContinueEmailModalOpen, setSaveAndContinueEmailModalOpen] = useState(false);
  const [ageVerificationModalOpen, setAgeVerificationModalOpen] = useState(false);
  const [anonymityPendingConfig, setAnonymityPendingConfig] =
    useState<RespondentAnonymityConfig | null>(null);
  const transitioningToConfirmRef = useRef(false);

  const displayId = useMemo(() => getSurveyDisplayId(surveyId), [surveyId]);
  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);
  const settings = useMemo(() => normalizeSurveySettings(settingsRaw), [settingsRaw]);
  const security = settings.security;
  const notifications = settings.notifications;
  const authenticationMethod = settings.authenticationMethod ?? 'none';
  const statusValue = useMemo(
    () =>
      SURVEY_STATUS_OPTIONS.find((option) => option.value === security.status) ??
      SURVEY_STATUS_OPTIONS[0],
    [security.status]
  );
  const closeDateValue = useMemo(
    () => parseCloseDate(security.closeDate),
    [security.closeDate]
  );
  const raaLocked =
    security.respondentAnonymityAssurance && !anonymityPendingEnable;

  function patchSecurity(partial: Partial<SurveySecuritySettings>): void {
    setSettings((prev) => {
      const nextSecurity = { ...prev.security, ...partial };
      const hasChanges = (Object.keys(partial) as (keyof SurveySecuritySettings)[]).some(
        (key) => !Object.is(prev.security[key], nextSecurity[key])
      );
      if (!hasChanges) return prev;
      return { ...prev, security: nextSecurity };
    });
  }

  function patchNotifications(partial: Partial<SurveyNotificationSettings>): void {
    setSettings((prev) => {
      const nextNotifications = { ...prev.notifications, ...partial };
      const hasChanges = (Object.keys(partial) as (keyof SurveyNotificationSettings)[]).some(
        (key) => !Object.is(prev.notifications[key], nextNotifications[key])
      );
      if (!hasChanges) return prev;
      return { ...prev, notifications: nextNotifications };
    });
  }

  function updateNotificationItem(
    notificationId: string,
    patch: Partial<SurveyNotificationItem>
  ): void {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        items: prev.notifications.items.map((item) =>
          item.id === notificationId ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  function handleAddNotification(): void {
    const item = createSurveyNotificationItem({
      name: `Notification ${notifications.items.length + 1}`,
      enabled: false,
      sendTo: 'Survey Administrator',
      criteria: 'Completed response',
    });
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        items: [...prev.notifications.items, item],
      },
    }));
    showToast({ message: 'Notification added', variant: 'success' });
  }

  function handleDeleteNotification(notificationId: string): void {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        items: prev.notifications.items.filter((item) => item.id !== notificationId),
      },
    }));
    showToast({ message: 'Notification deleted', variant: 'success' });
  }

  function handleNotificationListViewChange(listView: SurveyNotificationListView): void {
    patchNotifications({ listView });
  }

  function setAuthenticationMethod(method: SurveyAuthenticationMethod): void {
    setSettings((prev) => {
      if (prev.authenticationMethod === method) return prev;
      return { ...prev, authenticationMethod: method };
    });
  }

  function setGlobalPassword(globalPassword: string): void {
    setSettings((prev) => {
      if (prev.globalPassword === globalPassword) return prev;
      return { ...prev, globalPassword };
    });
  }

  function patchEmailPasswordAuth(partial: Partial<EmailPasswordAuthenticationSettings>): void {
    setSettings((prev) => {
      const nextEmailPasswordAuth = { ...prev.emailPasswordAuth, ...partial };
      const hasChanges = (
        Object.keys(partial) as (keyof EmailPasswordAuthenticationSettings)[]
      ).some((key) => !Object.is(prev.emailPasswordAuth[key], nextEmailPasswordAuth[key]));
      if (!hasChanges) return prev;
      return { ...prev, emailPasswordAuth: nextEmailPasswordAuth };
    });
  }

  function patchUsernamePasswordAuth(
    partial: Partial<UsernamePasswordAuthenticationSettings>
  ): void {
    setSettings((prev) => {
      const nextUsernamePasswordAuth = { ...prev.usernamePasswordAuth, ...partial };
      const hasChanges = (
        Object.keys(partial) as (keyof UsernamePasswordAuthenticationSettings)[]
      ).some(
        (key) => !Object.is(prev.usernamePasswordAuth[key], nextUsernamePasswordAuth[key])
      );
      if (!hasChanges) return prev;
      return { ...prev, usernamePasswordAuth: nextUsernamePasswordAuth };
    });
  }

  const selectedEmailList = useMemo(
    () =>
      MOCK_EMAIL_LISTS.find((list) => list.value === settings.emailPasswordAuth.emailListId) ??
      null,
    [settings.emailPasswordAuth.emailListId]
  );

  const selectedUsernameEmailList = useMemo(
    () =>
      MOCK_EMAIL_LISTS.find(
        (list) => list.value === settings.usernamePasswordAuth.emailListId
      ) ?? null,
    [settings.usernamePasswordAuth.emailListId]
  );

  function patchParticipantIdAuth(partial: Partial<ParticipantIdAuthenticationSettings>): void {
    setSettings((prev) => {
      const nextParticipantIdAuth = { ...prev.participantIdAuth, ...partial };
      const hasChanges = (
        Object.keys(partial) as (keyof ParticipantIdAuthenticationSettings)[]
      ).some((key) => !Object.is(prev.participantIdAuth[key], nextParticipantIdAuth[key]));
      if (!hasChanges) return prev;
      return { ...prev, participantIdAuth: nextParticipantIdAuth };
    });
  }

  const selectedParticipantEmailList = useMemo(
    () =>
      MOCK_EMAIL_LISTS.find((list) => list.value === settings.participantIdAuth.emailListId) ??
      null,
    [settings.participantIdAuth.emailListId]
  );

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

            <div
              className={
                security.closeDateTimeEnabled
                  ? `${styles.settingRow} ${styles.settingRowNoDivider}`
                  : styles.settingRow
              }
            >
              <span className={styles.settingLabel}>Schedule Close</span>
              <div className={styles.controlStack}>
                <WuToggle
                  checked={security.closeDateTimeEnabled}
                  onChange={(checked) => {
                    if (checked && !security.closeDate) {
                      patchSecurity({
                        closeDateTimeEnabled: true,
                        closeDate: formatDateInputValue(new Date()),
                        closeTime: security.closeTime || '00:00',
                      });
                      return;
                    }
                    patchSecurity({ closeDateTimeEnabled: checked });
                  }}
                  aria-label="Schedule Close"
                />
                {security.closeDateTimeEnabled ? (
                  <div className={styles.closeDateTimeRow}>
                    <div className={styles.closeDatePicker}>
                      <WuDatePicker
                        value={closeDateValue}
                        onChange={(date) => {
                          const nextDate = date ? formatDateInputValue(date) : '';
                          if (nextDate === security.closeDate) return;
                          patchSecurity({ closeDate: nextDate });
                        }}
                        formatString="MM/dd/yyyy"
                        placeholder="MM/DD/YYYY"
                        variant="outlined"
                        aria-label="Close date"
                      />
                    </div>
                    <SyncedWuTimePicker
                      time={security.closeTime || '00:00'}
                      onTimeChange={(closeTime) => patchSecurity({ closeTime })}
                      ariaLabel="Close time"
                    />
                    <span className={styles.timezoneLabel}>{timezoneLabel}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {security.closeDateTimeEnabled ? (
              <div className={`${styles.settingRow} ${styles.settingRowContinue}`}>
                <span className={styles.settingLabel}>Closed Message</span>
                <SurveySettingsRichText
                  value={security.closedMessage}
                  onChange={(next) => patchSecurity({ closedMessage: next })}
                  ariaLabel="Closed Message"
                />
              </div>
            ) : null}

            <div
              className={
                security.participationLogic === 'once-only'
                  ? `${styles.settingRow} ${styles.settingRowNoDivider}`
                  : styles.settingRow
              }
            >
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
                  <span className={styles.radioOptionRow}>
                    <span>
                      Only allow the survey to be taken once (prevents ballot box stuffing)
                    </span>
                    <button
                      type="button"
                      className={styles.participationSettingsBtn}
                      aria-label="Custom Variable Identification settings"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (security.participationLogic !== 'once-only') {
                          patchSecurity({ participationLogic: 'once-only' });
                        }
                        setCustomVariableModalOpen(true);
                      }}
                    >
                      <span className="wm-settings" aria-hidden />
                    </button>
                  </span>
                </label>
              </div>
            </div>

            {security.participationLogic === 'once-only' ? (
              <div className={`${styles.settingRow} ${styles.settingRowContinue}`}>
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
                <div className={styles.saveAndContinueRow}>
                  <div className={styles.toggleSlot}>
                    <WuToggle
                      checked={security.saveAndContinue}
                      onChange={(checked) => patchSecurity({ saveAndContinue: checked })}
                      aria-label="Save and Continue"
                    />
                  </div>
                  {security.saveAndContinue ? (
                    <>
                      <span className={styles.saveAndContinueFieldLabel}>Button Text</span>
                      <input
                        type="text"
                        className={styles.saveAndContinueInput}
                        value={security.saveAndContinueButtonText}
                        onChange={(event) =>
                          patchSecurity({ saveAndContinueButtonText: event.target.value })
                        }
                        aria-label="Save and Continue button text"
                      />
                      <button
                        type="button"
                        className={styles.editEmailLink}
                        onClick={() => setSaveAndContinueEmailModalOpen(true)}
                      >
                        <span className="wm-email" aria-hidden />
                        Edit Email
                      </button>
                    </>
                  ) : null}
                </div>
                <div className={styles.warningBanner} role="note">
                  Save and Continue will be disabled during block looping.
                </div>
              </div>
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Survey Timer</span>
              <div className={styles.controlStack}>
                <div className={styles.surveyTimerRow}>
                  <div className={styles.toggleSlot}>
                    <WuToggle
                      checked={security.surveyTimer}
                      onChange={(checked) => patchSecurity({ surveyTimer: checked })}
                      aria-label="Survey Timer"
                    />
                  </div>
                  {security.surveyTimer ? (
                    <>
                      <SyncedWuTimePicker
                        time={security.surveyTimerDuration || '00:05'}
                        onTimeChange={(surveyTimerDuration) =>
                          patchSecurity({ surveyTimerDuration })
                        }
                        ariaLabel="Survey timer duration"
                        className={styles.surveyTimerPicker}
                      />
                      <div className={styles.surveyTimerExpirySelect}>
                        <WuSelect
                          data={SURVEY_TIMER_EXPIRY_OPTIONS}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={
                            SURVEY_TIMER_EXPIRY_OPTIONS.find(
                              (option) => option.value === security.surveyTimerExpiryAction
                            ) ?? SURVEY_TIMER_EXPIRY_OPTIONS[0]
                          }
                          onSelect={(item) => {
                            const selected = item as { value: SurveyTimerExpiryAction } | null;
                            if (!selected) return;
                            patchSecurity({ surveyTimerExpiryAction: selected.value });
                          }}
                          variant="outlined"
                          aria-label="When time is up"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
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
                <div key={option.id} className={styles.authOptionGroup}>
                  <label className={styles.authOption}>
                    <input
                      type="radio"
                      name="survey-authentication"
                      checked={authenticationMethod === option.id}
                      onChange={() => setAuthenticationMethod(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                  {option.id === 'global-password' &&
                  authenticationMethod === 'global-password' ? (
                    <div className={styles.authNestedFields}>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="global-survey-password"
                        >
                          Password
                        </label>
                        <WuInput
                          id="global-survey-password"
                          type="password"
                          variant="outlined"
                          value={settings.globalPassword}
                          onChange={(event) => setGlobalPassword(event.target.value)}
                          placeholder="Enter password"
                          aria-label="Global survey password"
                        />
                      </div>
                    </div>
                  ) : null}
                  {option.id === 'email-password' && authenticationMethod === 'email-password' ? (
                    <div className={styles.authNestedFields}>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-email-address">
                          Email Address
                        </label>
                        <WuInput
                          id="auth-email-address"
                          type="email"
                          variant="outlined"
                          value={settings.emailPasswordAuth.emailAddress}
                          onChange={(event) =>
                            patchEmailPasswordAuth({ emailAddress: event.target.value })
                          }
                          aria-label="Email address"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-email-password">
                          Password
                        </label>
                        <WuInput
                          id="auth-email-password"
                          type="password"
                          variant="outlined"
                          value={settings.emailPasswordAuth.password}
                          onChange={(event) =>
                            patchEmailPasswordAuth({ password: event.target.value })
                          }
                          aria-label="Password"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="auth-invalid-credentials"
                        >
                          Invalid Credentials
                        </label>
                        <WuInput
                          id="auth-invalid-credentials"
                          variant="outlined"
                          value={settings.emailPasswordAuth.invalidCredentialsMessage}
                          onChange={(event) =>
                            patchEmailPasswordAuth({
                              invalidCredentialsMessage: event.target.value,
                            })
                          }
                          aria-label="Invalid credentials message"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-email-list">
                          Choose an Email List
                        </label>
                        <WuSelect
                          data={MOCK_EMAIL_LISTS}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={selectedEmailList}
                          onSelect={(item) => {
                            const selected = item as { value: string } | null;
                            patchEmailPasswordAuth({
                              emailListId: selected?.value ?? '',
                            });
                          }}
                          placeholder="-- Select --"
                          variant="outlined"
                          aria-label="Choose an email list"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <span className={styles.authFieldLabel} aria-hidden />
                        <button
                          type="button"
                          className={styles.createListLink}
                          onClick={() =>
                            showToast({
                              message: 'Create New List opened',
                              variant: 'success',
                            })
                          }
                        >
                          + Create New List
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {option.id === 'username-password' &&
                  authenticationMethod === 'username-password' ? (
                    <div className={styles.authNestedFields}>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-username">
                          Username
                        </label>
                        <WuInput
                          id="auth-username"
                          variant="outlined"
                          value={settings.usernamePasswordAuth.username}
                          onChange={(event) =>
                            patchUsernamePasswordAuth({ username: event.target.value })
                          }
                          placeholder="Username"
                          aria-label="Username"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="auth-username-password"
                        >
                          Password
                        </label>
                        <WuInput
                          id="auth-username-password"
                          type="password"
                          variant="outlined"
                          value={settings.usernamePasswordAuth.password}
                          onChange={(event) =>
                            patchUsernamePasswordAuth({ password: event.target.value })
                          }
                          placeholder="Password"
                          aria-label="Password"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="auth-username-invalid-credentials"
                        >
                          Invalid Credentials
                        </label>
                        <WuInput
                          id="auth-username-invalid-credentials"
                          variant="outlined"
                          value={settings.usernamePasswordAuth.invalidCredentialsMessage}
                          onChange={(event) =>
                            patchUsernamePasswordAuth({
                              invalidCredentialsMessage: event.target.value,
                            })
                          }
                          aria-label="Invalid credentials message"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="auth-username-email-list"
                        >
                          Choose an Email List
                        </label>
                        <WuSelect
                          data={MOCK_EMAIL_LISTS}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={selectedUsernameEmailList}
                          onSelect={(item) => {
                            const selected = item as { value: string } | null;
                            patchUsernamePasswordAuth({
                              emailListId: selected?.value ?? '',
                            });
                          }}
                          placeholder="-- Select --"
                          variant="outlined"
                          aria-label="Choose an email list"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <span className={styles.authFieldLabel} aria-hidden />
                        <button
                          type="button"
                          className={styles.createListLink}
                          onClick={() =>
                            showToast({
                              message: 'Create New List opened',
                              variant: 'success',
                            })
                          }
                        >
                          + Create New List
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {option.id === 'participant-id' && authenticationMethod === 'participant-id' ? (
                    <div className={styles.authNestedFields}>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-unique-key">
                          Unique Key
                        </label>
                        <WuInput
                          id="auth-unique-key"
                          variant="outlined"
                          value={settings.participantIdAuth.uniqueKey}
                          onChange={(event) =>
                            patchParticipantIdAuth({ uniqueKey: event.target.value })
                          }
                          aria-label="Unique key"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label className={styles.authFieldLabel} htmlFor="auth-invalid-value">
                          Invalid Value
                        </label>
                        <WuInput
                          id="auth-invalid-value"
                          variant="outlined"
                          value={settings.participantIdAuth.invalidValueMessage}
                          onChange={(event) =>
                            patchParticipantIdAuth({
                              invalidValueMessage: event.target.value,
                            })
                          }
                          aria-label="Invalid value message"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <label
                          className={styles.authFieldLabel}
                          htmlFor="auth-participant-email-list"
                        >
                          Choose an Email List
                        </label>
                        <WuSelect
                          data={MOCK_EMAIL_LISTS}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={selectedParticipantEmailList}
                          onSelect={(item) => {
                            const selected = item as { value: string } | null;
                            patchParticipantIdAuth({
                              emailListId: selected?.value ?? '',
                            });
                          }}
                          placeholder="-- Select --"
                          variant="outlined"
                          aria-label="Choose an email list"
                        />
                      </div>
                      <div className={styles.authFieldRow}>
                        <span className={styles.authFieldLabel} aria-hidden />
                        <button
                          type="button"
                          className={styles.createListLink}
                          onClick={() =>
                            showToast({
                              message: 'Create New List opened',
                              variant: 'success',
                            })
                          }
                        >
                          + Create New List
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <WuButton onClick={handleSave}>Save Changes</WuButton>
            </div>
          </div>
        ) : activeTab === 'privacy' ? (
          <div className={styles.panel}>
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
              <div className={styles.ageVerificationControls}>
                <WuToggle
                  checked={security.ageVerification}
                  onChange={(checked) => patchSecurity({ ageVerification: checked })}
                  aria-label="Age Verification"
                />
                {security.ageVerification ? (
                  <button
                    type="button"
                    className={styles.ageVerificationSettingsBtn}
                    aria-label="Age Verification settings"
                    onClick={() => setAgeVerificationModalOpen(true)}
                  >
                    <span className="wm-settings" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.actions}>
              <WuButton onClick={handleSave}>Save Changes</WuButton>
            </div>
          </div>
        ) : (
          <div className={`${styles.panel} ${styles.notificationsPanel}`}>
            <div className={styles.notificationsToolbar}>
              <WuButton onClick={handleAddNotification}>+ New Notification</WuButton>
            </div>

            <div
              className={`${styles.notificationsTable} ${
                notifications.listView === 'expanded' ? styles.notificationsTableExpanded : ''
              }`}
            >
              <div className={styles.notificationsHeader}>
                <div className={styles.notificationsColName}>
                  <span>Notification</span>
                  <WuTooltip content={SURVEY_NOTIFICATION_HELP} position="top">
                    <button
                      type="button"
                      className={styles.notificationHelpBtn}
                      aria-label={SURVEY_NOTIFICATION_HELP}
                    >
                      <span className="wm-help-outline" aria-hidden />
                    </button>
                  </WuTooltip>
                </div>
                <div className={styles.notificationsColSendTo}>Send to</div>
                <div className={styles.notificationsColCriteria}>Criteria</div>
                <div className={styles.notificationsColView}>
                  <WuMenu
                    Trigger={
                      <button type="button" className={styles.compactViewBtn}>
                        {SURVEY_NOTIFICATION_LIST_VIEW_OPTIONS.find(
                          (option) => option.value === notifications.listView
                        )?.label ?? 'Compact View'}
                        <span className="wm-arrow-drop-down" aria-hidden />
                      </button>
                    }
                  >
                    {SURVEY_NOTIFICATION_LIST_VIEW_OPTIONS.map((option) => (
                      <WuMenuItem
                        key={option.value}
                        onSelect={() => handleNotificationListViewChange(option.value)}
                      >
                        {option.label}
                      </WuMenuItem>
                    ))}
                  </WuMenu>
                </div>
              </div>

              <div className={styles.notificationsBody}>
                {notifications.items.map((item) => (
                  <div key={item.id} className={styles.notificationsDataRow}>
                    <div className={styles.notificationsColName}>
                      <button
                        type="button"
                        className={styles.notificationNameLink}
                        onClick={() =>
                          showToast({
                            message: `Edit ${item.name}`,
                            variant: 'info',
                          })
                        }
                      >
                        {item.name}
                      </button>
                      <WuToggle
                        checked={item.enabled}
                        onChange={(checked) =>
                          updateNotificationItem(item.id, { enabled: checked })
                        }
                        aria-label={`Enable ${item.name}`}
                      />
                    </div>
                    <div className={styles.notificationsColSendTo}>{item.sendTo}</div>
                    <div className={styles.notificationsColCriteria}>{item.criteria || '—'}</div>
                    <div className={styles.notificationsColActions}>
                      <WuTooltip content="Delete notification" position="top">
                        <button
                          type="button"
                          className={styles.notificationDeleteBtn}
                          aria-label={`Delete ${item.name}`}
                          onClick={() => handleDeleteNotification(item.id)}
                        >
                          <span className="wm-delete" aria-hidden />
                        </button>
                      </WuTooltip>
                    </div>
                  </div>
                ))}
              </div>
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

      <CustomVariableIdentificationModal
        open={customVariableModalOpen}
        onOpenChange={setCustomVariableModalOpen}
        enabled={security.customVariableIdentification}
        variable={security.customVariableIdentificationVariable}
        onEnabledChange={(checked) => {
          if (checked && !security.customVariableIdentificationVariable) {
            patchSecurity({
              customVariableIdentification: true,
              customVariableIdentificationVariable: 'cv-1',
            });
            return;
          }
          patchSecurity({ customVariableIdentification: checked });
        }}
        onVariableChange={(variable) =>
          patchSecurity({ customVariableIdentificationVariable: variable })
        }
      />

      <SaveAndContinueEmailModal
        open={saveAndContinueEmailModalOpen}
        onOpenChange={setSaveAndContinueEmailModalOpen}
        value={security.saveAndContinueEmail}
        onSave={(next: SaveAndContinueEmailSettings) => {
          patchSecurity({ saveAndContinueEmail: next });
          showToast({
            message: 'Save & Continue email saved',
            variant: 'success',
          });
        }}
      />

      <AgeVerificationModal
        open={ageVerificationModalOpen}
        onOpenChange={setAgeVerificationModalOpen}
        value={security.ageVerificationSettings}
        onSave={(next: AgeVerificationSettings) => {
          patchSecurity({ ageVerificationSettings: next });
          showToast({
            message: 'Age Verification settings saved',
            variant: 'success',
          });
        }}
      />
    </div>
  );
}
