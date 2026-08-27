'use client';

import { useState } from 'react';
import {
  filterVisibleProgressSteps,
  type ResearchAgentProgressStep,
  type ResearchAgentReplyPayload,
} from '@/data/mock-survey-ai-agent';
import styles from './ResearchAgentReplyCard.module.css';

interface ResearchAgentReplyCardProps {
  reply?: ResearchAgentReplyPayload;
  working?: boolean;
  workingHeadline?: string;
  workingSubline?: string;
  liveSteps?: ResearchAgentProgressStep[];
  onStop?: () => void;
  onNextStep?: (action: string) => void;
}

const PREVIEW_CHANGE_COUNT = 3;
const PREVIEW_NEXT_STEP_COUNT = 3;

export function ResearchAgentReplyCard({
  reply,
  working = false,
  workingHeadline = 'Building your survey…',
  workingSubline = 'You can keep editing while I work',
  liveSteps = [],
  onStop,
  onNextStep,
}: ResearchAgentReplyCardProps) {
  const [changesOpen, setChangesOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleLiveSteps = filterVisibleProgressSteps(liveSteps);
  const changes = reply?.changes ?? [];
  const visibleChanges = changesOpen ? changes : changes.slice(0, PREVIEW_CHANGE_COUNT);
  const nextSteps = reply?.nextSteps ?? [];
  const visibleNextSteps = moreOpen ? nextSteps : nextSteps.slice(0, PREVIEW_NEXT_STEP_COUNT);
  const hiddenNextCount = Math.max(0, nextSteps.length - PREVIEW_NEXT_STEP_COUNT);
  const changeTotal = reply?.changesTotal ?? changes.length;

  return (
    <section className={styles.card} aria-live={working ? 'polite' : undefined}>
      <div className={styles.header}>
        <span
          className={`${styles.statusIcon} ${
            working ? styles.statusIconWorking : styles.statusIconDone
          }`}
          aria-hidden
        >
          <span className={working ? 'wm-autorenew' : 'wm-check'} />
        </span>
        <div className={styles.headerCopy}>
          <p className={styles.headline}>
            {working ? workingHeadline : reply?.headline}
          </p>
          <p className={styles.subline}>{working ? workingSubline : reply?.subline}</p>
        </div>
      </div>

      {working ? (
        <div className={styles.workingBody}>
          <div className={styles.progressTrack} aria-hidden>
            <div className={styles.progressFill} />
          </div>
          {visibleLiveSteps.length > 0 ? (
            <ul className={styles.liveSteps}>
              {visibleLiveSteps.map((step) => (
                <li
                  key={step.id}
                  className={
                    step.status === 'active' ? styles.liveStepActive : styles.liveStepDone
                  }
                >
                  <span
                    className={`${
                      step.status === 'active' ? 'wm-autorenew' : 'wm-check-circle'
                    } ${styles.liveStepIcon}`}
                    aria-hidden
                  />
                  <span>{step.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {onStop ? (
            <button type="button" className={styles.stopBtn} onClick={onStop}>
              <span className="wm-stop-circle" aria-hidden />
              Stop
            </button>
          ) : null}
        </div>
      ) : reply ? (
        <div>
          {reply.counts.length > 0 ? (
            <div className={styles.counts}>
              {reply.counts.map((count) => (
                <span
                  key={`${count.value}-${count.label}`}
                  className={`${styles.countChip} ${
                    count.tone === 'green'
                      ? styles.countGreen
                      : count.tone === 'blue'
                        ? styles.countBlue
                        : styles.countGray
                  }`}
                >
                  <span className={styles.countValue}>{count.value}</span>
                  {count.label}
                </span>
              ))}
            </div>
          ) : null}

          {changes.length > 0 ? (
            <div className={styles.changesPanel}>
              <button
                type="button"
                className={styles.changesToggle}
                onClick={() => setChangesOpen((open) => !open)}
                aria-expanded={changesOpen}
              >
                <span
                  className={`wm-expand-more ${styles.chevron} ${
                    changesOpen ? '' : styles.chevronCollapsed
                  }`}
                  aria-hidden
                />
                Changes
                <span className={styles.changesTotal}>· {changeTotal}</span>
              </button>
              <ul className={styles.changeList}>
                {visibleChanges.map((change, index) => (
                  <li key={`${change.marker}-${change.text}-${index}`} className={styles.changeRow}>
                    <span
                      className={
                        change.marker === '+' ? styles.markerAdd : styles.markerEdit
                      }
                    >
                      {change.marker}
                    </span>
                    <span className={styles.changeType}>{change.type}</span>
                    <span className={styles.changeText}>{change.text}</span>
                  </li>
                ))}
              </ul>
              {changes.length > PREVIEW_CHANGE_COUNT ? (
                <button
                  type="button"
                  className={styles.showAllBtn}
                  onClick={() => setChangesOpen((open) => !open)}
                >
                  {changesOpen ? 'Show less' : `Show all ${changeTotal} changes`}
                </button>
              ) : null}
            </div>
          ) : null}

          {reply.steps.length > 0 ? (
            <div className={styles.stepsWrap}>
              <button
                type="button"
                className={styles.stepsToggle}
                onClick={() => setStepsOpen((open) => !open)}
                aria-expanded={stepsOpen}
              >
                <span
                  className={`wm-expand-more ${styles.chevron} ${
                    stepsOpen ? '' : styles.chevronCollapsed
                  }`}
                  aria-hidden
                />
                {stepsOpen ? 'Hide steps' : 'How I did it'}
              </button>
              {stepsOpen ? (
                <ul className={styles.doneSteps}>
                  {reply.steps.map((step) => (
                    <li key={step}>
                      <span className={`wm-check-circle ${styles.doneStepIcon}`} aria-hidden />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {nextSteps.length > 0 ? (
            <div className={styles.nextSteps}>
              <p className={styles.nextStepsLabel}>Next steps</p>
              <div className={styles.nextStepPills}>
                {visibleNextSteps.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={styles.nextStepBtn}
                    onClick={() => onNextStep?.(action)}
                  >
                    <span className={`wm-play-arrow ${styles.nextStepIcon}`} aria-hidden />
                    {action}
                  </button>
                ))}
                {hiddenNextCount > 0 ? (
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => setMoreOpen((open) => !open)}
                  >
                    {moreOpen ? 'Less' : `More (${hiddenNextCount})`}
                    <span
                      className={`wm-expand-more ${styles.moreChevron} ${
                        moreOpen ? styles.moreChevronOpen : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
