'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  isValidEmailAddress,
  normalizeEmailAddress,
} from '@/data/mock-survey-distribute';
import {
  groupNotificationOrgUsers,
  type NotificationOrgUser,
} from '@/data/mock-survey-notifications';
import { useAnchoredPickerStyle, handlePortaledPickerWheel } from '@/components/surveys/useAnchoredPickerStyle';
import styles from './MultiEmailInput.module.css';

interface MultiEmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  'aria-label'?: string;
  /** When provided, focus shows a grouped org-user picker under the field. */
  orgUsers?: NotificationOrgUser[];
  /** When true with orgUsers, only listed org users can be added — no freeform emails. */
  internalOnly?: boolean;
  fieldClassName?: string;
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
  orgUsers,
  internalOnly = false,
  fieldClassName,
}: MultiEmailInputProps) {
  const { showToast } = useWuShowToast();
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const { style: pickerStyle, placement: pickerPlacement } = useAnchoredPickerStyle(
    pickerOpen && Boolean(orgUsers?.length),
    rootRef
  );

  const orgEmailSet = useMemo(() => {
    if (!orgUsers || orgUsers.length === 0) return null;
    return new Set(orgUsers.map((user) => normalizeEmailAddress(user.email)));
  }, [orgUsers]);

  const orgGroups = useMemo(() => {
    if (!orgUsers || orgUsers.length === 0) return [];
    return groupNotificationOrgUsers(orgUsers, draft);
  }, [orgUsers, draft]);

  const draftNormalized = normalizeEmailAddress(draft);
  const draftIsValidEmail = Boolean(draftNormalized) && isValidEmailAddress(draftNormalized);
  const draftAlreadyAdded = draftIsValidEmail && value.includes(draftNormalized);
  const canAddTypedEmail =
    !internalOnly && orgGroups.length === 0 && draftIsValidEmail && !draftAlreadyAdded;
  const showOrgPicker = Boolean(orgUsers?.length) && pickerOpen;

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
    let external = 0;

    for (const candidate of candidates) {
      if (!isValidEmailAddress(candidate)) {
        invalid += 1;
        continue;
      }
      if (internalOnly && orgEmailSet && !orgEmailSet.has(candidate)) {
        external += 1;
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

    if (external > 0) {
      showToast({
        message: 'Only organization users can be shared with',
        variant: 'error',
      });
      setDraft('');
      return false;
    }

    if (invalid > 0) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      return false;
    }

    if (duplicate > 0 && added === 0) {
      showToast({ message: 'Email address already added', variant: 'info' });
    }

    setDraft('');
    return true;
  }

  function addTypedEmail(): void {
    if (!canAddTypedEmail) return;
    if (commitCandidates(draftNormalized)) {
      setPickerOpen(false);
    }
  }

  function removeEmail(email: string): void {
    const next = valueRef.current.filter((entry) => entry !== email);
    valueRef.current = next;
    onChange(next);
  }

  function toggleOrgUser(email: string): void {
    const normalized = normalizeEmailAddress(email);
    if (valueRef.current.includes(normalized)) {
      removeEmail(normalized);
      return;
    }
    const next = [...valueRef.current, normalized];
    valueRef.current = next;
    onChange(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      if (!draft.trim()) return;
      if (internalOnly) {
        // Filter-only: pick from the org list, don't freeform-add.
        return;
      }
      if (canAddTypedEmail && event.key === 'Enter') {
        addTypedEmail();
        return;
      }
      commitCandidates(draft);
      return;
    }

    if (event.key === 'Backspace' && !draft && valueRef.current.length > 0) {
      removeEmail(valueRef.current[valueRef.current.length - 1]);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value;
    if (/[,;\s]/.test(next)) {
      if (internalOnly) {
        setDraft(next.replace(/[,;\s]+$/g, ''));
        if (orgUsers?.length) setPickerOpen(true);
        return;
      }
      commitCandidates(next);
      return;
    }
    setDraft(next);
    if (orgUsers?.length) setPickerOpen(true);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    if (internalOnly) {
      event.preventDefault();
      const pasted = event.clipboardData.getData('text').trim();
      if (!pasted) return;
      setDraft(pasted);
      if (orgUsers?.length) setPickerOpen(true);
      return;
    }
    const pasted = event.clipboardData.getData('text');
    if (!/[,;\s]/.test(pasted)) return;
    event.preventDefault();
    commitCandidates(`${draft}${pasted}`);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={fieldClassName ? `${styles.field} ${fieldClassName}` : styles.field}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return;
          const input = event.currentTarget.querySelector('input');
          if (input && document.activeElement !== input) {
            event.preventDefault();
            input.focus();
          }
          if (orgUsers?.length) setPickerOpen(true);
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
          autoComplete="off"
          className={styles.input}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            if (orgUsers?.length) setPickerOpen(true);
          }}
          onBlur={() => {
            // When the org picker is open, typing filters the list — only commit a
            // complete email. Defer so checkbox clicks inside the picker win first.
            window.setTimeout(() => {
              if (rootRef.current?.contains(document.activeElement)) return;
              const trimmed = draft.trim();
              if (!trimmed) return;
              if (internalOnly) {
                setDraft('');
                return;
              }
              if (orgUsers?.length) {
                const normalized = normalizeEmailAddress(trimmed);
                if (isValidEmailAddress(normalized)) {
                  commitCandidates(trimmed);
                }
                return;
              }
              commitCandidates(trimmed);
            }, 0);
          }}
          placeholder={
            value.length > 0
              ? 'Add another email'
              : internalOnly
                ? 'Search organization users'
                : placeholder
          }
          aria-label={ariaLabel}
          aria-expanded={showOrgPicker}
          aria-controls={showOrgPicker ? 'notification-org-user-picker' : undefined}
        />
      </div>

      {showOrgPicker
        ? createPortal(
            <div
              ref={pickerRef}
              id="notification-org-user-picker"
              className={`${styles.orgPicker} ${styles.orgPickerPortaled} ${
                pickerPlacement === 'above' ? styles.orgPickerAbove : styles.orgPickerBelow
              }`}
              role="listbox"
              aria-label="Organization users"
              style={pickerStyle}
              onMouseDown={(event) => {
                // Keep input focus while interacting with the picker.
                event.preventDefault();
              }}
              onWheel={handlePortaledPickerWheel}
            >
              {orgGroups.length === 0 ? (
                <div className={styles.orgEmptyState}>
                  {canAddTypedEmail ? (
                    <button
                      type="button"
                      className={styles.orgAddButton}
                      onClick={addTypedEmail}
                    >
                      <span className={`wm-add ${styles.orgAddIcon}`} aria-hidden />
                      <span>
                        Add <strong>{draftNormalized}</strong>
                      </span>
                    </button>
                  ) : draftAlreadyAdded ? (
                    <p className={styles.orgEmpty}>Email address already added</p>
                  ) : (
                    <p className={styles.orgEmpty}>No matching users</p>
                  )}
                </div>
              ) : (
                orgGroups.map((group, groupIndex) => (
                  <div key={group.role} className={styles.orgGroup}>
                    {groupIndex > 0 ? <div className={styles.orgDivider} /> : null}
                    <div className={styles.orgGroupLabel}>{group.role}</div>
                    <ul className={styles.orgList}>
                      {group.users.map((user) => {
                        const checked = value.includes(user.email);
                        return (
                          <li key={user.id}>
                            <label
                              className={`${styles.orgRow} ${
                                checked ? styles.orgRowSelected : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                className={styles.orgCheckbox}
                                checked={checked}
                                onChange={() => toggleOrgUser(user.email)}
                              />
                              <span className={styles.orgEmail}>{user.email}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
