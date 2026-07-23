'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getDefaultMobileDeviceTab,
  getRecordAudioCapturePointOptions,
  MOBILE_DEVICE_AUDIT_SURVEY_OPTIONS,
  MOBILE_DEVICE_CAPTURE_POINTS_OPTIONS,
  MOBILE_DEVICE_FOLDER_OPTIONS,
  MOBILE_DEVICE_LANGUAGE_OPTIONS,
  MOBILE_DEVICE_MULTI_SURVEY_QUESTION_TOOLTIP,
  MOBILE_DEVICE_TABS,
  type MobileDevice,
  type MobileDeviceAuditOption,
  type MobileDeviceSettings,
  type MobileDeviceTabId,
  type RecordAudioCapturePointOption,
} from '@/data/mock-survey-mobile-app';
import styles from './SurveyMobileDeviceDetail.module.css';

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

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyMobileDeviceDetailProps {
  device: MobileDevice;
  onBack: () => void;
  onSave: (device: MobileDevice) => void;
}

function InfoHint({ text }: { text: string }) {
  return (
    <WuTooltip content={text} position="top">
      <span className={styles.infoHint} aria-label={text} title={text}>
        ?
      </span>
    </WuTooltip>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.toggleControl}>
        <WuToggle checked={checked} onChange={onChange} aria-label={label} />
        {hint ? <InfoHint text={hint} /> : <span className={styles.toggleSpacer} aria-hidden />}
      </div>
    </div>
  );
}

function CaptureOptionRow({
  label,
  checked,
  onCheckedChange,
  capturePoints,
  onCapturePointsChange,
  capturePointOptions,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  capturePoints: string;
  onCapturePointsChange: (value: string) => void;
  capturePointOptions?: RecordAudioCapturePointOption[];
}) {
  const options = useMemo(() => {
    const source = capturePointOptions ?? MOBILE_DEVICE_CAPTURE_POINTS_OPTIONS;
    return source.map((option) => {
      if (!option.title) {
        return option;
      }

      return {
        ...option,
        label: option.label,
        disabled: true,
        // Zero-width icon keeps labels left-aligned; WuTooltip matches app hover style.
        icon: (
          <span className={styles.disabledQuestionHover}>
            <WuTooltip
              content={option.title ?? MOBILE_DEVICE_MULTI_SURVEY_QUESTION_TOOLTIP}
              position="bottom"
              positionOffset={8}
              style={{ zIndex: 10000 }}
            >
              <span
                className={styles.disabledQuestionHoverHit}
                aria-label={option.title ?? MOBILE_DEVICE_MULTI_SURVEY_QUESTION_TOOLTIP}
              />
            </WuTooltip>
          </span>
        ),
      };
    });
  }, [capturePointOptions]);

  const capturePointsValue =
    options.find((o) => o.value === capturePoints && !o.disabled && !o.title) ??
    options.find((o) => !o.disabled && !o.title) ??
    null;

  return (
    <div className={styles.captureOptionRow}>
      <ToggleRow label={label} checked={checked} onChange={onCheckedChange} />
      {checked ? (
        <div className={styles.capturePointsField}>
          <span className={styles.fieldLabel}>Capture Points</span>
          <div className={styles.capturePointsControl}>
            <WuSelect
              data={options}
              accessorKey={{ value: 'value', label: 'label' }}
              value={capturePointsValue}
              onSelect={(v) => {
                const item = v as RecordAudioCapturePointOption;
                if (item.disabled || item.title) {
                  return;
                }
                onCapturePointsChange(item.value);
              }}
              variant="outlined"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <EmptyState
      icon="wm-smartphone"
      title={label}
      description={`${label} options for this device will be available in a future release.`}
    />
  );
}

export function SurveyMobileDeviceDetail({
  device,
  onBack,
  onSave,
}: SurveyMobileDeviceDetailProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<MobileDeviceTabId>(getDefaultMobileDeviceTab());
  const [deviceName, setDeviceName] = useState(device.deviceName);
  const [deviceEmail, setDeviceEmail] = useState(device.email);
  const [folder, setFolder] = useState(device.folder);
  const [settings, setSettings] = useState<MobileDeviceSettings>(device.settings);

  const languageValue =
    MOBILE_DEVICE_LANGUAGE_OPTIONS.find((o) => o.value === settings.systemLanguage) ??
    MOBILE_DEVICE_LANGUAGE_OPTIONS[0] ??
    null;
  const folderValue =
    MOBILE_DEVICE_FOLDER_OPTIONS.find((o) => o.value === folder) ??
    MOBILE_DEVICE_FOLDER_OPTIONS[0] ??
    null;

  const auditSurveyValues = useMemo(
    () =>
      MOBILE_DEVICE_AUDIT_SURVEY_OPTIONS.filter((option) =>
        settings.auditSurveyIds.includes(option.value)
      ),
    [settings.auditSurveyIds]
  );

  const recordAudioCapturePointOptions = useMemo(
    () => getRecordAudioCapturePointOptions(settings.auditSurveyIds),
    [settings.auditSurveyIds]
  );

  function patchSettings(patch: Partial<MobileDeviceSettings>): void {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  /** WuSelect multi mode calls onSelect inside a setState updater; defer parent updates. */
  function handleAuditSurveysSelect(value: MobileDeviceAuditOption | MobileDeviceAuditOption[]): void {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    const nextIds = items.map((item) => item.value);
    queueMicrotask(() => {
      setSettings((prev) => {
        const nextOptions = getRecordAudioCapturePointOptions(nextIds);
        const stillValid = nextOptions.some(
          (option) => option.value === prev.recordAudioCapturePoints && !option.disabled && !option.title
        );
        return {
          ...prev,
          auditSurveyIds: nextIds,
          recordAudioCapturePoints: stillValid
            ? prev.recordAudioCapturePoints
            : (MOBILE_DEVICE_CAPTURE_POINTS_OPTIONS[0]?.value ?? 'start-and-end'),
        };
      });
    });
  }

  function handleSave(): void {
    if (!deviceName.trim()) {
      showToast({ message: 'Enter a device name', variant: 'error' });
      return;
    }

    onSave({
      ...device,
      deviceName: deviceName.trim(),
      email: deviceEmail.trim(),
      folder,
      settings,
    });
    showToast({ message: `"${deviceName.trim()}" saved`, variant: 'success' });
  }

  const settingsContent = (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsGrid}>
        <div className={styles.settingsColumn}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Device Name</span>
            <div className={styles.fieldControl}>
              <WuInput
                variant="outlined"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                aria-label="Device Name"
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Device Email</span>
            <div className={styles.fieldControl}>
              <WuInput
                variant="outlined"
                value={deviceEmail}
                onChange={(e) => setDeviceEmail(e.target.value)}
                aria-label="Device Email"
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>System Language</span>
            <div className={styles.fieldControl}>
              <WuSelect
                data={MOBILE_DEVICE_LANGUAGE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={languageValue}
                onSelect={(v) => {
                  const item = v as { value: string; label: string };
                  patchSettings({ systemLanguage: item.value });
                }}
                variant="outlined"
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Shared Folder</span>
            <div className={styles.fieldControl}>
              <WuSelect
                data={MOBILE_DEVICE_FOLDER_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={folderValue}
                onSelect={(v) => {
                  const item = v as { value: string; label: string };
                  setFolder(item.value);
                }}
                variant="outlined"
              />
            </div>
          </div>
        </div>

        <div className={styles.settingsColumn}>
          <ToggleRow
            label="App Settings"
            checked={settings.appSettings}
            onChange={(checked) => patchSettings({ appSettings: checked })}
          />
          <ToggleRow
            label="Loop Survey"
            checked={settings.loopSurvey}
            onChange={(checked) => patchSettings({ loopSurvey: checked })}
            hint="Automatically restart the survey after each completed response"
          />
          <ToggleRow
            label="Back Button"
            checked={settings.backButton}
            onChange={(checked) => patchSettings({ backButton: checked })}
          />
          <ToggleRow
            label="Online Connect"
            checked={settings.onlineConnect}
            onChange={(checked) => patchSettings({ onlineConnect: checked })}
          />
        </div>

        <div className={styles.settingsColumn}>
          <ToggleRow
            label="Location Data"
            checked={settings.locationData}
            onChange={(checked) => patchSettings({ locationData: checked })}
          />
          <ToggleRow
            label="Text to Speech"
            checked={settings.textToSpeech}
            onChange={(checked) => patchSettings({ textToSpeech: checked })}
            hint="Read survey questions aloud on supported devices"
          />
          <ToggleRow
            label="NPS Slider"
            checked={settings.npsSlider}
            onChange={(checked) => patchSettings({ npsSlider: checked })}
          />
        </div>
      </div>

      <div className={styles.settingsFooter}>
        <WuButton onClick={handleSave}>Save</WuButton>
      </div>
    </div>
  );

  const auditContent = (
    <div className={styles.auditPanel}>
      <div className={styles.auditBody}>
        <ToggleRow
          label="Audit Mode"
          checked={settings.auditMode}
          onChange={(checked) => patchSettings({ auditMode: checked })}
        />

        {settings.auditMode ? (
          <>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Survey</span>
              <div className={styles.fieldControl}>
                <WuSelect
                  data={MOBILE_DEVICE_AUDIT_SURVEY_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={auditSurveyValues}
                  onSelect={(v) =>
                    handleAuditSurveysSelect(
                      v as MobileDeviceAuditOption | MobileDeviceAuditOption[]
                    )
                  }
                  multiple
                  selectAll={{ enable: true, label: 'Select all' }}
                  placeholder="Select surveys"
                  variant="outlined"
                />
              </div>
            </div>

            <CaptureOptionRow
              label="Record Audio"
              checked={settings.recordAudio}
              onCheckedChange={(checked) => patchSettings({ recordAudio: checked })}
              capturePoints={settings.recordAudioCapturePoints}
              onCapturePointsChange={(value) =>
                patchSettings({ recordAudioCapturePoints: value })
              }
              capturePointOptions={recordAudioCapturePointOptions}
            />

            <CaptureOptionRow
              label="Capture Picture"
              checked={settings.capturePicture}
              onCheckedChange={(checked) => patchSettings({ capturePicture: checked })}
              capturePoints={settings.capturePictureCapturePoints}
              onCapturePointsChange={(value) =>
                patchSettings({ capturePictureCapturePoints: value })
              }
            />

            <CaptureOptionRow
              label="Capture Location"
              checked={settings.captureLocation}
              onCheckedChange={(checked) => patchSettings({ captureLocation: checked })}
              capturePoints={settings.captureLocationCapturePoints}
              onCapturePointsChange={(value) =>
                patchSettings({ captureLocationCapturePoints: value })
              }
            />
          </>
        ) : null}
      </div>
      <div className={styles.auditFooter}>
        <WuButton onClick={handleSave}>Save</WuButton>
      </div>
    </div>
  );

  const tabs: IWuTabItem[] = MOBILE_DEVICE_TABS.map((tab) => ({
    value: tab.id,
    Trigger: tab.label,
    Content:
      tab.id === 'settings'
        ? settingsContent
        : tab.id === 'audit'
          ? auditContent
          : <PlaceholderTab label={tab.label} />,
  }));

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <nav className={styles.breadcrumb} aria-label="Device breadcrumb">
          <button type="button" className={styles.breadcrumbLink} onClick={onBack}>
            Device List
          </button>
          <span className={styles.breadcrumbSep} aria-hidden>
            &gt;
          </span>
          <span className={styles.breadcrumbCurrent}>{device.deviceName}</span>
        </nav>

        <div className={styles.credentials}>
          <span>
            device_key: <strong>{device.deviceKey}</strong>
          </span>
          <span>
            password: <strong>{device.password}</strong>
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <WuTab
          items={tabs}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as MobileDeviceTabId)}
        />
      </div>
    </div>
  );
}
