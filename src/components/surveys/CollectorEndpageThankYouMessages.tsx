'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  QUOTA_OVERLIMIT_MESSAGE_HELP,
  TERMINATED_RESPONDENT_MESSAGE_HELP,
  THANK_YOU_MESSAGE_HELP,
  normalizeSurveyFinishOptions,
  surveyFinishOptionsStorageKey,
  type SurveyFinishOptions,
} from '@/data/mock-survey-finish-options';
import styles from './CollectorEndpageThankYouMessages.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface CollectorEndpageThankYouMessagesProps {
  surveyId: number;
}

export function CollectorEndpageThankYouMessages({
  surveyId,
}: CollectorEndpageThankYouMessagesProps) {
  const { showToast } = useWuShowToast();
  const [optionsRaw, setOptions] = usePersistedState<SurveyFinishOptions>(
    surveyFinishOptionsStorageKey(surveyId),
    normalizeSurveyFinishOptions({})
  );
  const options = useMemo(() => normalizeSurveyFinishOptions(optionsRaw), [optionsRaw]);

  function patchOptions(partial: Partial<SurveyFinishOptions>): void {
    setOptions((prev) =>
      normalizeSurveyFinishOptions({
        ...prev,
        ...partial,
        finishType: 'thank-you-page',
      })
    );
  }

  function handlePreview(label: string): void {
    showToast({ message: `${label} preview opened`, variant: 'success' });
  }

  return (
    <div className={styles.root}>
      <MessageEditor
        id="collector-thank-you-message"
        label="Thank you message"
        help={THANK_YOU_MESSAGE_HELP}
        value={options.thankYouMessage}
        onChange={(thankYouMessage) => patchOptions({ thankYouMessage })}
        onPreview={() => handlePreview('Thank you message')}
      />
      <MessageEditor
        id="collector-terminated-respondent-message"
        label="Terminated respondent message"
        help={TERMINATED_RESPONDENT_MESSAGE_HELP}
        value={options.terminatedRespondentMessage}
        onChange={(terminatedRespondentMessage) =>
          patchOptions({ terminatedRespondentMessage })
        }
        onPreview={() => handlePreview('Terminated respondent message')}
      />
      <MessageEditor
        id="collector-quota-overlimit-message"
        label="Quota overlimit message"
        help={QUOTA_OVERLIMIT_MESSAGE_HELP}
        value={options.quotaOverlimitMessage}
        onChange={(quotaOverlimitMessage) => patchOptions({ quotaOverlimitMessage })}
        onPreview={() => handlePreview('Quota overlimit message')}
      />
    </div>
  );
}

function MessageEditor({
  id,
  label,
  help,
  value,
  onChange,
  onPreview,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  onPreview: () => void;
}) {
  return (
    <section className={styles.messageSection} aria-labelledby={`${id}-label`}>
      <div className={styles.messageHeader}>
        <span id={`${id}-label`} className={styles.messageLabel}>
          {label}
        </span>
        <WuTooltip content={help} position="top">
          <button type="button" className={styles.helpBtn} aria-label={help}>
            <span className="wm-help" aria-hidden />
          </button>
        </WuTooltip>
        <span className={styles.messageHeaderSpacer} aria-hidden />
        <button
          type="button"
          className={styles.previewBtn}
          aria-label={`Preview ${label.toLowerCase()}`}
          onClick={onPreview}
        >
          <span className="wm-visibility" aria-hidden />
        </button>
      </div>
      <div className={styles.messageEditor}>
        <SurveySettingsRichText
          value={value}
          onChange={onChange}
          ariaLabel={label}
          toolbarPosition="bottom"
        />
      </div>
    </section>
  );
}
