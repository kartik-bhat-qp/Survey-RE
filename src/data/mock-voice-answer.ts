/**
 * Voice answer response payload for open-ended / DeepDive survey questions.
 * Audio and text are intentionally NOT mutually exclusive.
 */

export type VoiceAnswerInputType = 'audio' | 'text' | 'audio_with_caption';

export type VoiceAnswerUploadStatus = 'idle' | 'uploading' | 'ready' | 'retry';

export interface VoiceAnswerValue {
  /** Derived from which fields are populated. */
  inputType: VoiceAnswerInputType | 'empty';
  /** Mock or blob URL for the recorded clip. */
  audioUrl?: string;
  /** Duration in seconds. */
  audioDuration?: number;
  /** Normalized 0–1 bar heights for the static chip waveform. */
  waveformBars?: number[];
  /** Optional caption typed alongside a recording (or entered from transcript). */
  captionText?: string;
  /** Pure text response when no recording exists. */
  textResponse?: string;
  /** STT result for the recorded clip (nullable until transcription completes). */
  transcriptText?: string | null;
  /** STT confidence 0–1 (nullable until transcription completes). */
  transcriptConfidence?: number | null;
  /** Prototype upload lifecycle for the audio clip. */
  uploadStatus?: VoiceAnswerUploadStatus;
}

const MOCK_TRANSCRIPTS = [
  'I really enjoyed the overall experience and would definitely recommend it to others.',
  'The product quality exceeded my expectations, though delivery took a bit longer than expected.',
  'Customer support was very responsive and resolved my issue within the same day.',
  'I appreciate the intuitive design — it made the whole process much easier to navigate.',
  'The pricing is fair given the value provided, but there is room for improvement in onboarding.',
  'Overall satisfaction is high. The team was professional and communicative throughout.',
];

export function emptyVoiceAnswer(): VoiceAnswerValue {
  return {
    inputType: 'empty',
    uploadStatus: 'idle',
    transcriptText: null,
    transcriptConfidence: null,
  };
}

export function deriveVoiceAnswerInputType(
  value: Pick<VoiceAnswerValue, 'audioUrl' | 'captionText' | 'textResponse'>
): VoiceAnswerInputType | 'empty' {
  const hasAudio = Boolean(value.audioUrl);
  const caption = value.captionText?.trim() ?? '';
  const text = value.textResponse?.trim() ?? '';

  if (hasAudio && caption) return 'audio_with_caption';
  if (hasAudio) return 'audio';
  if (text) return 'text';
  return 'empty';
}

export function isVoiceAnswerSubmittable(value: VoiceAnswerValue): boolean {
  if (value.uploadStatus === 'uploading' || value.uploadStatus === 'retry') {
    return false;
  }
  return deriveVoiceAnswerInputType(value) !== 'empty';
}

/** Build static chip waveform bars from amplitude samples (0–1). */
export function buildWaveformBars(samples: number[], barCount = 28): number[] {
  if (samples.length === 0) {
    return Array.from({ length: barCount }, (_, i) => {
      const t = i / barCount;
      return Math.max(
        0.12,
        0.38 + Math.sin(t * Math.PI * 8) * 0.34 + Math.sin(t * Math.PI * 17) * 0.16
      );
    });
  }
  const max = Math.max(...samples, 0.01);
  return Array.from({ length: barCount }, (_, i) => {
    const idx = Math.floor((i / barCount) * samples.length);
    return Math.max(0.12, (samples[idx] ?? 0) / max);
  });
}

export function formatVoiceDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface MockSttResult {
  transcriptText: string;
  transcriptConfidence: number;
}

/**
 * Prototype STT service — simulates speech-to-text for a recorded voice answer.
 * Ignore a stale result if a newer recording started (compare request ids in the caller).
 */
export function mockTranscribeVoiceAnswer(
  _audioUrl: string,
  _durationSec: number
): Promise<MockSttResult> {
  const delayMs = 700 + Math.floor(Math.random() * 500);
  return new Promise((resolve) => {
    setTimeout(() => {
      const transcriptText =
        MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      const transcriptConfidence = 0.82 + Math.random() * 0.16;
      resolve({
        transcriptText,
        transcriptConfidence: Math.round(transcriptConfidence * 100) / 100,
      });
    }, delayMs);
  });
}
