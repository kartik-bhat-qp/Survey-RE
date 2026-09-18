'use client';

import { useState, type PointerEvent } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { isDesignColor } from '@/data/dashboard-design';
import styles from './DesignColorPicker.module.css';

function toHsv(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}
function toHex(h: number, s: number, v: number) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(5)}${f(3)}${f(1)}`;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function DesignColorPicker({ value, label, onChange }: { value: string; label: string; onChange: (color: string) => void }) {
  const [hex, setHex] = useState(value);
  const [hsv, setHsv] = useState(() => toHsv(value));
  const update = (next: typeof hsv) => {
    setHsv(next);
    const color = toHex(next.h, next.s, next.v);
    setHex(color); onChange(color);
  };
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    update({ ...hsv, s: clamp((event.clientX - rect.left) / rect.width), v: 1 - clamp((event.clientY - rect.top) / rect.height) });
  };
  return <Popover.Root onOpenChange={open => { if (open) { setHex(value); setHsv(toHsv(value)); } }}>
    <Popover.Trigger asChild><button type="button" className={styles.swatch} style={{ backgroundColor: value }} aria-label={label} title={`${label}: ${value}`} /></Popover.Trigger>
    <Popover.Portal><Popover.Content className={styles.picker} sideOffset={6} align="end" aria-label={`${label} picker`}>
      <input aria-label={`${label} hex`} className={styles.hex} value={hex.toUpperCase()} maxLength={7} onChange={event => {
        const next = event.target.value; setHex(next);
        if (isDesignColor(next)) { setHsv(toHsv(next)); onChange(next.toLowerCase()); }
      }} onBlur={() => { if (!isDesignColor(hex)) setHex(value); }} />
      <div className={styles.saturation} style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }} role="slider" tabIndex={0} aria-label={`${label} saturation and brightness`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s * 100)} aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); point(event); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event); }} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault(); const step = event.shiftKey ? 0.1 : 0.01;
        update({ ...hsv, s: clamp(hsv.s + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)), v: clamp(hsv.v + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0)) });
      }}><span className={styles.thumb} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} /></div>
      <input type="range" min={0} max={359} value={hsv.h} aria-label={`${label} hue`} className={styles.hue} onChange={event => update({ ...hsv, h: Number(event.target.value) })} />
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
