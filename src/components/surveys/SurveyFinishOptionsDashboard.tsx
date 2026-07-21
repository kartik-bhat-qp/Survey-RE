'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  FINISH_OPTIONS_HELP,
  FINISH_OPTION_TYPE_OPTIONS,
  normalizeSurveyFinishOptions,
  surveyFinishOptionsStorageKey,
  TERMINATED_RESPONDENT_MESSAGE_HELP,
  THANK_YOU_MESSAGE_HELP,
  type SurveyFinishOptions,
  type SurveyFinishOptionType,
} from '@/data/mock-survey-finish-options';
import styles from './SurveyFinishOptionsDashboard.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyFinishOptionsDashboardProps {
  surveyId: number;
}

export function SurveyFinishOptionsDashboard({ surveyId }: SurveyFinishOptionsDashboardProps) {
  const { showToast } = useWuShowToast();
  const [optionsRaw, setOptions] = usePersistedState<SurveyFinishOptions>(
    surveyFinishOptionsStorageKey(surveyId),
    normalizeSurveyFinishOptions({})
  );
  const options = useMemo(() => normalizeSurveyFinishOptions(optionsRaw), [optionsRaw]);

  const selectedFinishType =
    FINISH_OPTION_TYPE_OPTIONS.find((option) => option.value === options.finishType) ??
    FINISH_OPTION_TYPE_OPTIONS[0];

  function patchOptions(partial: Partial<SurveyFinishOptions>): void {
    setOptions((prev) => normalizeSurveyFinishOptions({ ...prev, ...partial }));
  }

  function handlePreview(label: string): void {
    showToast({ message: `${label} preview opened`, variant: 'success' });
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.panel}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Finish Options</h1>
          <WuTooltip content={FINISH_OPTIONS_HELP} position="top">
            <button
              type="button"
              className={styles.helpBtn}
              aria-label={FINISH_OPTIONS_HELP}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </WuTooltip>
        </div>

        <div className={styles.typeSelect}>
          <WuSelect
            data={FINISH_OPTION_TYPE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedFinishType}
            onSelect={(item) => {
              const selected = item as { value: SurveyFinishOptionType } | null;
              if (!selected) return;
              patchOptions({ finishType: selected.value });
            }}
            variant="outlined"
            aria-label="Finish option type"
          />
        </div>

        <section className={styles.messageSection} aria-labelledby="thank-you-message-label">
          <div className={styles.messageHeader}>
            <span id="thank-you-message-label" className={styles.messageLabel}>
              Thank you message
            </span>
            <WuTooltip content={THANK_YOU_MESSAGE_HELP} position="top">
              <button
                type="button"
                className={styles.helpBtn}
                aria-label={THANK_YOU_MESSAGE_HELP}
              >
                <span className="wm-help-outline" aria-hidden />
              </button>
            </WuTooltip>
            <span className={styles.messageHeaderSpacer} aria-hidden />
            <button
              type="button"
              className={styles.previewBtn}
              aria-label="Preview thank you message"
              onClick={() => handlePreview('Thank you message')}
            >
              <span className="wm-visibility" aria-hidden />
            </button>
          </div>
          <div className={styles.messageEditor}>
            <SurveySettingsRichText
              value={options.thankYouMessage}
              onChange={(thankYouMessage) => patchOptions({ thankYouMessage })}
              ariaLabel="Thank you message"
              toolbarPosition="bottom"
            />
          </div>
        </section>

        <section
          className={styles.messageSection}
          aria-labelledby="terminated-respondent-message-label"
        >
          <div className={styles.messageHeader}>
            <span id="terminated-respondent-message-label" className={styles.messageLabel}>
              Terminated respondent message
            </span>
            <WuTooltip content={TERMINATED_RESPONDENT_MESSAGE_HELP} position="top">
              <button
                type="button"
                className={styles.helpBtn}
                aria-label={TERMINATED_RESPONDENT_MESSAGE_HELP}
              >
                <span className="wm-help-outline" aria-hidden />
              </button>
            </WuTooltip>
            <span className={styles.messageHeaderSpacer} aria-hidden />
            <button
              type="button"
              className={styles.previewBtn}
              aria-label="Preview terminated respondent message"
              onClick={() => handlePreview('Terminated respondent message')}
            >
              <span className="wm-visibility" aria-hidden />
            </button>
          </div>
          <div className={styles.messageEditor}>
            <SurveySettingsRichText
              value={options.terminatedRespondentMessage}
              onChange={(terminatedRespondentMessage) =>
                patchOptions({ terminatedRespondentMessage })
              }
              ariaLabel="Terminated respondent message"
              toolbarPosition="bottom"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
