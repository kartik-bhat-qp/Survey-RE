'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type {
  DeepDiveAnalysisQuestion,
  DeepDiveQuote,
  DeepDiveTheme,
} from '@/data/mock-deepdive-analysis';
import { getDeepDiveAnalysisData } from '@/data/mock-deepdive-analysis';
import type { SurveyDetail } from '@/data/mock-survey-detail';
import styles from './SurveyDeepDiveAnalysis.module.css';

const QUESTION_SELECT_ACCESSOR = { value: 'value', label: 'label' } as const;

function sentimentLabel(sentiment: DeepDiveTheme['sentiment']): string {
  if (sentiment === 'positive') return 'Positive lean';
  if (sentiment === 'negative') return 'Negative lean';
  return 'Mixed';
}

function quoteToneClass(sentiment: DeepDiveQuote['sentiment']): string {
  if (sentiment === 'positive') return styles.sentimentPositive;
  if (sentiment === 'negative') return styles.sentimentNegative;
  return styles.sentimentMixed;
}

function ThemeExplorer({
  question,
  themes,
  selectedTheme,
  activeQuoteIndex,
  onSelectTheme,
  onPrevQuote,
  onNextQuote,
}: {
  question: DeepDiveAnalysisQuestion;
  themes: DeepDiveTheme[];
  selectedTheme: DeepDiveTheme | null;
  activeQuoteIndex: number;
  onSelectTheme: (themeId: string) => void;
  onPrevQuote: () => void;
  onNextQuote: () => void;
}) {
  const activeQuote = selectedTheme?.quotes[activeQuoteIndex] ?? selectedTheme?.quotes[0] ?? null;

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Themes and representative quotes</h2>
          <p className={styles.cardSubtitle}>
            Text-first DeepDive highlights repeated motivations across follow-up responses.
          </p>
        </div>
      </header>
      <div className={styles.cardBody}>
        <div className={styles.themeExplorer}>
          <div className={styles.themeList}>
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`${styles.themeItem} ${
                  selectedTheme?.id === theme.id ? styles.themeItemActive : ''
                }`}
                onClick={() => onSelectTheme(theme.id)}
              >
                <div className={styles.themeItemHeader}>
                  <div className={styles.themeItemTitleWrap}>
                    <span className={styles.themeItemTitle}>{theme.label}</span>
                    {theme.emerging ? <span className={styles.emergingBadge}>Emerging</span> : null}
                  </div>
                  <span className={`${styles.sentimentPill} ${quoteToneClass(theme.sentiment)}`}>
                    {sentimentLabel(theme.sentiment)}
                  </span>
                </div>
                <p className={styles.themeInsight}>{theme.insight}</p>
                <div className={styles.themeStats}>
                  <span>{theme.mentionCount} mentions</span>
                  <span>{theme.share}% of text responses</span>
                </div>
                <div className={styles.segmentRow}>
                  {theme.segments.map((segment) => (
                    <span key={`${theme.id}-${segment.label}`} className={styles.segmentChip}>
                      {segment.label}: {segment.percent}%
                      {segment.significance === 'up' ? (
                        <span className={styles.significanceUp}>▲</span>
                      ) : null}
                      {segment.significance === 'down' ? (
                        <span className={styles.significanceDown}>▼</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className={styles.themeDetail}>
            {selectedTheme ? (
              <>
                <div className={styles.themeDetailHeader}>
                  <div>
                    <h3 className={styles.themeDetailTitle}>{selectedTheme.label}</h3>
                    <p className={styles.cardSubtitle}>{selectedTheme.insight}</p>
                  </div>
                  <span className={styles.themeCount}>{selectedTheme.quotes.length} quotes</span>
                </div>

                <div className={styles.subthemeWrap}>
                  {selectedTheme.subthemes.map((subtheme) => (
                    <span key={`${selectedTheme.id}-${subtheme.label}`} className={styles.subthemeChip}>
                      {subtheme.label} · {subtheme.mentionCount}
                    </span>
                  ))}
                </div>

                {activeQuote ? (
                  <div className={styles.quoteCard}>
                    <div className={styles.quoteMeta}>
                      <span className={styles.quoteRespondent}>{activeQuote.respondent}</span>
                      <span className={styles.quoteContext}>{activeQuote.optionLabel}</span>
                    </div>
                    <p className={styles.quoteText}>&ldquo;{activeQuote.text}&rdquo;</p>
                    <div className={styles.quoteFooter}>
                      <span className={`${styles.sentimentPill} ${quoteToneClass(activeQuote.sentiment)}`}>
                        {sentimentLabel(activeQuote.sentiment)}
                      </span>
                      <div className={styles.quoteControls}>
                        <button type="button" className={styles.quoteBtn} onClick={onPrevQuote} aria-label="Previous quote">
                          <span className="wm-chevron-left" aria-hidden />
                        </button>
                        <button type="button" className={styles.quoteBtn} onClick={onNextQuote} aria-label="Next quote">
                          <span className="wm-chevron-right" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {question.shouldShowOtherCallout ? (
                  <div className={styles.callout}>
                    Other-style language exceeds 15% of parent responses. The parent answer list may be missing a common response pattern.
                  </div>
                ) : null}
              </>
            ) : (
              <div className={styles.sampleNote}>No matching themes found for this search.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SurveyDeepDiveAnalysis({ detail }: { detail: SurveyDetail }) {
  const wick = useWickUILib();
  const data = useMemo(() => getDeepDiveAnalysisData(detail), [detail]);
  const [themeSearch, setThemeSearch] = useState('');
  const questionOptions = useMemo(
    () =>
      data.questions.map((question) => ({
        value: question.id,
        label: `${question.code} · ${question.title}`,
      })),
    [data.questions]
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(data.questions[0]?.id ?? '');
  const [selectedThemeIdByQuestionId, setSelectedThemeIdByQuestionId] = useState<Record<string, string>>({});
  const [quoteIndexByThemeId, setQuoteIndexByThemeId] = useState<Record<string, number>>({});

  const selectedQuestion =
    data.questions.find((question) => question.id === selectedQuestionId) ?? data.questions[0] ?? null;

  const filteredThemes = useMemo(() => {
    if (!selectedQuestion) return [];
    const term = themeSearch.trim().toLowerCase();
    if (!term) return selectedQuestion.themes;
    return selectedQuestion.themes.filter(
      (theme) =>
        theme.label.toLowerCase().includes(term) ||
        theme.insight.toLowerCase().includes(term) ||
        theme.subthemes.some((subtheme) => subtheme.label.toLowerCase().includes(term))
    );
  }, [selectedQuestion, themeSearch]);

  const selectedThemeId = selectedQuestion
    ? selectedThemeIdByQuestionId[selectedQuestion.id] ?? filteredThemes[0]?.id ?? selectedQuestion.themes[0]?.id ?? ''
    : '';
  const selectedTheme =
    filteredThemes.length === 0
      ? null
      : filteredThemes.find((theme) => theme.id === selectedThemeId) ?? filteredThemes[0] ?? null;

  const selectedOption =
    questionOptions.find((option) => option.value === selectedQuestion?.id) ?? questionOptions[0] ?? null;

  useEffect(() => {
    if (!selectedQuestion) return;
    setThemeSearch('');
  }, [selectedQuestion?.id]);

  if (!wick) {
    return <StandardLoader message="Loading DeepDive Analysis…" />;
  }

  if (!selectedQuestion) {
    return (
      <div className={styles.shell}>
        <div className={styles.main}>
          <div className={styles.emptyState}>
            <EmptyState
              icon="wm-bar-chart"
              title="DeepDive Analysis"
              description="DeepDive Analysis is available for Single Select and Multi Select question types only."
            />
          </div>
        </div>
      </div>
    );
  }

  const { WuInput, WuSelect } = wick;
  const activeQuoteIndex = selectedTheme ? quoteIndexByThemeId[selectedTheme.id] ?? 0 : 0;

  function setQuoteIndex(nextIndex: number) {
    if (!selectedTheme) return;
    const quoteCount = selectedTheme.quotes.length;
    if (!quoteCount) return;
    setQuoteIndexByThemeId((prev) => ({
      ...prev,
      [selectedTheme.id]: (nextIndex + quoteCount) % quoteCount,
    }));
  }

  function handleThemeSelect(themeId: string) {
    setSelectedThemeIdByQuestionId((prev) => ({
      ...prev,
      [selectedQuestion.id]: themeId,
    }));
  }

  return (
    <div className={styles.shell}>
      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>DeepDive Analysis</h1>
            <p className={styles.description}>
              Text-first analysis for DeepDive follow-up responses, with a light parent-question summary for context.
            </p>
          </div>
          <div className={styles.selectorWrap}>
            <WuSelect
              data={questionOptions}
              accessorKey={QUESTION_SELECT_ACCESSOR}
              value={selectedOption}
              onSelect={(option) => {
                if (!option) return;
                setSelectedQuestionId(String((option as { value: string }).value));
              }}
              variant="outlined"
              className={styles.selector}
            />
          </div>
        </div>

        <section className={`${styles.card} ${styles.hero}`}>
          <div>
            <h2 className={styles.heroTitle}>
              {selectedQuestion.code} · {selectedQuestion.title}
            </h2>
            <div className={styles.heroMeta}>
              <span className={styles.pill}>
                {selectedQuestion.kind === 'multi-select' ? 'Multi Select' : 'Single Select'}
              </span>
              <span>n={selectedQuestion.sampleSize}</span>
            </div>
            <div className={styles.summaryNote}>
              {selectedQuestion.topLineSummary}
            </div>
            {selectedQuestion.sampleTooSmall ? (
              <div className={styles.callout}>
                Sample size is below 30, so the panel emphasizes repeated themes and direct quotes over segment significance.
              </div>
            ) : null}
          </div>
          <div className={styles.metricGrid}>
            {selectedQuestion.metrics.map((metric) => (
              <div key={metric.label} className={styles.metricCard}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <span className={styles.metricValue}>{metric.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Parent question context</h2>
              <p className={styles.cardSubtitle}>{selectedQuestion.parentDistributionLabel}</p>
            </div>
          </header>
          <div className={styles.cardBody}>
            <div className={styles.parentSummaryGrid}>
              <div className={styles.parentMixPanel}>
                {selectedQuestion.parentAnswerMix.map((row) => (
                  <div key={row.label} className={styles.parentMixRow}>
                    <div className={styles.parentMixCopy}>
                      <span className={styles.parentMixLabel}>{row.label}</span>
                      <span className={styles.parentMixValue}>
                        {row.percent}% ({row.count})
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${row.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.parentNarrative}>
                {selectedQuestion.summarySections.map((section) => (
                  <section key={section.heading} className={styles.narrativeSection}>
                    <h3 className={styles.sectionTitle}>{section.heading}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className={styles.narrativeParagraph}>
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets?.length ? (
                      <ul className={styles.narrativeList}>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Theme explorer</h2>
              <p className={styles.cardSubtitle}>Search the recurring ideas surfacing in DeepDive follow-ups.</p>
            </div>
          </header>
          <div className={styles.cardBody}>
            <WuInput
              variant="outlined"
              placeholder="Search themes or subthemes"
              Icon={<span className="wm-search" />}
              iconPosition="left"
              value={themeSearch}
              onChange={(event) => setThemeSearch(event.target.value)}
              className={styles.searchInput}
            />
          </div>
        </section>

        <ThemeExplorer
          question={selectedQuestion}
          themes={filteredThemes}
          selectedTheme={selectedTheme}
          activeQuoteIndex={activeQuoteIndex}
          onSelectTheme={handleThemeSelect}
          onPrevQuote={() => setQuoteIndex(activeQuoteIndex - 1)}
          onNextQuote={() => setQuoteIndex(activeQuoteIndex + 1)}
        />

        <div className={styles.supportGrid}>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Sentiment mix</h2>
                <p className={styles.cardSubtitle}>Theme-coded tone across follow-up responses</p>
              </div>
            </header>
            <div className={styles.cardBody}>
              {[
                { label: 'Positive', value: selectedQuestion.sentiment.positive, toneClass: styles.sentimentPositive },
                { label: 'Mixed', value: selectedQuestion.sentiment.mixed, toneClass: styles.sentimentMixed },
                { label: 'Negative', value: selectedQuestion.sentiment.negative, toneClass: styles.sentimentNegative },
              ].map((row) => (
                <div key={row.label} className={styles.metricBarRow}>
                  <div className={styles.parentMixCopy}>
                    <span className={styles.parentMixLabel}>{row.label}</span>
                    <span className={styles.parentMixValue}>{row.value}%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={`${styles.barFill} ${row.toneClass}`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Response depth</h2>
                <p className={styles.cardSubtitle}>How detailed respondents get in follow-up text</p>
              </div>
            </header>
            <div className={styles.cardBody}>
              {selectedQuestion.responseLength.map((bucket) => (
                <div key={bucket.label} className={styles.metricBarRow}>
                  <div className={styles.parentMixCopy}>
                    <span className={styles.parentMixLabel}>{bucket.label}</span>
                    <span className={styles.parentMixValue}>
                      {bucket.percent}% ({bucket.count})
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${bucket.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Probe path summary</h2>
              <p className={styles.cardSubtitle}>Where the follow-up conversation tends to go next</p>
            </div>
          </header>
          <div className={styles.cardBody}>
            <div className={styles.probePathGrid}>
              {selectedQuestion.probePaths.map((path) => (
                <article key={path.label} className={styles.pathCard}>
                  <div className={styles.pathShare}>{path.share}%</div>
                  <h3 className={styles.pathTitle}>{path.label}</h3>
                  <p className={styles.pathDescription}>{path.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
