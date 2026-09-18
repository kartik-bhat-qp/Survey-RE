'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import {
  buildWaveformBars,
  deriveVoiceAnswerInputType,
  emptyVoiceAnswer,
  formatVoiceDuration,
  isVoiceAnswerSubmittable,
  mockTranscribeVoiceAnswer,
  pickMockDictationPhrase,
  startMockDictationStream,
  type MockDictationStream,
  type VoiceAnswerUploadStatus,
  type VoiceAnswerValue,
} from '@/data/mock-voice-answer';
import { DictationWaveform } from '@/components/ui/DictationWaveform';
import styles from './VoiceAnswerField.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const CHIP_BARS = 28;
const LIVE_BAR_COUNT = 24;
/** Auto-stop dictation after this many ms without new speech. */
const DICTATION_SILENCE_MS = 3000;

type FieldPhase = 'empty' | 'recording' | 'recorded';

export type VoiceAnswerFieldMode = 'voice-clip' | 'dictation';

export interface VoiceAnswerFieldProps {
  value?: VoiceAnswerValue;
  onChange?: (value: VoiceAnswerValue) => void;
  /** Empty-state placeholder for the text input. */
  placeholder?: string;
  /** Caption placeholder when a recording exists. */
  captionPlaceholder?: string;
  /** Called when Enter is pressed with a submittable value (optional). */
  onSubmit?: (value: VoiceAnswerValue) => void;
  disabled?: boolean;
  className?: string;
  /** Compact single-line empty state (single-row / email). */
  compact?: boolean;
  /** Hide field border when nested inside another bordered card. */
  embedded?: boolean;
  /**
   * `voice-clip` — record, store audio, then batch-transcribe (default).
   * `dictation` — live speech-to-text into the text field (no audio file).
   */
  mode?: VoiceAnswerFieldMode;
}

function DictationAnswerField({
  value,
  onChange,
  placeholder = 'Type your answer here…',
  onSubmit,
  disabled = false,
  className = '',
  compact = false,
  embedded = false,
}: Omit<VoiceAnswerFieldProps, 'mode' | 'captionPlaceholder'>) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value?.textResponse ?? '');
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');

  const textRef = useRef<HTMLTextAreaElement>(null);
  const prefixRef = useRef(value?.textResponse ?? '');
  const sessionCommittedRef = useRef('');
  const interimRef = useRef('');
  const mockStreamRef = useRef<MockDictationStream | null>(null);
  const listeningRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveformActivityRef = useRef(0);

  function bumpWaveformActivity(): void {
    waveformActivityRef.current = Math.min(1, waveformActivityRef.current + 0.45);
  }

  function joinParts(...parts: string[]): string {
    return parts
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
  }

  function publishSession(committed: string, interimText: string): void {
    const visible = joinParts(prefixRef.current, committed, interimText);
    sessionCommittedRef.current = committed;
    interimRef.current = interimText;
    setText(joinParts(prefixRef.current, committed));
    setInterim(interimText);
    onChange?.({
      ...emptyVoiceAnswer(),
      textResponse: visible || undefined,
      inputType: visible.trim() ? 'text' : 'empty',
    });
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      if (!compact) {
        el.style.height = 'auto';
        el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
      }
      el.scrollTop = el.scrollHeight;
    });
  }

  function setTypedText(next: string): void {
    prefixRef.current = next;
    sessionCommittedRef.current = '';
    setText(next);
    setInterim('');
    onChange?.({
      ...emptyVoiceAnswer(),
      textResponse: next || undefined,
      inputType: next.trim() ? 'text' : 'empty',
    });
  }

  function clearSilenceTimer(): void {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function resetSilenceTimer(): void {
    clearSilenceTimer();
    if (!listeningRef.current) return;
    silenceTimerRef.current = setTimeout(() => {
      if (listeningRef.current) endListening();
    }, DICTATION_SILENCE_MS);
  }

  function stopMockStream(): void {
    mockStreamRef.current?.stop();
    mockStreamRef.current = null;
  }

  function endListening(): void {
    const committed = joinParts(
      prefixRef.current,
      sessionCommittedRef.current,
      interimRef.current
    );
    prefixRef.current = committed;
    sessionCommittedRef.current = '';
    interimRef.current = '';
    listeningRef.current = false;
    clearSilenceTimer();
    stopMockStream();
    waveformActivityRef.current = 0;
    setListening(false);
    setInterim('');
    setText(committed);
    onChange?.({
      ...emptyVoiceAnswer(),
      textResponse: committed || undefined,
      inputType: committed.trim() ? 'text' : 'empty',
    });
  }

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      clearSilenceTimer();
      stopMockStream();
    };
  }, []);

  function startMockStreamForPhrase(phrase: string): void {
    mockStreamRef.current = startMockDictationStream(
      phrase,
      (committed, interimText) => {
        if (!listeningRef.current) return;
        bumpWaveformActivity();
        publishSession(committed, interimText);
        resetSilenceTimer();
      },
      () => {
        if (!listeningRef.current) return;
        bumpWaveformActivity();
        resetSilenceTimer();
      }
    );
  }

  function startDictation(): void {
    if (disabled || listeningRef.current) return;

    prefixRef.current = text;
    sessionCommittedRef.current = '';
    setInterim('');
    listeningRef.current = true;
    setListening(true);
    bumpWaveformActivity();
    resetSilenceTimer();

    const phrase = pickMockDictationPhrase(placeholder);
    startMockStreamForPhrase(phrase);
  }

  function handleTextChange(next: string): void {
    if (listening) return;
    setTypedText(next);
  }

  function handleSubmit(): void {
    const visible = joinParts(text, interim);
    const payload: VoiceAnswerValue = {
      ...emptyVoiceAnswer(),
      textResponse: visible || undefined,
    };
    payload.inputType = deriveVoiceAnswerInputType(payload);
    if (!isVoiceAnswerSubmittable(payload)) return;
    onSubmit?.(payload);
  }

  const displayText = interim ? joinParts(text, interim) : text;

  const rootClass = [
    styles.field,
    embedded ? styles.fieldEmbedded : '',
    (focused || listening) && !embedded ? styles.fieldFocused : '',
    disabled ? styles.fieldDisabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-phase={listening ? 'dictating' : 'empty'}>
      <div className={styles.emptyRow}>
        <textarea
          ref={textRef}
          className={styles.textInput}
          value={displayText}
          placeholder={placeholder}
          rows={compact ? 1 : 4}
          disabled={disabled}
          readOnly={listening}
          aria-label="Your answer"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (compact && e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {listening ? (
          <div className={styles.dictationControls} role="group" aria-label="Dictation in progress">
            <DictationWaveform active={listening} activityRef={waveformActivityRef} />
            <WuMenu
              Trigger={
                <button
                  type="button"
                  className={styles.dictationLangTrigger}
                  aria-label="Dictation language"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`wm-keyboard-arrow-down ${styles.dictationLangCaret}`} aria-hidden />
                </button>
              }
              align="end"
            >
              <div className={styles.dictationLangMenu} role="status" aria-live="polite">
                <span className={styles.dictationLangComingSoonBadge}>Coming soon</span>
                <p className={styles.dictationLangComingSoonText}>
                  Dictation language selection is not available yet.
                </p>
              </div>
            </WuMenu>
            <button
              type="button"
              className={styles.dictationStopBtn}
              onClick={(e) => {
                e.stopPropagation();
                endListening();
              }}
              aria-label="Stop dictation"
            >
              <span className="wm-stop-circle" aria-hidden />
            </button>
          </div>
        ) : (
          <WuTooltip content="Dictation">
            <button
              type="button"
              className={styles.micBtn}
              onClick={(e) => {
                e.stopPropagation();
                startDictation();
              }}
              disabled={disabled}
              aria-label="Dictation"
            >
              <span className="wm-mic" aria-hidden />
            </button>
          </WuTooltip>
        )}
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {listening ? 'Dictation active' : ''}
      </span>
    </div>
  );
}

export function VoiceAnswerField({
  value,
  onChange,
  placeholder = 'Type your answer here…',
  captionPlaceholder = 'Add a note, or tap send',
  onSubmit,
  disabled = false,
  className = '',
  compact = false,
  embedded = false,
  mode = 'voice-clip',
}: VoiceAnswerFieldProps) {
  if (mode === 'dictation') {
    return (
      <DictationAnswerField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onSubmit={onSubmit}
        disabled={disabled}
        className={className}
        compact={compact}
        embedded={embedded}
      />
    );
  }

  return (
    <VoiceClipAnswerField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      captionPlaceholder={captionPlaceholder}
      onSubmit={onSubmit}
      disabled={disabled}
      className={className}
      compact={compact}
      embedded={embedded}
    />
  );
}

function VoiceClipAnswerField({
  value,
  onChange,
  placeholder = 'Type your answer here…',
  captionPlaceholder = 'Add a note, or tap send',
  onSubmit,
  disabled = false,
  className = '',
  compact = false,
  embedded = false,
}: Omit<VoiceAnswerFieldProps, 'mode'>) {
  const [phase, setPhase] = useState<FieldPhase>(value?.audioUrl ? 'recorded' : 'empty');
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value?.textResponse ?? '');
  const [caption, setCaption] = useState(value?.captionText ?? '');
  const [audioUrl, setAudioUrl] = useState(value?.audioUrl ?? '');
  const [duration, setDuration] = useState(value?.audioDuration ?? 0);
  const [bars, setBars] = useState<number[]>(value?.waveformBars ?? []);
  const [uploadStatus, setUploadStatus] = useState<VoiceAnswerUploadStatus>(
    value?.uploadStatus ?? 'idle'
  );
  const [transcriptText, setTranscriptText] = useState<string | null>(
    value?.transcriptText ?? null
  );
  const [transcriptConfidence, setTranscriptConfidence] = useState<number | null>(
    value?.transcriptConfidence ?? null
  );
  const [transcriptPending, setTranscriptPending] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [liveAnnounce, setLiveAnnounce] = useState('');
  const [liveBars, setLiveBars] = useState<number[]>(() =>
    Array.from({ length: LIVE_BAR_COUNT }, () => 0.35)
  );

  const textRef = useRef<HTMLTextAreaElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const samplesRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sampleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sttRequestIdRef = useRef(0);
  const elapsedRef = useRef(0);
  const captionPreserveRef = useRef('');
  const previousClipRef = useRef<{
    url: string;
    duration: number;
    bars: number[];
    transcriptText: string | null;
    transcriptConfidence: number | null;
  } | null>(null);

  function emitPatch(patch: Partial<VoiceAnswerValue>): void {
    const merged: VoiceAnswerValue = {
      audioUrl: patch.audioUrl !== undefined ? patch.audioUrl || undefined : audioUrl || undefined,
      audioDuration:
        patch.audioDuration !== undefined
          ? patch.audioDuration || undefined
          : duration || undefined,
      waveformBars: patch.waveformBars ?? (bars.length ? bars : undefined),
      captionText: patch.captionText !== undefined ? patch.captionText : caption || undefined,
      textResponse: patch.textResponse !== undefined ? patch.textResponse : text || undefined,
      transcriptText:
        patch.transcriptText !== undefined ? patch.transcriptText : transcriptText,
      transcriptConfidence:
        patch.transcriptConfidence !== undefined
          ? patch.transcriptConfidence
          : transcriptConfidence,
      uploadStatus: patch.uploadStatus ?? uploadStatus,
      inputType: 'empty',
    };

    if (merged.audioUrl) {
      merged.textResponse = undefined;
    } else {
      merged.captionText = undefined;
      merged.audioDuration = undefined;
      merged.waveformBars = undefined;
      merged.transcriptText = null;
      merged.transcriptConfidence = null;
    }

    merged.inputType = deriveVoiceAnswerInputType(merged);
    onChange?.(merged);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
      if (playTickRef.current) clearInterval(playTickRef.current);
      sttRequestIdRef.current += 1;
    };
  }, []);

  function releaseRecordingTimers(): void {
    if (sampleIntervalRef.current) {
      clearInterval(sampleIntervalRef.current);
      sampleIntervalRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function cancelInFlightUpload(): void {
    if (uploadTimerRef.current) {
      clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }
  }

  function cancelInFlightStt(): void {
    sttRequestIdRef.current += 1;
    setTranscriptPending(false);
  }

  function runAutoTranscribe(url: string, dur: number): void {
    const requestId = ++sttRequestIdRef.current;
    setTranscriptPending(true);
    setTranscriptText(null);
    setTranscriptConfidence(null);
    setTranscriptExpanded(false);
    emitPatch({
      audioUrl: url,
      audioDuration: dur,
      transcriptText: null,
      transcriptConfidence: null,
    });

    void mockTranscribeVoiceAnswer(url, dur).then((result) => {
      if (requestId !== sttRequestIdRef.current) return;
      setTranscriptText(result.transcriptText);
      setTranscriptConfidence(result.transcriptConfidence);
      setTranscriptPending(false);
      emitPatch({
        audioUrl: url,
        audioDuration: dur,
        transcriptText: result.transcriptText,
        transcriptConfidence: result.transcriptConfidence,
      });
    });
  }

  function simulateUpload(url: string, dur: number, wave: number[]): void {
    cancelInFlightUpload();
    setUploadStatus('uploading');
    emitPatch({
      audioUrl: url,
      audioDuration: dur,
      waveformBars: wave,
      uploadStatus: 'uploading',
      transcriptText: null,
      transcriptConfidence: null,
    });
    uploadTimerRef.current = setTimeout(() => {
      setUploadStatus('ready');
      emitPatch({
        audioUrl: url,
        audioDuration: dur,
        waveformBars: wave,
        uploadStatus: 'ready',
      });
      runAutoTranscribe(url, dur);
    }, 600);
  }

  function finishRecording(dur: number, mockUrl: string): void {
    const wave = buildWaveformBars(samplesRef.current, CHIP_BARS);
    if (previousClipRef.current?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(previousClipRef.current.url);
    }
    previousClipRef.current = null;

    setBars(wave);
    setDuration(Math.max(1, dur));
    setAudioUrl(mockUrl);
    setPhase('recorded');
    setElapsed(0);
    setCaption(captionPreserveRef.current);
    setTranscriptExpanded(false);
    setTranscriptText(null);
    setTranscriptConfidence(null);
    simulateUpload(mockUrl, Math.max(1, dur), wave);
    requestAnimationFrame(() => captionRef.current?.focus());
  }

  function startRecording(): void {
    if (disabled) return;

    captionPreserveRef.current = caption || text;
    if (audioUrl) {
      previousClipRef.current = {
        url: audioUrl,
        duration,
        bars: [...bars],
        transcriptText,
        transcriptConfidence,
      };
    }
    cancelInFlightUpload();
    cancelInFlightStt();
    setIsPlaying(false);
    setPlayProgress(0);
    if (playTickRef.current) {
      clearInterval(playTickRef.current);
      playTickRef.current = null;
    }

    setPhase('recording');
    setUploadStatus('idle');
    setElapsed(0);
    elapsedRef.current = 0;
    samplesRef.current = [];
    setLiveAnnounce('Recording started');

    sampleIntervalRef.current = setInterval(() => {
      const next = Array.from({ length: LIVE_BAR_COUNT }, () => 0.18 + Math.random() * 0.72);
      samplesRef.current.push(0.2 + Math.random() * 0.6);
      setLiveBars(next);
    }, 140);

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      setLiveAnnounce(`Recording ${formatVoiceDuration(elapsedRef.current)}`);
    }, 1000);
  }

  function stopRecording(): void {
    releaseRecordingTimers();
    setLiveAnnounce('Recording stopped');
    finishRecording(Math.max(1, elapsedRef.current), `mock://voice/${Date.now()}`);
  }

  function cancelRecording(): void {
    releaseRecordingTimers();
    samplesRef.current = [];
    setElapsed(0);
    setLiveAnnounce('Recording cancelled');

    const prev = previousClipRef.current;
    if (prev) {
      setAudioUrl(prev.url);
      setDuration(prev.duration);
      setBars(prev.bars);
      setTranscriptText(prev.transcriptText);
      setTranscriptConfidence(prev.transcriptConfidence);
      setCaption(captionPreserveRef.current);
      setPhase('recorded');
      setUploadStatus('ready');
      previousClipRef.current = null;
      requestAnimationFrame(() => captionRef.current?.focus());
      return;
    }

    setPhase('empty');
    setCaption('');
    setText(captionPreserveRef.current);
  }

  function removeRecording(): void {
    cancelInFlightUpload();
    cancelInFlightStt();
    if (playTickRef.current) {
      clearInterval(playTickRef.current);
      playTickRef.current = null;
    }
    setAudioUrl('');
    setDuration(0);
    setBars([]);
    setTranscriptText(null);
    setTranscriptConfidence(null);
    setTranscriptExpanded(false);
    setIsPlaying(false);
    setPlayProgress(0);
    setUploadStatus('idle');
    setPhase('empty');
    const preserved = caption.trim();
    setText(preserved);
    setCaption('');
    captionPreserveRef.current = '';
    emitPatch({
      audioUrl: '',
      audioDuration: 0,
      waveformBars: [],
      captionText: '',
      textResponse: preserved,
      transcriptText: null,
      transcriptConfidence: null,
      uploadStatus: 'idle',
    });
    requestAnimationFrame(() => textRef.current?.focus());
  }

  function togglePlay(): void {
    if (!audioUrl) return;
    if (isPlaying) {
      setIsPlaying(false);
      if (playTickRef.current) {
        clearInterval(playTickRef.current);
        playTickRef.current = null;
      }
      return;
    }
    setIsPlaying(true);
    let t = playProgress * Math.max(1, duration);
    playTickRef.current = setInterval(() => {
      t += 0.08;
      const p = Math.min(1, t / Math.max(1, duration));
      setPlayProgress(p);
      if (p >= 1) {
        setIsPlaying(false);
        setPlayProgress(0);
        if (playTickRef.current) {
          clearInterval(playTickRef.current);
          playTickRef.current = null;
        }
      }
    }, 80);
  }

  function handleTextChange(next: string): void {
    setText(next);
    emitPatch({ textResponse: next, audioUrl: '', captionText: '' });
  }

  function handleCaptionChange(next: string): void {
    setCaption(next);
    captionPreserveRef.current = next;
    emitPatch({
      captionText: next,
      audioUrl,
      audioDuration: duration,
      waveformBars: bars,
      textResponse: '',
      transcriptText,
      transcriptConfidence,
    });
    const el = captionRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  function handleSubmit(): void {
    const payload: VoiceAnswerValue = {
      ...emptyVoiceAnswer(),
      audioUrl: audioUrl || undefined,
      audioDuration: audioUrl ? duration : undefined,
      waveformBars: audioUrl ? bars : undefined,
      captionText: audioUrl ? caption || undefined : undefined,
      textResponse: audioUrl ? undefined : text || undefined,
      transcriptText: audioUrl ? transcriptText : null,
      transcriptConfidence: audioUrl ? transcriptConfidence : null,
      uploadStatus: audioUrl ? uploadStatus : 'idle',
    };
    payload.inputType = deriveVoiceAnswerInputType(payload);
    if (!isVoiceAnswerSubmittable(payload)) return;
    onSubmit?.(payload);
  }

  function autoGrowEmpty(): void {
    const el = textRef.current;
    if (!el || compact) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, compact ? 24 : 96)}px`;
  }

  const showTranscriptToggle = Boolean(transcriptText) && !transcriptPending;
  const isRecording = phase === 'recording';

  const rootClass = [
    styles.field,
    embedded ? styles.fieldEmbedded : '',
    focused && !embedded && !isRecording ? styles.fieldFocused : '',
    disabled ? styles.fieldDisabled : '',
    isRecording ? styles.fieldRecording : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (phase === 'recorded') {
    return (
      <div className={rootClass} data-phase="recorded">
        <div className={styles.recordedBody}>
          <div className={styles.chip} role="group" aria-label="Voice recording">
            <button
              type="button"
              className={styles.playBtn}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
              disabled={uploadStatus === 'uploading'}
            >
              <span className={isPlaying ? 'wm-pause' : 'wm-play-arrow'} aria-hidden />
            </button>
            <div className={styles.chipWave} aria-hidden>
              {bars.map((h, i) => {
                const played = i / Math.max(1, bars.length - 1) <= playProgress;
                return (
                  <span
                    key={i}
                    className={styles.chipBar}
                    style={{
                      height: `${Math.max(3, h * 18)}px`,
                      opacity: played ? 1 : 0.45,
                    }}
                  />
                );
              })}
            </div>
            <span className={styles.duration}>{formatVoiceDuration(duration)}</span>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={removeRecording}
              aria-label="Remove recording"
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>

          {uploadStatus === 'uploading' ? (
            <p className={styles.uploadHint}>Uploading audio…</p>
          ) : null}
          {uploadStatus === 'retry' ? (
            <button type="button" className={styles.retryBtn} onClick={() => startRecording()}>
              Upload failed — tap to re-record
            </button>
          ) : null}

          {transcriptPending ? <p className={styles.uploadHint}>Transcribing…</p> : null}

          {showTranscriptToggle ? (
            <div className={styles.transcriptSection}>
              <div className={styles.transcriptToggleRow}>
                <button
                  type="button"
                  className={styles.transcriptToggle}
                  onClick={() => setTranscriptExpanded((open) => !open)}
                  aria-expanded={transcriptExpanded}
                >
                  <span
                    className={`wm-chevron-down ${styles.transcriptChevron} ${
                      transcriptExpanded ? styles.transcriptChevronOpen : ''
                    }`}
                    aria-hidden
                  />
                  {transcriptExpanded ? 'Hide transcript' : 'Show transcript'}
                </button>
                <span className={styles.betaBadge} aria-label="Beta">
                  Beta
                </span>
              </div>

              {transcriptExpanded ? (
                <div
                  className={styles.transcriptBox}
                  role="region"
                  aria-label="Transcript (read-only)"
                  aria-readonly="true"
                >
                  <p className={styles.transcriptText}>{transcriptText}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.captionBlock}>
            <textarea
              ref={captionRef}
              className={styles.captionInput}
              value={caption}
              placeholder={captionPlaceholder}
              rows={1}
              disabled={disabled || uploadStatus === 'uploading'}
              aria-label="Caption"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => handleCaptionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} data-phase={isRecording ? 'recording' : 'empty'}>
      <div className={styles.emptyRow} aria-hidden={isRecording}>
        <textarea
          ref={textRef}
          className={styles.textInput}
          value={text}
          placeholder={isRecording ? '' : placeholder}
          rows={compact ? 1 : 4}
          disabled={disabled || isRecording}
          aria-label="Your answer"
          tabIndex={isRecording ? -1 : 0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            handleTextChange(e.target.value);
            autoGrowEmpty();
          }}
          onKeyDown={(e) => {
            if (compact && e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {!isRecording ? (
          <WuTooltip content="Record a voice response">
            <button
              type="button"
              className={styles.micBtn}
              onClick={startRecording}
              disabled={disabled}
              aria-label="Record a voice response"
            >
              <span className="wm-mic" aria-hidden />
            </button>
          </WuTooltip>
        ) : (
          <span className={styles.micPlaceholder} aria-hidden />
        )}
      </div>

      {isRecording ? (
        <div className={styles.recordingOverlay} role="group" aria-label="Recording in progress">
          <div className={styles.dimLayer} aria-hidden />
          <div className={styles.recCard}>
            <button
              type="button"
              className={styles.recCancel}
              onClick={cancelRecording}
              aria-label="Cancel recording"
            >
              <span className="wm-close" aria-hidden />
            </button>
            <div className={styles.recWave} aria-hidden>
              {liveBars.map((h, i) => (
                <span
                  key={i}
                  className={styles.recBar}
                  style={{ height: `${Math.max(4, h * 22)}px` }}
                />
              ))}
            </div>
            <span className={styles.recTimer}>{formatVoiceDuration(elapsed)}</span>
            <button
              type="button"
              className={styles.recConfirm}
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <span className="wm-check" aria-hidden />
            </button>
          </div>
          <span className={styles.srOnly} aria-live="polite">
            {liveAnnounce}
          </span>
        </div>
      ) : null}
    </div>
  );
}
