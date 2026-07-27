'use client';

import { useEffect, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './AudioInputButton.module.css';

/**
 * Pool of mock transcripts returned after a simulated recording.
 * Mix of long-form text (for comment / open-ended fields) and realistic
 * short values (for name / phone / email fields) so demos look natural
 * across every question type.
 */
const MOCK_TRANSCRIPTS = [
  // Long-form feedback — used for comment boxes and open-ended text fields
  'I really enjoyed the overall experience and would definitely recommend it to others.',
  'The product quality exceeded my expectations, though delivery took a bit longer than expected.',
  'Customer support was very responsive and resolved my issue within the same day.',
  'I appreciate the intuitive design — it made the whole process much easier to navigate.',
  'The pricing is fair given the value provided, but there is room for improvement in onboarding.',
  'Overall satisfaction is high. The team was professional and communicative throughout.',
  'I found the interface easy to use, but the mobile experience could be a bit smoother.',
  'Would love to see more customization options, but the core features work really well.',
  'Great service overall. I had a minor issue but it was quickly resolved by the support team.',
  // Realistic short values — demo-friendly for name, phone, and email fields
  'Sarah Johnson',
  'Michael Chen',
  'Priya Patel',
  'James Okoye',
  'Nina Johansson',
  'sofia.morales@icloud.com',
  'james.okoye@gmail.com',
  'michael.chen@outlook.com',
  '+1 (415) 555-0192',
  '+1 (312) 867-5309',
  '+44 20 7946 0958',
];

const BAR_COUNT = 20;
const MIN_BAR_RATIO = 0.06;

type AudioState = 'idle' | 'recording' | 'transcribing';

export interface AudioInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  /** Size variant — 'sm' for compact toolbars, 'md' (default) for standalone use */
  size?: 'sm' | 'md';
}

/** Draws a pill-shaped (rounded) vertical bar on a canvas 2D context. */
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

export function AudioInputButton({
  onTranscript,
  disabled = false,
  className = '',
  size = 'md',
}: AudioInputButtonProps) {
  const { showToast } = useWuShowToast();
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Web Audio refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Per-bar state for smoothing
  const prevHeightsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(MIN_BAR_RATIO));
  const simulatedRef = useRef(false);
  const recordingStartRef = useRef(0);

  // Canvas element — always mounted so canvasRef is non-null before animation starts
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The draw loop is stored in a ref so requestAnimationFrame always calls the
  // latest closure version (which only reads refs, never stale state).
  const drawLoopRef = useRef<() => void>(() => {});

  function drawLoop(): void {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(drawLoopRef.current);
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fetch fresh frequency data once per frame
    let freqData: Uint8Array<ArrayBuffer> | null = null;
    if (!simulatedRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      freqData = dataArrayRef.current;
    }

    const prevH = prevHeightsRef.current;
    const now = Date.now();

    for (let i = 0; i < BAR_COUNT; i++) {
      let targetRatio: number;

      if (freqData) {
        // Map each bar to a band within the lower 45% of the spectrum (speech range)
        const halfLen = Math.ceil(freqData.length * 0.45);
        const binStart = Math.floor((i / BAR_COUNT) * halfLen);
        const binEnd = Math.max(binStart + 1, Math.floor(((i + 1) / BAR_COUNT) * halfLen));
        let sum = 0;
        for (let j = binStart; j < binEnd && j < freqData.length; j++) {
          sum += freqData[j];
        }
        const avg = sum / (binEnd - binStart);
        // Gamma lift so quiet audio still shows visible movement
        targetRatio = Math.pow(avg / 255, 0.65);
      } else {
        // Organic simulation: overlapping sine waves at different rates per bar
        const t = (now - recordingStartRef.current) / 1000;
        const p1 = (i / BAR_COUNT) * Math.PI * 2.4;
        const p2 = (i / BAR_COUNT) * Math.PI * 5.1;
        const p3 = (i / BAR_COUNT) * Math.PI * 8.7;
        targetRatio = Math.max(
          MIN_BAR_RATIO,
          0.42
            + Math.sin(t * 2.0 + p1) * 0.27
            + Math.sin(t * 5.5 + p2) * 0.14
            + Math.sin(t * 11.0 + p3) * 0.06
        );
      }

      targetRatio = Math.min(1, Math.max(MIN_BAR_RATIO, targetRatio));

      // Exponential smoothing: fast attack (sounds louder quickly), slow decay
      const prev = prevH[i] ?? MIN_BAR_RATIO;
      const lerpFactor = targetRatio > prev ? 0.6 : 0.28;
      const smoothed = prev + (targetRatio - prev) * lerpFactor;
      prevH[i] = smoothed;

      const barH = Math.max(2, smoothed * H * 0.88);
      const slotW = W / BAR_COUNT;
      const barW = Math.max(1.5, slotW * 0.6);
      const x = i * slotW + (slotW - barW) / 2;
      const y = (H - barH) / 2;
      const r = Math.min(barW / 2, 2);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      drawBar(ctx, x, y, barW, barH, r);
    }

    animFrameRef.current = requestAnimationFrame(drawLoopRef.current);
  }

  // Keep ref current on every render
  drawLoopRef.current = drawLoop;

  // Start / stop waveform animation based on recording state
  useEffect(() => {
    if (audioState === 'recording') {
      // By the time useEffect runs, React has committed the canvas to the DOM
      drawLoopRef.current();
      return () => {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    }
  }, [audioState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (transcribeTimerRef.current) clearTimeout(transcribeTimerRef.current);
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    };
  }, []);

  function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function startRecording(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      showToast({ message: 'Microphone is not supported in this browser', variant: 'error' });
      return;
    }

    recordingStartRef.current = Date.now();
    simulatedRef.current = false;
    prevHeightsRef.current.fill(MIN_BAR_RATIO);

    // Try real mic; fall back to simulated waveform if denied
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    } catch {
      // Permission denied or API unavailable — animate without real data
      simulatedRef.current = true;
    }

    setAudioState('recording');
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function stopRecording(): void {
    // Release microphone resources
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;

    // Clear canvas pixels
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setAudioState('transcribing');
    transcribeTimerRef.current = setTimeout(() => {
      const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      onTranscript(transcript);
      setAudioState('idle');
      setElapsed(0);
      showToast({ message: 'Audio transcribed successfully', variant: 'success' });
    }, 1200);
  }

  function handleClick(): void {
    if (disabled) return;
    if (audioState === 'idle') void startRecording();
    else if (audioState === 'recording') stopRecording();
  }

  const isRecording = audioState === 'recording';
  const isTranscribing = audioState === 'transcribing';

  let label: string;
  if (isRecording) label = 'Stop recording';
  else if (isTranscribing) label = 'Transcribing…';
  else label = 'Record audio input';

  // Render canvas at 2× buffer for crisp retina rendering
  const cssW = size === 'sm' ? 48 : 80;
  const cssH = size === 'sm' ? 18 : 20;

  return (
    <button
      type="button"
      className={[
        styles.micBtn,
        isRecording ? styles.recording : '',
        isTranscribing ? styles.transcribing : '',
        size === 'sm' ? styles.sm : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      aria-label={label}
      title={label}
      aria-pressed={isRecording}
    >
      {isRecording ? (
        <span className="wm-stop-circle" aria-hidden />
      ) : isTranscribing ? (
        <span className={styles.dotsWrap} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      ) : (
        <span className="wm-mic" aria-hidden />
      )}

      {/*
        Always in the DOM so canvasRef.current is non-null before the first
        animation frame. Hidden via display:none when not recording.
      */}
      <canvas
        ref={canvasRef}
        className={[styles.waveform, !isRecording ? styles.waveformHidden : '']
          .filter(Boolean)
          .join(' ')}
        width={cssW * 2}
        height={cssH * 2}
        style={{ width: cssW, height: cssH }}
        aria-hidden
      />

      {isRecording ? (
        <span className={styles.timer} aria-live="off">
          {formatElapsed(elapsed)}
        </span>
      ) : null}
    </button>
  );
}
