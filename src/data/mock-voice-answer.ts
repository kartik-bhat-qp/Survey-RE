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

const MOCK_DICTATION_SENTENCES = [
  ...MOCK_TRANSCRIPTS,
  'The checkout flow was smooth and I had no trouble completing my purchase.',
  'I found the mobile experience a bit slow, but the desktop version worked perfectly.',
  'What stood out most was how quickly the support team responded to my questions.',
  'I would happily use this product again and have already told a few colleagues about it.',
];

const MOCK_EMAIL_SENTENCES = [
  'You can reach me at sarah.johnson@gmail.com if you have any follow-up questions.',
  'Please feel free to email me at michael.chen@outlook.com anytime this week.',
  'My preferred contact email is sofia.morales@icloud.com for survey follow-ups.',
];

const MOCK_PHONE_SENTENCES = [
  'My phone number is plus one four one five five five five zero one nine two.',
  'You can call me at plus one three one two eight six seven five three zero nine.',
  'The best number to reach me is plus four four two zero seven nine four six zero nine five eight.',
];

const MOCK_NAME_SENTENCES = [
  'My first name is Sarah and my last name is Johnson.',
  'I go by Michael Chen — that is M I C H A E L C H E N.',
  'My name is Priya Patel, spelled P R I Y A P A T E L.',
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export interface DictationLanguage {
  id: string;
  label: string;
}

/** Cursor-style dictation language list (prototype — no real locale switching). */
export const DICTATION_LANGUAGES: DictationLanguage[] = [
  { id: 'zh-CN', label: 'Chinese (Simplified, China)' },
  { id: 'zh-HK', label: 'Chinese (Traditional, Hong Kong)' },
  { id: 'zh-TW', label: 'Chinese (Traditional, Taiwan)' },
  { id: 'da', label: 'Danish' },
  { id: 'nl', label: 'Dutch' },
  { id: 'en', label: 'English' },
  { id: 'fr-CA', label: 'French (Canada)' },
  { id: 'fr-FR', label: 'French (France)' },
  { id: 'de', label: 'German' },
  { id: 'hi', label: 'Hindi' },
  { id: 'it', label: 'Italian' },
  { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' },
  { id: 'pt-BR', label: 'Portuguese (Brazil)' },
];

export const DEFAULT_DICTATION_LANGUAGE_ID = 'en';

export function getDictationLanguage(id: string): DictationLanguage | undefined {
  return DICTATION_LANGUAGES.find((language) => language.id === id);
}

const MOCK_HINDI_SENTENCES = [
  'मुझे समग्र अनुभव बहुत अच्छा लगा और मैं इसे दूसरों को ज़रूर सुझाऊँगा।',
  'ग्राहक सहायता बहुत उत्तरदायी थी और उसने मेरा मुद्दा उसी दिन हल कर दिया।',
];

const MOCK_JAPANESE_SENTENCES = [
  '全体的な体験はとても良く、他の人にもぜひおすすめしたいと思います。',
  'カスタマーサポートの対応が早く、当日中に問題が解決されました。',
];

/** Pick a complete demo dictation sentence based on field context. */
export function pickMockDictationPhrase(contextHint = '', languageId = DEFAULT_DICTATION_LANGUAGE_ID): string {
  if (languageId === 'hi') {
    return pickRandom(MOCK_HINDI_SENTENCES);
  }
  if (languageId === 'ja') {
    return pickRandom(MOCK_JAPANESE_SENTENCES);
  }
  const hint = contextHint.toLowerCase();
  if (hint.includes('email') || hint.includes('@')) {
    return pickRandom(MOCK_EMAIL_SENTENCES);
  }
  if (hint.includes('phone') || hint.includes('mobile') || hint.includes('cell')) {
    return pickRandom(MOCK_PHONE_SENTENCES);
  }
  if (
    hint.includes('first') ||
    hint.includes('last') ||
    hint.includes('name') ||
    hint.includes('sarah') ||
    hint.includes('johnson')
  ) {
    return pickRandom(MOCK_NAME_SENTENCES);
  }
  return pickRandom(MOCK_DICTATION_SENTENCES);
}

export interface MockDictationStream {
  stop: () => void;
}

/**
 * Prototype live dictation — streams words into the field to demo speech-to-text UX.
 */
export function startMockDictationStream(
  phrase: string,
  onUpdate: (committed: string, interim: string) => void,
  onActivity: () => void
): MockDictationStream {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  let wordIndex = 0;
  let charIndex = 0;
  let committed = '';
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function tick(): void {
    if (stopped) return;

    if (wordIndex >= words.length) {
      onUpdate(committed, '');
      return;
    }

    const word = words[wordIndex];
    charIndex += 1;
    const partial = word.slice(0, charIndex);
    onUpdate(committed, partial);
    onActivity();

    if (charIndex >= word.length) {
      committed = committed ? `${committed} ${word}` : word;
      wordIndex += 1;
      charIndex = 0;
      timer = setTimeout(tick, 180 + Math.floor(Math.random() * 120));
      return;
    }

    timer = setTimeout(tick, 45 + Math.floor(Math.random() * 35));
  }

  timer = setTimeout(tick, 200);

  return {
    stop: () => {
      stopped = true;
      clearTimer();
    },
  };
}
