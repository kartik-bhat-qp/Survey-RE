'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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

function isSingleToggle<T extends string>(items: readonly CheckItem<T>[]): boolean {
  return items.length === 1;
}

function groupStatus<T extends string>(
  items: readonly CheckItem<T>[],
  selected: readonly T[],
  tolerances: Partial<Record<string, number>> | undefined,
): string {
  const counts: string[] = [];
  const names: string[] = [];
  for (const item of items) {
    if (!selected.includes(item.id)) continue;
    const allowances = allowancesFor(item);
    if (allowances.length === 0) {
      names.push(item.label);
      continue;
    }
    for (const spec of allowances) {
      const value = allowanceCount(spec, tolerances);
      counts.push(`${value} ${value === 1 ? spec.singular : spec.plural}`);
    }
  }
  const plain = names.length > 2 ? `${names.length} on` : names.join(', ');
  const summary = [counts.join(', '), plain].filter(Boolean).join(', ');
  return summary || 'Off';
}

export function IntegrityCheckToggles<T extends string>({
  items,
  selected,
  tolerances,
  onToggle,
  onTolerance,
}: {
  items: readonly CheckItem<T>[];
  selected: readonly T[];
  tolerances?: Partial<Record<string, number>>;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: string, value: number) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className={styles.groupList}>
      {grouped(items).map((group) => {
        if (isSingleToggle(group.items)) {
          const item = group.items[0];
          return (
            <section key={group.key} className={styles.checkCard}>
              <div className={styles.plainHeader}>
                <CheckRow
                  item={item}
                  checked={selected.includes(item.id)}
                  tolerances={tolerances}
                  onToggle={onToggle}
                  onTolerance={onTolerance}
                />
              </div>
            </section>
          );
        }
        const expanded = open[group.key] ?? false;
        const status = groupStatus(group.items, selected, tolerances);
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
                    onToggle={onToggle}
                    onTolerance={onTolerance}
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
  onToggle,
  onTolerance,
}: {
  item: CheckItem<T>;
  checked: boolean;
  tolerances?: Partial<Record<string, number>>;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: string, value: number) => void;
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
      </div>
      <WuToggle
        checked={checked}
        aria-label={item.label}
        onChange={(next) => onToggle(item.id, next)}
      />
    </div>
  );
}
