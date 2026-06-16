'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { VideoAiResponse, SentimentValue } from '@/data/mock-video-ai-detail';
import {
  AVAILABLE_LANGUAGES,
  TRANSLATIONS,
  RESPONSE_VIDEO_URLS,
  RESPONSE_VOICE_IDX,
  type TranscriptSegment,
} from '@/data/mock-video-ai-reel';
import styles from './VideoPlayerModal.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function segmentTranscript(text: string, durationSeconds: number): TranscriptSegment[] {
  const chunks = text
    .split(/(?<=[.!?,…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length === 0) return [{ start: 0, end: durationSeconds, text }];
  const wordCounts = chunks.map((s) => s.split(/\s+/).length);
  const total = wordCounts.reduce((a, b) => a + b, 0);
  const segments: TranscriptSegment[] = [];
  let time = 0;
  chunks.forEach((chunk, i) => {
    const dur = (wordCounts[i] / total) * durationSeconds;
    segments.push({ start: +time.toFixed(2), end: +(time + Math.max(dur - 0.15, 0.4)).toFixed(2), text: chunk });
    time += dur;
  });
  segments[segments.length - 1].end = durationSeconds;
  return segments;
}

function deriveWordTiming(segs: TranscriptSegment[]) {
  const result: Array<{ word: string; start: number; end: number }> = [];
  for (const seg of segs) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const wordDur = (seg.end - seg.start) / words.length;
    words.forEach((word, i) => {
      result.push({
        word,
        start: +(seg.start + i * wordDur).toFixed(2),
        end: +(seg.start + (i + 1) * wordDur).toFixed(2),
      });
    });
  }
  return result;
}


const SENTIMENT_CFG: Record<SentimentValue, { bg: string; text: string }> = {
  Positive: { bg: '#E1F5EE', text: '#15803d' },
  Neutral:  { bg: '#FAEEDA', text: '#92400e' },
  Negative: { bg: '#FCEBEB', text: '#991b1b' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} type="button"
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={() => onChange(!on)}>
      <span className={styles.toggleKnob} />
    </button>
  );
}

function SentimentBadge({ sentiment }: { sentiment: SentimentValue }) {
  const cfg = SENTIMENT_CFG[sentiment];
  return (
    <span className={styles.sentimentBadge} style={{ background: cfg.bg, color: cfg.text }}>
      {sentiment}
    </span>
  );
}

/**
 * TikTok-style word-by-word caption. Shows the current segment's phrase and
 * highlights each word as it is spoken. Word index comes from speech boundary
 * events (currentWordGlobalIdx ≥ 0) and falls back to the timer otherwise.
 */
function DynamicCaption({
  currentTime, currentWordGlobalIdx, wordTiming, segments,
}: {
  currentTime: number;
  currentWordGlobalIdx: number;
  wordTiming: Array<{ word: string; start: number; end: number }>;
  segments: TranscriptSegment[];
}) {
  const activeSeg =
    segments.find((s) => currentTime >= s.start && currentTime < s.end) ??
    (currentTime >= (segments.at(-1)?.start ?? 0) ? segments.at(-1) : null);

  if (!activeSeg) return null;

  const firstWordIdx = wordTiming.findIndex(
    (w) => w.start >= activeSeg.start - 0.05 && w.start < activeSeg.end + 0.05
  );
  const segWords = wordTiming.filter(
    (w) => w.start >= activeSeg.start - 0.05 && w.start < activeSeg.end + 0.05
  );
  if (segWords.length === 0) return null;

  return (
    <div className={styles.captionDynamic}>
      {segWords.map((w, i) => {
        const gIdx = firstWordIdx + i;
        const useBoundary = currentWordGlobalIdx >= 0;
        const isCurrent = useBoundary
          ? gIdx === currentWordGlobalIdx
          : currentTime >= w.start - 0.05 && currentTime <= w.end + 0.05;
        const isPast = useBoundary
          ? gIdx < currentWordGlobalIdx
          : currentTime > w.end + 0.05;

        return (
          <span
            key={`${w.word}-${activeSeg.start}-${i}`}
            className={[
              styles.dynWord,
              isCurrent ? styles.dynWordActive : '',
              isPast    ? styles.dynWordPast   : '',
            ].filter(Boolean).join(' ')}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

function TranscriptPanel({
  segments, secondarySegments, currentTime, onSeek,
}: {
  segments: TranscriptSegment[];
  secondarySegments?: TranscriptSegment[];
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeIdx = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end);

  useEffect(() => {
    if (listRef.current && activeIdx >= 0) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIdx]);

  return (
    <div className={styles.transcriptList} ref={listRef}>
      {segments.map((seg, i) => {
        const isActive  = i === activeIdx;
        const secondary = secondarySegments?.[i];
        return (
          <div key={`${seg.start}-${i}`}
            className={`${styles.transcriptSeg} ${isActive ? styles.transcriptSegActive : ''}`}>
            <button type="button" className={styles.tsTimestamp}
              onClick={() => onSeek(seg.start)}
              aria-label={`Seek to ${fmtTime(seg.start)}`}>
              {fmtTime(seg.start)}
            </button>
            <div className={styles.tsTextWrap}>
              <p className={`${styles.tsText} ${isActive ? styles.tsTextActive : ''}`}>{seg.text}</p>
              {secondary && <p className={styles.tsTextSecondary}>{secondary.text}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main VideoPlayerModal ─────────────────────────────────────────────────────

export interface VideoPlayerModalProps {
  responses: VideoAiResponse[];
  initialResponseId: string;
  sentimentOverrides: Record<string, SentimentValue>;
  textOverrides: Record<string, { summary?: string; transcript?: string }>;
  onClose: () => void;
}

export function VideoPlayerModal({
  responses, initialResponseId,
  sentimentOverrides, textOverrides,
  onClose,
}: VideoPlayerModalProps) {
  const { showToast } = useWuShowToast();

  const [currentId, setCurrentId] = useState(initialResponseId);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'transcript'>('summary');
  const [activeLang, setActiveLang] = useState('en');
  const [showOriginal, setShowOriginal] = useState(false);
  /** Global word index driven by SpeechSynthesis boundary events; -1 = not active */
  const [currentWordGlobalIdx, setCurrentWordGlobalIdx] = useState(-1);

  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechActiveRef   = useRef(false);
  /** Always holds the latest English voices (avoids stale closures). */
  const englishVoicesRef  = useRef<SpeechSynthesisVoice[]>([]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const responseIdx      = responses.findIndex((r) => r.id === currentId);
  const currentResponse  = responses[responseIdx] ?? responses[0];
  const effectiveSentiment = (sentimentOverrides[currentId] ?? currentResponse?.sentiment) as SentimentValue;
  const displaySummary   = textOverrides[currentId]?.summary ?? currentResponse?.summary ?? '';
  const displayTranscript = textOverrides[currentId]?.transcript ?? currentResponse?.transcript ?? '';
  const totalDuration    = currentResponse?.durationSeconds ?? 18;

  const segments   = useMemo(() => segmentTranscript(displayTranscript, totalDuration), [displayTranscript, totalDuration]);
  const wordTiming = useMemo(() => deriveWordTiming(segments), [segments]);

  const translatedSegs: TranscriptSegment[] = useMemo(() => {
    if (activeLang === 'en') return segments;
    const tlTexts = TRANSLATIONS[activeLang] ?? [];
    return segments.map((seg, i) => ({
      ...seg,
      text: tlTexts[i % Math.max(tlTexts.length, 1)]?.text ?? seg.text,
    }));
  }, [activeLang, segments]);

  // Keep a ref for stable closure access inside speech callbacks
  const translatedSegsRef = useRef(translatedSegs);
  useEffect(() => { translatedSegsRef.current = translatedSegs; }, [translatedSegs]);

  const activeSegIdx   = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end);
  const captionPrimary = activeLang !== 'en'
    ? (translatedSegs[activeSegIdx]?.text ?? '')
    : (segments[activeSegIdx]?.text ?? '');
  const captionSecondary = activeLang !== 'en' && showOriginal
    ? (segments[activeSegIdx]?.text ?? '')
    : undefined;
  void captionPrimary; void captionSecondary; // used below

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const videoUrl = RESPONSE_VIDEO_URLS[currentId]
    ?? `https://assets.mixkit.co/videos/41290/41290-720.mp4`;

  // ── Load TTS voices ─────────────────────────────────────────────────────────
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length === 0) return;
      const en = v.filter((voice) => voice.lang.startsWith('en'));
      englishVoicesRef.current = en.length > 0 ? en : v;
    }
    loadVoices();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => { if (typeof window !== 'undefined') window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Speech synthesis ────────────────────────────────────────────────────────
  function stopSpeech() {
    speechActiveRef.current = false;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }

  /**
   * Speak segments from `fromTime`. Fires `onFirstStart` when the first
   * utterance actually begins (eliminates startup lag vs. the timer).
   * Uses boundary events to update `currentWordGlobalIdx` for precise captions.
   */
  function startSpeechFrom(
    fromTime: number,
    segs: TranscriptSegment[],
    voiceIdx: number,
    onFirstStart: () => void,
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onFirstStart();
      return;
    }
    stopSpeech();
    speechActiveRef.current = true;

    let idx = segs.findIndex((s) => fromTime <= s.end);
    if (idx < 0) { onFirstStart(); return; }

    // Word offset for all segments before idx (for global word indexing)
    let wordOffset = segs
      .slice(0, idx)
      .reduce((sum, seg) => sum + seg.text.split(/\s+/).filter(Boolean).length, 0);

    let timerFired = false;

    function speakNext() {
      if (!speechActiveRef.current || idx >= segs.length) return;

      const seg = segs[idx];
      const segWordOffset = wordOffset; // capture for this closure

      const utt = new SpeechSynthesisUtterance(seg.text);
      utt.rate = 1.0;
      utt.pitch = 1.0;

      const voices = englishVoicesRef.current;
      if (voices.length > 0) {
        utt.voice = voices[voiceIdx % voices.length];
      }

      // Start timer exactly when first word is spoken — eliminates startup lag
      utt.onstart = () => {
        if (!timerFired) {
          timerFired = true;
          onFirstStart();
        }
      };

      // Boundary events: map char position → global word index
      utt.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === 'word') {
          const textBefore = seg.text.substring(0, e.charIndex).trimStart();
          const wordsBeforeInSeg = textBefore === '' ? 0 : textBefore.split(/\s+/).length;
          setCurrentWordGlobalIdx(segWordOffset + wordsBeforeInSeg);
        }
      };

      utt.onend = () => {
        wordOffset += seg.text.split(/\s+/).filter(Boolean).length;
        idx++;
        speakNext();
      };

      window.speechSynthesis.speak(utt);
    }

    speakNext();
  }

  // ── Playback ────────────────────────────────────────────────────────────────
  function beginPlayingFrom(fromTime: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(true);
    setCurrentWordGlobalIdx(-1);

    const voiceIdx =
      (RESPONSE_VOICE_IDX[currentId] ?? responseIdx) %
      Math.max(englishVoicesRef.current.length, 1);

    startSpeechFrom(fromTime, translatedSegsRef.current, voiceIdx, () => {
      // Timer starts in sync with speech onset
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = +(prev + 0.1).toFixed(1);
          if (next >= totalDuration) {
            clearInterval(intervalRef.current!);
            stopSpeech();
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 100);
    });
  }

  function pausePlay() {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopSpeech();
    setCurrentWordGlobalIdx(-1);
  }

  function togglePlay() {
    isPlaying ? pausePlay() : beginPlayingFrom(currentTime);
  }

  function seekTo(t: number) {
    const clamped = Math.max(0, Math.min(totalDuration, t));
    setCurrentTime(clamped);
    if (isPlaying) beginPlayingFrom(clamped);
  }

  function navigateResponse(dir: 1 | -1) {
    pausePlay();
    setCurrentTime(0);
    setCurrentWordGlobalIdx(-1);
    const newIdx = Math.max(0, Math.min(responses.length - 1, responseIdx + dir));
    setCurrentId(responses[newIdx].id);
  }

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopSpeech();
  }, []);

  useEffect(() => {
    stopSpeech();
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentWordGlobalIdx(-1);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [currentId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!currentResponse) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal aria-label="Video response player">
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>

        {/* ── Top bar ───────────────────────────────────── */}
        <div className={styles.topBar}>
          <button type="button" className={styles.navBtn}
            onClick={() => navigateResponse(-1)} disabled={responseIdx <= 0}
            aria-label="Previous response">
            <span className="wm-chevron-left" aria-hidden />
          </button>
          <span className={styles.navCounter}>
            {responseIdx + 1} <span className={styles.navOf}>of</span> {responses.length}
          </span>
          <button type="button" className={styles.navBtn}
            onClick={() => navigateResponse(1)} disabled={responseIdx >= responses.length - 1}
            aria-label="Next response">
            <span className="wm-chevron-right" aria-hidden />
          </button>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close player">
            <span className="wm-close" aria-hidden />
          </button>
        </div>

        {/* ── Main area ─────────────────────────────────── */}
        <div className={styles.mainArea}>

          {/* Portrait video panel */}
          <div className={styles.videoPanel}>
            <div className={styles.videoWrap}>

              {/* Blurred background fill — same video, heavily blurred */}
              <video
                key={`bg-${currentId}`}
                src={videoUrl}
                autoPlay loop muted playsInline
                aria-hidden
                className={styles.avatarBgBlur}
              />

              {/* Primary portrait video */}
              <video
                key={currentId}
                src={videoUrl}
                autoPlay loop muted playsInline
                className={styles.avatarVideo}
              />

              {/* Bottom gradient for caption readability */}
              <div className={styles.portraitGradient} />

              {/* REC badge */}
              <div className={styles.recBadge} aria-hidden>
                <span className={styles.recDot} />
                REC
              </div>

              {/* Speaking audio wave bars */}
              {isPlaying && (
                <div className={styles.speakWave} aria-hidden>
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                </div>
              )}

              {/* TikTok-style dynamic caption */}
              {ccEnabled && (
                <DynamicCaption
                  currentTime={currentTime}
                  currentWordGlobalIdx={currentWordGlobalIdx}
                  wordTiming={wordTiming}
                  segments={segments}
                />
              )}
            </div>

            {/* Control bar */}
            <div className={styles.controlBar}>
              <button type="button" className={styles.ctrlBtn} onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}>
                <span className={isPlaying ? 'wm-pause' : 'wm-play-arrow'} aria-hidden />
              </button>

              <div className={styles.progressBar}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo(((e.clientX - rect.left) / rect.width) * totalDuration);
                }}
                role="slider" aria-label="Seek"
                aria-valuenow={Math.round(currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.round(totalDuration)}>
                <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                <div className={styles.progressThumb} style={{ left: `${progressPct}%` }} />
              </div>

              <span className={styles.timeDisplay}>{fmtTime(currentTime)}</span>

              <div className={styles.ctrlRight}>
                {/* CC: direct toggle for TikTok captions */}
                <button type="button"
                  className={`${styles.ctrlBtnCC} ${ccEnabled ? styles.ctrlBtnActive : ''}`}
                  onClick={() => setCcEnabled((v) => !v)}
                  aria-label="Toggle captions" title="Dynamic captions">
                  CC
                </button>

                {/* Fullscreen (mock) */}
                <button type="button" className={styles.ctrlBtn}
                  title="Fullscreen" aria-label="Fullscreen"
                  onClick={() => showToast({ message: 'Fullscreen not available in prototype', variant: 'info' })}>
                  <span className="wm-fullscreen" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────── */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarRespondentRow}>
                <span className={styles.respondentId}>{currentResponse.id}</span>
                <span className={styles.respondentDate}>{currentResponse.date}</span>
              </div>
              <div className={styles.sidebarActionsRow}>
                <SentimentBadge sentiment={effectiveSentiment} />
                <div className={styles.sidebarActions}>
                  {[
                    { icon: 'wm-thumb-up', label: 'Like', msg: 'Liked' },
                    { icon: 'wm-thumb-down', label: 'Dislike', msg: 'Disliked' },
                    { icon: 'wm-bookmark', label: 'Bookmark', msg: 'Bookmarked' },
                  ].map(({ icon, label, msg }) => (
                    <button key={icon} type="button" className={styles.sidebarActionBtn}
                      title={label} aria-label={label}
                      onClick={() => showToast({ message: msg, variant: 'success' })}>
                      <span className={icon} aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sidebarTabRow} role="tablist">
              {(['summary', 'transcript'] as const).map((tab) => (
                <button key={tab} role="tab" aria-selected={sidebarTab === tab}
                  className={`${styles.sidebarTab} ${sidebarTab === tab ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.sidebarContent}>
              {sidebarTab === 'summary' && (
                <p className={styles.summaryText}>{displaySummary}</p>
              )}
              {sidebarTab === 'transcript' && (
                <div className={styles.transcriptPanel}>
                  {/* ── Translation bar ── */}
                  <div className={styles.transcriptLangBar}>
                    <span className="wm-translate" aria-hidden
                      style={{ color: '#64748b', fontSize: '0.9375rem', flexShrink: 0 }} />
                    <select
                      className={styles.langSelect}
                      value={activeLang}
                      onChange={(e) => {
                        setActiveLang(e.target.value);
                        if (e.target.value !== 'en') setSidebarTab('transcript');
                      }}
                      aria-label="Select transcript language"
                    >
                      {AVAILABLE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.native} — {lang.label}
                        </option>
                      ))}
                    </select>
                    {activeLang !== 'en' && (
                      <label className={styles.showOrigInline}>
                        <input
                          type="checkbox"
                          checked={showOriginal}
                          onChange={(e) => setShowOriginal(e.target.checked)}
                        />
                        Show original
                      </label>
                    )}
                  </div>

                  {/* ── Segment list ── */}
                  <div className={styles.transcriptScrollArea}>
                    <TranscriptPanel
                      segments={translatedSegs}
                      secondarySegments={activeLang !== 'en' && showOriginal ? segments : undefined}
                      currentTime={currentTime}
                      onSeek={(t) => { seekTo(t); }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
