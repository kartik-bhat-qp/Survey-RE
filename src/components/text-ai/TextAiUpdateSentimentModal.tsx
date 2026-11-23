'use client';

import { useId, useMemo, useState } from 'react';
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
type SentimentSummary = TextAiAssignedSentiment | 'mixed';
const MIXED_SENTIMENT_OPTION = { value: 'mixed', label: 'Mixed' } as const;

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

function summarizeSentiments(sentiments: SentimentSummary[]): SentimentSummary | null {
  const unique = new Set(sentiments);
  return unique.size > 1 ? 'mixed' : sentiments[0] ?? null;
}

function summarizeResponseSentiment(
  response: TextAiSentimentEditableResponse,
  draft: TextAiSentimentDraft
): SentimentSummary {
  const subthemeSentiments = response.subthemes.map(({ id, sentiment }) =>
    draft.subthemeSentiments[id] ?? sentiment
  );
  return summarizeSentiments(subthemeSentiments) ?? draft.responseSentiment ?? response.responseSentiment;
}

function getSummaryOption(value: SentimentSummary | null) {
  return value === 'mixed' ? MIXED_SENTIMENT_OPTION : findSentimentOption(value);
}

function assignResponseSentiment(
  response: TextAiSentimentEditableResponse,
  sentiment: TextAiAssignedSentiment
): TextAiSentimentDraft {
  return {
    responseSentiment: sentiment,
    subthemeSentiments: Object.fromEntries(
      response.subthemes.map(({ id }) => [id, sentiment])
    ),
  };
}

function formatCount(count: number, noun: string): string {
  return `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;
}

export function TextAiUpdateSentimentModal({
  open,
  onOpenChange,
  onSave,
  responses,
}: TextAiUpdateSentimentModalProps) {
  const wick = useWickUILib();
  const initialDrafts = useMemo(() => buildDrafts(responses), [responses]);
  const confirmationDescriptionId = useId();
  const [reviewPage, setReviewPage] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, TextAiSentimentDraft>>(
    () => initialDrafts
  );
  const [bulkSelectedResponseIds, setBulkSelectedResponseIds] = useState<Set<number>>(
    () => new Set()
  );
  const [bulkChangedResponseIds, setBulkChangedResponseIds] = useState<Set<number>>(
    () => new Set()
  );
  const [confirmingBulkSave, setConfirmingBulkSave] = useState(false);

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
  const bulkSummary = useMemo(() => {
    if (!bulkChangeEnabled) return null;
    const selectedSentiments = responses
      .filter(({ id }) => bulkSelectedResponseIds.has(id))
      .map(response => summarizeResponseSentiment(
        response,
        drafts[response.id] ?? initialDrafts[response.id]
      ));
    return summarizeSentiments(selectedSentiments);
  }, [bulkChangeEnabled, bulkSelectedResponseIds, drafts, initialDrafts, responses]);

  const { changedDrafts, subthemeChanges, selectedSubthemeChanges, hasBulkChanges } = useMemo(() => {
    const changedDrafts: Record<number, TextAiSentimentDraft> = {};
    let subthemeChanges = 0;
    let selectedSubthemeChanges = 0;
    let hasBulkChanges = false;
    responses.forEach((response) => {
      const initial = initialDrafts[response.id];
      const current = drafts[response.id];
      if (!current || current === initial) return;
      const changes = response.subthemes.filter(({ id }) =>
        initial.subthemeSentiments[id] !== current.subthemeSentiments[id]
      ).length;
      subthemeChanges += changes;
      if (bulkSelectedResponseIds.has(response.id)) selectedSubthemeChanges += changes;
      if (changes || initial.responseSentiment !== current.responseSentiment) {
        changedDrafts[response.id] = current;
        if (bulkChangedResponseIds.has(response.id)) hasBulkChanges = true;
      }
    });
    return { changedDrafts, subthemeChanges, selectedSubthemeChanges, hasBulkChanges };
  }, [bulkChangedResponseIds, bulkSelectedResponseIds, drafts, initialDrafts, responses]);
  const responseChanges = Object.keys(changedDrafts).length;

  if (!open || !wick) return null;

  const {
    WuButton,
    WuModal,
    WuModalContent,
    WuModalFooter,
    WuModalHeader,
    WuSelect,
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
      [response.id]: assignResponseSentiment(response, sentiment),
    }));
  }

  function updateSubthemeSentiment(
    responseId: number,
    subthemeId: string,
    sentiment: TextAiAssignedSentiment
  ): void {
    setDrafts((current) => {
      const draft = current[responseId] ?? initialDrafts[responseId];
      if (draft.subthemeSentiments[subthemeId] === sentiment) return current;
      return {
        ...current,
        [responseId]: {
          responseSentiment: null,
          subthemeSentiments: {
            ...draft.subthemeSentiments,
            [subthemeId]: sentiment,
          },
        },
      };
    });
  }

  function updateBulkSentiment(sentiment: TextAiAssignedSentiment): void {
    const affectedResponses = responses.filter(response =>
      bulkSelectedResponseIds.has(response.id) &&
      summarizeResponseSentiment(response, drafts[response.id] ?? initialDrafts[response.id]) !== sentiment
    );
    if (affectedResponses.length === 0) return;

    setDrafts(current => ({
      ...current,
      ...Object.fromEntries(affectedResponses.map(response => [
        response.id, assignResponseSentiment(response, sentiment),
      ])),
    }));
    setBulkChangedResponseIds(current => new Set([
      ...current, ...affectedResponses.map(({ id }) => id),
    ]));
  }

  function reviewSave(): void {
    if (hasBulkChanges) {
      setConfirmingBulkSave(true);
    } else {
      onSave(changedDrafts);
    }
  }

  return (
    <>
      <WuModal open onOpenChange={onOpenChange} size="lg" className={styles.modal}>
      <WuModalHeader className={styles.modalTitle}>Update sentiment</WuModalHeader>
      <WuModalContent className={styles.content}>
        <section className={styles.reviewSection} aria-label="Response assignments">
          <div className={styles.reviewControls}>
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
              const responseSelected = bulkSelectedResponseIds.has(response.id);
              return (
                <article
                  key={response.id}
                  className={`${styles.responseCard} ${
                    responseSelected ? styles.responseCardSelected : ''
                  }`}
                  onClick={() => toggleResponseSelection(response.id)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
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
                      className={styles.sentimentControl}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <WuSelect
                        aria-label={`Response ${response.id} sentiment`}
                        data={TEXT_AI_SENTIMENT_OPTIONS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={getSummaryOption(summarizeResponseSentiment(response, draft))}
                        placeholder="Select sentiment"
                        onSelect={(option) => {
                          if (option && !Array.isArray(option)) {
                            updateResponseSentiment(response, (option as SentimentOption).value);
                          }
                        }}
                        variant="outlined"
                        className={styles.sentimentSelect}
                      />
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
                        return (
                          <div className={styles.subthemeRow} key={subtheme.id}>
                            <span className={styles.subthemeName}>{subtheme.label}</span>
                            <span
                              className={styles.sentimentControl}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <WuSelect
                                aria-label={`${subtheme.label} sentiment`}
                                data={TEXT_AI_SENTIMENT_OPTIONS}
                                accessorKey={{ value: 'value', label: 'label' }}
                                value={findSentimentOption(sentiment)}
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
                                className={styles.sentimentSelect}
                              />
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

        {bulkChangeEnabled && (
          <div className={styles.bulkRow}>
            <div className={styles.bulkDetails}>
              <strong>Bulk update sentiment</strong>
              <span aria-live="polite">
                {formatCount(bulkSelectedResponseIds.size, 'response')} selected ·{' '}
                {formatCount(selectedSubthemeChanges, 'sub-theme change')}
              </span>
            </div>
            <WuSelect
              aria-label="Bulk update sentiment"
              data={TEXT_AI_SENTIMENT_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={getSummaryOption(bulkSummary)}
              placeholder="Select sentiment"
              onSelect={(option) => {
                if (option && !Array.isArray(option)) {
                  updateBulkSentiment((option as SentimentOption).value);
                }
              }}
              variant="outlined"
              className={styles.sentimentSelect}
            />
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </WuButton>
        <WuButton
          disabled={responseChanges === 0}
          onClick={reviewSave}
        >
          Save changes
        </WuButton>
      </WuModalFooter>
    </WuModal>
    <WuModal
      open={confirmingBulkSave}
      onOpenChange={setConfirmingBulkSave}
      size="sm"
      aria-describedby={confirmationDescriptionId}
    >
      <WuModalHeader className={styles.modalTitle}>Confirm bulk sentiment update</WuModalHeader>
      <WuModalContent>
        <p id={confirmationDescriptionId} className={styles.confirmationMessage}>
          Saving will update sentiment for <strong>{formatCount(responseChanges, 'response')}</strong>{' '}
          and change <strong>{formatCount(subthemeChanges, 'sub-theme assignment')}</strong>.
        </p>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="secondary" onClick={() => setConfirmingBulkSave(false)}>Back</WuButton>
        <WuButton onClick={() => onSave(changedDrafts)}>Confirm update</WuButton>
      </WuModalFooter>
    </WuModal>
    </>
  );
}
