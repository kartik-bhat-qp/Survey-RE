'use client';

import { useCallback, useRef } from 'react';
import styles from './SurveySettingsRichText.module.css';

interface SurveySettingsRichTextProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  toolbarPosition?: 'top' | 'bottom';
}

export function SurveySettingsRichText({
  value,
  onChange,
  ariaLabel,
}: SurveySettingsRichTextProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeRef.current(e.target.value);
    },
    []
  );

  return (
    <div className={styles.shell} aria-label={ariaLabel}>
      <textarea
        className={styles.editor}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        rows={4}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid var(--wu-border-color, #ccc)',
          borderRadius: '4px',
          fontFamily: 'inherit',
          fontSize: '14px',
          resize: 'vertical',
        }}
      />
    </div>
  );
}
