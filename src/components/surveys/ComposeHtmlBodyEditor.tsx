'use client';

import { useEffect, useRef } from 'react';
import styles from './ComposeHtmlBodyEditor.module.css';

interface ComposeHtmlBodyEditorProps {
  html: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function ComposeHtmlBodyEditor({
  html,
  onChange,
  disabled = false,
  ariaLabel = 'Email body',
  className,
}: ComposeHtmlBodyEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedHtmlRef = useRef(html);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;
    if (editor.innerHTML === html) return;
    editor.innerHTML = html || '<br>';
    lastEmittedHtmlRef.current = html;
  }, [html]);

  function commitChange(): void {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    const nextHtml = editor.innerHTML;
    if (nextHtml === lastEmittedHtmlRef.current) return;
    lastEmittedHtmlRef.current = nextHtml;
    onChange(nextHtml);
  }

  return (
    <div
      ref={editorRef}
      className={`${styles.editor} ${className ?? ''}`.trim()}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-placeholder="Write your email message…"
      onInput={commitChange}
      onBlur={commitChange}
      onPaste={(event) => {
        // Keep paste handling in the browser; commit after the paste settles.
        window.requestAnimationFrame(commitChange);
        if (event.defaultPrevented) return;
      }}
    />
  );
}
