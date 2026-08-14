'use client';

import { useState, type SyntheticEvent } from 'react';
import dynamic from 'next/dynamic';
import type {
  ConjointFeatureType,
  SurveyQuestion,
  SurveyQuestionConjoint,
} from '@/data/mock-survey-detail';
import {
  CONJOINT_DESIGN_TYPE_TABS,
  CONJOINT_FEATURE_TYPE_OPTIONS,
  createConjointFeature,
  createConjointLevel,
  createDefaultConjointData,
  normalizeConjointFeatureType,
} from '@/data/mock-survey-detail';
import { BulkEditLinesModal } from '@/components/surveys/BulkEditLinesModal';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ConjointQuestionRow.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

type BulkEditTarget = 'features' | 'levels';

const TASK_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CONCEPT_PER_TASK_OPTIONS = [2, 3, 4, 5, 6];

export interface ConjointQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onConjointChange: (
    sectionId: string,
    questionId: string,
    conjoint: SurveyQuestionConjoint
  ) => void;
}

export function ConjointQuestionRow({
  question,
  sectionId,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onConjointChange,
}: ConjointQuestionRowProps) {
  const conjoint = question.conjoint ?? createDefaultConjointData();
  const [bulkEditTarget, setBulkEditTarget] = useState<BulkEditTarget | null>(null);
  const [bulkEditFeatureId, setBulkEditFeatureId] = useState<string | null>(null);

  function patch(partial: Partial<SurveyQuestionConjoint>): void {
    onConjointChange(sectionId, question.id, { ...conjoint, ...partial });
  }

  function updateFeature(
    featureId: string,
    updater: (
      feature: SurveyQuestionConjoint['features'][number]
    ) => SurveyQuestionConjoint['features'][number]
  ): void {
    patch({
      features: conjoint.features.map((feature) =>
        feature.id === featureId ? updater(feature) : feature
      ),
    });
  }

  const bulkEditFeature = conjoint.features.find((feature) => feature.id === bulkEditFeatureId);

  return (
    <article className={styles.root}>
      <div className="conjointCard">
        <div className={styles.cardInner}>
          <div className={styles.titleRow}>
            <h3 className={styles.questionHeading}>
              {question.required ? <span className={styles.required}>*</span> : null}
              Question {question.number}
            </h3>
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onOpenValidation={onOpenValidation}
              onMenuAction={onMenuAction}
              showLogic={false}
              extraActions={
                <button
                  type="button"
                  className={styles.designTypeLink}
                  onClick={(event) => {
                    event.stopPropagation();
                    patch({ designType: 'random' });
                    onAction('Design Type');
                  }}
                >
                  Design Type
                </button>
              }
              menuBtnClassName={styles.menuBtn}
            />
          </div>

          <div className={styles.designTabs} role="tablist" aria-label="Design Type">
            <label
              className={`${styles.designTypeControl} ${
                conjoint.designType === 'random' ? styles.designTypeControlActive : ''
              }`}
            >
              <span>Design Type:</span>
              <select
                className={styles.designTypeSelect}
                value="random"
                aria-label="Design Type"
                onPointerDown={stopQuestionEvent}
                onChange={(event) => {
                  event.stopPropagation();
                  patch({ designType: 'random' });
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  patch({ designType: 'random' });
                }}
              >
                <option value="random">Random</option>
              </select>
            </label>
            {CONJOINT_DESIGN_TYPE_TABS.filter((tab) => tab.id !== 'random').map((tab) => {
              const active = conjoint.designType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.designTab} ${active ? styles.designTabActive : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    patch({ designType: tab.id });
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {conjoint.designType === 'random' ? (
            <>
              <div className={styles.tableWrap} onPointerDown={stopQuestionEvent}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Features</th>
                      <th scope="col">Feature Type</th>
                      <th scope="col">Levels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conjoint.features.map((feature, featureIndex) => (
                      <tr key={feature.id}>
                        <td>
                          <div className={styles.featureNameCell}>
                            <span className={styles.featureIndex}>{featureIndex + 1}</span>
                            <input
                              className={styles.textInput}
                              value={feature.name}
                              onChange={(event) =>
                                updateFeature(feature.id, (current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              aria-label={`Feature ${featureIndex + 1} name`}
                            />
                          </div>
                        </td>
                        <td>
                          <select
                            className={styles.typeSelect}
                            value={normalizeConjointFeatureType(feature.featureType)}
                            aria-label={`${feature.name || `Feature ${featureIndex + 1}`} type`}
                            onChange={(event) =>
                              updateFeature(feature.id, (current) => ({
                                ...current,
                                featureType: event.target.value as ConjointFeatureType,
                              }))
                            }
                          >
                            {CONJOINT_FEATURE_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <ul className={styles.levelList}>
                            {feature.levels.map((level, levelIndex) => (
                              <li key={level.id}>
                                <input
                                  className={styles.textInput}
                                  value={level.label}
                                  onChange={(event) =>
                                    updateFeature(feature.id, (current) => ({
                                      ...current,
                                      levels: current.levels.map((item) =>
                                        item.id === level.id
                                          ? { ...item, label: event.target.value }
                                          : item
                                      ),
                                    }))
                                  }
                                  aria-label={`${feature.name || 'Feature'} level ${levelIndex + 1}`}
                                />
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            className={styles.addLink}
                            onClick={() =>
                              updateFeature(feature.id, (current) => ({
                                ...current,
                                levels: [
                                  ...current.levels,
                                  createConjointLevel(`Level ${current.levels.length + 1}`),
                                ],
                              }))
                            }
                          >
                            Add Level
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableTools} onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className={styles.addLink}
                  onClick={() =>
                    patch({
                      features: [
                        ...conjoint.features,
                        createConjointFeature(`Feature ${conjoint.features.length + 1}`),
                      ],
                    })
                  }
                >
                  Add Feature
                </button>
                <div className={styles.bulkLinks}>
                  <button
                    type="button"
                    className={styles.bulkLink}
                    onClick={() => {
                      setBulkEditFeatureId(null);
                      setBulkEditTarget('features');
                    }}
                  >
                    Bulk Edit Features
                  </button>
                  <button
                    type="button"
                    className={styles.bulkLink}
                    onClick={() => {
                      setBulkEditFeatureId(conjoint.features[0]?.id ?? null);
                      setBulkEditTarget('levels');
                    }}
                  >
                    Bulk Edit Levels
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.altPanel}>
              {conjoint.designType === 'prohibited'
                ? 'Mark combinations that should never appear together in a concept.'
                : 'Add fixed tasks that every respondent will see.'}
            </div>
          )}

          <div className={styles.configBar} onPointerDown={stopQuestionEvent}>
            <label className={styles.configField}>
              <span>Task Count</span>
              <select
                className={styles.configSelect}
                value={conjoint.taskCount}
                aria-label="Task Count"
                onChange={(event) =>
                  patch({ taskCount: Math.max(1, Number(event.target.value) || 1) })
                }
              >
                {TASK_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.configField}>
              <span>Concept Per Task</span>
              <select
                className={styles.configSelect}
                value={conjoint.conceptPerTask}
                aria-label="Concept Per Task"
                onChange={(event) =>
                  patch({ conceptPerTask: Math.max(2, Number(event.target.value) || 2) })
                }
              >
                {CONCEPT_PER_TASK_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.naField}>
              <span>Not Applicable Option</span>
              <WuToggle
                Label="Not Applicable Option"
                labelPosition="right"
                checked={conjoint.notApplicableOption}
                onChange={(checked) => patch({ notApplicableOption: checked })}
              />
            </div>
          </div>

          <p className={styles.infoBanner} role="status">
            <span className={`wm-warning ${styles.infoIcon}`} aria-hidden />
            Conjoint questions require at least 2 features and 2 levels for each feature.
          </p>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          className={styles.footer}
        />
      </div>

      <BulkEditLinesModal
        open={bulkEditTarget === 'features'}
        title="Bulk Edit Features"
        fieldLabel="Features"
        lines={conjoint.features.map((feature) => feature.name)}
        onOpenChange={(open) => {
          if (!open) setBulkEditTarget(null);
        }}
        onSave={(lines) => {
          const nextFeatures = lines.map((name, index) => {
            const existing = conjoint.features[index];
            if (existing) return { ...existing, name };
            return createConjointFeature(name);
          });
          patch({ features: nextFeatures.length > 0 ? nextFeatures : conjoint.features });
          setBulkEditTarget(null);
        }}
      />

      <BulkEditLinesModal
        open={bulkEditTarget === 'levels'}
        title="Bulk Edit Levels"
        fieldLabel={
          bulkEditFeature ? `Levels for ${bulkEditFeature.name || 'feature'}` : 'Levels'
        }
        lines={bulkEditFeature?.levels.map((level) => level.label) ?? []}
        onOpenChange={(open) => {
          if (!open) {
            setBulkEditTarget(null);
            setBulkEditFeatureId(null);
          }
        }}
        onSave={(lines) => {
          if (!bulkEditFeatureId) return;
          updateFeature(bulkEditFeatureId, (current) => ({
            ...current,
            levels: lines.map((label, index) => {
              const existing = current.levels[index];
              return existing ? { ...existing, label } : createConjointLevel(label);
            }),
          }));
          setBulkEditTarget(null);
          setBulkEditFeatureId(null);
        }}
      />
    </article>
  );
}
