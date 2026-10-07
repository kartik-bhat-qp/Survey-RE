'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  COBRANDED_LOGO_NOTE,
  COMPANY_SETTINGS_ADMINISTRATOR,
  COMPANY_SETTINGS_CHECKBOXES,
  COMPANY_SETTINGS_TOGGLES,
  GLOBAL_THEME_OPTIONS,
  ORGANIZATION_LOGO_OPTIONS,
  PERCENTAGE_MODE_OPTIONS,
  REPORT_SORT_OPTIONS,
  REPORT_SORT_TOOLTIP,
  SIGNUP_ROLE_OPTIONS,
  SURVEY_LAYOUT_OPTIONS,
  SURVEY_LAYOUT_TOOLTIP,
  UPDATE_COMPANY_SETTINGS_TOOLTIP,
  WORKSPACE_URL_SUFFIX,
  companySettingsOption,
  type CompanySettingsDraft,
  type CompanySettingsOption,
} from '@/data/mock-organization';
import styles from './UpdateCompanySettingsModal.module.css';

interface UpdateCompanySettingsModalProps {
  open: boolean;
  draft: CompanySettingsDraft;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CompanySettingsDraft) => void;
}

export function UpdateCompanySettingsModal({
  open,
  draft,
  onOpenChange,
  onSave,
}: UpdateCompanySettingsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(draft);
  const [audioPrompt, setAudioPrompt] = useState<'disable' | 'allow' | null>(null);
  const [applyAudioToExisting, setApplyAudioToExisting] = useState(false);
  const [audioReset, setAudioReset] = useState(0);

  useEffect(() => {
    if (open) setForm(draft);
  }, [open, draft]);

  useEffect(() => {
    if (open) return;
    setAudioPrompt(null);
    setApplyAudioToExisting(false);
  }, [open]);

  if (!open || !wick) return null;

  const {
    WuModal,
    WuModalHeader,
    WuModalContent,
    WuModalFooter,
    WuButton,
    WuInput,
    WuSelect,
    WuCheckbox,
    WuToggle,
    WuTooltip,
  } = wick;

  function patch<K extends keyof CompanySettingsDraft>(
    key: K,
    value: CompanySettingsDraft[K]
  ): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleToggle(
    key: (typeof COMPANY_SETTINGS_TOGGLES)[number]['key'],
    checked: boolean
  ): void {
    if (key === 'disableAudioInput') {
      setApplyAudioToExisting(false);
      setAudioPrompt(checked ? 'disable' : 'allow');
      setAudioReset((current) => current + 1);
      return;
    }
    patch(key, checked);
  }

  function confirmAllowAudio(): void {
    patch('disableAudioInput', false);
    showToast({
      message: applyAudioToExisting
        ? 'Audio input is allowed on surveys created from now on, including existing surveys.'
        : 'Audio input is allowed on surveys created from now on.',
      variant: 'success',
    });
    setAudioPrompt(null);
    setApplyAudioToExisting(false);
  }

  function selectOption(
    key: keyof CompanySettingsDraft,
    options: CompanySettingsOption[],
    item: CompanySettingsOption | CompanySettingsOption[] | null
  ): void {
    const next = Array.isArray(item) ? item[0] : item;
    if (!next || !options.some((option) => option.value === next.value)) return;
    patch(key, next.value);
  }

  return (
    <>
    <WuModal
      open
      variant="action"
      size="lg"
      maxWidth="760px"
      maxHeight="calc(100vh - 2rem)"
      allowExternalPortals
      className={styles.dialog}
      onOpenChange={onOpenChange}
    >
      <WuModalHeader className={styles.modalTitle}>
        <span className={styles.titleRow}>
          Update Company Settings
          <WuTooltip content={UPDATE_COMPANY_SETTINGS_TOOLTIP} position="top">
            <button type="button" className={styles.helpButton} aria-label="About company settings">
              <span className="wm-help" aria-hidden />
            </button>
          </WuTooltip>
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.form}>
          <div className={styles.row}>
            <span className={styles.label}>Administrator</span>
            <span className={styles.staticValue}>{COMPANY_SETTINGS_ADMINISTRATOR}</span>
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-workspace`}>
              Workspace URL
            </label>
            <div className={styles.workspace}>
              <WuInput
                id={`${fileInputId}-workspace`}
                variant="outlined"
                value={form.workspaceSlug}
                className={styles.workspaceInput}
                onChange={(event) => patch('workspaceSlug', event.target.value)}
              />
              <span className={styles.suffix}>{WORKSPACE_URL_SUFFIX}</span>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-org`}>
              Organization Name
            </label>
            <WuInput
              id={`${fileInputId}-org`}
              variant="outlined"
              value={form.organizationName}
              onChange={(event) => patch('organizationName', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-payable`}>
              Accounts Payable Email
            </label>
            <WuInput
              id={`${fileInputId}-payable`}
              variant="outlined"
              type="email"
              value={form.accountsPayableEmail}
              onChange={(event) => patch('accountsPayableEmail', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Signup Role</span>
            <div className={styles.narrow}>
              <WuSelect
                data={SIGNUP_ROLE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={companySettingsOption(SIGNUP_ROLE_OPTIONS, form.signupRole)}
                onSelect={(item) => selectOption('signupRole', SIGNUP_ROLE_OPTIONS, item)}
                variant="outlined"
                aria-label="Signup Role"
              />
            </div>
          </div>

          <div className={`${styles.row} ${styles.textareaRow}`}>
            <label className={styles.label} htmlFor={`${fileInputId}-header`}>
              Global Header (Logo/HTML)
            </label>
            <textarea
              id={`${fileInputId}-header`}
              className={styles.textarea}
              value={form.globalHeader}
              onChange={(event) => patch('globalHeader', event.target.value)}
            />
          </div>

          <div className={`${styles.row} ${styles.textareaRow}`}>
            <label className={styles.label} htmlFor={`${fileInputId}-footer`}>
              Global Footer
            </label>
            <textarea
              id={`${fileInputId}-footer`}
              className={styles.textarea}
              value={form.globalFooter}
              onChange={(event) => patch('globalFooter', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Global Theme</span>
            <div className={styles.narrow}>
              <WuSelect
                data={GLOBAL_THEME_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={companySettingsOption(GLOBAL_THEME_OPTIONS, form.globalTheme)}
                onSelect={(item) => selectOption('globalTheme', GLOBAL_THEME_OPTIONS, item)}
                variant="outlined"
                aria-label="Global Theme"
              />
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Organization Logo</span>
            <div className={styles.logoRow}>
              <div className={styles.narrow}>
                <WuSelect
                  data={ORGANIZATION_LOGO_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={companySettingsOption(ORGANIZATION_LOGO_OPTIONS, form.organizationLogo)}
                  onSelect={(item) =>
                    selectOption('organizationLogo', ORGANIZATION_LOGO_OPTIONS, item)
                  }
                  variant="outlined"
                  aria-label="Organization Logo"
                />
              </div>
              <input
                ref={fileRef}
                id={`${fileInputId}-logo-file`}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  showToast({ message: `${file.name} selected`, variant: 'success' });
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                className={styles.upload}
                onClick={() => fileRef.current?.click()}
              >
                <span className="wm-upload-file" aria-hidden />
                Upload File
              </button>
            </div>
          </div>

          <p className={styles.note}>{COBRANDED_LOGO_NOTE}</p>

          <div className={styles.checks}>
            {COMPANY_SETTINGS_CHECKBOXES.map((item) => (
              <WuCheckbox
                key={item.key}
                Label={item.label}
                labelPosition="right"
                checked={form[item.key]}
                onChange={(checked) => patch(item.key, checked)}
              />
            ))}
          </div>

          {COMPANY_SETTINGS_TOGGLES.map((item) => (
            <div key={item.key} className={styles.row}>
              <span className={styles.label}>{item.label}</span>
              <WuToggle
                key={
                  item.key === 'disableAudioInput'
                    ? `disable-audio-${form.disableAudioInput}-${audioReset}`
                    : item.key
                }
                checked={form[item.key]}
                onChange={(checked) => handleToggle(item.key, checked)}
                aria-label={item.label}
              />
            </div>
          ))}

          <div className={styles.row}>
            <span className={styles.label}>Survey Layout</span>
            <div className={styles.inlineControl}>
              <div className={styles.narrow}>
                <WuSelect
                  data={SURVEY_LAYOUT_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={companySettingsOption(SURVEY_LAYOUT_OPTIONS, form.surveyLayout)}
                  onSelect={(item) => selectOption('surveyLayout', SURVEY_LAYOUT_OPTIONS, item)}
                  variant="outlined"
                  aria-label="Survey Layout"
                />
              </div>
              <WuTooltip content={SURVEY_LAYOUT_TOOLTIP} position="top">
                <button type="button" className={styles.infoButton} aria-label="About Survey Layout">
                  <span className="wm-info" aria-hidden />
                </button>
              </WuTooltip>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Report Sort Order</span>
            <div className={styles.inlineControl}>
              <div className={styles.narrow}>
                <WuSelect
                  data={REPORT_SORT_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={companySettingsOption(REPORT_SORT_OPTIONS, form.reportSortOrder)}
                  onSelect={(item) => selectOption('reportSortOrder', REPORT_SORT_OPTIONS, item)}
                  variant="outlined"
                  aria-label="Report Sort Order"
                />
              </div>
              <WuTooltip content={REPORT_SORT_TOOLTIP} position="top">
                <button
                  type="button"
                  className={styles.infoButton}
                  aria-label="About Report Sort Order"
                >
                  <span className="wm-info" aria-hidden />
                </button>
              </WuTooltip>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-start`}>
              Start Button
            </label>
            <WuInput
              id={`${fileInputId}-start`}
              variant="outlined"
              value={form.startButton}
              onChange={(event) => patch('startButton', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-next`}>
              Next Button
            </label>
            <WuInput
              id={`${fileInputId}-next`}
              variant="outlined"
              value={form.nextButton}
              onChange={(event) => patch('nextButton', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <label className={styles.label} htmlFor={`${fileInputId}-done`}>
              Done Button
            </label>
            <WuInput
              id={`${fileInputId}-done`}
              variant="outlined"
              value={form.doneButton}
              onChange={(event) => patch('doneButton', event.target.value)}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Percentage Calculation Mode</span>
            <div className={styles.percentage}>
              <WuSelect
                data={PERCENTAGE_MODE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={companySettingsOption(PERCENTAGE_MODE_OPTIONS, form.percentageMode)}
                onSelect={(item) => selectOption('percentageMode', PERCENTAGE_MODE_OPTIONS, item)}
                variant="outlined"
                aria-label="Percentage Calculation Mode"
              />
            </div>
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton onClick={() => onSave(form)}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
      <ConfirmModal
        open={audioPrompt === 'disable'}
        onOpenChange={(next) => {
          if (!next) setAudioPrompt(null);
        }}
        title="Disable Audio Input"
        description="Disable audio input for surveys created from now on? Respondents will not be able to record audio answers."
        confirmLabel="Disable audio input"
        onConfirm={() => {
          patch('disableAudioInput', true);
          showToast({
            message: 'Audio input is disabled for surveys created from now on.',
            variant: 'success',
          });
        }}
      />
      <WuModal
        open={audioPrompt === 'allow'}
        onOpenChange={(next) => {
          if (!next) {
            setAudioPrompt(null);
            setApplyAudioToExisting(false);
          }
        }}
        variant="action"
        size="sm"
        preventClickOutside
      >
        <WuModalHeader>Allow audio input</WuModalHeader>
        <WuModalContent>
          <p className={styles.promptCopy}>
            Turning this off will allow audio input on all surveys created from now on.
          </p>
          <div className={styles.promptChoice}>
            <WuCheckbox
              Label="Apply this change to existing surveys"
              labelPosition="right"
              checked={applyAudioToExisting}
              onChange={setApplyAudioToExisting}
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            variant="secondary"
            onClick={() => {
              setAudioPrompt(null);
              setApplyAudioToExisting(false);
            }}
          >
            Cancel
          </WuButton>
          <WuButton onClick={confirmAllowAudio}>Allow audio input</WuButton>
        </WuModalFooter>
      </WuModal>
    </>
  );
}
