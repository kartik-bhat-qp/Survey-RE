export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface ReelClip {
  clipNumber: number;
  responseId: string;
  start: number;
  end: number;
  duration: string;
  durationSeconds: number;
  transcript: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  theme: string;
  language: string;
}

export interface HighlightReel {
  reelId: string;
  status: 'ready';
  totalClips: number;
  totalDuration: string;
  generatedAt: string;
  clips: ReelClip[];
}

/**
 * Avatar image indices (from pravatar.cc ?img=N).
 * Cycle: White → Black → Asian → White → Black → Asian …
 *   White  : 26 (woman), 31 (man), 11 (woman), 5 (man)
 *   Black  : 54 (man),   65 (woman), 47 (man)
 *   Asian  : 38 (woman), 22 (man),  15 (woman)
 */

/**
 * Mixkit CDN talking-head videos (free, royalty-free).
 * Pattern: https://assets.mixkit.co/videos/{id}/{id}-720.mp4
 *
 * All five source clips show a man looking DIRECTLY into the camera:
 *  41290 – "Face of a vlogger speaking to the camera"
 *  41289 – "Youtuber recording himself" (bearded man, direct to camera)
 *  41291 – "Youtuber filming with a camera on a tripod" (face fills frame)
 *  34486 – "Behind the scenes of a speaker talking on camera" (facing tripod cam)
 *  2963  – "Man talking in front of a radio station microphone" (facing camera)
 */
const MK = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;

export const RESPONSE_VIDEO_URLS: Record<string, string> = {
  '221640647': MK(41290),  // vlogger face direct to camera
  '221470507': MK(41289),  // bearded youtuber direct to camera
  '221502834': MK(41291),  // youtuber with tripod, face-on
  '221388912': MK(34486),  // influencer on tripod, facing camera
  '221519443': MK(2963),   // man at radio mic, facing camera
  '221601287': MK(41290),  // cycle: vlogger
  '221445670': MK(41289),  // cycle: bearded youtuber
  '221677201': MK(41291),  // cycle: tripod youtuber
  '221534890': MK(34486),  // cycle: influencer on tripod
  '221490123': MK(2963),   // cycle: man at radio mic
};

/** Voice index offset per response (used to pick different TTS voices) */
export const RESPONSE_VOICE_IDX: Record<string, number> = {
  '221640647': 0,
  '221470507': 2,
  '221502834': 1,
  '221388912': 3,
  '221519443': 4,
  '221601287': 1,
  '221445670': 2,
  '221677201': 0,
  '221534890': 3,
  '221490123': 1,
};

export const TOTAL_VIDEO_DURATION = 18.5;

export const TRANSCRIPT_SEGMENTS: TranscriptSegment[] = [
  { start: 0.0,  end: 2.8,  text: 'One of the core issues users face' },
  { start: 3.0,  end: 5.5,  text: 'with the current system is its ineffective' },
  { start: 6.0,  end: 10.2, text: 'timer functionality. Specifically, the problem lies in' },
  { start: 11.0, end: 15.5, text: "the timer's inability to display the remaining" },
  { start: 16.0, end: 18.0, text: 'time with precision.' },
];

export const WORD_TIMING: WordTiming[] = [
  { word: 'One',           start: 0.0,   end: 0.3  },
  { word: 'of',            start: 0.35,  end: 0.5  },
  { word: 'the',           start: 0.55,  end: 0.7  },
  { word: 'core',          start: 0.75,  end: 1.1  },
  { word: 'issues',        start: 1.15,  end: 1.6  },
  { word: 'users',         start: 1.65,  end: 2.0  },
  { word: 'face',          start: 2.05,  end: 2.4  },
  { word: 'with',          start: 3.0,   end: 3.2  },
  { word: 'the',           start: 3.25,  end: 3.4  },
  { word: 'current',       start: 3.45,  end: 3.8  },
  { word: 'system',        start: 3.85,  end: 4.2  },
  { word: 'is',            start: 4.25,  end: 4.4  },
  { word: 'its',           start: 4.45,  end: 4.7  },
  { word: 'ineffective',   start: 4.75,  end: 5.4  },
  { word: 'timer',         start: 6.0,   end: 6.4  },
  { word: 'functionality.', start: 6.45, end: 7.2  },
  { word: 'Specifically,', start: 7.25,  end: 7.9  },
  { word: 'the',           start: 7.95,  end: 8.1  },
  { word: 'problem',       start: 8.15,  end: 8.6  },
  { word: 'lies',          start: 8.65,  end: 8.9  },
  { word: 'in',            start: 8.95,  end: 9.2  },
  { word: 'the',           start: 11.0,  end: 11.2 },
  { word: "timer's",       start: 11.25, end: 11.7 },
  { word: 'inability',     start: 11.75, end: 12.4 },
  { word: 'to',            start: 12.45, end: 12.6 },
  { word: 'display',       start: 12.65, end: 13.1 },
  { word: 'the',           start: 13.15, end: 13.3 },
  { word: 'remaining',     start: 13.35, end: 14.0 },
  { word: 'time',          start: 16.0,  end: 16.4 },
  { word: 'with',          start: 16.45, end: 16.65 },
  { word: 'precision.',    start: 16.7,  end: 17.5 },
];

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English'   },
  { code: 'es', label: 'Spanish',    native: 'Español'   },
  { code: 'fr', label: 'French',     native: 'Français'  },
  { code: 'de', label: 'German',     native: 'Deutsch'   },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'zh', label: 'Chinese',    native: '中文'       },
];

export const TRANSLATIONS: Record<string, TranscriptSegment[]> = {
  es: [
    { start: 0.0,  end: 2.8,  text: 'Uno de los problemas centrales que enfrentan' },
    { start: 3.0,  end: 5.5,  text: 'los usuarios con el sistema actual es su inefectiva' },
    { start: 6.0,  end: 10.2, text: 'funcionalidad del temporizador. El problema radica en' },
    { start: 11.0, end: 15.5, text: 'la incapacidad del temporizador para mostrar el tiempo restante' },
    { start: 16.0, end: 18.0, text: 'con precisión.' },
  ],
  fr: [
    { start: 0.0,  end: 2.8,  text: "L'un des principaux problèmes rencontrés par les utilisateurs" },
    { start: 3.0,  end: 5.5,  text: "avec le système actuel est son inefficacité" },
    { start: 6.0,  end: 10.2, text: "dans la fonctionnalité du minuteur. Le problème réside dans" },
    { start: 11.0, end: 15.5, text: "l'incapacité du minuteur à afficher le temps restant" },
    { start: 16.0, end: 18.0, text: "avec précision." },
  ],
  de: [
    { start: 0.0,  end: 2.8,  text: 'Eines der Hauptprobleme der Benutzer' },
    { start: 3.0,  end: 5.5,  text: 'mit dem aktuellen System ist die ineffektive' },
    { start: 6.0,  end: 10.2, text: 'Timer-Funktionalität. Das Problem liegt in' },
    { start: 11.0, end: 15.5, text: "der Unfähigkeit des Timers, die verbleibende Zeit anzuzeigen" },
    { start: 16.0, end: 18.0, text: 'mit Genauigkeit.' },
  ],
  pt: [
    { start: 0.0,  end: 2.8,  text: 'Um dos principais problemas enfrentados pelos usuários' },
    { start: 3.0,  end: 5.5,  text: 'com o sistema atual é sua ineficaz' },
    { start: 6.0,  end: 10.2, text: 'funcionalidade do temporizador. O problema está em' },
    { start: 11.0, end: 15.5, text: 'a incapacidade do temporizador de exibir o tempo restante' },
    { start: 16.0, end: 18.0, text: 'com precisão.' },
  ],
  zh: [
    { start: 0.0,  end: 2.8,  text: '用户面临的核心问题之一' },
    { start: 3.0,  end: 5.5,  text: '在于当前系统无效的' },
    { start: 6.0,  end: 10.2, text: '计时器功能。具体来说，问题在于' },
    { start: 11.0, end: 15.5, text: '计时器无法精确显示剩余时间' },
    { start: 16.0, end: 18.0, text: '的精确性。' },
  ],
};

export const MOCK_HIGHLIGHT_REEL: HighlightReel = {
  reelId: 'reel_001',
  status: 'ready',
  totalClips: 8,
  totalDuration: '1:42',
  generatedAt: 'Jun 03 2026 10:15 AM',
  clips: [
    { clipNumber: 1, responseId: '221640647', start: 2.0,  end: 9.5,  duration: '0:07', durationSeconds: 7,  transcript: "The colors remind me of the treats I buy for my dog already. It feels really authentic.",              sentiment: 'Positive', theme: 'Brand affinity',    language: 'en' },
    { clipNumber: 2, responseId: '221519443', start: 3.0,  end: 12.0, duration: '0:09', durationSeconds: 9,  transcript: "There's too much going on, the dog takes up most of the image and I can barely see the product.",  sentiment: 'Negative', theme: 'Product visibility', language: 'en' },
    { clipNumber: 3, responseId: '221601287', start: 1.0,  end: 8.5,  duration: '0:07', durationSeconds: 7,  transcript: "This feels really genuine, like it's not overly polished which I appreciate.",                       sentiment: 'Positive', theme: 'Authenticity',       language: 'en' },
    { clipNumber: 4, responseId: '221388912', start: 5.0,  end: 18.0, duration: '0:13', durationSeconds: 13, transcript: "I love everything about this! The pastel colors, the happy dog, the whole vibe.",                   sentiment: 'Positive', theme: 'Visual appeal',      language: 'en' },
    { clipNumber: 5, responseId: '221677201', start: 1.0,  end: 7.0,  duration: '0:06', durationSeconds: 6,  transcript: "The pastels don't say pet food to me. I think of baby products. It's confusing.",                   sentiment: 'Negative', theme: 'Color recognition',  language: 'en' },
    { clipNumber: 6, responseId: '221445670', start: 8.0,  end: 20.0, duration: '0:12', durationSeconds: 12, transcript: "For Instagram this works great. But on Twitter the format would be completely off.",                 sentiment: 'Neutral',  theme: 'Platform fit',      language: 'en' },
    { clipNumber: 7, responseId: '221490123', start: 4.0,  end: 16.0, duration: '0:12', durationSeconds: 12, transcript: "I would 100% share this. My friends always send each other cute dog content and this fits.",         sentiment: 'Positive', theme: 'Shareability',       language: 'en' },
    { clipNumber: 8, responseId: '221534890', start: 12.0, end: 28.0, duration: '0:16', durationSeconds: 16, transcript: "From a marketing perspective this is solid. The color palette is cohesive and effective.",           sentiment: 'Positive', theme: 'Brand affinity',    language: 'en' },
  ],
};
