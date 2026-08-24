'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ComposeEmailToolbar } from '@/components/surveys/ComposeEmailToolbar';
import { ComposeHtmlSourceEditor } from '@/components/surveys/ComposeHtmlSourceEditor';
import { ComposeHtmlPreviewFrame } from '@/components/surveys/ComposeHtmlPreviewFrame';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DEFAULT_EMAIL_COMPOSE,
  MOCK_EMAIL_SENDERS,
  MOCK_REPLY_TO_OPTIONS,
  composeBodyHasRenderableHtml,
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

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const DEFAULT_LANGUAGE_OPTIONS = [
  { value: '', label: '--Select--' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

interface NewDistributeTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (template: DistributeTemplate) => void;
}

export function NewDistributeTemplateModal({
  open,
  onOpenChange,
  onSaved,
}: NewDistributeTemplateModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const bodyFieldRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (!open) return;
    setTemplateName('');
    setSelectedType(TEMPLATE_TYPE_OPTIONS[0]);
    setSelectedSender(MOCK_EMAIL_SENDERS[0] ?? null);
    setSelectedReplyTo(MOCK_REPLY_TO_OPTIONS[0] ?? null);
    setSubject(DEFAULT_EMAIL_COMPOSE.subject);
    setBody(DEFAULT_EMAIL_COMPOSE.body);
    setSelectedLanguage(DEFAULT_LANGUAGE_OPTIONS[0]);
    setSurveySpecific(true);
    setHtmlSourceOpen(false);
    setBodySelection(null);
  }, [open]);

  function updateBodySelection(): void {
    setBodySelection(readComposeBodySelection(bodyFieldRef.current));
  }

  function handleToolbarAction(label: string): void {
    if (label === 'Source') {
      setHtmlSourceOpen(true);
      return;
    }
    showToast({ message: label, variant: 'info' });
  }

  function handleSave(): void {
    const name = templateName.trim();
    if (!name) {
      showToast({ message: 'Template Name is required', variant: 'error' });
      return;
    }

    const type: DistributeTemplateType =
      selectedType.value === 'sms' ? 'SMS' : 'Email - Survey Specific';

    const defaultLanguage = selectedLanguage.value || 'NA';

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tmpl-${Date.now()}`;

    const saved: DistributeTemplate = {
      id,
      name,
      type,
      defaultLanguage,
    };

    onSaved?.(saved);
    showToast({ message: `Saved "${name}"`, variant: 'success' });
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <>
      <WuModal
        open
        onOpenChange={onOpenChange}
        variant="action"
        size="lg"
        className={styles.modal}
      >
        <WuModalHeader className={styles.header}>Email Template</WuModalHeader>
        <WuModalContent className={styles.content}>
          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Template Name :</span>
              <WuInput value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </div>
            <div className={styles.fieldSmall}>
              <span className={styles.label}>Type:</span>
              <WuSelect
                data={TEMPLATE_TYPE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedType}
                onSelect={(item) => setSelectedType(item as (typeof TEMPLATE_TYPE_OPTIONS)[number])}
                variant="outlined"
              />
            </div>
          </div>

          <div className={styles.row}>
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

          <div className={styles.row}>
            <div className={styles.field}>
              <span className={styles.label}>Subject :</span>
              <WuInput value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className={styles.fieldSmall}>
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
            <div className={styles.editorBody}>
              {bodyIsHtml ? (
                <div className={styles.bodyPreview} aria-label="Template HTML preview">
                  <ComposeHtmlPreviewFrame
                    html={body}
                    title="Template HTML preview"
                    className={styles.bodyPreviewFrame}
                  />
                </div>
              ) : (
                <textarea
                  ref={bodyFieldRef}
                  className={styles.bodyField}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onSelect={updateBodySelection}
                  onMouseUp={updateBodySelection}
                  onKeyUp={updateBodySelection}
                  aria-label="Template body"
                  rows={12}
                />
              )}
            </div>

            <ComposeEmailToolbar
              helpMeWriteOpen={false}
              helpMeWriteDisabled
              sourceEditorOpen={htmlSourceOpen}
              onHelpMeWriteToggle={() => undefined}
              onAction={handleToolbarAction}
              onSourceClick={() => setHtmlSourceOpen(true)}
            />
          </div>
        </WuModalContent>
        <WuModalFooter className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerToggleLabel}>Survey Specific</span>
            <WuToggle checked={surveySpecific} onChange={setSurveySpecific} />
            <span className={styles.footerToggleMuted}>Global</span>
          </div>
          <div className={styles.footerRight}>
            <WuModalClose variant="secondary">Cancel</WuModalClose>
            <WuButton color="primary" onClick={handleSave}>
              Save
            </WuButton>
          </div>
        </WuModalFooter>
      </WuModal>

      <ComposeHtmlSourceEditor
        open={htmlSourceOpen}
        onOpenChange={setHtmlSourceOpen}
        body={body}
        onApply={setBody}
      />
    </>
  );
}
