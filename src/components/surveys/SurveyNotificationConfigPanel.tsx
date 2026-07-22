'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import { MultiEmailInput } from '@/components/surveys/MultiEmailInput';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { NOTIFICATION_CONDITION_SOURCES, hasCompleteConditions, type Criterion } from '@/data/mock-criteria-engine';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import {
  deriveNotificationCriteriaLabel,
  deriveNotificationSendTo,
  getFixedNotificationCriteriaLabel,
  getFixedNotificationHelpText,
  isSystemSurveyNotification,
  notificationSupportsEmailRespondent,
  notificationUsesEditableCriteria,
  SURVEY_NOTIFICATION_EXECUTION_OPTIONS,
  SURVEY_NOTIFICATION_FROM_OPTIONS,
  type SurveyNotificationExecutionWhen,
  type SurveyNotificationItem,
} from '@/data/mock-survey-notifications';
import styles from './SurveyNotificationConfigPanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyNotificationConfigPanelProps {
  value: SurveyNotificationItem;
  surveyId: number;
  onBack: () => void;
  onSave: (next: SurveyNotificationItem) => void;
}

function findOption<T extends { value: string }>(
  options: T[],
  value: string
): T | null {
  return options.find((option) => option.value === value) ?? null;
}

export function SurveyNotificationConfigPanel({
  value,
  surveyId,
  onBack,
  onSave,
}: SurveyNotificationConfigPanelProps) {
  const [draft, setDraft] = useState<SurveyNotificationItem>(value);
  const [editorKey, setEditorKey] = useState(0);
  const [showReplyTo, setShowReplyTo] = useState(Boolean(value.replyTo));
  const [collapsedCriterionIds, setCollapsedCriterionIds] = useState<Set<string>>(
    () => new Set()
  );

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  useEffect(() => {
    setDraft(value);
    setEditorKey((key) => key + 1);
    setShowReplyTo(Boolean(value.replyTo));
    setCollapsedCriterionIds(new Set());
  }, [value]);

  const selectedExecution =
    findOption(SURVEY_NOTIFICATION_EXECUTION_OPTIONS, draft.executionWhen) ??
    SURVEY_NOTIFICATION_EXECUTION_OPTIONS[0];
  const selectedFrom =
    findOption(SURVEY_NOTIFICATION_FROM_OPTIONS, draft.fromSenderId) ??
    SURVEY_NOTIFICATION_FROM_OPTIONS[0];
  const selectedReplyTo = findOption(SURVEY_NOTIFICATION_FROM_OPTIONS, draft.replyTo);

  function patchDraft(partial: Partial<SurveyNotificationItem>): void {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      const emailAdministrator = next.emailAdministrator;
      const emailRespondent = next.emailRespondent;
      return {
        ...next,
        sendTo: deriveNotificationSendTo(emailAdministrator, emailRespondent),
        criteria: deriveNotificationCriteriaLabel(next.criteriaBlocks, questions),
      };
    });
  }

  function handleCriteriaChange(next: {
    criteria: Criterion[];
    collapsedCriterionIds: Set<string>;
  }): void {
    setCollapsedCriterionIds(next.collapsedCriterionIds);
    patchDraft({ criteriaBlocks: next.criteria });
  }

  const isSystemNotification = isSystemSurveyNotification(draft);
  const fixedCriteriaLabel = getFixedNotificationCriteriaLabel(draft);
  const fixedNotificationHelp = getFixedNotificationHelpText(draft);
  const usesEditableCriteria = notificationUsesEditableCriteria(draft);
  const showEmailRespondent = notificationSupportsEmailRespondent(draft);
  const canSave =
    !usesEditableCriteria ||
    draft.criteriaBlocks.some((block) => hasCompleteConditions(block));

  function handleSave(): void {
    if (!canSave) return;
    onSave({
      ...draft,
      enabled: true,
      emailRespondent: showEmailRespondent ? draft.emailRespondent : false,
      sendTo: deriveNotificationSendTo(
        draft.emailAdministrator,
        showEmailRespondent ? draft.emailRespondent : false
      ),
      criteria: fixedCriteriaLabel
        ? fixedCriteriaLabel
        : deriveNotificationCriteriaLabel(draft.criteriaBlocks, questions),
      criteriaBlocks: usesEditableCriteria ? draft.criteriaBlocks : [],
    });
  }

  return (
    <div className={styles.panel}>
      <nav className={styles.breadcrumb} aria-label="Notification breadcrumb">
        <button type="button" className={styles.breadcrumbLink} onClick={onBack}>
          Notifications
        </button>
        <span className={styles.breadcrumbSep} aria-hidden>
          &gt;
        </span>
        <span className={styles.breadcrumbCurrentGroup}>
          <span className={styles.breadcrumbCurrent}>{draft.name}</span>
          {fixedNotificationHelp ? (
            <WuTooltip content={fixedNotificationHelp} position="top">
              <span
                className={styles.breadcrumbHelpBtn}
                aria-label={fixedNotificationHelp}
                title={fixedNotificationHelp}
              >
                <span className={styles.breadcrumbInfoMark} aria-hidden>
                  i
                </span>
              </span>
            </WuTooltip>
          ) : null}
        </span>
      </nav>

      {usesEditableCriteria ? (
        <div className={styles.section}>
          <CriteriaEngineEditor
            criteria={draft.criteriaBlocks}
            collapsedCriterionIds={collapsedCriterionIds}
            questions={questions}
            variant="quota"
            sources={NOTIFICATION_CONDITION_SOURCES}
            showAddCriteria={!isSystemNotification}
            addCriteriaLabel="Add criteria"
            onChange={handleCriteriaChange}
          />
        </div>
      ) : null}

      <div className={styles.executionRow}>
        {usesEditableCriteria ? (
          <div className={styles.executionSelect}>
            <WuSelect
              data={SURVEY_NOTIFICATION_EXECUTION_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedExecution}
              onSelect={(item) => {
                const selected = item as { value: SurveyNotificationExecutionWhen } | null;
                if (!selected) return;
                patchDraft({ executionWhen: selected.value });
              }}
              variant="outlined"
              aria-label="Execution condition"
            />
          </div>
        ) : null}
        <div className={styles.recipientToggles}>
          <WuToggle
            Label="Email Administrator"
            labelPosition="right"
            checked={draft.emailAdministrator}
            onChange={(checked) => patchDraft({ emailAdministrator: checked })}
          />
          {!showEmailRespondent ? null : (
            <WuToggle
              Label="Email Respondent"
              labelPosition="right"
              checked={draft.emailRespondent}
              onChange={(checked) => patchDraft({ emailRespondent: checked })}
            />
          )}
        </div>
      </div>

      <div className={styles.emailFields}>
        <div className={styles.emailFieldRow}>
          <span className={styles.fieldLabel}>To:</span>
          <MultiEmailInput
            value={draft.toEmails}
            onChange={(toEmails) => patchDraft({ toEmails })}
            placeholder="Enter email addresses"
            aria-label="To"
          />
        </div>
        <div className={styles.emailFieldRow}>
          <span className={styles.fieldLabel}>From:</span>
          <div className={styles.fromRow}>
            <div className={styles.fromSelect}>
              <WuSelect
                data={SURVEY_NOTIFICATION_FROM_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedFrom}
                onSelect={(item) => {
                  const selected = item as { value: string } | null;
                  if (!selected) return;
                  patchDraft({ fromSenderId: selected.value });
                }}
                variant="outlined"
                aria-label="From"
              />
            </div>
            {showReplyTo ? (
              <div className={styles.replyToSelect}>
                <WuSelect
                  data={SURVEY_NOTIFICATION_FROM_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedReplyTo}
                  onSelect={(item) => {
                    const selected = item as { value: string } | null;
                    if (!selected) {
                      patchDraft({ replyTo: '' });
                      return;
                    }
                    patchDraft({ replyTo: selected.value });
                  }}
                  placeholder="Reply To"
                  variant="outlined"
                  aria-label="Reply To"
                />
              </div>
            ) : (
              <button
                type="button"
                className={styles.replyToLink}
                onClick={() => {
                  setShowReplyTo(true);
                  if (!draft.replyTo) {
                    patchDraft({ replyTo: SURVEY_NOTIFICATION_FROM_OPTIONS[0].value });
                  }
                }}
              >
                Reply To
              </button>
            )}
          </div>
        </div>
        <div className={styles.emailFieldRow}>
          <span className={styles.fieldLabel}>Subject:</span>
          <WuInput
            value={draft.subject}
            onChange={(event) => patchDraft({ subject: event.target.value })}
            aria-label="Subject"
          />
        </div>
        <div className={styles.bodyEditor}>
          <SurveySettingsRichText
            key={editorKey}
            value={draft.body}
            onChange={(body) => patchDraft({ body })}
            ariaLabel="Notification email body"
            toolbarPosition="bottom"
          />
        </div>
      </div>

      <div className={styles.attachmentToggles}>
        <WuToggle
          Label="Attach response"
          labelPosition="right"
          checked={draft.attachResponse}
          onChange={(checked) => patchDraft({ attachResponse: checked })}
        />
        <div className={styles.customAttachmentRow}>
          <WuToggle
            Label="Custom attachment"
            labelPosition="right"
            checked={draft.customAttachment}
            onChange={(checked) =>
              patchDraft({
                customAttachment: checked,
                customAttachmentName: checked ? draft.customAttachmentName : '',
              })
            }
          />
          {draft.customAttachment ? (
            <div className={styles.customAttachmentPicker}>
              {draft.customAttachmentName ? (
                <span className={styles.customAttachmentChip}>
                  <span className="wm-attach-file" aria-hidden />
                  <span className={styles.customAttachmentName}>
                    {draft.customAttachmentName}
                  </span>
                  <button
                    type="button"
                    className={styles.customAttachmentRemove}
                    aria-label={`Remove ${draft.customAttachmentName}`}
                    onClick={() => patchDraft({ customAttachmentName: '' })}
                  >
                    <span className="wm-close" aria-hidden />
                  </button>
                </span>
              ) : null}
              <label className={styles.customAttachmentUpload}>
                <input
                  type="file"
                  className={styles.customAttachmentInput}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    patchDraft({ customAttachmentName: file.name });
                    event.target.value = '';
                  }}
                />
                {draft.customAttachmentName ? 'Replace file' : 'Choose file'}
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <WuButton onClick={handleSave} disabled={!canSave}>
          Save Changes
        </WuButton>
      </div>
    </div>
  );
}
