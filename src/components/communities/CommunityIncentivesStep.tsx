'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  COMMUNITY_INCENTIVE_CRITERIA,
  COMMUNITY_INCENTIVE_FIELD_PLACEHOLDER,
  COMMUNITY_INCENTIVE_OPERATORS,
  type CommunityIncentiveCondition,
  type CommunityIncentiveCriterionField,
  type CommunityIncentiveCriterionValue,
  type CommunityIncentiveKey,
  type CommunityIncentiveOperatorId,
  type CommunityIncentivePoints,
  type CommunityIncentiveRule,
  type CommunityPointsTag,
} from '@/data/mock-community-send';
import styles from './CommunityIncentivesStep.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const OUTCOMES: { key: CommunityIncentiveKey; label: string }[] = [
  { key: 'complete', label: 'Complete' },
  { key: 'quota', label: 'Quota' },
  { key: 'terminate', label: 'Terminate' },
];

interface ResolvedCondition {
  condition: CommunityIncentiveCondition;
  field: CommunityIncentiveCriterionField;
  value: CommunityIncentiveCriterionValue;
}

export interface IncentiveRuleReach {
  rule: CommunityIncentiveRule;
  conditions: ResolvedCondition[];
  label: string;
  /** Recipients not yet assigned to an earlier rule. */
  pool: number;
  recipients: number;
  shadowedBy: number | null;
}

const VALUE_PLACEHOLDER: CommunityIncentiveCriterionValue = {
  id: '',
  label: 'Select value',
  share: 0,
};

function findCriterion(condition: Pick<CommunityIncentiveCondition, 'fieldId' | 'valueId'>) {
  const field = COMMUNITY_INCENTIVE_CRITERIA.find((item) => item.id === condition.fieldId);
  if (!field) return { field: COMMUNITY_INCENTIVE_FIELD_PLACEHOLDER, value: VALUE_PLACEHOLDER };
  const value = field.values.find((item) => item.id === condition.valueId) ?? field.values[0];
  return { field, value };
}

function conditionSignature(rule: CommunityIncentiveRule): string {
  return rule.conditions
    .map((condition) => `${condition.fieldId}|${condition.operatorId}|${condition.valueId}`)
    .join('&');
}

function describeCondition(condition: CommunityIncentiveCondition): string | null {
  const { field, value } = findCriterion(condition);
  if (!field.id || !value.id) return null;
  const operator = condition.operatorId === 'not-equals' ? 'does not equal' : 'equals';
  return `${field.label} ${operator} ${value.label}`;
}

/** First matching rule wins. Conditions on one rule are combined with AND. */
export function estimateIncentiveReach(
  rules: CommunityIncentiveRule[],
  totalRecipients: number
): { reach: IncentiveRuleReach[]; defaultRecipients: number } {
  let remaining = totalRecipients;
  const reach = rules.map((rule, index) => {
    const conditions = rule.conditions.map((condition) => ({
      condition,
      ...findCriterion(condition),
    }));
    const descriptions = rule.conditions.map(describeCondition);
    const complete = descriptions.every((item) => item !== null);
    const earlier = rules.findIndex(
      (other, otherIndex) =>
        otherIndex < index &&
        conditionSignature(other) === conditionSignature(rule) &&
        rule.conditions.some((condition) => condition.fieldId !== '')
    );
    const share = rule.conditions.reduce((product, condition) => {
      const { value } = findCriterion(condition);
      if (!condition.fieldId || !value.id) return 0;
      const portion =
        condition.operatorId === 'not-equals' ? Math.max(0, 1 - value.share) : value.share;
      return product * portion;
    }, 1);
    const pool = remaining;
    const recipients =
      !complete || earlier >= 0 ? 0 : Math.min(pool, Math.round(pool * share));
    remaining -= recipients;
    return {
      rule,
      conditions,
      label: complete ? descriptions.join(' and ') : 'Select a field',
      pool,
      recipients,
      shadowedBy: earlier >= 0 ? earlier + 1 : null,
    };
  });
  return { reach, defaultRecipients: remaining };
}

interface CommunityIncentivesStepProps {
  surveyName: string;
  defaults: CommunityIncentivePoints;
  onDefaultsChange: (points: CommunityIncentivePoints) => void;
  rules: CommunityIncentiveRule[];
  onRulesChange: (rules: CommunityIncentiveRule[]) => void;
  verifiedRecipients: number;
  usedPointsTags: CommunityPointsTag[];
}

export function CommunityIncentivesStep({
  surveyName,
  defaults,
  onDefaultsChange,
  rules,
  onRulesChange,
  verifiedRecipients,
  usedPointsTags,
}: CommunityIncentivesStepProps) {
  const { showToast } = useWuShowToast();
  const idRef = useRef(0);
  const { reach, defaultRecipients } = estimateIncentiveReach(rules, verifiedRecipients);

  function nextId(prefix: string): string {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function blankCondition(): CommunityIncentiveCondition {
    return { id: nextId('condition'), fieldId: '', operatorId: 'equals', valueId: '' };
  }
  const maxPayout =
    reach.reduce((sum, item) => sum + item.recipients * Number(item.rule.points.complete || 0), 0) +
    defaultRecipients * Number(defaults.complete || 0);

  function updateRule(id: string, patch: Partial<CommunityIncentiveRule>): void {
    onRulesChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function moveRule(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    [next[index], next[target]] = [next[target], next[index]];
    onRulesChange(next);
  }

  function addRule(): void {
    onRulesChange([
      ...rules,
      {
        id: nextId('rule'),
        conditions: [blankCondition()],
        points: { ...defaults },
      },
    ]);
  }

  function removeRule(id: string): void {
    onRulesChange(rules.filter((rule) => rule.id !== id));
    showToast({ message: 'Rule removed', variant: 'info' });
  }

  function updateCondition(
    ruleId: string,
    conditionId: string,
    patch: Partial<CommunityIncentiveCondition>
  ): void {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map((condition) =>
                condition.id === conditionId ? { ...condition, ...patch } : condition
              ),
            }
          : rule
      )
    );
  }

  function addCondition(ruleId: string): void {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, conditions: [...rule.conditions, blankCondition()] } : rule
      )
    );
  }

  function removeCondition(ruleId: string, conditionId: string): void {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId && rule.conditions.length > 1
          ? { ...rule, conditions: rule.conditions.filter((condition) => condition.id !== conditionId) }
          : rule
      )
    );
  }

  function pointsInputs(
    points: CommunityIncentivePoints,
    onChange: (points: CommunityIncentivePoints) => void,
    idPrefix: string
  ) {
    return (
      <div className={styles.pointsRow}>
        {OUTCOMES.map(({ key, label }) => (
          <label key={key} className={styles.pointsField} htmlFor={`${idPrefix}-${key}`}>
            <span className={styles.label}>{label}:</span>
            <input
              id={`${idPrefix}-${key}`}
              className={styles.pointsInput}
              inputMode="numeric"
              value={points[key]}
              onChange={(event) =>
                onChange({ ...points, [key]: event.target.value.replace(/[^0-9]/g, '') })
              }
            />
            <span className={styles.suffix}>points</span>
          </label>
        ))}
      </div>
    );
  }

  const completeValues = [
    ...(defaultRecipients > 0 ? [Number(defaults.complete || 0)] : []),
    ...reach.filter((item) => item.recipients > 0).map((item) => Number(item.rule.points.complete || 0)),
  ];
  const minComplete = completeValues.length ? Math.min(...completeValues) : 0;
  const maxComplete = completeValues.length ? Math.max(...completeValues) : 0;

  return (
    <div className={styles.step}>
      <div>
        <h3 className={styles.sectionTitle}>Default points</h3>
        <p className={styles.hint}>
          Points for “{surveyName}” when a recipient matches none of the rules below.
        </p>
      </div>
      <div className={`${styles.card} ${styles.defaultsCard}`}>
        {pointsInputs(defaults, onDefaultsChange, 'default')}
      </div>

      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Points by criteria</h3>
          <p className={styles.hint}>
            Rules are checked top to bottom — the first matching rule sets the member’s points.
          </p>
        </div>
        <WuButton
          variant="secondary"
          Icon={<span className="wm-add" aria-hidden />}
          onClick={() => addRule()}
        >
          Add rule
        </WuButton>
      </div>

      {rules.length === 0 ? (
        <div className={`${styles.card} ${styles.emptyRules}`}>
          <span className={`wm-tune ${styles.emptyIcon}`} aria-hidden />
          <p>
            Everyone earns the default points. Add a rule to reward specific members differently.
          </p>
        </div>
      ) : (
        <ol className={styles.rules}>
          {reach.map(({ rule, conditions, pool, recipients, shadowedBy }, index) => (
            <li key={rule.id} className={`${styles.card} ${styles.rule}`}>
              <div className={styles.ruleHeader}>
                <span className={styles.ruleBadge}>Rule {index + 1}</span>
                <span className={shadowedBy ? styles.reachWarn : styles.reach}>
                  {shadowedBy
                    ? `Same criteria as Rule ${shadowedBy} — this rule will never apply`
                    : `${recipients.toLocaleString()}/${pool.toLocaleString()}`}
                </span>
                <div className={styles.ruleActions}>
                  <WuTooltip content="Move up" position="top">
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveRule(index, -1)}
                    >
                      <span className="wm-arrow-upward" aria-hidden />
                    </button>
                  </WuTooltip>
                  <WuTooltip content="Move down" position="top">
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Move down"
                      disabled={index === rules.length - 1}
                      onClick={() => moveRule(index, 1)}
                    >
                      <span className="wm-arrow-downward" aria-hidden />
                    </button>
                  </WuTooltip>
                  <WuTooltip content="Remove rule" position="top">
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Remove rule"
                      onClick={() => removeRule(rule.id)}
                    >
                      <span className="wm-delete" aria-hidden />
                    </button>
                  </WuTooltip>
                </div>
              </div>

              <div className={styles.conditions}>
                <p className={styles.matchLine}>Members that match all of the following conditions:</p>
                {conditions.map(({ condition, field, value }, lineIndex) => (
                  <div key={condition.id}>
                    {lineIndex > 0 ? <div className={styles.andLabel}>AND</div> : null}
                    <div className={styles.condition}>
                      <div className={styles.selectWrap}>
                        <WuSelect
                          data={[
                            COMMUNITY_INCENTIVE_FIELD_PLACEHOLDER,
                            ...COMMUNITY_INCENTIVE_CRITERIA,
                          ]}
                          accessorKey={{ value: 'id', label: 'label' }}
                          value={field}
                          onSelect={(item) => {
                            const selected = item as CommunityIncentiveCriterionField | null;
                            if (!selected) return;
                            updateCondition(rule.id, condition.id, {
                              fieldId: selected.id,
                              valueId: selected.values[0]?.id ?? '',
                            });
                          }}
                          aria-label={`Rule ${index + 1} condition ${lineIndex + 1} field`}
                        />
                      </div>
                      <div className={styles.operatorWrap}>
                        <WuSelect
                          data={[...COMMUNITY_INCENTIVE_OPERATORS]}
                          accessorKey={{ value: 'id', label: 'label' }}
                          value={
                            COMMUNITY_INCENTIVE_OPERATORS.find(
                              (item) => item.id === condition.operatorId
                            ) ?? COMMUNITY_INCENTIVE_OPERATORS[0]
                          }
                          onSelect={(item) => {
                            const selected = item as { id: CommunityIncentiveOperatorId } | null;
                            if (selected) {
                              updateCondition(rule.id, condition.id, { operatorId: selected.id });
                            }
                          }}
                          aria-label={`Rule ${index + 1} condition ${lineIndex + 1} operator`}
                        />
                      </div>
                      <div className={styles.selectWrap}>
                        <WuSelect
                          key={field.id || 'empty'}
                          data={field.values.length > 0 ? field.values : [VALUE_PLACEHOLDER]}
                          accessorKey={{ value: 'id', label: 'label' }}
                          value={value}
                          onSelect={(item) => {
                            const selected = item as CommunityIncentiveCriterionValue | null;
                            if (selected?.id) {
                              updateCondition(rule.id, condition.id, { valueId: selected.id });
                            }
                          }}
                          aria-label={`Rule ${index + 1} condition ${lineIndex + 1} value`}
                        />
                      </div>
                      {lineIndex === conditions.length - 1 ? (
                        <WuTooltip content="Add condition" position="top">
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Add condition"
                            onClick={() => addCondition(rule.id)}
                          >
                            <span className="wm-add" aria-hidden />
                          </button>
                        </WuTooltip>
                      ) : (
                        <span className={styles.iconSpacer} aria-hidden />
                      )}
                      {conditions.length > 1 ? (
                        <WuTooltip content="Remove condition" position="top">
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Remove condition"
                            onClick={() => removeCondition(rule.id, condition.id)}
                          >
                            <span className="wm-close" aria-hidden />
                          </button>
                        </WuTooltip>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.award}>
                <span className={styles.keyword}>Award</span>
                {pointsInputs(
                  rule.points,
                  (points) => updateRule(rule.id, { points }),
                  rule.id
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className={`${styles.card} ${styles.summary}`}>
        <h3 className={styles.summaryTitle}>Points distribution</h3>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Applies to</th>
              <th>Recipients</th>
              <th>Complete</th>
              <th>Quota</th>
              <th>Terminate</th>
            </tr>
          </thead>
          <tbody>
            {reach.map(({ rule, label, pool, recipients, shadowedBy }, index) => (
              <tr key={rule.id} className={shadowedBy ? styles.mutedRow : undefined}>
                <td>
                  Rule {index + 1}: {label}
                </td>
                <td>
                  {recipients.toLocaleString()}/{pool.toLocaleString()}
                </td>
                <td>{rule.points.complete || 0}</td>
                <td>{rule.points.quota || 0}</td>
                <td>{rule.points.terminate || 0}</td>
              </tr>
            ))}
            <tr>
              <td>Everyone else (default)</td>
              <td>
                {defaultRecipients.toLocaleString()}/{defaultRecipients.toLocaleString()}
              </td>
              <td>{defaults.complete || 0}</td>
              <td>{defaults.quota || 0}</td>
              <td>{defaults.terminate || 0}</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.payout}>
          Estimated maximum payout: <strong>{maxPayout.toLocaleString()} points</strong> if all{' '}
          {verifiedRecipients.toLocaleString()} recipients complete.
        </p>
      </div>

      {usedPointsTags.some(({ incentive }) => incentive === 'complete') ? (
        <p className={styles.preview}>
          {'{SURVEY_POINTS_COMPLETE}'} is personalized per member:{' '}
          {minComplete === maxComplete
            ? `${minComplete} points`
            : `${minComplete}–${maxComplete} points depending on the matching rule`}
          .
        </p>
      ) : null}
    </div>
  );
}
