'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SpotlightCriteriaModal } from '@/components/surveys/SpotlightCriteriaModal';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  buildSpotlightCompareOptions,
  FINISH_OPTIONS_HELP,
  FORWARD_TO_FRIEND_DESCRIPTION,
  FORWARD_TO_FRIEND_HELP,
  FINISH_OPTION_TYPE_OPTIONS,
  FINISH_OPTION_TYPE_SELECT_DATA,
  normalizeSurveyFinishOptions,
  QUOTA_OVERLIMIT_MESSAGE_HELP,
  REWARD_CATALOG,
  REWARD_PUBLIC_CONTACT_HELP,
  REWARD_PUBLIC_CONTACT_TOOLTIP,
  REWARD_QUALIFYING_CRITERIA_OPTIONS,
  REVIEW_PRINT_EDIT_RESPONSE_HELP,
  REVIEW_PRINT_LOGIC_WARNING,
  SPOTLIGHT_REPORT_DESCRIPTION,
  SPOTLIGHT_REPORT_HELP,
  surveyFinishOptionsStorageKey,
  TERMINATED_RESPONDENT_MESSAGE_HELP,
  THANK_YOU_MESSAGE_HELP,
  type RewardSelectOption,
  type SpotlightCompareOption,
  type SurveyFinishOptions,
  type SurveyFinishOptionType,
} from '@/data/mock-survey-finish-options';
import styles from './SurveyFinishOptionsDashboard.module.css';

const WuSelect = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuSelect,
    })),
  { ssr: false }
);
const WuInput = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuInput,
    })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuAlert = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAlert })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuTooltip,
    })),
  { ssr: false }
);

interface SurveyFinishOptionsDashboardProps {
  surveyId: number;
  embedded?: boolean;
}

const DEFAULT_URL_SCHEME = 'https://';

function withUrlScheme(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  if (DEFAULT_URL_SCHEME.startsWith(value.toLowerCase())) return DEFAULT_URL_SCHEME;
  const brokenScheme = value.match(/^https?:\/?/i);
  const rest = brokenScheme ? value.slice(brokenScheme[0].length) : value;
  return `${DEFAULT_URL_SCHEME}${rest}`;
}

export function SurveyFinishOptionsDashboard({
  surveyId,
  embedded = false,
}: SurveyFinishOptionsDashboardProps) {
  const { showToast } = useWuShowToast();
  const [createCriteriaOpen, setCreateCriteriaOpen] = useState(false);
  const [optionsRaw, setOptions] = usePersistedState<SurveyFinishOptions>(
    surveyFinishOptionsStorageKey(surveyId),
    normalizeSurveyFinishOptions({})
  );
  const options = useMemo(() => normalizeSurveyFinishOptions(optionsRaw), [optionsRaw]);

  const selectedFinishType =
    FINISH_OPTION_TYPE_OPTIONS.find((option) => option.value === options.finishType) ??
    FINISH_OPTION_TYPE_OPTIONS[0];

  const spotlightCompareOptions = useMemo(
    () => buildSpotlightCompareOptions(options.spotlightCustomCriteria),
    [options.spotlightCustomCriteria]
  );
  const selectedSpotlightCompare =
    spotlightCompareOptions.find((option) => option.value === options.spotlightCompareAgainst) ??
    spotlightCompareOptions[0];
  const selectedRewardCriteria =
    REWARD_QUALIFYING_CRITERIA_OPTIONS.find(
      (option) => option.value === options.rewardQualifyingCriteria
    ) ?? null;
  const selectedReward = REWARD_CATALOG.find((option) => option.value === options.rewardId) ?? null;

  function patchOptions(partial: Partial<SurveyFinishOptions>): void {
    setOptions((prev) => normalizeSurveyFinishOptions({ ...prev, ...partial }));
  }

  function handlePreview(label: string): void {
    showToast({ message: `${label} preview opened`, variant: 'success' });
  }

  function handleCreateCriteria(name: string): void {
    const criteria = { id: `spotlight-crit-${Date.now()}`, name };
    patchOptions({
      spotlightCustomCriteria: [...options.spotlightCustomCriteria, criteria],
      spotlightCompareAgainst: criteria.id,
    });
    setCreateCriteriaOpen(false);
    showToast({ message: `Criteria "${name}" created`, variant: 'success' });
  }

  return (
    <div className={`${styles.workspace} ${embedded ? styles.workspaceEmbedded : ''}`}>
      <div className={styles.panel}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Finish Options</h1>
          <WuTooltip content={FINISH_OPTIONS_HELP} position="top">
            <button type="button" className={styles.helpBtn} aria-label={FINISH_OPTIONS_HELP}>
              <span className="wm-help" aria-hidden />
            </button>
          </WuTooltip>
        </div>

        <div className={styles.typeSelect}>
          <WuSelect
            data={FINISH_OPTION_TYPE_SELECT_DATA}
            hasGroup
            maxHeight={360}
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

        {options.finishType === 'automatic-redirect' ? (
          <section className={styles.messageSection} aria-labelledby="website-address-label">
            <label
              id="website-address-label"
              htmlFor="website-address"
              className={styles.messageLabel}
            >
              Website Address
            </label>
            <WuInput
              id="website-address"
              variant="outlined"
              type="url"
              value={withUrlScheme(options.redirectWebsiteAddress)}
              onChange={(event) =>
                patchOptions({ redirectWebsiteAddress: withUrlScheme(event.target.value) })
              }
            />
          </section>
        ) : options.finishType === 'spotlight-report' ? (
          <section className={styles.messageSection} aria-labelledby="spotlight-compare-label">
            <span id="spotlight-compare-label" className={styles.messageLabel}>
              Compare Results Against
            </span>
            <div className={styles.typeSelect}>
              <WuSelect
                data={spotlightCompareOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedSpotlightCompare}
                onSelect={(item) => {
                  const selected = item as SpotlightCompareOption | null;
                  if (!selected) return;
                  patchOptions({ spotlightCompareAgainst: selected.value });
                }}
                variant="outlined"
                aria-labelledby="spotlight-compare-label"
              />
            </div>
            <button
              type="button"
              className={styles.createCriteriaBtn}
              onClick={() => setCreateCriteriaOpen(true)}
            >
              <span className="wm-add" aria-hidden />
              Create New Criteria
            </button>
            <p className={styles.optionDescription}>
              {SPOTLIGHT_REPORT_DESCRIPTION}
              <WuTooltip content={SPOTLIGHT_REPORT_HELP} position="top">
                <button type="button" className={styles.helpBtn} aria-label={SPOTLIGHT_REPORT_HELP}>
                  <span className="wm-help" aria-hidden />
                </button>
              </WuTooltip>
            </p>
          </section>
        ) : options.finishType === 'rewards' ? (
          <section className={styles.rewardsCard} aria-label="Reward setup">
            <div>
              <h2 className={styles.rewardsTitle}>Reward setup</h2>
              <p className={styles.rewardsHint}>
                Choose who qualifies, which reward they receive, and the contact winners can reach.
              </p>
            </div>
            <div className={styles.rewardField}>
              <span id="reward-criteria-label" className={styles.messageLabel}>
                Qualifying Criteria
              </span>
              <div className={`${styles.typeSelect} ${styles.rewardSelect}`}>
                <WuSelect
                  data={REWARD_QUALIFYING_CRITERIA_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedRewardCriteria}
                  placeholder="-Select-"
                  onSelect={(item) => {
                    const selected = item as RewardSelectOption | null;
                    if (!selected) return;
                    patchOptions({ rewardQualifyingCriteria: selected.value });
                  }}
                  variant="outlined"
                  aria-labelledby="reward-criteria-label"
                />
              </div>
            </div>
            <div className={styles.rewardField}>
              <span id="reward-catalog-label" className={styles.messageLabel}>
                Select a Reward
              </span>
              <div className={`${styles.typeSelect} ${styles.rewardSelect}`}>
                <WuSelect
                  data={REWARD_CATALOG}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedReward}
                  placeholder="-Select-"
                  onSelect={(item) => {
                    const selected = item as RewardSelectOption | null;
                    if (!selected) return;
                    patchOptions({ rewardId: selected.value });
                  }}
                  variant="outlined"
                  aria-labelledby="reward-catalog-label"
                />
              </div>
            </div>
            <div className={styles.rewardField}>
              <label htmlFor="reward-public-email" className={styles.messageLabel}>
                Public Contact Email
              </label>
              <WuInput
                id="reward-public-email"
                variant="outlined"
                type="email"
                value={options.rewardPublicContactEmail}
                onChange={(event) => patchOptions({ rewardPublicContactEmail: event.target.value })}
              />
              <p className={styles.fieldHelper}>
                {REWARD_PUBLIC_CONTACT_HELP}
                <WuTooltip content={REWARD_PUBLIC_CONTACT_TOOLTIP} position="top">
                  <button
                    type="button"
                    className={styles.helpBtn}
                    aria-label={REWARD_PUBLIC_CONTACT_TOOLTIP}
                  >
                    <span className="wm-help" aria-hidden />
                  </button>
                </WuTooltip>
              </p>
            </div>
          </section>
        ) : options.finishType === 'forward-to-friend' ? (
          <p className={styles.optionDescription}>
            {FORWARD_TO_FRIEND_DESCRIPTION}
            <WuTooltip content={FORWARD_TO_FRIEND_HELP} position="top">
              <button type="button" className={styles.helpBtn} aria-label={FORWARD_TO_FRIEND_HELP}>
                <span className="wm-help" aria-hidden />
              </button>
            </WuTooltip>
          </p>
        ) : (
          <>
            {options.finishType === 'review-print' ? (
              <div className={styles.reviewPrintRow}>
                <div className={styles.editResponseToggle}>
                  <WuToggle
                    Label="Edit Response"
                    labelPosition="left"
                    checked={options.reviewPrintEditResponse}
                    onChange={(checked) => patchOptions({ reviewPrintEditResponse: checked })}
                  />
                  <WuTooltip content={REVIEW_PRINT_EDIT_RESPONSE_HELP} position="top">
                    <button
                      type="button"
                      className={styles.helpBtn}
                      aria-label={REVIEW_PRINT_EDIT_RESPONSE_HELP}
                    >
                      <span className="wm-help" aria-hidden />
                    </button>
                  </WuTooltip>
                </div>
                <WuAlert
                  variant="warning"
                  className={styles.logicWarning}
                  Icon={<span className="wm-warning" aria-hidden />}
                >
                  {REVIEW_PRINT_LOGIC_WARNING}
                </WuAlert>
              </div>
            ) : null}
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
                    <span className="wm-help" aria-hidden />
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
          </>
        )}

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
                <span className="wm-help" aria-hidden />
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

        <section className={styles.messageSection} aria-labelledby="quota-overlimit-message-label">
          <div className={styles.messageHeader}>
            <span id="quota-overlimit-message-label" className={styles.messageLabel}>
              Quota overlimit message
            </span>
            <WuTooltip content={QUOTA_OVERLIMIT_MESSAGE_HELP} position="top">
              <button
                type="button"
                className={styles.helpBtn}
                aria-label={QUOTA_OVERLIMIT_MESSAGE_HELP}
              >
                <span className="wm-help" aria-hidden />
              </button>
            </WuTooltip>
            <span className={styles.messageHeaderSpacer} aria-hidden />
            <button
              type="button"
              className={styles.previewBtn}
              aria-label="Preview quota overlimit message"
              onClick={() => handlePreview('Quota overlimit message')}
            >
              <span className="wm-visibility" aria-hidden />
            </button>
          </div>
          <div className={styles.messageEditor}>
            <SurveySettingsRichText
              value={options.quotaOverlimitMessage}
              onChange={(quotaOverlimitMessage) => patchOptions({ quotaOverlimitMessage })}
              ariaLabel="Quota overlimit message"
              toolbarPosition="bottom"
            />
          </div>
        </section>
      </div>

      {createCriteriaOpen ? (
        <SpotlightCriteriaModal
          surveyId={surveyId}
          onOpenChange={setCreateCriteriaOpen}
          onCreate={handleCreateCriteria}
        />
      ) : null}
    </div>
  );
}
