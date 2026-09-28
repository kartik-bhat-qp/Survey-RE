'use client';

import { useId } from 'react';
import type { AiLensReadinessBand } from '@/data/mock-ai-lens';
import styles from './AiLensReadinessGauge.module.css';

interface AiLensReadinessGaugeProps {
  score: number;
  band: AiLensReadinessBand;
}

const CX = 120;
const CY = 112;
const OUTER_R = 92;
const INNER_R = 68;
const MID_R = (OUTER_R + INNER_R) / 2;
const STROKE = OUTER_R - INNER_R;

/** Top semicircle track (left → right through the top). */
const TRACK_D = `M ${CX - MID_R} ${CY} A ${MID_R} ${MID_R} 0 0 1 ${CX + MID_R} ${CY}`;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/** 180° at score 0 (left), 0° at score 100 (right). */
function scoreToAngle(score: number): number {
  return 180 - (clampScore(score) / 100) * 180;
}

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY - radius * Math.sin(rad),
  };
}

export function AiLensReadinessGauge({ score, band }: AiLensReadinessGaugeProps) {
  const gradId = useId().replace(/:/g, '');
  const value = clampScore(score);
  const angle = scoreToAngle(value);
  const marker = polar(angle, OUTER_R + 2);
  // Triangle tip points inward toward arc center
  const rotation = 90 - angle;

  return (
    <div
      className={styles.wrap}
      role="img"
      aria-label={`Overall score ${band}`}
    >
      <svg className={styles.svg} viewBox="0 0 240 140" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="28%" stopColor="#f97316" />
            <stop offset="52%" stopColor="#eab308" />
            <stop offset="78%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        <path
          d={TRACK_D}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />

        {/* Yellow triangular pointer on the outer rim */}
        <g transform={`translate(${marker.x} ${marker.y}) rotate(${rotation})`}>
          <polygon points="0,10 -7,-4 7,-4" fill="#eab308" />
        </g>
      </svg>

      <div className={styles.centerLabel}>
        <span className={styles.band}>{band}</span>
        <span className={styles.overall}>Overall Score</span>
      </div>
    </div>
  );
}
