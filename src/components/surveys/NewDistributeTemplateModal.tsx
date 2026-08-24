'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ComposeEmailToolbar } from '@/components/surveys/ComposeEmailToolbar';
import { ComposeHtmlBodyEditor } from '@/components/surveys/ComposeHtmlBodyEditor';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  COMPOSE_BLOB_UNSUPPORTED_MESSAGE,
  DEFAULT_EMAIL_COMPOSE,
  MOCK_EMAIL_SENDERS,
  MOCK_REPLY_TO_OPTIONS,
  composeBodyHasRenderableHtml,
  composeHtmlContainsUnsupportedBlob,
  composePlainTextToHtml,
  readComposeBodySelection,
  type DistributeTemplate,
  type DistributeTemplateType,
  type ComposeWritingSelection,
} from '@/data/mock-survey-distribute';
import styles from './NewDistributeTemplateModal.module.css';

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
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const DEFAULT_LANGUAGE_OPTIONS = [
  { value: '', label: '--Select Language--' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

interface NewDistributeTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DistributeTemplate | null;
  onSaved?: (template: DistributeTemplate) => void;
}

function resolveSender(
  value: string | undefined,
  fallback = MOCK_EMAIL_SENDERS[0] ?? null
) {
  if (!value) return fallback;
  return MOCK_EMAIL_SENDERS.find((item) => item.value === value) ?? fallback;
}

function resolveReplyTo(
  value: string | undefined,
  fallback = MOCK_REPLY_TO_OPTIONS[0] ?? null
) {
  if (!value) return fallback;
  return MOCK_REPLY_TO_OPTIONS.find((item) => item.value === value) ?? fallback;
}

function resolveLanguage(defaultLanguage: string | undefined) {
  if (!defaultLanguage || defaultLanguage === 'NA') {
    return DEFAULT_LANGUAGE_OPTIONS[0];
  }
  return (
    DEFAULT_LANGUAGE_OPTIONS.find((item) => item.value === defaultLanguage) ??
    DEFAULT_LANGUAGE_OPTIONS[0]
  );
}

export function NewDistributeTemplateModal({
  open,
  onOpenChange,
  template = null,
  onSaved,
}: NewDistributeTemplateModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const bodyFieldRef = useRef<HTMLTextAreaElement>(null);
  const isEditMode = Boolean(template);
  const [templateName, setTemplateName] = useState('');
  const [selectedType, setSelectedType] = useState(TEMPLATE_TYPE_OPTIONS[0]);
  const [selectedSender, setSelectedSender] = useState(MOCK_EMAIL_SENDERS[0] ?? null);
  const [selectedReplyTo, setSelectedReplyTo] = useState(MOCK_REPLY_TO_OPTIONS[0] ?? null);
  const [subject, setSubject] = useState(DEFAULT_EMAIL_COMPOSE.subject);
  const [body, setBody] = useState(DEFAULT_EMAIL_COMPOSE.body);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE_OPTIONS[0]);
  const [surveySpecific, setSurveySpecific] = useState(true);
  const [htmlSourceOpen, setHtmlSourceOpen] = useState(false);
  const [bodySelection, setBodySelection] = useState<ComposeWritingSelection | null>(null);

  const bodyIsHtml = useMemo(() => composeBodyHasRenderableHtml(body), [body]);
  const bodyContainsBlob = useMemo(() => composeHtmlContainsUnsupportedBlob(body), [body]);

  useEffect(() => {
    if (!open) return;

    if (template) {
      setTemplateName(template.name);
      setSelectedType(
        template.type === 'SMS' ? TEMPLATE_TYPE_OPTIONS[1] : TEMPLATE_TYPE_OPTIONS[0]
      );
      setSelectedSender(resolveSender(template.fromValue));
      setSelectedReplyTo(resolveReplyTo(template.replyToValue));
      setSubject(template.subject ?? DEFAULT_EMAIL_COMPOSE.subject);
      setBody(
        template.body ??
          (template.type === 'SMS'
            ? DEFAULT_EMAIL_COMPOSE.smsBody
            : DEFAULT_EMAIL_COMPOSE.body)
      );
      setSelectedLanguage(resolveLanguage(template.defaultLanguage));
      setSurveySpecific(template.type !== 'Email');
    } else {
      setTemplateName('');
      setSelectedType(TEMPLATE_TYPE_OPTIONS[0]);
      setSelectedSender(MOCK_EMAIL_SENDERS[0] ?? null);
      setSelectedReplyTo(MOCK_REPLY_TO_OPTIONS[0] ?? null);
      setSubject(DEFAULT_EMAIL_COMPOSE.subject);
      setBody(DEFAULT_EMAIL_COMPOSE.body);
      setSelectedLanguage(DEFAULT_LANGUAGE_OPTIONS[0]);
      setSurveySpecific(true);
    }

    setHtmlSourceOpen(false);
    setBodySelection(null);
  }, [open, template]);

  function updateBodySelection(): void {
    setBodySelection(readComposeBodySelection(bodyFieldRef.current));
  }

  function handleToolbarAction(label: string): void {
    if (label === 'Source') {
      handleSourceToggle();
      return;
    }
    showToast({ message: label, variant: 'info' });
  }

  function handleSourceToggle(): void {
    setHtmlSourceOpen((openSource) => {
      if (openSource) return false;
      setBody((prev) => composePlainTextToHtml(prev));
      return true;
    });
  }

  function handleSave(): void {
    if (bodyContainsBlob) {
      showToast({ message: COMPOSE_BLOB_UNSUPPORTED_MESSAGE, variant: 'error' });
      return;
    }

    const name = templateName.trim();
    if (!name) {
      showToast({ message: 'Template Name is required', variant: 'error' });
      return;
    }

    if (isEditMode && !subject.trim()) {
      showToast({ message: 'Subject is required', variant: 'error' });
      return;
    }

    const type: DistributeTemplateType =
      selectedType.value === 'sms'
        ? 'SMS'
        : surveySpecific
          ? 'Email - Survey Specific'
          : 'Email';

    const defaultLanguage = selectedLanguage.value || 'NA';

    const saved: DistributeTemplate = {
      id: template?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tmpl-${Date.now()}`),
      name,
      type,
      defaultLanguage,
      subject: subject.trim(),
      body,
      fromValue: selectedSender?.value,
      replyToValue: selectedReplyTo?.value,
    };

    onSaved?.(saved);
    showToast({
      message: isEditMode ? 'Template saved' : 'Template Created Successfully',
      variant: 'success',
    });
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>
          {isEditMode ? `Email Template: ${templateName || 'Untitled'}` : 'Email Template'}
          {isEditMode ? (
            <WuTooltip content="Edit this email template" position="top">
              <button
                type="button"
                className={styles.helpBtn}
                aria-label="Template help"
                onClick={() =>
                  showToast({ message: 'Edit From, Reply To, Subject, and body', variant: 'info' })
                }
              >
                <span className="wm-help" aria-hidden />
              </button>
            </WuTooltip>
          ) : null}
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        {!isEditMode ? (
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Template Name :</span>
              <WuInput
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
            </div>
            <div className={styles.fieldSmall}>
              <span className={styles.label}>Type:</span>
              <WuSelect
                data={TEMPLATE_TYPE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedType}
                onSelect={(item) =>
                  setSelectedType(item as (typeof TEMPLATE_TYPE_OPTIONS)[number])
                }
                variant="outlined"
              />
            </div>
          </div>
        ) : null}

        <div className={styles.rowEqual}>
          <div className={styles.field}>
            <span className={styles.label}>From :</span>
            <WuSelect
              data={MOCK_EMAIL_SENDERS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedSender}
              onSelect={(item) =>
                setSelectedSender(item as (typeof MOCK_EMAIL_SENDERS)[number])
              }
              variant="outlined"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Reply To:</span>
            <WuSelect
              data={MOCK_REPLY_TO_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedReplyTo}
              onSelect={(item) =>
                setSelectedReplyTo(item as (typeof MOCK_REPLY_TO_OPTIONS)[number])
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={styles.rowEqual}>
          <div className={styles.field}>
            <span className={styles.label}>
              Subject
              {isEditMode ? <span className={styles.requiredMark}>*</span> : null}:
            </span>
            <WuInput value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Default Language :</span>
            <WuSelect
              data={DEFAULT_LANGUAGE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedLanguage}
              onSelect={(item) =>
                setSelectedLanguage(item as (typeof DEFAULT_LANGUAGE_OPTIONS)[number])
              }
              variant="outlined"
            />
          </div>
        </div>

        <div className={styles.editorShell}>
          {bodyContainsBlob ? (
            <p className={styles.blobWarning} role="alert">
              {COMPOSE_BLOB_UNSUPPORTED_MESSAGE}
            </p>
          ) : null}
          <div className={styles.editorBody}>
            {bodyIsHtml && !htmlSourceOpen ? (
              <ComposeHtmlBodyEditor
                html={body}
                onChange={setBody}
                ariaLabel="Template body"
                className={styles.bodyPreviewFrame}
              />
            ) : (
              <textarea
                ref={bodyFieldRef}
                className={
                  htmlSourceOpen
                    ? `${styles.bodyField} ${styles.bodyFieldSource}`
                    : styles.bodyField
                }
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onSelect={updateBodySelection}
                onMouseUp={updateBodySelection}
                onKeyUp={updateBodySelection}
                aria-label={htmlSourceOpen ? 'Template HTML source' : 'Template body'}
                rows={12}
                spellCheck={!htmlSourceOpen}
              />
            )}
          </div>

          <ComposeEmailToolbar
            helpMeWriteOpen={false}
            helpMeWriteDisabled
            sourceEditorOpen={htmlSourceOpen}
            onHelpMeWriteToggle={() => undefined}
            onAction={handleToolbarAction}
            onSourceClick={handleSourceToggle}
          />
        </div>
      </WuModalContent>
      <WuModalFooter className={isEditMode ? styles.footerEdit : styles.footer}>
        {!isEditMode ? (
          <div className={styles.footerLeft}>
            <span className={styles.footerToggleLabel}>Survey Specific</span>
            <WuToggle checked={surveySpecific} onChange={setSurveySpecific} />
            <span className={styles.footerToggleMuted}>Global</span>
          </div>
        ) : (
          <span aria-hidden />
        )}
        <div className={styles.footerRight}>
          <WuModalClose variant="secondary">{isEditMode ? 'Close' : 'Cancel'}</WuModalClose>
          <WuTooltip
            content={bodyContainsBlob ? COMPOSE_BLOB_UNSUPPORTED_MESSAGE : undefined}
            position="top"
          >
            <span className={styles.saveBtnWrap}>
              <WuButton color="primary" onClick={handleSave} disabled={bodyContainsBlob}>
                Save
              </WuButton>
            </span>
          </WuTooltip>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
