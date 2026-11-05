'use client';

import dynamic from 'next/dynamic';
import {
  normalizeTerminateAfterFlags,
  type IntegrityFlagAction,
} from '@/lib/integrity/coverage';
import styles from './IntegrityCoverage.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

export function IntegrityFlagActionControls({
  flagAction,
  terminateAfterFlags,
  maxFlags,
  onFlagActionChange,
  onTerminateAfterChange,
}: {
  flagAction: IntegrityFlagAction;
  terminateAfterFlags: number;
  /** Total enabled checks — terminate-after cannot exceed this. */
  maxFlags: number;
  onFlagActionChange: (action: IntegrityFlagAction) => void;
  onTerminateAfterChange: (count: number) => void;
}) {
  const terminate = flagAction === 'terminate';
  const max = Math.max(1, maxFlags);
  const count = normalizeTerminateAfterFlags(terminateAfterFlags, max);

  return (
    <section className={styles.flagAction} aria-label="When checks are hit">
      <div className={styles.row}>
        <span className={styles.copy}>
          <strong>Terminate after flags</strong>
          <span className={styles.hint}>
            End the survey when enough checks set to Terminate are hit. When off, those checks
            only mark the response.
          </span>
        </span>
        <WuToggle
          checked={terminate}
          onChange={(checked) => onFlagActionChange(checked ? 'terminate' : 'flag')}
          aria-label="Terminate after flags"
        />
      </div>
      {terminate ? (
        <div className={styles.tolerance}>
          <span>Terminate after</span>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.step}
              aria-label="Decrease terminate after flags"
              disabled={count <= 1}
              onClick={() => onTerminateAfterChange(Math.max(1, count - 1))}
            >
              −
            </button>
            <input
              className={styles.stepValue}
              inputMode="numeric"
              aria-label="Flags before terminate"
              value={String(count)}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                onTerminateAfterChange(normalizeTerminateAfterFlags(next, max));
              }}
            />
            <button
              type="button"
              className={styles.step}
              aria-label="Increase terminate after flags"
              disabled={count >= max}
              onClick={() => onTerminateAfterChange(normalizeTerminateAfterFlags(count + 1, max))}
            >
              +
            </button>
          </div>
          <span>{count === 1 ? 'flag' : 'flags'}</span>
        </div>
      ) : null}
    </section>
  );
}
