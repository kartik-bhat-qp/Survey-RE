'use client';

import { useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  PHISHING_AGENT_OUTREACH_COPY,
  PHISHING_AGENT_OUTREACH_WINDOW,
  PHISHING_SEE_WHY_BODY,
  PHISHING_SEE_WHY_BOOK_LABEL,
  PHISHING_SEE_WHY_CHAT_LABEL,
  PHISHING_SEE_WHY_CONTINUE,
  PHISHING_SEE_WHY_TITLE,
  PHISHING_VERIFICATION_TURNAROUND,
  bookVerificationCall,
  getAccountVerificationCallSlot,
  phishingFlagReason,
  type PhishingFlagMatch,
} from '@/data/mock-phishing-publish-hold';

type WhyModalStep = 'why' | 'schedule';

interface PhishingWhyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: PhishingFlagMatch[];
  onChatWithSupport: () => void;
  onGoToQuestion?: (match: PhishingFlagMatch) => void;
}

export function PhishingWhyModal({
  open,
  onOpenChange,
  matches,
  onChatWithSupport,
  onGoToQuestion,
}: PhishingWhyModalProps) {
  const wick = useWickUILib();
  const [step, setStep] = useState<WhyModalStep>('why');

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) setStep('why');
    onOpenChange(nextOpen);
  }

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const questionMatches = matches.filter((match) => Boolean(match.questionId));
  const hasMatches = questionMatches.length > 0;

  function goToSchedule(): void {
    if (!getAccountVerificationCallSlot()) {
      bookVerificationCall(undefined, PHISHING_AGENT_OUTREACH_WINDOW);
    }
    setStep('schedule');
  }

  return (
    <WuModal open onOpenChange={handleOpenChange} variant="action" size="md">
      <WuModalHeader>
        {step === 'why' ? PHISHING_SEE_WHY_TITLE : 'Schedule a verification call'}
      </WuModalHeader>
      <WuModalContent>
        {/* Fixed min-height so the schedule step does not collapse the dialog. */}
        <div className="flex min-h-[22rem] flex-col gap-4">
          {step === 'why' ? (
            <>
              <p className="text-sm text-gray-700">{PHISHING_SEE_WHY_BODY}</p>
              <p className="text-sm text-gray-700">{PHISHING_SEE_WHY_CONTINUE}</p>

              {hasMatches ? (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <p className="text-sm font-medium text-gray-900">Flagged questions</p>
                  <ul
                    className="flex max-h-64 flex-col gap-2 overflow-y-auto"
                    aria-label="Flagged questions"
                  >
                    {questionMatches.map((match, index) => (
                      <li
                        key={`${match.location}-${match.category}-${index}`}
                        className="flex flex-wrap items-start justify-between gap-3 rounded border border-gray-200 p-3"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-xs font-medium text-gray-500">Question</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900">
                              {match.location}
                            </span>
                            {onGoToQuestion ? (
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#1b87e6] hover:bg-[#e8f4fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1b87e6]"
                                aria-label={`Go to ${match.location}`}
                                title="Go to question"
                                onClick={() => onGoToQuestion(match)}
                              >
                                <span
                                  className="wm-arrow-forward text-sm leading-none"
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex min-w-0 max-w-[18rem] flex-col gap-0.5 text-right">
                          <span className="text-xs font-medium text-gray-500">Reason</span>
                          <span className="text-sm text-gray-700">
                            {phishingFlagReason(match.category)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Your account was flagged during a security check. Schedule a call or chat with
                  support to continue.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700">{PHISHING_AGENT_OUTREACH_COPY}</p>
              <div className="flex flex-1 flex-col gap-3 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="wm-calendar text-xl text-gray-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-xs font-medium text-gray-500">Agent outreach window</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {PHISHING_AGENT_OUTREACH_WINDOW}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{PHISHING_VERIFICATION_TURNAROUND}</p>
                  </div>
                </div>
                <ol className="m-0 flex list-none flex-col gap-2 border-t border-gray-200 pt-3 pl-0">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" aria-hidden />
                    Request received · Now
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" aria-hidden />
                    Agent reaches out · {PHISHING_AGENT_OUTREACH_WINDOW}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" aria-hidden />
                    Review complete · Usually within 2 hours
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        {step === 'why' ? (
          <>
            <WuButton
              variant="outlined"
              onClick={() => {
                handleOpenChange(false);
                onChatWithSupport();
              }}
            >
              {PHISHING_SEE_WHY_CHAT_LABEL}
            </WuButton>
            <WuButton color="primary" onClick={goToSchedule}>
              {PHISHING_SEE_WHY_BOOK_LABEL}
            </WuButton>
          </>
        ) : (
          <>
            <WuButton variant="outlined" onClick={() => setStep('why')}>
              Back
            </WuButton>
            <WuButton
              variant="outlined"
              onClick={() => {
                handleOpenChange(false);
                onChatWithSupport();
              }}
            >
              {PHISHING_SEE_WHY_CHAT_LABEL}
            </WuButton>
            <WuButton color="primary" onClick={() => handleOpenChange(false)}>
              Done
            </WuButton>
          </>
        )}
      </WuModalFooter>
    </WuModal>
  );
}
