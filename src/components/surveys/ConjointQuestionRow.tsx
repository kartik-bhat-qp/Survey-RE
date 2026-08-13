'use client';

import { useState, type SyntheticEvent } from 'react';
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
} from '@/data/mock-survey-detail';
import { BulkEditLinesModal } from '@/components/surveys/BulkEditLinesModal';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ConjointQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

type BulkEditTarget = 'features' | 'levels';

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
  onQuestionTextChange,
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
    updater: (feature: SurveyQuestionConjoint['features'][number]) => SurveyQuestionConjoint['features'][number]
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
          <div className={styles.questionTextWrap}>
            {question.required ? <span className={styles.required}>*</span> : null}
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>

          <div className={styles.designRow}>
            <div className={styles.designTabs} role="tablist" aria-label="Design Type">
              {CONJOINT_DESIGN_TYPE_TABS.map((tab) => {
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
                            value={feature.featureType}
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
                    bulk edit features
                  </button>
                  <button
                    type="button"
                    className={styles.bulkLink}
                    onClick={() => {
                      setBulkEditFeatureId(conjoint.features[0]?.id ?? null);
                      setBulkEditTarget('levels');
                    }}
                  >
                    bulk edit levels
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
              <input
                className={styles.numberInput}
                type="number"
                min={1}
                value={conjoint.taskCount}
                onChange={(event) =>
                  patch({ taskCount: Math.max(1, Number(event.target.value) || 1) })
                }
                aria-label="Task Count"
              />
            </label>
            <label className={styles.configField}>
              <span>Concept Per Task</span>
              <input
                className={styles.numberInput}
                type="number"
                min={2}
                value={conjoint.conceptPerTask}
                onChange={(event) =>
                  patch({ conceptPerTask: Math.max(2, Number(event.target.value) || 2) })
                }
                aria-label="Concept Per Task"
              />
            </label>
            <label className={styles.naField}>
              <span>Not Applicable Option</span>
              <input
                type="radio"
                className={styles.naRadio}
                checked={conjoint.notApplicableOption}
                onClick={(event) => {
                  event.stopPropagation();
                  patch({ notApplicableOption: !conjoint.notApplicableOption });
                }}
                onChange={() => undefined}
                aria-label="Not Applicable Option"
              />
            </label>
          </div>

          <p className={styles.infoBanner} role="status">
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
          bulkEditFeature
            ? `Levels for ${bulkEditFeature.name || 'feature'}`
            : 'Levels'
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
