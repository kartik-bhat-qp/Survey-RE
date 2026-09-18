'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import styles from './DictationWaveform.module.css';

const BAR_COUNT = 5;
const MIN_BAR_RATIO = 0.12;

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

export interface DictationWaveformProps {
  active: boolean;
  /** Parent bumps toward 1 when speech activity is detected. */
  activityRef: MutableRefObject<number>;
  className?: string;
}

export function DictationWaveform({ active, activityRef, className = '' }: DictationWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevHeightsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(MIN_BAR_RATIO));
  const startRef = useRef(0);
  const drawLoopRef = useRef<() => void>(() => {});

  drawLoopRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(drawLoopRef.current);
      return;
    }

    activityRef.current = Math.max(0, activityRef.current * 0.9);

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const activity = activityRef.current;
    const t = (Date.now() - startRef.current) / 1000;
    const prevH = prevHeightsRef.current;

    for (let i = 0; i < BAR_COUNT; i += 1) {
      const p1 = (i / BAR_COUNT) * Math.PI * 2.4;
      const p2 = (i / BAR_COUNT) * Math.PI * 5.1;
      const p3 = (i / BAR_COUNT) * Math.PI * 8.7;
      let targetRatio =
        0.22 +
        Math.sin(t * 2.2 + p1) * 0.14 +
        Math.sin(t * 5.8 + p2) * 0.08 +
        Math.sin(t * 11 + p3) * 0.04;
      targetRatio *= 0.35 + activity * 0.72;
      targetRatio = Math.min(0.82, Math.max(MIN_BAR_RATIO, targetRatio));

      const prev = prevH[i] ?? MIN_BAR_RATIO;
      const lerpFactor = targetRatio > prev ? 0.42 : 0.22;
      const smoothed = prev + (targetRatio - prev) * lerpFactor;
      prevH[i] = smoothed;

      const barH = Math.max(2, smoothed * H * 0.78);
      const slotW = W / BAR_COUNT;
      const barW = Math.max(1.25, slotW * 0.34);
      const x = i * slotW + (slotW - barW) / 2;
      const y = (H - barH) / 2;
      const r = Math.min(barW / 2, 1.5);

      const accentMix = Math.min(1, activity * 1.4);
      const rCh = Math.round(148 + (27 - 148) * accentMix);
      const gCh = Math.round(163 + (135 - 163) * accentMix);
      const bCh = Math.round(184 + (230 - 184) * accentMix);
      const alpha = 0.34 + accentMix * 0.28;
      ctx.fillStyle = `rgba(${rCh}, ${gCh}, ${bCh}, ${alpha})`;
      drawBar(ctx, x, y, barW, barH, r);
    }

    animFrameRef.current = requestAnimationFrame(drawLoopRef.current);
  };

  useEffect(() => {
    if (!active) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      activityRef.current = 0;
      prevHeightsRef.current.fill(MIN_BAR_RATIO);
      return;
    }

    startRef.current = Date.now();
    drawLoopRef.current();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [active, activityRef]);

  const cssW = 26;
  const cssH = 14;

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      width={cssW * 2}
      height={cssH * 2}
      style={{ width: cssW, height: cssH }}
      aria-hidden
    />
  );
}
