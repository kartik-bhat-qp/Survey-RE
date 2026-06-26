'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { VideoAiResponse, SentimentValue } from '@/data/mock-video-ai-detail';
import {
  getNativeLangCode,
  getTranslatedSummary,
  getTranslatedTranscript,
  getLanguageLabel,
} from '@/data/mock-video-ai-translations';
import {
  AVAILABLE_LANGUAGES,
  RESPONSE_VIDEO_URLS,
  RESPONSE_VOICE_IDX,
  type TranscriptSegment,
  type ReelClip,
} from '@/data/mock-video-ai-reel';
import { SENTIMENT_BADGE_COLORS } from '@/data/sentiment-colors';
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
  const cfg = SENTIMENT_BADGE_COLORS[sentiment];
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
  onSaveClip?: (clip: ReelClip) => void;
  onClose: () => void;
}

export function VideoPlayerModal({
  responses, initialResponseId,
  sentimentOverrides, textOverrides,
  onSaveClip,
  onClose,
}: VideoPlayerModalProps) {
  const { showToast } = useWuShowToast();
  const wick = useWickUILib();

  const [currentId, setCurrentId] = useState(initialResponseId);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'transcript'>('summary');
  const [activeLang, setActiveLang] = useState(() => {
    const initial = responses.find((r) => r.id === initialResponseId) ?? responses[0];
    return initial ? getNativeLangCode(initial) : 'en';
  });
  const [showOriginal, setShowOriginal] = useState(false);
  const [reelPanelOpen, setReelPanelOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);
  const [clipTheme, setClipTheme] = useState('');
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
  const nativeLang = currentResponse ? getNativeLangCode(currentResponse) : 'en';
  const textOverride = textOverrides[currentId];
  const originalSummary = textOverride?.summary ?? currentResponse?.summary ?? '';
  const originalTranscript = textOverride?.transcript ?? currentResponse?.transcript ?? '';
  const displaySummary = currentResponse
    ? getTranslatedSummary(currentResponse, activeLang, textOverride)
    : '';
  const displayTranscript = currentResponse
    ? getTranslatedTranscript(currentResponse, activeLang, textOverride)
    : '';
  const totalDuration    = currentResponse?.durationSeconds ?? 18;

  const segments = useMemo(
    () => segmentTranscript(displayTranscript, totalDuration),
    [displayTranscript, totalDuration],
  );
  const originalSegments = useMemo(
    () => segmentTranscript(originalTranscript, totalDuration),
    [originalTranscript, totalDuration],
  );
  const wordTiming = useMemo(() => deriveWordTiming(segments), [segments]);

  const segmentsRef = useRef(segments);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);

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

    startSpeechFrom(fromTime, segmentsRef.current, voiceIdx, () => {
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

  function openReelPanel() {
    setClipStart(Math.floor(currentTime));
    setClipEnd(Math.min(Math.floor(currentTime) + 10, Math.floor(totalDuration) || Math.floor(currentTime) + 10));
    setClipTheme('');
    setReelPanelOpen(true);
  }

  function closeReelPanel() {
    setReelPanelOpen(false);
  }

  function handleModalOpenChange(open: boolean) {
    if (open) return;
    if (reelPanelOpen) {
      closeReelPanel();
      return;
    }
    setModalOpen(false);
    onClose();
  }

  function handleSaveReel() {
    if (!onSaveClip || clipEnd <= clipStart) return;
    const dur = clipEnd - clipStart;
    const m = Math.floor(dur / 60);
    const s = dur % 60;
    onSaveClip({
      clipNumber: Date.now(),
      responseId: currentId,
      start: clipStart,
      end: clipEnd,
      duration: `${m}:${String(s).padStart(2, '0')}`,
      durationSeconds: dur,
      transcript: displayTranscript.slice(0, 120),
      sentiment: effectiveSentiment,
      theme: clipTheme.trim() || 'Highlight',
      language: currentResponse.language ?? 'EN',
    });
    setReelPanelOpen(false);
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
    setReelPanelOpen(false);
    setClipTheme('');
    setShowOriginal(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const response = responses.find((r) => r.id === currentId);
    if (response) {
      setActiveLang(getNativeLangCode(response));
    }
  }, [currentId, responses]);

  useEffect(() => {
    if (!isPlaying) return;
    beginPlayingFrom(currentTime);
    // Re-sync captions and speech when display language changes during playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLang]);

  if (!currentResponse || !wick) return null;

  const reelDurationLabel = fmtTime(Math.max(0, clipEnd - clipStart));
  const {
    WuModal,
    WuModalHeader,
    WuModalContent,
    WuButton,
    WuInput,
  } = wick;

  const reelFormFields = (
    <div className={styles.reelPanelContent}>
      <p className={styles.reelModalIntro}>
        Select the start and end of the highlight from this response. The clip will be saved to the Reels tab.
      </p>

      <div className={styles.reelDurationPill}>
        <span className="wm-schedule" aria-hidden />
        Clip duration: <strong>{reelDurationLabel}</strong>
        <span className={styles.reelDurationRange}>
          ({fmtTime(clipStart)} – {fmtTime(clipEnd)})
        </span>
      </div>

      <div className={styles.reelTimeGrid}>
        <div className={styles.reelField}>
          <label className={styles.reelLabel} htmlFor="reel-start">Start (seconds)</label>
          <div className={styles.reelInputRow}>
            <WuInput
              id="reel-start"
              variant="outlined"
              type="number"
              value={String(clipStart)}
              onChange={(e) =>
                setClipStart(Math.max(0, Math.min(clipEnd - 1, Number(e.target.value) || 0)))
              }
              aria-label="Clip start time in seconds"
            />
            <WuButton
              variant="secondary"
              size="sm"
              onClick={() => setClipStart(Math.floor(currentTime))}
              title="Use current playhead"
            >
              Use playhead
            </WuButton>
          </div>
        </div>

        <div className={styles.reelField}>
          <label className={styles.reelLabel} htmlFor="reel-end">End (seconds)</label>
          <div className={styles.reelInputRow}>
            <WuInput
              id="reel-end"
              variant="outlined"
              type="number"
              value={String(clipEnd)}
              onChange={(e) =>
                setClipEnd(Math.max(clipStart + 1, Math.min(Math.floor(totalDuration), Number(e.target.value) || 0)))
              }
              aria-label="Clip end time in seconds"
            />
            <WuButton
              variant="secondary"
              size="sm"
              onClick={() =>
                setClipEnd(Math.min(Math.floor(totalDuration), Math.max(clipStart + 1, Math.floor(currentTime))))
              }
              title="Use current playhead"
            >
              Use playhead
            </WuButton>
          </div>
        </div>
      </div>

      <div className={styles.reelField}>
        <label className={styles.reelLabel} htmlFor="reel-theme">Theme label</label>
        <WuInput
          id="reel-theme"
          variant="outlined"
          placeholder="e.g. Brand affinity, Navigation accuracy"
          value={clipTheme}
          onChange={(e) => setClipTheme(e.target.value)}
          maxLength={60}
          aria-label="Reel theme label"
        />
      </div>
    </div>
  );

  return (
    <WuModal
      open={modalOpen}
      onOpenChange={handleModalOpenChange}
      variant="action"
      size="lg"
      className={styles.playerModal}
    >
      <WuModalHeader className={styles.playerHeader}>
        <div className={styles.headerNav}>
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
        </div>
        <p className={styles.playerHeaderTitle}>Video response</p>
      </WuModalHeader>

      <WuModalContent className={styles.playerModalContent}>
        <div className={styles.mainArea}>

          {/* Portrait video panel */}
          <div className={styles.videoPanel}>
            <div className={styles.videoWrap}>

              <video
                key={`bg-${currentId}`}
                src={videoUrl}
                autoPlay loop muted playsInline
                aria-hidden
                className={styles.avatarBgBlur}
              />

              <video
                key={currentId}
                src={videoUrl}
                autoPlay loop muted playsInline
                className={styles.avatarVideo}
              />

              <div className={styles.portraitGradient} />

              <div className={styles.recBadge} aria-hidden>
                <span className={styles.recDot} />
                REC
              </div>

              {isPlaying && (
                <div className={styles.speakWave} aria-hidden>
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                  <span className={styles.speakBar} />
                </div>
              )}

              {ccEnabled && (
                <DynamicCaption
                  currentTime={currentTime}
                  currentWordGlobalIdx={currentWordGlobalIdx}
                  wordTiming={wordTiming}
                  segments={segments}
                />
              )}
            </div>

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
                <button type="button"
                  className={`${styles.ctrlBtn} ${reelPanelOpen ? styles.ctrlBtnActive : ''}`}
                  title="Create Reels" aria-label="Create Reels"
                  onClick={openReelPanel}>
                  <span className="wm-movie" aria-hidden />
                </button>

                <button type="button"
                  className={`${styles.ctrlBtnCC} ${ccEnabled ? styles.ctrlBtnActive : ''}`}
                  onClick={() => setCcEnabled((v) => !v)}
                  aria-label="Toggle captions" title="Dynamic captions">
                  CC
                </button>

                <button type="button" className={styles.ctrlBtn}
                  title="Fullscreen" aria-label="Fullscreen"
                  onClick={() => showToast({ message: 'Fullscreen not available in prototype', variant: 'info' })}>
                  <span className="wm-fullscreen" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar — summary/transcript or inline Create Reels panel */}
          <div className={styles.sidebar}>
            {reelPanelOpen ? (
              <div className={styles.reelPanel}>
                <div className={styles.reelPanelHeader}>
                  <button type="button" className={styles.reelPanelBack}
                    onClick={closeReelPanel} aria-label="Back to response details">
                    <span className="wm-chevron-left" aria-hidden />
                  </button>
                  <h3 className={styles.reelPanelTitle}>Create Reels</h3>
                </div>
                <div className={styles.reelPanelBody}>
                  {reelFormFields}
                </div>
                <div className={styles.reelPanelFooter}>
                  <WuButton variant="secondary" onClick={closeReelPanel}>
                    Cancel
                  </WuButton>
                  <WuButton
                    variant="primary"
                    disabled={!onSaveClip || clipEnd <= clipStart}
                    onClick={handleSaveReel}
                  >
                    <span className="wm-movie" aria-hidden />
                    Add to Reels
                  </WuButton>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.sidebarHeader}>
                  <div className={styles.sidebarRespondentRow}>
                    <span className={styles.respondentId}>{currentResponse.id}</span>
                    <span className={styles.respondentDate}>{currentResponse.date}</span>
                  </div>
                  <div className={styles.sidebarActionsRow}>
                    <SentimentBadge sentiment={effectiveSentiment} />
                    <div className={styles.sidebarActions}>
                      <div className={styles.langSelectorCompact}>
                        <span className={`wm-translate ${styles.langSelectorIcon}`} aria-hidden />
                        <select
                          className={styles.langSelectCompact}
                          value={activeLang}
                          onChange={(e) => setActiveLang(e.target.value)}
                          aria-label="Select display language"
                        >
                          {AVAILABLE_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.native}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button type="button" className={styles.sidebarActionBtn} title="Like" aria-label="Like"
                        onClick={() => showToast({ message: 'Liked', variant: 'success' })}>
                        <span className="wm-thumb-up" aria-hidden />
                      </button>
                      <button type="button" className={styles.sidebarActionBtn} title="Dislike" aria-label="Dislike"
                        onClick={() => showToast({ message: 'Disliked', variant: 'info' })}>
                        <span className="wm-thumb-down" aria-hidden />
                      </button>
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
                    <div className={styles.summaryPanel}>
                      {activeLang !== nativeLang && (
                        <label className={styles.showOrigInline}>
                          <input
                            type="checkbox"
                            checked={showOriginal}
                            onChange={(e) => setShowOriginal(e.target.checked)}
                          />
                          Show original ({getLanguageLabel(nativeLang)})
                        </label>
                      )}
                      <p className={styles.summaryText}>{displaySummary}</p>
                      {activeLang !== nativeLang && showOriginal && (
                        <p className={styles.summaryTextSecondary}>{originalSummary}</p>
                      )}
                    </div>
                  )}
                  {sidebarTab === 'transcript' && (
                    <div className={styles.transcriptPanel}>
                      {activeLang !== nativeLang && (
                        <label className={styles.showOrigInline}>
                          <input
                            type="checkbox"
                            checked={showOriginal}
                            onChange={(e) => setShowOriginal(e.target.checked)}
                          />
                          Show original ({getLanguageLabel(nativeLang)})
                        </label>
                      )}

                      <div className={styles.transcriptScrollArea}>
                        <TranscriptPanel
                          segments={segments}
                          secondarySegments={activeLang !== nativeLang && showOriginal ? originalSegments : undefined}
                          currentTime={currentTime}
                          onSeek={(t) => { seekTo(t); }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
