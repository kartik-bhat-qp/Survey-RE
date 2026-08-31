'use client';

import { useMemo, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './TextAiUpdateSentimentModal.module.css';

export type TextAiAssignedSentiment =
  | 'very-negative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'very-positive';

export interface TextAiSentimentSubtheme {
  id: string;
  label: string;
  sentiment: TextAiAssignedSentiment;
}

export interface TextAiSentimentEditableResponse {
  id: number;
  responseSentiment: TextAiAssignedSentiment;
  responseSentimentOverride: TextAiAssignedSentiment | null;
  subthemes: TextAiSentimentSubtheme[];
  text: string;
}

export const TEXT_AI_SENTIMENT_OPTIONS: Array<{
  value: TextAiAssignedSentiment;
  label: string;
}> = [
  { value: 'very-negative', label: 'Very negative' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'positive', label: 'Positive' },
  { value: 'very-positive', label: 'Very positive' },
];

type SentimentOption = (typeof TEXT_AI_SENTIMENT_OPTIONS)[number];

export interface TextAiSentimentDraft {
  responseSentiment: TextAiAssignedSentiment | null;
  subthemeSentiments: Record<string, TextAiAssignedSentiment>;
}

interface TextAiUpdateSentimentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (drafts: Record<number, TextAiSentimentDraft>) => void;
  responses: TextAiSentimentEditableResponse[];
}

const REVIEW_PAGE_SIZE = 10;
const SUBTHEME_OVERRIDE_TOOLTIP =
  'Reset response-level sentiment to apply sub-theme-level sentiment for this response.';

export function getSentimentLabel(sentiment: TextAiAssignedSentiment): string {
  return (
    TEXT_AI_SENTIMENT_OPTIONS.find((option) => option.value === sentiment)?.label ??
    'Neutral'
  );
}

export function getSentimentIcon(sentiment: TextAiAssignedSentiment): string {
  if (sentiment === 'very-negative') return 'wm-sentiment-very-dissatisfied';
  if (sentiment === 'negative') return 'wm-sentiment-dissatisfied';
  if (sentiment === 'positive') return 'wm-sentiment-satisfied';
  if (sentiment === 'very-positive') return 'wm-sentiment-very-satisfied';
  return 'wm-sentiment-neutral';
}

function buildDrafts(
  responses: TextAiSentimentEditableResponse[]
): Record<number, TextAiSentimentDraft> {
  return Object.fromEntries(
    responses.map((response) => [
      response.id,
      {
        responseSentiment: response.responseSentimentOverride,
        subthemeSentiments: Object.fromEntries(
          response.subthemes.map((subtheme) => [subtheme.id, subtheme.sentiment])
        ),
      },
    ])
  );
}

function findSentimentOption(
  value: TextAiAssignedSentiment | null
): SentimentOption | null {
  if (!value) return null;
  return (
    TEXT_AI_SENTIMENT_OPTIONS.find((option) => option.value === value) ?? null
  );
}

export function TextAiUpdateSentimentModal({
  open,
  onOpenChange,
  onSave,
  responses,
}: TextAiUpdateSentimentModalProps) {
  const wick = useWickUILib();
  const initialDrafts = useMemo(() => buildDrafts(responses), [responses]);
  const [bulkSentiment, setBulkSentiment] = useState<SentimentOption | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, TextAiSentimentDraft>>(
    () => initialDrafts
  );
  const [bulkSelectedResponseIds, setBulkSelectedResponseIds] = useState<Set<number>>(
    () => new Set(responses.map((response) => response.id))
  );

  const reviewPageCount = Math.max(
    1,
    Math.ceil(responses.length / REVIEW_PAGE_SIZE)
  );
  const safeReviewPage = Math.min(reviewPage, reviewPageCount - 1);
  const reviewResponses = useMemo(
    () =>
      responses.slice(
        safeReviewPage * REVIEW_PAGE_SIZE,
        (safeReviewPage + 1) * REVIEW_PAGE_SIZE
      ),
    [responses, safeReviewPage]
  );
  const reviewStart =
    responses.length === 0 ? 0 : safeReviewPage * REVIEW_PAGE_SIZE + 1;
  const reviewEnd = Math.min(
    (safeReviewPage + 1) * REVIEW_PAGE_SIZE,
    responses.length
  );
  const allResponsesSelected =
    responses.length > 0 && bulkSelectedResponseIds.size === responses.length;
  const someResponsesSelected =
    bulkSelectedResponseIds.size > 0 && !allResponsesSelected;
  const bulkChangeEnabled = bulkSelectedResponseIds.size > 1;

  const changeStats = useMemo(() => {
    let subthemeChanges = 0;
    responses.forEach((response) => {
      const initial = initialDrafts[response.id];
      const current = drafts[response.id];
      if (!initial || !current) return;
      response.subthemes.forEach((subtheme) => {
        if (
          initial.subthemeSentiments[subtheme.id] !==
          current.subthemeSentiments[subtheme.id]
        ) {
          subthemeChanges += 1;
        }
      });
    });
    return { subthemeChanges };
  }, [drafts, initialDrafts, responses]);

  if (!open || !wick) return null;

  const {
    WuButton,
    WuModal,
    WuModalContent,
    WuModalFooter,
    WuModalHeader,
    WuSelect,
    WuTooltip,
  } = wick;

  function toggleResponseSelection(responseId: number): void {
    setBulkSelectedResponseIds((current) => {
      const next = new Set(current);
      if (next.has(responseId)) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  }

  function toggleAllResponses(checked: boolean): void {
    setBulkSelectedResponseIds(
      checked ? new Set(responses.map((response) => response.id)) : new Set()
    );
  }

  function updateResponseSentiment(
    response: TextAiSentimentEditableResponse,
    sentiment: TextAiAssignedSentiment
  ): void {
    setDrafts((current) => ({
      ...current,
      [response.id]: {
        ...current[response.id],
        responseSentiment: sentiment,
        subthemeSentiments: Object.fromEntries(
          response.subthemes.map((subtheme) => [subtheme.id, sentiment])
        ),
      },
    }));
  }

  function resetResponseSentiment(
    response: TextAiSentimentEditableResponse
  ): void {
    setDrafts((current) => ({
      ...current,
      [response.id]: {
        responseSentiment: null,
        subthemeSentiments: Object.fromEntries(
          response.subthemes.map((subtheme) => [subtheme.id, subtheme.sentiment])
        ),
      },
    }));
  }

  function updateSubthemeSentiment(
    responseId: number,
    subthemeId: string,
    sentiment: TextAiAssignedSentiment
  ): void {
    setDrafts((current) => ({
      ...current,
      [responseId]: {
        ...current[responseId],
        subthemeSentiments: {
          ...current[responseId]?.subthemeSentiments,
          [subthemeId]: sentiment,
        },
      },
    }));
  }

  function applyBulkSentiment(): void {
    if (!bulkSentiment || !bulkChangeEnabled) return;
    setDrafts((current) => {
      const next = { ...current };
      responses.forEach((response) => {
        if (!bulkSelectedResponseIds.has(response.id)) return;
        next[response.id] = {
          ...next[response.id],
          responseSentiment: bulkSentiment.value,
          subthemeSentiments: Object.fromEntries(
            response.subthemes.map((subtheme) => [
              subtheme.id,
              bulkSentiment.value,
            ])
          ),
        };
      });
      return next;
    });
  }

  return (
      <WuModal open onOpenChange={onOpenChange} size="lg" className={styles.modal}>
      <WuModalHeader className={styles.modalTitle}>Update sentiment</WuModalHeader>
      <WuModalContent className={styles.content}>
        <section className={styles.reviewSection} aria-labelledby="review-sentiment-heading">
          <div className={styles.reviewHeadingRow}>
            <div className={styles.reviewHeading}>
              <h3 id="review-sentiment-heading">Review individual assignments</h3>
              <label className={styles.modalSelectAll}>
                <input
                  type="checkbox"
                  ref={(input) => {
                    if (input) input.indeterminate = someResponsesSelected;
                  }}
                  checked={allResponsesSelected}
                  onChange={(event) => toggleAllResponses(event.target.checked)}
                />
                <span>
                  Select all ({responses.length.toLocaleString()} responses)
                </span>
              </label>
            </div>
            <nav className={styles.reviewPagination} aria-label="Selected responses pages">
              <span>
                {reviewStart.toLocaleString()}–{reviewEnd.toLocaleString()} of{' '}
                {responses.length.toLocaleString()}
              </span>
              <WuButton
                variant="iconOnly"
                size="sm"
                aria-label="Previous selected responses"
                Icon={<span className="wm-chevron-left" />}
                disabled={safeReviewPage === 0}
                onClick={() => setReviewPage((current) => Math.max(0, current - 1))}
              />
              <WuButton
                variant="iconOnly"
                size="sm"
                aria-label="Next selected responses"
                Icon={<span className="wm-chevron-right" />}
                disabled={safeReviewPage >= reviewPageCount - 1}
                onClick={() =>
                  setReviewPage((current) =>
                    Math.min(reviewPageCount - 1, current + 1)
                  )
                }
              />
            </nav>
          </div>

          <div
            className={styles.responseList}
            role="region"
            aria-label="Scrollable response sentiment assignments"
          >
            {reviewResponses.map((response) => {
              const draft = drafts[response.id] ?? initialDrafts[response.id];
              const hasResponseOverride = draft.responseSentiment !== null;
              const responseSelected = bulkSelectedResponseIds.has(response.id);
              return (
                <article
                  key={response.id}
                  className={`${styles.responseCard} ${
                    responseSelected ? styles.responseCardSelected : ''
                  }`}
                  onClick={() => toggleResponseSelection(response.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleResponseSelection(response.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Response ${response.id}. ${
                    responseSelected ? 'Selected' : 'Not selected'
                  } for bulk change.`}
                >
                  <div className={styles.responseHeader}>
                    <div className={styles.responseIdentity}>
                      <input
                        type="checkbox"
                        aria-label={`Select response ${response.id} for bulk change`}
                        checked={responseSelected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleResponseSelection(response.id)}
                      />
                      <div>
                        <span className={styles.responseId}>
                          Response {response.id.toLocaleString()}
                        </span>
                        <p>{response.text}</p>
                      </div>
                    </div>
                    <div
                      className={styles.responseSentimentControl}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <label
                        className={`${styles.field} ${styles.responseSentimentField}`}
                      >
                        <span>Response sentiment</span>
                        <WuSelect
                          data={TEXT_AI_SENTIMENT_OPTIONS}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={findSentimentOption(draft.responseSentiment)}
                          placeholder="Select sentiment"
                          onSelect={(option) => {
                            if (option && !Array.isArray(option)) {
                              updateResponseSentiment(
                                response,
                                (option as SentimentOption).value
                              );
                            }
                          }}
                          variant="outlined"
                        />
                      </label>
                      <WuButton
                        variant="link"
                        size="sm"
                        disabled={!hasResponseOverride}
                        onClick={() => resetResponseSentiment(response)}
                      >
                        Reset
                      </WuButton>
                    </div>
                  </div>

                  <div className={styles.subthemeAssignments}>
                    <span className={styles.assignmentLabel}>
                      Assigned sub-themes
                    </span>
                    {response.subthemes.length > 0 ? (
                      response.subthemes.map((subtheme) => {
                        const sentiment =
                          draft.subthemeSentiments[subtheme.id] ?? subtheme.sentiment;
                        const subthemeSelect = (
                          <WuSelect
                            aria-label={`${subtheme.label} sentiment`}
                            data={TEXT_AI_SENTIMENT_OPTIONS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={findSentimentOption(sentiment)}
                            disabled={hasResponseOverride}
                            onSelect={(option) => {
                              if (option && !Array.isArray(option)) {
                                updateSubthemeSentiment(
                                  response.id,
                                  subtheme.id,
                                  (option as SentimentOption).value
                                );
                              }
                            }}
                            variant="outlined"
                            className={styles.subthemeSelect}
                          />
                        );
                        return (
                          <div className={styles.subthemeRow} key={subtheme.id}>
                            <span className={styles.subthemeName}>{subtheme.label}</span>
                            <span
                              className={styles.subthemeControl}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {hasResponseOverride ? (
                                <WuTooltip
                                  content={SUBTHEME_OVERRIDE_TOOLTIP}
                                  position="top"
                                >
                                  <span
                                    className={styles.disabledSubthemeControl}
                                    tabIndex={0}
                                    title={SUBTHEME_OVERRIDE_TOOLTIP}
                                  >
                                    {subthemeSelect}
                                  </span>
                                </WuTooltip>
                              ) : (
                                subthemeSelect
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className={styles.noSubthemes}>No sub-themes assigned</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.bulkBar} aria-label="Bulk sentiment change">
          <div className={styles.changeStats} aria-live="polite">
            <span>
              <strong>{bulkSelectedResponseIds.size.toLocaleString()}</strong> selected
            </span>
            <span>
              <strong>{changeStats.subthemeChanges.toLocaleString()}</strong> sub-theme
              changes
            </span>
          </div>
          <div className={styles.bulkControls}>
            <label className={styles.bulkSentimentField}>
              <span className={styles.srOnly}>Bulk sentiment</span>
              <WuSelect
                aria-label="Bulk sentiment"
                data={TEXT_AI_SENTIMENT_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={bulkSentiment}
                placeholder="Select sentiment"
                disabled={!bulkChangeEnabled}
                onSelect={(option) => {
                  if (option && !Array.isArray(option)) {
                    setBulkSentiment(option as SentimentOption);
                  }
                }}
                variant="outlined"
              />
            </label>
            <WuButton
              disabled={!bulkChangeEnabled || !bulkSentiment}
              onClick={applyBulkSentiment}
            >
              Apply
            </WuButton>
          </div>
        </section>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </WuButton>
        <WuButton onClick={() => onSave(drafts)}>Save changes</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
