'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatSmartDate } from '@/data/mock-utils';
import { getSurveyDetail, type SurveyQuestion, type SurveySection } from '@/data/mock-survey-detail';
import {
  DEFAULT_SURVEY_APPROVAL_STATE,
  applySurveyReviewDecision,
  getSurveyApprovalStatusLabel,
  readSurveyApprovalState,
  subscribeSurveyApprovalState,
  surveyHasApprovalTab,
  type SurveyApprovalState,
} from '@/data/mock-survey-approval';
import {
  getSurveyEditorSectionsStorageKey,
  readPersistedSurveyEditorValue,
} from '@/data/survey-editor-persistence';
import type { Survey } from '@/data/mock-surveys';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import styles from './SurveyReviewerView.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface SurveyReviewerViewProps {
  survey: Survey;
}

function loadReviewSections(survey: Survey): SurveySection[] {
  const persisted = readPersistedSurveyEditorValue<SurveySection[]>(
    getSurveyEditorSectionsStorageKey(survey.id)
  );
  if (Array.isArray(persisted) && persisted.length > 0) return persisted;
  return getSurveyDetail(survey).sections;
}

function questionOptions(question: SurveyQuestion): string[] {
  if (question.options.length > 0) {
    return question.options.map((option) => option.label).filter(Boolean);
  }
  if (question.nps) {
    return [question.nps.leftAnchor, question.nps.rightAnchor].filter(Boolean);
  }
  return [];
}

export function SurveyReviewerView({ survey }: SurveyReviewerViewProps) {
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<SurveyApprovalState>(DEFAULT_SURVEY_APPROVAL_STATE);
  const [comments, setComments] = useState('');
  const [sections, setSections] = useState<SurveySection[]>([]);
  const surveyName = getSurveyEditorTitle(survey);
  const reviewerName = state.currentRequest?.reviewerName ?? 'Reviewer';
  const canDecide = state.status === 'pending' && Boolean(state.currentRequest);

  useEffect(() => {
    setState(readSurveyApprovalState(survey.id));
    setSections(loadReviewSections(survey));
    return subscribeSurveyApprovalState(survey.id, setState);
  }, [survey]);

  const questionCount = useMemo(
    () => sections.reduce((count, section) => count + section.questions.length, 0),
    [sections]
  );

  function handleDecision(decision: 'approved' | 'rejected'): void {
    const trimmed = comments.trim();
    if (decision === 'rejected' && !trimmed) {
      showToast({ message: 'Add a comment before rejecting this survey', variant: 'error' });
      return;
    }

    applySurveyReviewDecision(survey.id, decision, trimmed);
    showToast({
      message:
        decision === 'approved' ? 'Survey approved and published' : 'Survey rejected',
      variant: 'success',
    });
  }

  if (!surveyHasApprovalTab(survey.id)) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>
          <EmptyState
            icon="wm-assignment-turned-in"
            title="Review is not available"
            description="This survey is not part of the review prototype."
          />
        </div>
      </div>
    );
  }

  if (state.status === 'approved' || state.status === 'rejected') {
    const approved = state.status === 'approved';
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <p className={styles.eyebrow}>Survey review</p>
            <h1 className={styles.title}>{surveyName}</h1>
          </div>
          <span className={styles.reviewerChip}>Reviewed as {reviewerName}</span>
        </header>
        <div className={styles.body}>
          <section className={styles.panel}>
            <div className={styles.result}>
              <h2 className={styles.resultTitle}>
                {approved ? 'Survey approved and published' : 'Survey rejected'}
              </h2>
              <p className={styles.resultCopy}>
                {approved
                  ? 'The survey owner can now collect responses. You can close this page.'
                  : 'The survey owner has been notified and can send it for review again after making changes.'}
              </p>
              {state.reviewerFeedback ? (
                <p className={styles.notes}>{state.reviewerFeedback}</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!canDecide) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <p className={styles.eyebrow}>Survey review</p>
            <h1 className={styles.title}>{surveyName}</h1>
          </div>
        </header>
        <div className={styles.empty}>
          <EmptyState
            icon="wm-assignment-turned-in"
            title="Nothing to review"
            description="This survey has not been sent for review, or the request was cancelled."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <p className={styles.eyebrow}>Survey review</p>
          <h1 className={styles.title}>{surveyName}</h1>
        </div>
        <span className={styles.reviewerChip}>Reviewing as {reviewerName}</span>
      </header>

      <div className={styles.body}>
        <section className={styles.panel} aria-label="Survey content">
          <div>
            <h2 className={styles.surveyName}>{surveyName}</h2>
            <p className={styles.hint}>
              {questionCount} question{questionCount === 1 ? '' : 's'} · Review the entire survey
              before you approve or reject it.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.id} className={styles.block}>
              <h3 className={styles.blockTitle}>{section.title || 'Untitled block'}</h3>
              {section.questions.map((question) => {
                const options = questionOptions(question);
                return (
                  <article key={question.id} className={styles.question}>
                    <div className={styles.questionHead}>
                      <span className={styles.questionCode}>{question.code}</span>
                      <p className={styles.questionText}>
                        {question.text}
                        {question.required ? <span className={styles.required}>*</span> : null}
                      </p>
                    </div>
                    {options.length > 0 ? (
                      <ul className={styles.options}>
                        {options.map((option) => (
                          <li key={option}>{option}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ))}
        </section>

        <aside className={styles.decision} aria-label="Review decision">
          <h2 className={styles.sectionTitle}>Your decision</h2>
          <span className={styles.hint}>
            Status: {getSurveyApprovalStatusLabel(state.status)}
          </span>
          <dl className={styles.metaList}>
            <div>
              <dt>Requested by</dt>
              <dd>{state.currentRequest?.submittedBy}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>
                {state.currentRequest
                  ? formatSmartDate(state.currentRequest.submittedAt)
                  : '—'}
              </dd>
            </div>
          </dl>
          {state.currentRequest?.notes ? (
            <p className={styles.notes}>{state.currentRequest.notes}</p>
          ) : (
            <p className={styles.hint}>No additional notes were included.</p>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Comments</span>
            <textarea
              className={styles.textarea}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Add comments for the survey owner. Required if you reject the survey."
            />
            <p className={styles.hint}>Optional for approve. Required for reject.</p>
          </label>

          <div className={styles.actions}>
            <WuButton
              color="error"
              disabled={!comments.trim()}
              onClick={() => handleDecision('rejected')}
            >
              Reject
            </WuButton>
            <WuButton onClick={() => handleDecision('approved')}>Approve</WuButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
