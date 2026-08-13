'use client';

import { useMemo, useState } from 'react';
import { buildConjointPreviewTasks } from '@/data/mock-survey-detail';
import type { ConjointQuestionPreviewSession } from '@/data/survey-question-preview-session';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import { useSurveyPreviewDevice } from '@/components/surveys/SurveyPreviewDeviceContext';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import styles from './ConjointSurveyQuestionPreview.module.css';
import { SurveyPreviewRespondentFooter } from '@/components/surveys/SurveyPreviewRespondentFooter';

const NOT_APPLICABLE_VALUE = 'not-applicable';

interface ConjointSurveyQuestionPreviewProps {
  session: ConjointQuestionPreviewSession;
  onDone?: () => void;
  onClose?: () => void;
}

function SelectedCheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
      <path
        d="M2.5 7l2.6 2.6L10.5 3.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ConjointSurveyQuestionPreview({
  session,
  onDone,
  onClose,
}: ConjointSurveyQuestionPreviewProps) {
  const { surveyId, surveyTitle, questionNumber, questionText, conjoint } = session;
  const device = useSurveyPreviewDevice();
  const isMobile = device === 'mobile';
  const tasks = useMemo(() => buildConjointPreviewTasks(conjoint), [conjoint]);
  const features = conjoint.features;
  const { pageIndex, isLastPage, handleFooterAction } = useSurveyPreviewPagination(
    tasks.length,
    0
  );
  const [selectedByTask, setSelectedByTask] = useState<Record<number, string>>({});

  const task = tasks[pageIndex] ?? { concepts: [] };
  const radioName = `conjoint-task-${pageIndex}`;
  const selectedValue = selectedByTask[pageIndex] ?? '';
  const hasSelection = selectedValue.length > 0;
  const prompt =
    plainTextFromRichValue(questionText).trim() || 'Which of the following would you buy?';
  const progressPct = Math.round(
    ((pageIndex + (hasSelection ? 1 : 0)) / Math.max(tasks.length, 1)) * 100
  );

  function handleSelect(value: string): void {
    setSelectedByTask((prev) => ({ ...prev, [pageIndex]: value }));
  }

  function handleAdvance(): void {
    if (!hasSelection) return;
    handleFooterAction(onDone);
  }

  const conceptChoices = [
    ...task.concepts.map((concept, conceptIndex) => ({
      id: concept.id,
      label: `Option ${conceptIndex + 1}`,
      rows: features.map((feature) => ({
        id: feature.id,
        name: feature.name,
        value: concept.levelsByFeatureId[feature.id] ?? '',
      })),
    })),
    ...(conjoint.notApplicableOption
      ? [
          {
            id: NOT_APPLICABLE_VALUE,
            label: 'Not applicable',
            rows: [{ id: 'na', name: '', value: 'Not applicable' }],
          },
        ]
      : []),
  ];

  if (isMobile) {
    return (
      <div className={`${shellStyles.shell} ${shellStyles.shellMobile}`}>
        <div className={styles.mobileRoot}>
          <div className={styles.mobileProgressTrack} aria-hidden>
            <div
              className={styles.mobileProgressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className={styles.mobileHeader}>
            <div className={styles.mobileMeta}>
              <span className={styles.mobileQuestionLabel}>Question {questionNumber}</span>
              <span className={styles.mobileStep}>
                Step {pageIndex + 1} of {tasks.length}
              </span>
            </div>
            <h1 className={styles.mobilePrompt}>{prompt}</h1>
          </div>

          <div className={styles.mobileCards} role="radiogroup" aria-label={prompt}>
            {conceptChoices.map((choice) => {
              const selected = selectedValue === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={choice.label}
                  className={
                    selected
                      ? `${styles.mobileCard} ${styles.mobileCardSelected}`
                      : styles.mobileCard
                  }
                  onClick={() => handleSelect(choice.id)}
                >
                  <div className={styles.mobileCardBody}>
                    {choice.rows.map((row, rowIndex) =>
                      row.name ? (
                        <div key={row.id || row.value} className={styles.mobileRow}>
                          <span className={styles.mobileRowLabel}>{row.name}</span>
                          <span
                            className={
                              rowIndex === 0
                                ? styles.mobileRowValuePrimary
                                : styles.mobileRowValue
                            }
                          >
                            {row.value}
                          </span>
                        </div>
                      ) : (
                        <span key={row.id || row.value} className={styles.mobileRowValuePrimary}>
                          {row.value}
                        </span>
                      )
                    )}
                  </div>
                  <span className={styles.mobileDot} aria-hidden>
                    {selected ? <SelectedCheckIcon /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.mobileSticky}>
            <button
              type="button"
              className={styles.mobileSubmit}
              disabled={!hasSelection}
              onClick={handleAdvance}
            >
              {isLastPage ? 'Submit' : 'Next'}
            </button>
            <p className={styles.mobilePowered}>
              Powered by <span>QuestionPro</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellStyles.shell}>
      <header className={shellStyles.previewHeader}>
        <span className={shellStyles.previewHeaderTitle}>{surveyTitle}</span>
        <button
          type="button"
          className={shellStyles.previewCloseBtn}
          aria-label="Close preview"
          onClick={onClose}
        >
          <span className="wm-logout" aria-hidden />
        </button>
      </header>

      <div className={`${shellStyles.previewCanvas} ${styles.canvas}`}>
        <div className={`${shellStyles.questionContainer} ${styles.card}`}>
          <div className={styles.taskHeader}>
            <h2 className={styles.questionHeading}>Question {questionNumber}</h2>
            <p className={styles.stepLabel}>
              Step {pageIndex + 1} of {tasks.length}
            </p>
          </div>

          <table className={styles.table}>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.id}>
                  <th scope="row" className={styles.featureCell}>
                    {feature.name}
                  </th>
                  {task.concepts.map((concept) => (
                    <td key={concept.id} className={styles.levelCell}>
                      {concept.levelsByFeatureId[feature.id]}
                    </td>
                  ))}
                  {conjoint.notApplicableOption ? (
                    <td className={styles.levelCell} aria-hidden />
                  ) : null}
                </tr>
              ))}
              <tr>
                <td className={styles.radioCell} />
                {task.concepts.map((concept, conceptIndex) => (
                  <td key={concept.id} className={styles.radioCell}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name={radioName}
                        value={concept.id}
                        checked={selectedValue === concept.id}
                        onChange={() => handleSelect(concept.id)}
                        aria-label={`Option ${conceptIndex + 1}`}
                      />
                    </label>
                  </td>
                ))}
                {conjoint.notApplicableOption ? (
                  <td className={styles.radioCell}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name={radioName}
                        value={NOT_APPLICABLE_VALUE}
                        checked={selectedValue === NOT_APPLICABLE_VALUE}
                        onChange={() => handleSelect(NOT_APPLICABLE_VALUE)}
                        aria-label="Not applicable"
                      />
                    </label>
                  </td>
                ) : null}
              </tr>
            </tbody>
          </table>

          <div className={shellStyles.previewFooter}>
            <button
              type="button"
              className={shellStyles.doneBtn}
              onClick={() => handleFooterAction(onDone)}
            >
              {isLastPage ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <SurveyPreviewRespondentFooter surveyId={surveyId} />
    </div>
  );
}
