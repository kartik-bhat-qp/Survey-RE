'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AccountSectionNav } from '@/components/account/AccountSectionNav';
import { RaaTabIcon } from '@/components/account/RaaTabIcon';
import {
  CAN_SPAM_FIELD_LABELS,
  CAN_SPAM_INFO_TOOLTIP,
  COMPLIANCE_TABS,
  DEFAULT_CAN_SPAM_DETAILS,
  RAA_COMPLIANCE_FIELDS,
  RAA_COMPLIANCE_INFO_TOOLTIP,
  type CanSpamComplianceDetails,
  type ComplianceTabId,
} from '@/data/mock-compliance';
import styles from './CompliancePage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

export function CompliancePage() {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<ComplianceTabId>('can-spam');
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState<CanSpamComplianceDetails>(DEFAULT_CAN_SPAM_DETAILS);
  const [draft, setDraft] = useState<CanSpamComplianceDetails>(DEFAULT_CAN_SPAM_DETAILS);

  function handleUpdateClick(): void {
    if (editing) {
      setDetails(draft);
      setEditing(false);
      showToast({ message: 'CAN-SPAM compliance updated', variant: 'success' });
      return;
    }
    setDraft(details);
    setEditing(true);
  }

  function handleCancelEdit(): void {
    setDraft(details);
    setEditing(false);
  }

  function patchDraft(key: keyof CanSpamComplianceDetails, value: string): void {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className={styles.page}>
      <AccountSectionNav activeId="compliance" />

      <div className={styles.subNav} role="tablist" aria-label="Compliance sections">
        {COMPLIANCE_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? styles.subTabActive : styles.subTab}
              onClick={() => {
                setActiveTab(tab.id);
                setEditing(false);
              }}
            >
              <span className={styles.subTabIconWrap} aria-hidden>
                {tab.id === 'respondent-anonymity' ? (
                  <RaaTabIcon className={styles.subTabSvgIcon} />
                ) : (
                  <span className={`${tab.icon} ${styles.subTabIcon}`} />
                )}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.body}>
        {activeTab === 'can-spam' ? (
          <section className={styles.panel} aria-labelledby="can-spam-heading">
            <header className={styles.panelHeader}>
              <div className={styles.panelTitleRow}>
                <h1 id="can-spam-heading" className={styles.panelTitle}>
                  CAN-SPAM Compliance
                </h1>
                <WuTooltip content={CAN_SPAM_INFO_TOOLTIP} position="bottom">
                  <span className={styles.infoIcon} aria-label={CAN_SPAM_INFO_TOOLTIP}>
                    <span className="wm-info" aria-hidden />
                  </span>
                </WuTooltip>
              </div>
              <div className={styles.panelActions}>
                {editing ? (
                  <WuButton variant="secondary" onClick={handleCancelEdit}>
                    Cancel
                  </WuButton>
                ) : null}
                <WuButton
                  onClick={handleUpdateClick}
                  Icon={<span className="wm-edit" aria-hidden />}
                >
                  {editing ? 'Save' : 'Update'}
                </WuButton>
              </div>
            </header>

            <dl className={styles.fieldList}>
              {CAN_SPAM_FIELD_LABELS.map((field) => {
                const value = editing ? draft[field.key] : details[field.key];
                return (
                  <div key={field.key} className={styles.fieldRow}>
                    <dt className={styles.fieldLabel}>{field.label}</dt>
                    <dd className={styles.fieldValue}>
                      {editing ? (
                        <WuInput
                          variant="outlined"
                          value={value}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            patchDraft(field.key, event.target.value)
                          }
                          aria-label={field.label}
                          className={styles.fieldInput}
                        />
                      ) : (
                        <span>{value || '\u00A0'}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ) : activeTab === 'privacy' ? (
          <section className={styles.panel} aria-labelledby="privacy-heading">
            <h1 id="privacy-heading" className={styles.panelTitle}>
              Privacy
            </h1>
            <p className={styles.placeholderCopy}>
              Privacy compliance settings will appear here.
            </p>
          </section>
        ) : activeTab === 'accessibility' ? (
          <section className={styles.panel} aria-labelledby="accessibility-heading">
            <h1 id="accessibility-heading" className={styles.panelTitle}>
              Accessibility
            </h1>
            <p className={styles.placeholderCopy}>
              Accessibility compliance settings will appear here.
            </p>
          </section>
        ) : (
          <section className={styles.panel} aria-labelledby="raa-heading">
            <header className={styles.panelHeader}>
              <div className={styles.panelTitleRow}>
                <h1 id="raa-heading" className={styles.panelTitle}>
                  Respondent Anonymity Assurance
                </h1>
                <WuTooltip content={RAA_COMPLIANCE_INFO_TOOLTIP} position="bottom">
                  <span className={styles.infoIcon} aria-label={RAA_COMPLIANCE_INFO_TOOLTIP}>
                    <span className="wm-info" aria-hidden />
                  </span>
                </WuTooltip>
              </div>
            </header>
            <p className={styles.placeholderCopy}>
              When Respondent Anonymity Assurance is enabled on a survey, selected
              identifiers are anonymized in response data. Enable it per survey under
              Settings → Security. Once enabled, it cannot be disabled.
            </p>
            <div className={styles.raaGroups}>
              {(['Standard Fields', 'Custom Variables'] as const).map((category) => (
                <div key={category} className={styles.raaGroup}>
                  <h2 className={styles.raaGroupTitle}>{category}</h2>
                  <ul className={styles.raaFieldList}>
                    {RAA_COMPLIANCE_FIELDS.filter((field) => field.category === category).map(
                      (field) => (
                        <li key={field.id} className={styles.raaFieldItem}>
                          <span>{field.label}</span>
                          {field.alwaysEnabled ? (
                            <span className={styles.raaFieldBadge}>Always anonymized</span>
                          ) : null}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
