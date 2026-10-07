'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { UpdateCompanySettingsModal } from '@/components/account/UpdateCompanySettingsModal';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  DEFAULT_COMPANY_SETTINGS,
  GLOBAL_THEME_OPTIONS,
  ORGANIZATION_ID,
  ORGANIZATION_ID_TOOLTIP,
  ORGANIZATION_SETTING_FIELDS,
  ORGANIZATION_SETTINGS_ACTIONS,
  WELCOME_EMAIL_TOOLTIP,
  companySettingsOption,
  normalizeCompanySettings,
  type CompanySettingsDraft,
  type OrganizationSettingField,
  type OrganizationSettingsSection,
} from '@/data/mock-organization';
import styles from './OrganizationSettingsPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

function InfoTip({ label, content }: { label: string; content: string }) {
  return (
    <WuTooltip content={content} position="top">
      <button type="button" className={styles.infoButton} aria-label={label}>
        <span className="wm-info" aria-hidden />
      </button>
    </WuTooltip>
  );
}

export function OrganizationSettingsPage() {
  const { showToast } = useWuShowToast();
  const [section, setSection] = useState<OrganizationSettingsSection>('settings');
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [companySettingsRaw, setCompanySettings] = usePersistedState<CompanySettingsDraft>(
    'organization-company-settings',
    DEFAULT_COMPANY_SETTINGS
  );
  const companySettings = normalizeCompanySettings(companySettingsRaw);
  const [summaryFields, setSummaryFields] = usePersistedState<OrganizationSettingField[]>(
    'organization-setting-summary',
    ORGANIZATION_SETTING_FIELDS
  );
  const [welcomeEnabled, setWelcomeEnabled] = usePersistedState(
    'organization-welcome-email-enabled',
    false
  );
  const [welcomeMessage, setWelcomeMessage] = usePersistedState(
    'organization-welcome-email-message',
    ''
  );
  const placeholderSection = ORGANIZATION_SETTINGS_ACTIONS.find(
    (item) => item.id === section && item.id !== 'settings'
  );

  function handleSaveCompanySettings(next: CompanySettingsDraft): void {
    setCompanySettings(normalizeCompanySettings(next));
    setSummaryFields((current) =>
      current.map((field) => {
        if (field.id === 'company-name') return { ...field, value: next.organizationName };
        if (field.id === 'accounts-payable-email') {
          return { ...field, value: next.accountsPayableEmail };
        }
        if (field.id === 'global-header') return { ...field, value: next.globalHeader };
        if (field.id === 'global-footer') return { ...field, value: next.globalFooter };
        if (field.id === 'global-theme') {
          const theme = companySettingsOption(GLOBAL_THEME_OPTIONS, next.globalTheme);
          return { ...field, value: next.globalTheme ? theme.label : '' };
        }
        return field;
      })
    );
    setCompanySettingsOpen(false);
    showToast({ message: 'Company settings updated', variant: 'success' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <p className={styles.orgId}>
          <span>Organization ID : {ORGANIZATION_ID}</span>
          <InfoTip label="About Organization ID" content={ORGANIZATION_ID_TOOLTIP} />
        </p>
        <div className={styles.actions}>
          {ORGANIZATION_SETTINGS_ACTIONS.map((action) => {
            const active = action.id === section;
            return (
              <WuButton
                key={action.id}
                size="sm"
                variant={active ? 'primary' : 'secondary'}
                color={active ? 'primary' : 'neutral'}
                selected={active}
                onClick={() => {
                  setSection(action.id);
                  if (action.id === 'settings') setCompanySettingsOpen(true);
                }}
              >
                {action.label}
              </WuButton>
            );
          })}
        </div>
      </div>

      {section === 'settings' ? (
        <>
          <dl className={styles.details}>
            {summaryFields.map((field) => (
              <div key={field.id} className={styles.row}>
                <dt className={styles.label}>{field.label} :</dt>
                <dd className={styles.value}>{field.value}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.welcome} aria-labelledby="welcome-email-label">
            <div className={styles.welcomeLabel} id="welcome-email-label">
              <span>Welcome Email</span>
              <InfoTip label="About Welcome Email" content={WELCOME_EMAIL_TOOLTIP} />
            </div>
            <WuToggle
              checked={welcomeEnabled}
              onChange={setWelcomeEnabled}
              aria-label="Welcome Email"
            />
            <div className={welcomeEnabled ? styles.welcomeField : styles.welcomeFieldOff}>
              <WuInput
                variant="flat"
                value={welcomeMessage}
                disabled={!welcomeEnabled}
                aria-label="Welcome email message"
                onInput={(event) => setWelcomeMessage(event.currentTarget.value)}
              />
            </div>
          </section>
        </>
      ) : (
        <section className={styles.placeholder}>
          <h1 className={styles.placeholderTitle}>{placeholderSection?.label}</h1>
          <p className={styles.placeholderCopy}>
            {placeholderSection?.label} will appear here.
          </p>
        </section>
      )}
      <UpdateCompanySettingsModal
        open={companySettingsOpen}
        draft={companySettings}
        onOpenChange={setCompanySettingsOpen}
        onSave={handleSaveCompanySettings}
      />
    </div>
  );
}
