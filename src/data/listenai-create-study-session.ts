const STORAGE_KEY = 'listenai-create-study-session';

export interface ListenAiCreateStudySession {
  studyId: string;
}

export function writeListenAiCreateStudySession(payload: ListenAiCreateStudySession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readListenAiCreateStudySession(): ListenAiCreateStudySession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ListenAiCreateStudySession;
    if (!parsed?.studyId?.trim()) return null;
    return { studyId: parsed.studyId };
  } catch {
    return null;
  }
}

export function openListenAiCreateStudyWindow(studyId: string): void {
  if (typeof window === 'undefined') return;
  writeListenAiCreateStudySession({ studyId });
  window.open(
    `${window.location.origin}/listenai/create?studyId=${encodeURIComponent(studyId)}`,
    '_blank',
    'noopener,noreferrer'
  );
}
