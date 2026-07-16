'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AccountSectionNav } from '@/components/account/AccountSectionNav';
import { RaaTabIcon } from '@/components/account/RaaTabIcon';
import { RespondentAnonymityAssurancePopup } from '@/components/surveys/RespondentAnonymityAssurancePopup';
import { RichTextEditor } from '@/components/surveys/RichTextEditor';
import {
  plainTextFromRichValue,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CAN_SPAM_FIELD_LABELS,
  CAN_SPAM_INFO_TOOLTIP,
  COMPLIANCE_TABS,
  DEFAULT_CAN_SPAM_DETAILS,
  DEFAULT_RAA_POPUP_COPY,
  RAA_COMPLIANCE_FIELDS,
  RAA_COMPLIANCE_INFO_TOOLTIP,
  RAA_POPUP_COPY_STORAGE_KEY,
  normalizeRaaPopupCopy,
  type CanSpamComplianceDetails,
  type ComplianceTabId,
  type RaaPopupCopy,
} from '@/data/mock-compliance';
import { CUSTOM_VARIABLE_MAPPING_TOOLTIP } from '@/data/mock-survey-settings';
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
  const [raaCopyRaw, setRaaCopy] = usePersistedState<RaaPopupCopy>(
    RAA_POPUP_COPY_STORAGE_KEY,
    DEFAULT_RAA_POPUP_COPY
  );
  const raaCopy = useMemo(() => normalizeRaaPopupCopy(raaCopyRaw), [raaCopyRaw]);
  const [raaAddingInfo, setRaaAddingInfo] = useState(false);
  const [raaInfoDraft, setRaaInfoDraft] = useState('');
  const [raaPreviewOpen, setRaaPreviewOpen] = useState(false);

  const raaPreviewFields = useMemo(
    () =>
      RAA_COMPLIANCE_FIELDS.filter(
        (field) =>
          field.alwaysEnabled ||
          field.id === 'ip-address' ||
          field.id === 'country-code' ||
          field.id === 'region' ||
          field.id === 'cv-1'
      ),
    []
  );

  const raaAdditionalContent = plainTextFromRichValue(raaCopy.additionalContent).trim()
    ? raaCopy.additionalContent.trim()
    : '';

  const raaPreviewCopy = useMemo(
    (): RaaPopupCopy => ({
      bodyTitle: DEFAULT_RAA_POPUP_COPY.bodyTitle,
      intro: DEFAULT_RAA_POPUP_COPY.intro,
      outro: DEFAULT_RAA_POPUP_COPY.outro,
      additionalContent: raaAddingInfo
        ? plainTextFromRichValue(raaInfoDraft).trim()
          ? raaInfoDraft.trim()
          : ''
        : raaAdditionalContent,
    }),
    [raaAddingInfo, raaInfoDraft, raaAdditionalContent]
  );

  const raaPreviewFieldLabels = useMemo(
    () => raaPreviewFields.map((field) => field.label),
    [raaPreviewFields]
  );

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

  function handleRaaAddMoreInformation(): void {
    setRaaInfoDraft(raaAdditionalContent);
    setRaaAddingInfo(true);
  }

  function handleRaaSaveInformation(): void {
    const next = plainTextFromRichValue(raaInfoDraft).trim() ? raaInfoDraft.trim() : '';
    setRaaCopy({
      bodyTitle: DEFAULT_RAA_POPUP_COPY.bodyTitle,
      intro: DEFAULT_RAA_POPUP_COPY.intro,
      outro: DEFAULT_RAA_POPUP_COPY.outro,
      additionalContent: next,
    });
    setRaaAddingInfo(false);
    showToast({ message: 'Additional content updated', variant: 'success' });
  }

  function handleRaaCancelInformation(): void {
    setRaaInfoDraft(raaAdditionalContent);
    setRaaAddingInfo(false);
  }

  function handleRaaRemoveInformation(): void {
    setRaaCopy({
      bodyTitle: DEFAULT_RAA_POPUP_COPY.bodyTitle,
      intro: DEFAULT_RAA_POPUP_COPY.intro,
      outro: DEFAULT_RAA_POPUP_COPY.outro,
      additionalContent: '',
    });
    setRaaAddingInfo(false);
    setRaaInfoDraft('');
    showToast({ message: 'Additional content removed', variant: 'success' });
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
                setRaaAddingInfo(false);
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
              <div className={styles.panelActions}>
                <WuTooltip content="Preview respondent popup" position="bottom">
                  <button
                    type="button"
                    className={styles.raaPreviewBtn}
                    aria-label="Preview respondent popup"
                    onClick={() => setRaaPreviewOpen(true)}
                  >
                    <span className="wm-visibility" aria-hidden />
                  </button>
                </WuTooltip>
              </div>
            </header>

            <p className={styles.placeholderCopy}>
              When RAA is enabled on a survey, respondents see which fields are anonymized in
              the survey footer popup. You can add your own additional content below.
            </p>

            <div className={styles.raaCopyEditor}>
              <div className={styles.raaFieldsPreview}>
                <h2 className={styles.raaGroupTitle}>Enabled settings (shown in popup)</h2>
                <p className={styles.raaFieldsHint}>
                  The survey&apos;s selected RAA fields appear here in the respondent popup.
                </p>
                <ul className={styles.raaFieldList}>
                  {raaPreviewFields.map((field) => (
                    <li key={field.id} className={styles.raaFieldItem}>
                      <span className={styles.raaFieldLabel}>
                        <span>{field.label}</span>
                        {field.category === 'Custom Variables' ? (
                          <WuTooltip
                            content={CUSTOM_VARIABLE_MAPPING_TOOLTIP}
                            position="top"
                          >
                            <span
                              className={styles.infoIcon}
                              aria-label={CUSTOM_VARIABLE_MAPPING_TOOLTIP}
                            >
                              <span className="wm-info" aria-hidden />
                            </span>
                          </WuTooltip>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className={styles.raaCopyText}>{DEFAULT_RAA_POPUP_COPY.outro}</p>

              {raaAddingInfo ? (
                <div className={styles.raaMoreInfo}>
                  <label className={styles.raaCopyLabel} htmlFor="raa-additional-content">
                    Additional content
                  </label>
                  <div id="raa-additional-content">
                    <RichTextEditor
                      value={raaInfoDraft}
                      onChange={setRaaInfoDraft}
                      ariaLabel="Additional content"
                      compact
                      hideFont
                    />
                  </div>
                  <div className={styles.raaMoreInfoActions}>
                    <WuButton variant="secondary" onClick={handleRaaCancelInformation}>
                      Cancel
                    </WuButton>
                    {raaAdditionalContent ? (
                      <WuButton variant="secondary" onClick={handleRaaRemoveInformation}>
                        Remove
                      </WuButton>
                    ) : null}
                    <WuButton onClick={handleRaaSaveInformation}>Save</WuButton>
                  </div>
                </div>
              ) : raaAdditionalContent ? (
                <div className={styles.raaMoreInfo}>
                  <div className={styles.raaMoreInfoHeader}>
                    <h2 className={styles.raaGroupTitle}>Additional content</h2>
                    <WuButton
                      variant="secondary"
                      onClick={handleRaaAddMoreInformation}
                      Icon={<span className="wm-edit" aria-hidden />}
                    >
                      Edit
                    </WuButton>
                  </div>
                  <div
                    className={styles.raaRichText}
                    dangerouslySetInnerHTML={{
                      __html: toEditorHtml(raaAdditionalContent),
                    }}
                  />
                </div>
              ) : (
                <div className={styles.raaAddInfoWrap}>
                  <WuButton
                    variant="secondary"
                    onClick={handleRaaAddMoreInformation}
                    Icon={<span className="wm-add" aria-hidden />}
                  >
                    Add more information
                  </WuButton>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <RespondentAnonymityAssurancePopup
        open={raaPreviewOpen}
        onOpenChange={setRaaPreviewOpen}
        copy={raaPreviewCopy}
        enabledFieldLabels={raaPreviewFieldLabels}
      />
    </div>
  );
}
