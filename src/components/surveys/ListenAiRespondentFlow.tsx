'use client';

import { useState } from 'react';
import type { ListenAiPreviewPayload } from '@/data/mock-listenai-question';
import { LISTENAI_INTERVIEW_TYPE_OPTIONS } from '@/data/mock-listenai-studies';
import { ListenAIConversationScreen } from '@/components/surveys/ListenAIConversationScreen';
import { ListenAIHandoffScreen } from '@/components/surveys/ListenAIHandoffScreen';
import { SurveyPreviewRespondentFooter } from '@/components/surveys/SurveyPreviewRespondentFooter';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import type { SurveyPreviewAnswer } from '@/data/evaluate-preview-criteria';

interface ListenAiRespondentFlowProps {
  payload: ListenAiPreviewPayload | null;
  selectedAnswerLabel: string;
  surveyId: number;
  surveyTitle: string;
  onComplete: () => void;
  onClose?: () => void;
}

function interviewTypeLabel(value: string): string {
  return (
    LISTENAI_INTERVIEW_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Conversation'
  );
}

export function findListenAiOnPage(
  questions: SurveyQuestionPreviewFollowUp[]
): SurveyQuestionPreviewFollowUp | undefined {
  return questions.find((question) => question.kind === 'listenai');
}

export function resolveListenAiAnswerLabel(
  payload: ListenAiPreviewPayload | null | undefined,
  answersByCode: Record<string, SurveyPreviewAnswer>
): string {
  const sourceCode = payload?.study.sourceQuestionCode;
  if (sourceCode && answersByCode[sourceCode]?.selectedLabels[0]) {
    return answersByCode[sourceCode].selectedLabels[0];
  }
  for (const answer of Object.values(answersByCode)) {
    if (answer.selectedLabels[0]) return answer.selectedLabels[0];
  }
  return payload?.study.sourceQuestionText?.trim() || 'your previous answer';
}

export function ListenAiRespondentFlow({
  payload,
  selectedAnswerLabel,
  surveyId,
  surveyTitle,
  onComplete,
  onClose,
}: ListenAiRespondentFlowProps) {
  const [phase, setPhase] = useState<'handoff' | 'interview'>('handoff');

  if (payload && phase === 'interview') {
    return (
      <ListenAIConversationScreen
        study={payload.study}
        selectedAnswerLabel={selectedAnswerLabel}
        onComplete={onComplete}
      />
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

      <div className={shellStyles.previewCanvas}>
        <div className={shellStyles.questionContainer}>
          <ListenAIHandoffScreen
            studyTitle={payload?.study.title ?? 'ListenAI'}
            interviewTypeLabel={interviewTypeLabel(payload?.study.interviewType ?? 'conversation')}
            connected={payload != null}
            onContinue={() => {
              if (!payload) {
                onComplete();
                return;
              }
              setPhase('interview');
            }}
          />
        </div>
      </div>

      <SurveyPreviewRespondentFooter surveyId={surveyId} />
    </div>
  );
}
