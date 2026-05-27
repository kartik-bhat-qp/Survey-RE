'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  RICH_TEXT_FONT_OPTIONS,
  RICH_TEXT_SIZE_OPTIONS,
} from '@/data/mock-rich-text-editor';
import {
  serializeEditorContent,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import styles from './RichTextEditorModal.module.css';

export interface RichTextEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
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
    <button
      type="button"
      className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''} ${className ?? ''}`}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichTextEditorModal({
  open,
  onOpenChange,
  value,
  onSave,
}: RichTextEditorModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [fontName, setFontName] = useState<string>(RICH_TEXT_FONT_OPTIONS[0]);
  const [fontSize, setFontSize] = useState<string>(RICH_TEXT_SIZE_OPTIONS[2].value);

  useEffect(() => {
    if (!open) return;
    const html = toEditorHtml(value);
    setDraft(html);
    setSourceText(html);
    setSourceMode(false);
    setFontName(RICH_TEXT_FONT_OPTIONS[0]);
    setFontSize(RICH_TEXT_SIZE_OPTIONS[2].value);
  }, [open, value]);

  useEffect(() => {
    if (!open || sourceMode) return;
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== draft) {
      editor.innerHTML = draft;
    }
  }, [open, sourceMode, draft]);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const runCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (sourceMode) return;
      focusEditor();
      document.execCommand(command, false, commandValue);
      const editor = editorRef.current;
      if (!editor) return;
      const next = serializeEditorContent(editor);
      setDraft(next);
      setSourceText(next);
    },
    [focusEditor, sourceMode]
  );

  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = serializeEditorContent(editor);
    setDraft(next);
    setSourceText(next);
  }, []);

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
      const html = sourceText.trim();
      setDraft(html);
      setSourceMode(false);
      return;
    }
    const editor = editorRef.current;
    const html = editor ? serializeEditorContent(editor) : draft;
    setSourceText(html);
    setSourceMode(true);
  }, [draft, sourceMode, sourceText]);

  const handleSave = useCallback(() => {
    const next = sourceMode ? sourceText.trim() : draft;
    onSave(next);
    onOpenChange(false);
    showToast({ message: 'Rich text saved', variant: 'success' });
  }, [draft, onOpenChange, onSave, showToast, sourceMode, sourceText]);

  const handleInsertImage = useCallback(() => {
    showToast({ message: 'Insert image', variant: 'info' });
  }, [showToast]);

  const handleInsertTable = useCallback(() => {
    showToast({ message: 'Insert table', variant: 'info' });
  }, [showToast]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      className={styles.modalWide}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Rich Text Editor</WuModalHeader>
      <WuModalContent>
        <div className={styles.editorShell}>
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
              <ToolbarButton label="Clear formatting" onClick={() => runCommand('removeFormat')}>
                <span className="wm-format-clear" aria-hidden />
              </ToolbarButton>
            </div>

            <span className={styles.toolbarDivider} aria-hidden />

            <div className={styles.toolbarGroup}>
              <label className={styles.toolbarSelect}>
                <span className={styles.srOnly}>Font</span>
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
              <label className={styles.toolbarSelect}>
                <span className={styles.srOnly}>Size</span>
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
              <input
                type="color"
                className={styles.colorInput}
                defaultValue="#1e293b"
                aria-label="Text color"
                onChange={(event) => runCommand('foreColor', event.target.value)}
              />
              <input
                type="color"
                className={styles.colorInput}
                defaultValue="#ffffff"
                aria-label="Highlight color"
                onChange={(event) => runCommand('backColor', event.target.value)}
              />
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
              <ToolbarButton label="Decrease indent" onClick={() => runCommand('outdent')}>
                <span className="wm-format-indent-decrease" aria-hidden />
              </ToolbarButton>
              <ToolbarButton label="Increase indent" onClick={() => runCommand('indent')}>
                <span className="wm-format-indent-increase" aria-hidden />
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
              <ToolbarButton label="Remove link" onClick={() => runCommand('unlink')}>
                <span className="wm-link-off" aria-hidden />
              </ToolbarButton>
              <ToolbarButton
                label="Source"
                active={sourceMode}
                onClick={handleToggleSource}
              >
                Source
              </ToolbarButton>
              <ToolbarButton label="Remove format" onClick={() => runCommand('removeFormat')}>
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
                aria-label="HTML source"
              />
            ) : (
              <div
                ref={editorRef}
                role="textbox"
                contentEditable
                suppressContentEditableWarning
                className={styles.editor}
                aria-label="Rich text content"
                onInput={handleEditorInput}
              />
            )}
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <WuButton onClick={handleSave}>Save</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
