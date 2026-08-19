'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  deepDiveFollowUpSettingsSignature,
  formatDeepDiveReplyCount,
  generateDeepDiveFollowUps,
  type DeepDiveFollowUpReply,
} from '@/data/mock-deepdive-follow-ups';
import {
  normalizeDeepDiveMaxFollowUp,
  resolveDeepDiveFollowUpSettings,
  type DeepDiveFollowUpSettings,
} from '@/data/mock-deepdive-question-settings';

export type DeepDiveThreadPhase = 'idle' | 'active' | 'collapsed';

export interface DeepDiveFollowUpThreadState {
  phase: DeepDiveThreadPhase;
  triggerOptionId: string | null;
  triggerLabel: string;
  queuedQuestions: string[];
  currentIndex: number;
  replies: DeepDiveFollowUpReply[];
  priorAnswerQuote: string;
  currentQuestion: string | null;
  progressCurrent: number;
  progressTotal: number;
  summaryLabel: string | null;
  isExpanded: boolean;
}

export interface UseDeepDiveFollowUpThreadResult {
  state: DeepDiveFollowUpThreadState;
  startThread: (optionId: string, optionLabel: string) => void;
  resetThread: () => void;
  submitReply: (answer: string) => void;
  skipThread: () => void;
  toggleExpanded: () => void;
}

const IDLE_STATE: DeepDiveFollowUpThreadState = {
  phase: 'idle',
  triggerOptionId: null,
  triggerLabel: '',
  queuedQuestions: [],
  currentIndex: 0,
  replies: [],
  priorAnswerQuote: '',
  currentQuestion: null,
  progressCurrent: 0,
  progressTotal: 0,
  summaryLabel: null,
  isExpanded: false,
};

function buildActiveState(
  optionId: string,
  optionLabel: string,
  queuedQuestions: string[]
): DeepDiveFollowUpThreadState {
  const total = queuedQuestions.length;
  return {
    phase: 'active',
    triggerOptionId: optionId,
    triggerLabel: optionLabel,
    queuedQuestions,
    currentIndex: 0,
    replies: [],
    priorAnswerQuote: optionLabel,
    currentQuestion: queuedQuestions[0] ?? null,
    progressCurrent: total > 0 ? 1 : 0,
    progressTotal: total,
    summaryLabel: null,
    isExpanded: false,
  };
}

function buildCollapsedState(
  base: DeepDiveFollowUpThreadState,
  replies: DeepDiveFollowUpReply[]
): DeepDiveFollowUpThreadState {
  return {
    ...base,
    phase: 'collapsed',
    currentQuestion: null,
    progressCurrent: 0,
    progressTotal: 0,
    summaryLabel: formatDeepDiveReplyCount(replies.length),
    isExpanded: false,
    replies,
  };
}

export function useDeepDiveFollowUpThread(
  settings: DeepDiveFollowUpSettings | null | undefined
): UseDeepDiveFollowUpThreadResult {
  const resolvedSettings = useMemo(
    () => (settings ? resolveDeepDiveFollowUpSettings(settings) : null),
    [settings]
  );
  const settingsSignature = deepDiveFollowUpSettingsSignature(resolvedSettings);

  const [syncedSignature, setSyncedSignature] = useState(settingsSignature);
  const [state, setState] = useState<DeepDiveFollowUpThreadState>(IDLE_STATE);

  if (syncedSignature !== settingsSignature) {
    setSyncedSignature(settingsSignature);
    setState(IDLE_STATE);
  }

  const commitState = useCallback(
    (next: DeepDiveFollowUpThreadState) => {
      setSyncedSignature(settingsSignature);
      setState(next);
    },
    [settingsSignature]
  );

  const isEnabled = Boolean(resolvedSettings?.enabled);

  const startThread = useCallback(
    (optionId: string, optionLabel: string) => {
      if (!isEnabled || !resolvedSettings) return;

      const queuedQuestions = generateDeepDiveFollowUps(
        optionLabel,
        resolvedSettings.tone,
        normalizeDeepDiveMaxFollowUp(resolvedSettings.maxFollowUp)
      );

      if (queuedQuestions.length === 0) {
        commitState(IDLE_STATE);
        return;
      }

      commitState(buildActiveState(optionId, optionLabel, queuedQuestions));
    },
    [commitState, isEnabled, resolvedSettings]
  );

  const resetThread = useCallback(() => {
    commitState(IDLE_STATE);
  }, [commitState]);

  const submitReply = useCallback(
    (answer: string) => {
      const trimmed = answer.trim();
      if (trimmed === '' || state.phase !== 'active' || !state.currentQuestion) {
        return;
      }

      const reply: DeepDiveFollowUpReply = {
        question: state.currentQuestion,
        answer: trimmed,
      };
      const nextReplies = [...state.replies, reply];
      const nextIndex = state.currentIndex + 1;
      const total = state.queuedQuestions.length;

      if (nextIndex >= total) {
        commitState(buildCollapsedState(state, nextReplies));
        return;
      }

      const nextQuestion = state.queuedQuestions[nextIndex];
      commitState({
        ...state,
        replies: nextReplies,
        currentIndex: nextIndex,
        priorAnswerQuote: trimmed,
        currentQuestion: nextQuestion,
        progressCurrent: nextIndex + 1,
        progressTotal: total,
      });
    },
    [commitState, state]
  );

  const skipThread = useCallback(() => {
    if (state.phase !== 'active') return;

    if (state.replies.length === 0) {
      commitState(IDLE_STATE);
      return;
    }

    commitState(buildCollapsedState(state, state.replies));
  }, [commitState, state]);

  const toggleExpanded = useCallback(() => {
    if (state.phase !== 'collapsed') return;
    commitState({ ...state, isExpanded: !state.isExpanded });
  }, [commitState, state]);

  return {
    state,
    startThread,
    resetThread,
    submitReply,
    skipThread,
    toggleExpanded,
  };
}
