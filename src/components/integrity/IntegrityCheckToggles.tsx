'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  INTEGRITY_FLAG_ACTIONS,
  checkActionFor,
  type CheckFlagActions,
  type IntegrityFlagAction,
} from '@/lib/integrity/coverage';
import styles from './IntegrityCoverage.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

type Allowance = {
  id: string;
  label: string;
  singular: string;
  plural: string;
  min: number;
  defaultValue: number;
  legacyId?: string;
};

type CheckItem<T extends string> = {
  id: T;
  label: string;
  detail: string;
  whenLabel?: string;
  group?: string;
  groupNote?: string;
  tolerance?: Omit<Allowance, 'id'>;
  allowances?: readonly Allowance[];
};

function allowancesFor<T extends string>(item: CheckItem<T>): Allowance[] {
  if (item.allowances?.length) return [...item.allowances];
  if (!item.tolerance) return [];
  return [{ ...item.tolerance, id: item.id }];
}

function allowanceCount(
  spec: Allowance,
  tolerances: Partial<Record<string, number>> | undefined,
): number {
  const raw = tolerances?.[spec.id] ?? (spec.legacyId ? tolerances?.[spec.legacyId] : undefined);
  const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : spec.defaultValue;
  return Math.max(spec.min, value);
}

function grouped<T extends string>(items: readonly CheckItem<T>[]) {
  const groups: { key: string; note: string; items: CheckItem<T>[] }[] = [];
  for (const item of items) {
    const key = item.group ?? item.label;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, note: item.groupNote ?? '', items: [item] });
  }
  return groups;
}

function groupStatus<T extends string>(
  items: readonly CheckItem<T>[],
  selected: readonly T[],
  tolerances: Partial<Record<string, number>> | undefined,
  checkActions: CheckFlagActions | undefined,
  showFlagActions: boolean,
): string {
  const selectedItems = items.filter((item) => selected.includes(item.id));
  if (selectedItems.length === 0) return 'Off';
  const counts: string[] = [];
  for (const item of selectedItems) {
    for (const spec of allowancesFor(item)) {
      const value = allowanceCount(spec, tolerances);
      counts.push(`${value} ${value === 1 ? spec.singular : spec.plural}`);
    }
  }
  if (showFlagActions) {
    let flagCount = 0;
    let terminateCount = 0;
    for (const item of selectedItems) {
      if (checkActionFor(item.id, checkActions) === 'terminate') terminateCount += 1;
      else flagCount += 1;
    }
    if (terminateCount > 0 && flagCount > 0) {
      counts.push(`${terminateCount} terminate`, `${flagCount} flag`);
    } else if (terminateCount > 0) {
      counts.push(terminateCount === selectedItems.length ? 'Terminate' : `${terminateCount} terminate`);
    } else if (flagCount > 0 && selectedItems.length > 0) {
      counts.push('Only flag');
    }
  }
  if (counts.length > 0) {
    return selectedItems.length === items.length
      ? counts.join(', ')
      : `${counts.join(', ')}, ${selectedItems.length} on`;
  }
  if (selectedItems.length === items.length) {
    return selectedItems.length === 1 ? 'On' : `${selectedItems.length} on`;
  }
  return `${selectedItems.length} on`;
}

export function IntegrityCheckToggles<T extends string>({
  items,
  selected,
  tolerances,
  checkActions,
  onToggle,
  onTolerance,
  onCheckAction,
}: {
  items: readonly CheckItem<T>[];
  selected: readonly T[];
  tolerances?: Partial<Record<string, number>>;
  checkActions?: CheckFlagActions;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: string, value: number) => void;
  onCheckAction?: (id: T, action: IntegrityFlagAction) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const showFlagActions = Boolean(onCheckAction);
  return (
    <div className={styles.groupList}>
      {grouped(items).map((group) => {
        const expanded = open[group.key] ?? false;
        const status = groupStatus(
          group.items,
          selected,
          tolerances,
          checkActions,
          showFlagActions,
        );
        return (
          <section key={group.key} className={styles.checkCard}>
            <button
              type="button"
              className={styles.groupHeader}
              aria-expanded={expanded}
              onClick={() =>
                setOpen((current) => ({ ...current, [group.key]: !expanded }))
              }
            >
              <span
                className={`${styles.chevron} ${
                  expanded ? 'wm-keyboard-arrow-down' : 'wm-keyboard-arrow-right'
                }`}
                aria-hidden
              />
              <span className={styles.copy}>
                <strong>{group.key}</strong>
                {group.note ? <span className={styles.groupNote}>{group.note}</span> : null}
              </span>
              <span className={status === 'Off' ? styles.statusOff : styles.status}>
                {status}
              </span>
            </button>
            {expanded ? (
              <div className={styles.groupBody}>
                {group.items.map((item) => (
                  <CheckRow
                    key={item.id}
                    item={item}
                    checked={selected.includes(item.id)}
                    tolerances={tolerances}
                    checkAction={checkActionFor(item.id, checkActions)}
                    showFlagActions={showFlagActions}
                    onToggle={onToggle}
                    onTolerance={onTolerance}
                    onCheckAction={onCheckAction}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function CheckRow<T extends string>({
  item,
  checked,
  tolerances,
  checkAction,
  showFlagActions,
  onToggle,
  onTolerance,
  onCheckAction,
}: {
  item: CheckItem<T>;
  checked: boolean;
  tolerances?: Partial<Record<string, number>>;
  checkAction: IntegrityFlagAction;
  showFlagActions: boolean;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: string, value: number) => void;
  onCheckAction?: (id: T, action: IntegrityFlagAction) => void;
}) {
  const allowances = allowancesFor(item);
  return (
    <div className={styles.row}>
      <div className={styles.copy}>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => onToggle(item.id, !checked)}
        >
          <strong>{item.label}</strong>
        </button>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => onToggle(item.id, !checked)}
        >
          <span className={styles.hint}>{item.detail}</span>
        </button>
        {checked
          ? allowances.map((allowance) => {
              const count = allowanceCount(allowance, tolerances);
              return (
                <div key={allowance.id} className={styles.tolerance}>
                  <span>Allow</span>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.step}
                      aria-label={`Decrease ${allowance.label}`}
                      disabled={count <= allowance.min}
                      onClick={() =>
                        onTolerance?.(allowance.id, Math.max(allowance.min, count - 1))
                      }
                    >
                      −
                    </button>
                    <input
                      className={styles.stepValue}
                      inputMode="numeric"
                      aria-label={`${allowance.label} for ${item.label}`}
                      value={String(count)}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (!Number.isFinite(next)) return;
                        onTolerance?.(allowance.id, Math.max(allowance.min, Math.floor(next)));
                      }}
                    />
                    <button
                      type="button"
                      className={styles.step}
                      aria-label={`Increase ${allowance.label}`}
                      onClick={() => onTolerance?.(allowance.id, count + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span>{count === 1 ? allowance.singular : allowance.plural}</span>
                </div>
              );
            })
          : null}
        {checked && showFlagActions ? (
          <div
            className={styles.checkActionRow}
            role="radiogroup"
            aria-label={`Action for ${item.label}`}
          >
            {INTEGRITY_FLAG_ACTIONS.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={checkAction === choice.id}
                className={checkAction === choice.id ? styles.choiceOn : styles.choice}
                onClick={() => onCheckAction?.(item.id, choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <WuToggle
        checked={checked}
        aria-label={item.label}
        onChange={(next) => onToggle(item.id, next)}
      />
    </div>
  );
}
