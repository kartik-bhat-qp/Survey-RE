'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  RICH_TEXT_FONT_OPTIONS,
  RICH_TEXT_SIZE_OPTIONS,
} from '@/data/mock-rich-text-editor';
import {
  serializeEditorContent,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import styles from './RichTextEditor.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Compact height for inline forms; default is the modal-sized editor. */
  compact?: boolean;
  /** Hide the Font dropdown (e.g. RAA additional content). */
  hideFont?: boolean;
}

function ToolbarButton({
  label,
  active,
  className,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <WuTooltip content={label} position="top">
      <button
        type="button"
        className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''} ${className ?? ''}`}
        aria-label={label}
        aria-pressed={active}
        title={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      >
        {children}
      </button>
    </WuTooltip>
  );
}

export function RichTextEditor({
  value,
  onChange,
  ariaLabel,
  compact = false,
  hideFont = false,
}: RichTextEditorProps) {
  const { showToast } = useWuShowToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState(value);
  const [fontName, setFontName] = useState<string>(RICH_TEXT_FONT_OPTIONS[0]);
  const [fontSize, setFontSize] = useState<string>(RICH_TEXT_SIZE_OPTIONS[2].value);

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

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const runCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (sourceMode) return;
      focusEditor();
      document.execCommand(command, false, commandValue);
      commitFromEditor();
    },
    [commitFromEditor, focusEditor, sourceMode]
  );

  const handleFontChange = useCallback(
    (nextFont: string) => {
      setFontName(nextFont);
      runCommand('fontName', nextFont);
    },
    [runCommand]
  );

  const handleSizeChange = useCallback(
    (nextSize: string) => {
      setFontSize(nextSize);
      runCommand('fontSize', nextSize);
    },
    [runCommand]
  );

  const handleInsertLink = useCallback(() => {
    const url = window.prompt('Enter link URL', 'https://');
    if (!url) return;
    runCommand('createLink', url);
  }, [runCommand]);

  const handleToggleSource = useCallback(() => {
    if (sourceMode) {
      onChange(sourceText);
      setSourceMode(false);
      return;
    }
    setSourceText(value);
    setSourceMode(true);
  }, [onChange, sourceMode, sourceText, value]);

  const handleInsertImage = useCallback(() => {
    showToast({ message: 'Insert image', variant: 'info' });
  }, [showToast]);

  const handleInsertTable = useCallback(() => {
    showToast({ message: 'Insert table', variant: 'info' });
  }, [showToast]);

  return (
    <div className={`${styles.shell} ${compact ? styles.shellCompact : ''}`}>
      <div className={styles.toolbar} role="toolbar" aria-label="Rich text formatting">
        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Bold" onClick={() => runCommand('bold')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            className={styles.toolbarBtnItalic}
            onClick={() => runCommand('italic')}
          >
            I
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            className={styles.toolbarBtnUnderline}
            onClick={() => runCommand('underline')}
          >
            U
          </ToolbarButton>
          <ToolbarButton
            label="Copy formatting"
            onClick={() => showToast({ message: 'Copy formatting', variant: 'info' })}
          >
            <span className="wm-format-paint" aria-hidden />
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          {hideFont ? null : (
            <WuTooltip content="Font" position="top">
              <label className={styles.toolbarSelect} title="Font">
                <span className={styles.selectLabel} aria-hidden>
                  Font
                </span>
                <select
                  value={fontName}
                  onChange={(event) => handleFontChange(event.target.value)}
                  aria-label="Font"
                >
                  {RICH_TEXT_FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
            </WuTooltip>
          )}
          <WuTooltip content="Size" position="top">
            <label className={styles.toolbarSelect} title="Size">
              <span className={styles.selectLabel} aria-hidden>
                Size
              </span>
              <select
                value={fontSize}
                onChange={(event) => handleSizeChange(event.target.value)}
                aria-label="Size"
              >
                {RICH_TEXT_SIZE_OPTIONS.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </label>
          </WuTooltip>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <WuTooltip content="Text color" position="top">
            <input
              type="color"
              className={styles.colorInput}
              defaultValue="#1e293b"
              aria-label="Text color"
              title="Text color"
              onMouseDown={(event) => event.preventDefault()}
              onChange={(event) => runCommand('foreColor', event.target.value)}
            />
          </WuTooltip>
          <WuTooltip content="Highlight color" position="top">
            <input
              type="color"
              className={styles.colorInput}
              defaultValue="#ffffff"
              aria-label="Highlight color"
              title="Highlight color"
              onMouseDown={(event) => event.preventDefault()}
              onChange={(event) => runCommand('backColor', event.target.value)}
            />
          </WuTooltip>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Align left" onClick={() => runCommand('justifyLeft')}>
            <span className="wm-format-align-left" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Align center" onClick={() => runCommand('justifyCenter')}>
            <span className="wm-format-align-center" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Align right" onClick={() => runCommand('justifyRight')}>
            <span className="wm-format-align-right" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Justify" onClick={() => runCommand('justifyFull')}>
            <span className="wm-format-align-justify" aria-hidden />
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Decrease indent" onClick={() => runCommand('outdent')}>
            <span className="wm-format-indent-decrease" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Increase indent" onClick={() => runCommand('indent')}>
            <span className="wm-format-indent-increase" aria-hidden />
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton
            label="Bulleted list"
            onClick={() => runCommand('insertUnorderedList')}
          >
            <span className="wm-format-list-bulleted" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            onClick={() => runCommand('insertOrderedList')}
          >
            <span className="wm-format-list-numbered" aria-hidden />
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Insert image" onClick={handleInsertImage}>
            <span className="wm-image" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Insert table" onClick={handleInsertTable}>
            <span className="wm-table-chart" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Subscript" onClick={() => runCommand('subscript')}>
            x<sub>2</sub>
          </ToolbarButton>
          <ToolbarButton label="Superscript" onClick={() => runCommand('superscript')}>
            x<sup>2</sup>
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Insert link" onClick={handleInsertLink}>
            <span className="wm-link" aria-hidden />
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton
            label="Source"
            active={sourceMode}
            onClick={handleToggleSource}
          >
            <span className={styles.sourceLabel}>
              <span className="wm-code" aria-hidden />
              Source
            </span>
          </ToolbarButton>
        </div>

        <span className={styles.toolbarDivider} aria-hidden />

        <div className={styles.toolbarGroup}>
          <ToolbarButton label="Clear formatting" onClick={() => runCommand('removeFormat')}>
            T<sub>x</sub>
          </ToolbarButton>
        </div>
      </div>

      <div className={styles.editorArea}>
        {sourceMode ? (
          <textarea
            className={styles.sourceTextarea}
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            onBlur={() => onChange(sourceText)}
            aria-label={`${ariaLabel} source`}
          />
        ) : (
          <div
            ref={editorRef}
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            className={styles.editor}
            aria-label={ariaLabel}
            aria-multiline
            onInput={commitFromEditor}
            onBlur={commitFromEditor}
          />
        )}
      </div>
    </div>
  );
}
