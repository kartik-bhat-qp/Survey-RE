'use client';

import { useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  isValidEmailAddress,
  normalizeEmailAddress,
} from '@/data/mock-survey-distribute';
import styles from './MultiEmailInput.module.css';

interface MultiEmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  'aria-label'?: string;
}

function splitEmailCandidates(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((part) => normalizeEmailAddress(part))
    .filter((part) => part.length > 0);
}

export function MultiEmailInput({
  value,
  onChange,
  placeholder = 'Enter email addresses',
  'aria-label': ariaLabel = 'Email addresses',
}: MultiEmailInputProps) {
  const { showToast } = useWuShowToast();
  const [draft, setDraft] = useState('');
  const valueRef = useRef(value);
  valueRef.current = value;

  function commitCandidates(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) {
      setDraft('');
      return false;
    }

    const candidates = splitEmailCandidates(raw);
    if (candidates.length === 0) {
      setDraft('');
      return false;
    }

    const next = [...valueRef.current];
    let added = 0;
    let invalid = 0;
    let duplicate = 0;

    for (const candidate of candidates) {
      if (!isValidEmailAddress(candidate)) {
        invalid += 1;
        continue;
      }
      if (next.includes(candidate)) {
        duplicate += 1;
        continue;
      }
      next.push(candidate);
      added += 1;
    }

    if (added > 0) {
      valueRef.current = next;
      onChange(next);
    }

    if (invalid > 0) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      // Keep draft so the user can fix a mistyped address.
      return false;
    }

    if (duplicate > 0 && added === 0) {
      showToast({ message: 'Email address already added', variant: 'info' });
    }

    setDraft('');
    return true;
  }

  function removeEmail(email: string): void {
    const next = valueRef.current.filter((entry) => entry !== email);
    valueRef.current = next;
    onChange(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      if (!draft.trim()) return;
      commitCandidates(draft);
      return;
    }

    if (event.key === 'Backspace' && !draft && valueRef.current.length > 0) {
      removeEmail(valueRef.current[valueRef.current.length - 1]);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value;
    // Commit when the user types a delimiter instead of only relying on keydown
    // (some browsers swallow Space in email-like inputs).
    if (/[,;\s]/.test(next)) {
      commitCandidates(next);
      return;
    }
    setDraft(next);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    const pasted = event.clipboardData.getData('text');
    if (!/[,;\s]/.test(pasted)) return;
    event.preventDefault();
    commitCandidates(`${draft}${pasted}`);
  }

  return (
    <div
      className={styles.field}
      onMouseDown={(event) => {
        // Keep focus in the input when clicking chips/empty field chrome.
        if ((event.target as HTMLElement).closest('button')) return;
        const input = event.currentTarget.querySelector('input');
        if (input && document.activeElement !== input) {
          event.preventDefault();
          input.focus();
        }
      }}
    >
      {value.map((email) => (
        <span key={email} className={styles.chip}>
          <span className="wm-mail" aria-hidden />
          <span className={styles.chipLabel}>{email}</span>
          <button
            type="button"
            className={styles.chipRemoveBtn}
            aria-label={`Remove ${email}`}
            onClick={() => removeEmail(email)}
          >
            <span className="wm-close" aria-hidden />
          </button>
        </span>
      ))}
      <input
        type="text"
        inputMode="email"
        autoComplete="email"
        className={styles.input}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (draft.trim()) commitCandidates(draft);
        }}
        placeholder={value.length > 0 ? 'Add another email' : placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
