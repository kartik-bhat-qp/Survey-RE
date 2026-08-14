'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPickerStyle, handlePortaledPickerWheel } from '@/components/surveys/useAnchoredPickerStyle';
import styles from './MultiEmailInput.module.css';

interface MultiValueInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
  /** When provided, focus shows a filterable suggestion list under the field. */
  suggestions?: string[];
  /** When false with suggestions, only listed values can be selected — no freeform add. */
  allowCustomValues?: boolean;
}

function splitCandidates(raw: string, allowSpaces = false): string[] {
  if (allowSpaces) {
    return raw
      .split(/[,;]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
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
  className,
  suggestions,
  allowCustomValues = true,
}: MultiValueInputProps) {
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const pickerStyle = useAnchoredPickerStyle(
    pickerOpen && Boolean(suggestions?.length),
    rootRef
  );

  const suggestionSet = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return null;
    return new Set(suggestions);
  }, [suggestions]);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const query = draft.trim().toLowerCase();
    return suggestions.filter((item) => {
      if (!query) return true;
      return item.toLowerCase().includes(query);
    });
  }, [draft, suggestions]);

  const draftTrimmed = draft.trim();
  const draftAlreadyAdded = Boolean(draftTrimmed) && value.includes(draftTrimmed);
  const canAddTypedValue =
    allowCustomValues &&
    Boolean(suggestions?.length) &&
    Boolean(draftTrimmed) &&
    filteredSuggestions.length === 0 &&
    !draftAlreadyAdded;
  const showSuggestionPicker = Boolean(suggestions?.length) && pickerOpen;

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || pickerRef.current?.contains(target)) {
        return;
      }
      setPickerOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setPickerOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerOpen]);

  function commitCandidates(raw: string): void {
    const trimmed = raw.trim();
    if (!trimmed) {
      setDraft('');
      return;
    }

    const candidates = splitCandidates(raw, Boolean(suggestions?.length));
    if (candidates.length === 0) {
      setDraft('');
      return;
    }

    const next = [...valueRef.current];
    let added = 0;
    for (const candidate of candidates) {
      if (!allowCustomValues && suggestionSet && !suggestionSet.has(candidate)) {
        continue;
      }
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

  function toggleSuggestion(entry: string): void {
    if (valueRef.current.includes(entry)) {
      removeValue(entry);
      return;
    }
    const next = [...valueRef.current, entry];
    valueRef.current = next;
    onChange(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const commitKeys = suggestions?.length
      ? event.key === 'Enter' || event.key === ','
      : event.key === 'Enter' || event.key === ',' || event.key === ' ';
    if (commitKeys) {
      event.preventDefault();
      if (!draft.trim()) return;
      if (!allowCustomValues && suggestions?.length) {
        // Filter-only: pick from the suggestion list, don't freeform-add.
        return;
      }
      commitCandidates(draft);
      return;
    }

    if (event.key === 'Backspace' && !draft && valueRef.current.length > 0) {
      removeValue(valueRef.current[valueRef.current.length - 1]);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value;
    const shouldCommit = suggestions?.length ? /[,;]/.test(next) : /[,;\s]/.test(next);
    if (shouldCommit) {
      if (!allowCustomValues && suggestions?.length) {
        setDraft(next.replace(/[,;]+$/g, ''));
        setPickerOpen(true);
        return;
      }
      commitCandidates(next);
      return;
    }
    setDraft(next);
    if (suggestions?.length) setPickerOpen(true);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    if (!allowCustomValues && suggestions?.length) {
      event.preventDefault();
      const pasted = event.clipboardData.getData('text').trim();
      if (!pasted) return;
      setDraft(pasted);
      setPickerOpen(true);
      return;
    }
    const pasted = event.clipboardData.getData('text');
    const shouldCommit = suggestions?.length ? /[,;]/.test(pasted) : /[,;\s]/.test(pasted);
    if (!shouldCommit) return;
    event.preventDefault();
    commitCandidates(`${draft}${pasted}`);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={`${styles.field} ${styles.compactField} ${className ?? ''}`.trim()}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return;
          const input = event.currentTarget.querySelector('input');
          if (input && document.activeElement !== input) {
            event.preventDefault();
            input.focus();
          }
          if (suggestions?.length) setPickerOpen(true);
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
          onFocus={() => {
            if (suggestions?.length) setPickerOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (rootRef.current?.contains(document.activeElement)) return;
              if (!draft.trim()) return;
              if (!allowCustomValues && suggestions?.length) {
                setDraft('');
                return;
              }
              commitCandidates(draft);
            }, 0);
          }}
          placeholder={
            value.length > 0
              ? 'Add another'
              : !allowCustomValues && suggestions?.length
                ? 'Search teams'
                : placeholder
          }
          aria-label={ariaLabel}
          aria-expanded={showSuggestionPicker}
          aria-controls={showSuggestionPicker ? 'multi-value-suggestions' : undefined}
        />
      </div>

      {showSuggestionPicker
        ? createPortal(
            <div
              ref={pickerRef}
              id="multi-value-suggestions"
              className={`${styles.orgPicker} ${styles.orgPickerPortaled}`}
              role="listbox"
              aria-label="Suggested values"
              style={pickerStyle}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onWheel={handlePortaledPickerWheel}
            >
              {filteredSuggestions.length === 0 ? (
                <div className={styles.orgEmptyState}>
                  {canAddTypedValue ? (
                    <button
                      type="button"
                      className={styles.orgAddButton}
                      onClick={() => {
                        commitCandidates(draftTrimmed);
                        setPickerOpen(false);
                      }}
                    >
                      <span className={`wm-add ${styles.orgAddIcon}`} aria-hidden />
                      <span>
                        Add <strong>{draftTrimmed}</strong>
                      </span>
                    </button>
                  ) : draftAlreadyAdded ? (
                    <p className={styles.orgEmpty}>Already added</p>
                  ) : (
                    <p className={styles.orgEmpty}>No matching values</p>
                  )}
                </div>
              ) : (
                <ul className={styles.orgList}>
                  {filteredSuggestions.map((item) => {
                    const checked = value.includes(item);
                    return (
                      <li key={item}>
                        <label
                          className={`${styles.orgRow} ${checked ? styles.orgRowSelected : ''}`}
                        >
                          <input
                            type="checkbox"
                            className={styles.orgCheckbox}
                            checked={checked}
                            onChange={() => toggleSuggestion(item)}
                          />
                          <span className={styles.orgEmail}>{item}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
