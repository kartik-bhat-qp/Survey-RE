'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './IntegrityCoverage.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

type CheckItem<T extends string> = {
  id: T;
  label: string;
  detail: string;
  whenLabel?: string;
  group?: string;
  groupNote?: string;
  tolerance?: {
    label: string;
    singular: string;
    plural: string;
    min: number;
    defaultValue: number;
  };
};

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
  tolerances: Partial<Record<T, number>> | undefined,
): string {
  const counts: string[] = [];
  const names: string[] = [];
  for (const item of items) {
    if (!selected.includes(item.id)) continue;
    if (!item.tolerance) {
      names.push(item.label);
      continue;
    }
    const value = Math.max(
      item.tolerance.min,
      tolerances?.[item.id] ?? item.tolerance.defaultValue,
    );
    const unit = value === 1 ? item.tolerance.singular : item.tolerance.plural;
    counts.push(`${value} ${unit}`);
  }
  const plain =
    names.length > 2 ? `${names.length} on` : names.join(', ');
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
  tolerances?: Partial<Record<T, number>>;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: T, value: number) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className={styles.groupList}>
      {grouped(items).map((group) => {
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
                    allowance={
                      item.tolerance
                        ? Math.max(
                            item.tolerance.min,
                            tolerances?.[item.id] ?? item.tolerance.defaultValue,
                          )
                        : 0
                    }
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
  allowance,
  onToggle,
  onTolerance,
}: {
  item: CheckItem<T>;
  checked: boolean;
  allowance: number;
  onToggle: (id: T, checked: boolean) => void;
  onTolerance?: (id: T, value: number) => void;
}) {
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
        {checked && item.tolerance ? (
          <div className={styles.tolerance}>
            <span>Allow</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.step}
                aria-label={`Decrease ${item.tolerance.label}`}
                disabled={allowance <= item.tolerance.min}
                onClick={() =>
                  onTolerance?.(item.id, Math.max(item.tolerance.min, allowance - 1))
                }
              >
                −
              </button>
              <input
                className={styles.stepValue}
                inputMode="numeric"
                aria-label={`${item.tolerance.label} for ${item.label}`}
                value={String(allowance)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) return;
                  onTolerance?.(item.id, Math.max(item.tolerance!.min, Math.floor(next)));
                }}
              />
              <button
                type="button"
                className={styles.step}
                aria-label={`Increase ${item.tolerance.label}`}
                onClick={() => onTolerance?.(item.id, allowance + 1)}
              >
                +
              </button>
            </div>
            <span>{allowance === 1 ? item.tolerance.singular : item.tolerance.plural}</span>
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
