'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  serializeEditorContent,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import styles from './SurveySettingsRichText.module.css';

interface SurveySettingsRichTextProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function SurveySettingsRichText({
  value,
  onChange,
  ariaLabel,
}: SurveySettingsRichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState(value);

  useEffect(() => {
    if (sourceMode) return;
    const editor = editorRef.current;
    if (!editor) return;
    const html = toEditorHtml(value);
    if (editor.innerHTML !== html && document.activeElement !== editor) {
      editor.innerHTML = html;
    }
  }, [value, sourceMode]);

  const commitFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = serializeEditorContent(editor);
    onChange(next);
    setSourceText(next);
  }, [onChange]);

  const runCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (sourceMode) return;
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      commitFromEditor();
    },
    [commitFromEditor, sourceMode]
  );

  function handleSourceToggle(): void {
    if (sourceMode) {
      onChange(sourceText);
      setSourceMode(false);
      return;
    }
    setSourceText(value);
    setSourceMode(true);
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="Bold"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('bold')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${styles.toolbarBtnItalic}`}
          aria-label="Italic"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('italic')}
        >
          I
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${styles.toolbarBtnUnderline}`}
          aria-label="Underline"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('underline')}
        >
          U
        </button>
        <span className={styles.toolbarDivider} aria-hidden />
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="Font size"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('fontSize', '3')}
        >
          Size
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="Align left"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyLeft')}
        >
          <span className="wm-format-align-left" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="Align center"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyCenter')}
        >
          <span className="wm-format-align-center" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="Align right"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('justifyRight')}
        >
          <span className="wm-format-align-right" aria-hidden />
        </button>
        <span className={styles.toolbarDivider} aria-hidden />
        <button
          type="button"
          className={`${styles.toolbarBtn} ${sourceMode ? styles.toolbarBtnActive : ''}`}
          aria-label="Source code"
          aria-pressed={sourceMode}
          onClick={handleSourceToggle}
        >
          {'</>'}
        </button>
      </div>
      {sourceMode ? (
        <textarea
          className={styles.source}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          onBlur={() => onChange(sourceText)}
          aria-label={`${ariaLabel} source`}
        />
      ) : (
        <div
          ref={editorRef}
          className={styles.editor}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          aria-label={ariaLabel}
          onInput={commitFromEditor}
          onBlur={commitFromEditor}
        />
      )}
    </div>
  );
}
