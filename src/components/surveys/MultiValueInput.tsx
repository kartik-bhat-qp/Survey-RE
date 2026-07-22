'use client';

import { useRef, useState } from 'react';
import styles from './MultiEmailInput.module.css';

interface MultiValueInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  'aria-label'?: string;
}

function splitCandidates(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function MultiValueInput({
  value,
  onChange,
  placeholder = 'Enter value',
  'aria-label': ariaLabel = 'Values',
}: MultiValueInputProps) {
  const [draft, setDraft] = useState('');
  const valueRef = useRef(value);
  valueRef.current = value;

  function commitCandidates(raw: string): void {
    const trimmed = raw.trim();
    if (!trimmed) {
      setDraft('');
      return;
    }

    const candidates = splitCandidates(raw);
    if (candidates.length === 0) {
      setDraft('');
      return;
    }

    const next = [...valueRef.current];
    let added = 0;
    for (const candidate of candidates) {
      if (next.includes(candidate)) continue;
      next.push(candidate);
      added += 1;
    }

    if (added > 0) {
      valueRef.current = next;
      onChange(next);
    }
    setDraft('');
  }

  function removeValue(entry: string): void {
    const next = valueRef.current.filter((item) => item !== entry);
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
      removeValue(valueRef.current[valueRef.current.length - 1]);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value;
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
      className={`${styles.field} ${styles.compactField}`}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest('button')) return;
        const input = event.currentTarget.querySelector('input');
        if (input && document.activeElement !== input) {
          event.preventDefault();
          input.focus();
        }
      }}
    >
      {value.map((entry) => (
        <span key={entry} className={styles.chip}>
          <span className={styles.chipLabel}>{entry}</span>
          <button
            type="button"
            className={styles.chipRemoveBtn}
            aria-label={`Remove ${entry}`}
            onClick={() => removeValue(entry)}
          >
            <span className="wm-close" aria-hidden />
          </button>
        </span>
      ))}
      <input
        type="text"
        className={styles.input}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (draft.trim()) commitCandidates(draft);
        }}
        placeholder={value.length > 0 ? 'Add another' : placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
