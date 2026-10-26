'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { WarningNotice } from '@/components/ui/WarningNotice';
import { SpotlightCriteriaModal } from '@/components/surveys/SpotlightCriteriaModal';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  buildRewardCharge,
  createRewardTicketId,
  formatUsd,
  isRewardCardOrder,
  parseGiftCardAmount,
  parseGiftCardCount,
  rewardOrderStorageKey,
  type RewardCardOrder,
} from '@/data/mock-reward-orders';
import {
  buildSpotlightCompareOptions,
  FINISH_OPTIONS_HELP,
  FORWARD_TO_FRIEND_DESCRIPTION,
  FORWARD_TO_FRIEND_HELP,
  FINISH_OPTION_TYPE_OPTIONS,
  FINISH_OPTION_TYPE_SELECT_DATA,
  normalizeSurveyFinishOptions,
  QUOTA_OVERLIMIT_MESSAGE_HELP,
  AMAZON_GIFT_CARD_DISCLAIMER,
  COUPON_LIST_HINT,
  GIFT_CARD_FULFILLMENT_NOTE,
  GIFT_CARD_VALUE_HINT,
  TANGO_GIFT_CARD_VALUE_HINT,
  REWARD_CATALOG,
  REWARD_PAGE_PREVIEW_HINT,
  REWARD_PUBLIC_CONTACT_HELP,
  REWARD_PUBLIC_CONTACT_TOOLTIP,
  PREPAID_VISA_DISCLAIMER,
  PREPAID_VISA_GIFT_CARD_VALUE_OPTIONS,
  REWARD_QUALIFYING_CRITERIA_OPTIONS,
  STARBUCKS_GIFT_CARD_DISCLAIMER,
  STARBUCKS_GIFT_CARD_VALUE_OPTIONS,
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
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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

function GiftCardOrderPanel({
  surveyId,
  rewardId,
  rewardLabel,
  unitValueRaw,
  countRaw,
}: {
  surveyId: number;
  rewardId: string;
  rewardLabel: string;
  unitValueRaw: string;
  countRaw: string;
}) {
  const { showToast } = useWuShowToast();
  const [orderRaw, setOrder] = usePersistedState<RewardCardOrder | null>(
    rewardOrderStorageKey(surveyId),
    null
  );
  const order = isRewardCardOrder(orderRaw) ? orderRaw : null;
  const unitValue = parseGiftCardAmount(unitValueRaw);
  const cardCount = parseGiftCardCount(countRaw);
  const charge =
    unitValue !== null && cardCount !== null ? buildRewardCharge(unitValue, cardCount) : null;
  const [approvalComment, setApprovalComment] = useState('');

  function placeOrder(): void {
    if (!charge || unitValue === null || cardCount === null) return;
    if (order?.status === 'processing') return;
    const orderedAt = new Date();
    const next: RewardCardOrder = {
      ticketId: createRewardTicketId(),
      rewardId,
      rewardLabel,
      unitValue,
      cardCount,
      subtotal: charge.subtotal,
      fulfilmentFee: charge.fulfilmentFee,
      total: charge.total,
      orderedAt: orderedAt.toISOString(),
      addedAt: '',
      approvalComment: '',
      status: 'processing',
    };
    setOrder(next);
    setApprovalComment('');
    showToast({
      message: `Order placed. Ticket ${next.ticketId} is in process.`,
      variant: 'success',
    });
  }

  function approveOrder(): void {
    if (!order || order.status !== 'processing') return;
    const comment = approvalComment.trim();
    if (!comment) return;
    setOrder({
      ...order,
      status: 'added',
      addedAt: new Date().toISOString(),
      approvalComment: comment,
    });
    setApprovalComment('');
    showToast({
      message: `Ticket ${order.ticketId} approved. Gift cards added.`,
      variant: 'success',
    });
  }

  if (order?.status === 'processing' && order.rewardId !== rewardId) {
    return (
      <p className={styles.fulfillmentNote} role="status">
        <span className={`wm-schedule ${styles.fulfillmentNoteIcon}`} aria-hidden />
        Ticket {order.ticketId} for {order.rewardLabel} is still in process. Place another order
        after those cards are added.
      </p>
    );
  }

  if (order && order.rewardId === rewardId) {
    const added = order.status === 'added';
    const addedCopy = `${order.cardCount} cards of ${formatUsd(
      order.unitValue
    )} were added for ${order.rewardLabel}.`;
    const processingCopy =
      `Your ${order.rewardLabel} order is in process. ` +
      'Gift cards are added when an employee approves the order.';
    return (
      <section className={styles.orderCard} aria-live="polite" aria-label="Reward order status">
        <div className={styles.orderStatusHead}>
          <div>
            <p className={styles.ticketLabel}>Ticket ID</p>
            <p className={styles.ticketId}>{order.ticketId}</p>
          </div>
          <span className={added ? styles.statusAdded : styles.statusProcessing}>
            {added ? 'Cards added' : 'In process'}
          </span>
        </div>
        <ol className={styles.orderSteps}>
          <li className={`${styles.orderStep} ${styles.orderStepDone}`}>Order placed</li>
          <li
            className={`${styles.orderStep} ${
              added ? styles.orderStepDone : styles.orderStepCurrent
            }`}
          >
            In process
          </li>
          <li className={`${styles.orderStep} ${added ? styles.orderStepDone : ''}`}>
            Cards added
          </li>
        </ol>
        <p className={styles.orderCopy}>
          {added ? addedCopy : processingCopy}
        </p>
        <dl className={styles.orderLines}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Fulfilment fee (5%)</dt>
            <dd>{formatUsd(order.fulfilmentFee)}</dd>
          </div>
          <div className={styles.orderTotal}>
            <dt>Total charged</dt>
            <dd>{formatUsd(order.total)}</dd>
          </div>
        </dl>
        {added && order.approvalComment ? (
          <p className={styles.approvalComment}>
            <span>Approval comment</span>
            {order.approvalComment}
          </p>
        ) : null}
        {added ? (
          <button type="button" className={styles.placeAnother} onClick={() => setOrder(null)}>
            Place another order
          </button>
        ) : (
          <div className={styles.employeeApproval}>
            <p className={styles.employeeLabel}>Employee only</p>
            <p className={styles.orderCopy}>
              Approve this order to add the gift cards. A comment is required.
            </p>
            <label className={styles.employeeField} htmlFor={`reward-approval-${order.ticketId}`}>
              Approval comment <span className={styles.requiredMark}>*</span>
              <textarea
                id={`reward-approval-${order.ticketId}`}
                className={styles.couponTextarea}
                rows={3}
                required
                aria-required="true"
                value={approvalComment}
                onChange={(event) => setApprovalComment(event.target.value)}
              />
            </label>
            <WuButton type="button" disabled={!approvalComment.trim()} onClick={approveOrder}>
              Approve
            </WuButton>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={styles.orderCard} aria-label="Order summary">
      <h3 className={styles.orderTitle}>Order summary</h3>
      <dl className={styles.orderLines}>
        <div>
          <dt>Gift card value</dt>
          <dd>{unitValue === null ? '—' : formatUsd(unitValue)}</dd>
        </div>
        <div>
          <dt>Number of gift cards</dt>
          <dd>{cardCount === null ? '—' : cardCount}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd>{charge ? formatUsd(charge.subtotal) : '—'}</dd>
        </div>
        <div>
          <dt>Fulfilment fee (5%)</dt>
          <dd>{charge ? formatUsd(charge.fulfilmentFee) : '—'}</dd>
        </div>
        <div className={styles.orderTotal}>
          <dt>Total</dt>
          <dd>{charge ? formatUsd(charge.total) : '—'}</dd>
        </div>
      </dl>
      <WuButton type="button" disabled={!charge} onClick={placeOrder}>
        Place order
      </WuButton>
      {charge ? null : (
        <p className={styles.fieldHelper}>
          Enter a gift card value and the number of cards to see what will be charged.
        </p>
      )}
    </section>
  );
}

function GiftCardFulfillmentNote() {
  return (
    <p className={styles.fulfillmentNote} role="note">
      <span className={`wm-schedule ${styles.fulfillmentNoteIcon}`} aria-hidden />
      {GIFT_CARD_FULFILLMENT_NOTE}
    </p>
  );
}

function RewardPageFields({
  headline,
  message,
  onHeadlineChange,
  onMessageChange,
  onPreview,
}: {
  headline: string;
  message: string;
  onHeadlineChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onPreview: () => void;
}) {
  return (
    <>
      <div className={styles.couponRow}>
        <label htmlFor="reward-page-headline" className={styles.couponLabel}>
          Reward Page Headline
        </label>
        <WuInput
          id="reward-page-headline"
          variant="outlined"
          value={headline}
          onChange={(event) => onHeadlineChange(event.target.value)}
        />
      </div>
      <div className={styles.couponRow}>
        <label htmlFor="reward-page-message" className={styles.couponLabel}>
          Reward Page Message
        </label>
        <div>
          <textarea
            id="reward-page-message"
            className={styles.couponTextarea}
            rows={4}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
          />
          <p className={styles.fieldHelper}>{REWARD_PAGE_PREVIEW_HINT}</p>
        </div>
      </div>
      <div className={styles.couponRow}>
        <span />
        <div>
          <WuButton type="button" onClick={onPreview}>
            Preview
          </WuButton>
        </div>
      </div>
    </>
  );
}

function PublicContactEmailRow({
  email,
  onChange,
}: {
  email: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.couponRow}>
      <label htmlFor="reward-public-email" className={styles.couponLabel}>
        Public Contact Email
      </label>
      <div>
        <WuInput
          id="reward-public-email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(event) => onChange(event.target.value)}
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
    </div>
  );
}

function RewardToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={`${styles.couponRow} ${styles.toggleRow}`}>
      <span id={id} className={styles.couponLabel}>
        {label}
      </span>
      <WuToggle checked={checked} onChange={onChange} aria-labelledby={id} />
    </div>
  );
}

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
  const selectedStarbucksValue =
    STARBUCKS_GIFT_CARD_VALUE_OPTIONS.find(
      (option) => option.value === options.starbucksGiftCardValue
    ) ?? null;
  const selectedPrepaidVisaValue =
    PREPAID_VISA_GIFT_CARD_VALUE_OPTIONS.find(
      (option) => option.value === options.prepaidVisaGiftCardValue
    ) ?? null;

  function patchOptions(partial: Partial<SurveyFinishOptions>): void {
    setOptions((prev) => normalizeSurveyFinishOptions({ ...prev, ...partial }));
  }

  function handlePreview(label: string): void {
    showToast({ message: `${label} preview opened`, variant: 'success' });
  }

  function handleSave(): void {
    showToast({ message: 'Settings saved', variant: 'success' });
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
                  placeholder="Select..."
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
                  placeholder="Select..."
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
            {options.rewardId === 'coupon' ? (
              <div className={styles.couponForm}>
                <div className={styles.couponRow}>
                  <label htmlFor="coupon-company-name" className={styles.couponLabel}>
                    Coupon Company Name
                  </label>
                  <WuInput
                    id="coupon-company-name"
                    variant="outlined"
                    value={options.couponCompanyName}
                    onChange={(event) => patchOptions({ couponCompanyName: event.target.value })}
                  />
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="coupon-headline" className={styles.couponLabel}>
                    Coupon Headline
                  </label>
                  <WuInput
                    id="coupon-headline"
                    variant="outlined"
                    value={options.couponHeadline}
                    onChange={(event) => patchOptions({ couponHeadline: event.target.value })}
                  />
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="coupon-details" className={styles.couponLabel}>
                    Coupon Details
                  </label>
                  <textarea
                    id="coupon-details"
                    className={styles.couponTextarea}
                    rows={4}
                    value={options.couponDetails}
                    onChange={(event) => patchOptions({ couponDetails: event.target.value })}
                  />
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="coupon-list" className={styles.couponLabel}>
                    Coupon List <span className={styles.requiredMark}>*</span>
                  </label>
                  <div>
                    <textarea
                      id="coupon-list"
                      className={styles.couponTextarea}
                      rows={4}
                      required
                      aria-required="true"
                      value={options.couponList}
                      onChange={(event) => patchOptions({ couponList: event.target.value })}
                    />
                    <p className={styles.fieldHelper}>{COUPON_LIST_HINT}</p>
                  </div>
                </div>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
              </div>
            ) : options.rewardId === 'user-defined' ? (
              <div className={styles.couponForm}>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
              </div>
            ) : options.rewardId === 'amazon' ? (
              <div className={styles.couponForm}>
                <GiftCardFulfillmentNote />
                <div className={styles.couponRow}>
                  <label htmlFor="gift-card-value" className={styles.couponLabel}>
                    Gift Card Value
                  </label>
                  <div>
                    <WuInput
                      id="gift-card-value"
                      variant="outlined"
                      value={options.giftCardValue}
                      onChange={(event) => patchOptions({ giftCardValue: event.target.value })}
                    />
                    <p className={styles.fieldHelper}>{GIFT_CARD_VALUE_HINT}</p>
                  </div>
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="gift-card-count" className={styles.couponLabel}>
                    Number of Gift Cards
                  </label>
                  <WuInput
                    id="gift-card-count"
                    variant="outlined"
                    value={options.giftCardCount}
                    onChange={(event) => patchOptions({ giftCardCount: event.target.value })}
                  />
                </div>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <div className={styles.couponRow}>
                  <span />
                  <p className={styles.amazonDisclaimer}>{AMAZON_GIFT_CARD_DISCLAIMER}</p>
                </div>
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
                <GiftCardOrderPanel
                  surveyId={surveyId}
                  rewardId="amazon"
                  rewardLabel="Amazon.com Gift Card"
                  unitValueRaw={options.giftCardValue}
                  countRaw={options.giftCardCount}
                />
              </div>
            ) : options.rewardId === 'tango' ? (
              <div className={styles.couponForm}>
                <GiftCardFulfillmentNote />
                <div className={styles.couponRow}>
                  <label htmlFor="tango-gift-card-value" className={styles.couponLabel}>
                    Gift Card Value
                  </label>
                  <div>
                    <WuInput
                      id="tango-gift-card-value"
                      variant="outlined"
                      value={options.giftCardValue}
                      onChange={(event) => patchOptions({ giftCardValue: event.target.value })}
                    />
                    <p className={styles.fieldHelper}>{TANGO_GIFT_CARD_VALUE_HINT}</p>
                  </div>
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="tango-gift-card-count" className={styles.couponLabel}>
                    Number of Gift Cards
                  </label>
                  <WuInput
                    id="tango-gift-card-count"
                    variant="outlined"
                    value={options.giftCardCount}
                    onChange={(event) => patchOptions({ giftCardCount: event.target.value })}
                  />
                </div>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
                <GiftCardOrderPanel
                  surveyId={surveyId}
                  rewardId="tango"
                  rewardLabel="Tango Gift Card"
                  unitValueRaw={options.giftCardValue}
                  countRaw={options.giftCardCount}
                />
              </div>
            ) : options.rewardId === 'starbucks' ? (
              <div className={styles.couponForm}>
                <GiftCardFulfillmentNote />
                <div className={styles.couponRow}>
                  <span id="starbucks-gift-card-value-label" className={styles.couponLabel}>
                    Gift Card Value
                  </span>
                  <div className={`${styles.typeSelect} ${styles.rewardSelect}`}>
                    <WuSelect
                      data={STARBUCKS_GIFT_CARD_VALUE_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedStarbucksValue}
                      placeholder="Select..."
                      onSelect={(item) => {
                        const selected = item as RewardSelectOption | null;
                        if (!selected) return;
                        patchOptions({ starbucksGiftCardValue: selected.value });
                      }}
                      variant="outlined"
                      aria-labelledby="starbucks-gift-card-value-label"
                    />
                  </div>
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="starbucks-gift-card-count" className={styles.couponLabel}>
                    Number of Gift Cards
                  </label>
                  <WuInput
                    id="starbucks-gift-card-count"
                    variant="outlined"
                    value={options.giftCardCount}
                    onChange={(event) => patchOptions({ giftCardCount: event.target.value })}
                  />
                </div>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <div className={styles.couponRow}>
                  <span />
                  <p className={styles.amazonDisclaimer}>{STARBUCKS_GIFT_CARD_DISCLAIMER}</p>
                </div>
                <RewardToggleRow
                  id="email-rewards-to-respondent"
                  label="Email Rewards to Respondent"
                  checked={options.emailRewardsToRespondent}
                  onChange={(emailRewardsToRespondent) =>
                    patchOptions({ emailRewardsToRespondent })
                  }
                />
                <RewardToggleRow
                  id="display-reward-on-thank-you"
                  label="Display Reward on Thank You Page"
                  checked={options.displayRewardOnThankYouPage}
                  onChange={(displayRewardOnThankYouPage) =>
                    patchOptions({ displayRewardOnThankYouPage })
                  }
                />
                <RewardToggleRow
                  id="email-admin-on-each-reward"
                  label="Email Survey Administrator Each Time Reward is Given"
                  checked={options.emailAdminOnEachReward}
                  onChange={(emailAdminOnEachReward) => patchOptions({ emailAdminOnEachReward })}
                />
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
                <GiftCardOrderPanel
                  surveyId={surveyId}
                  rewardId="starbucks"
                  rewardLabel="Starbucks Gift Card"
                  unitValueRaw={options.starbucksGiftCardValue}
                  countRaw={options.giftCardCount}
                />
              </div>
            ) : options.rewardId === 'prepaid-visa' ? (
              <div className={styles.couponForm}>
                <GiftCardFulfillmentNote />
                <div className={styles.couponRow}>
                  <span id="prepaid-visa-gift-card-value-label" className={styles.couponLabel}>
                    Gift Card Value
                  </span>
                  <div className={`${styles.typeSelect} ${styles.rewardSelect}`}>
                    <WuSelect
                      data={PREPAID_VISA_GIFT_CARD_VALUE_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedPrepaidVisaValue}
                      placeholder="Select..."
                      onSelect={(item) => {
                        const selected = item as RewardSelectOption | null;
                        if (!selected) return;
                        patchOptions({ prepaidVisaGiftCardValue: selected.value });
                      }}
                      variant="outlined"
                      aria-labelledby="prepaid-visa-gift-card-value-label"
                    />
                  </div>
                </div>
                <div className={styles.couponRow}>
                  <label htmlFor="prepaid-visa-gift-card-count" className={styles.couponLabel}>
                    Number of Gift Cards
                  </label>
                  <WuInput
                    id="prepaid-visa-gift-card-count"
                    variant="outlined"
                    value={options.giftCardCount}
                    onChange={(event) => patchOptions({ giftCardCount: event.target.value })}
                  />
                </div>
                <RewardPageFields
                  headline={options.rewardPageHeadline}
                  message={options.rewardPageMessage}
                  onHeadlineChange={(rewardPageHeadline) => patchOptions({ rewardPageHeadline })}
                  onMessageChange={(rewardPageMessage) => patchOptions({ rewardPageMessage })}
                  onPreview={() => handlePreview('Reward page')}
                />
                <div className={styles.couponRow}>
                  <span />
                  <p className={styles.amazonDisclaimer}>{PREPAID_VISA_DISCLAIMER}</p>
                </div>
                <PublicContactEmailRow
                  email={options.rewardPublicContactEmail}
                  onChange={(rewardPublicContactEmail) =>
                    patchOptions({ rewardPublicContactEmail })
                  }
                />
                <GiftCardOrderPanel
                  surveyId={surveyId}
                  rewardId="prepaid-visa"
                  rewardLabel="Prepaid Visa Reward"
                  unitValueRaw={options.prepaidVisaGiftCardValue}
                  countRaw={options.giftCardCount}
                />
              </div>
            ) : (
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
            )}
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
                <WarningNotice
                  className={styles.logicWarning}
                  Icon={<span className="wm-warning" aria-hidden />}
                >
                  {REVIEW_PRINT_LOGIC_WARNING}
                </WarningNotice>
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

        <div className={styles.saveActions}>
          <WuButton type="button" onClick={handleSave}>
            Save Changes
          </WuButton>
        </div>
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
