'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type SyntheticEvent,
} from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { RichTextEditorModal } from '@/components/surveys/RichTextEditorModal';
import {
  plainTextFromRichValue,
  serializeEditorContent,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import styles from './QuestionRichTextField.module.css';

export { plainTextFromRichValue };

export type QuestionRichTextVariant = 'question' | 'option';

interface QuestionRichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  variant?: QuestionRichTextVariant;
  placeholder?: string;
  ariaLabel: string;
  onPointerDown?: (event: SyntheticEvent) => void;
  /** Where the inline formatting toolbar anchors when focused. */
  toolbarAlign?: 'start' | 'end';
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function readFormatState(): FormatState {
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
  };
}

export function QuestionRichTextField({
  value,
  onChange,
  variant = 'question',
  placeholder,
  ariaLabel,
  onPointerDown,
  toolbarAlign = 'start',
}: QuestionRichTextFieldProps) {
  const { showToast } = useWuShowToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [fullEditorOpen, setFullEditorOpen] = useState(false);
  const [formats, setFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
  });

  const syncValueToEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = toEditorHtml(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }, [value]);

  useEffect(() => {
    if (document.activeElement === editorRef.current) return;
    syncValueToEditor();
  }, [syncValueToEditor]);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.textContent?.trim() === '') {
      onChange('');
      return;
    }
    onChange(serializeEditorContent(editor));
  }, [onChange]);

  const refreshFormats = useCallback(() => {
    setFormats(readFormatState());
  }, []);

  const runCommand = useCallback(
    (command: 'bold' | 'italic' | 'underline') => {
      editorRef.current?.focus();
      document.execCommand(command);
      emitChange();
      refreshFormats();
    },
    [emitChange, refreshFormats]
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    refreshFormats();
  }, [refreshFormats]);

  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (toolbarRef.current?.contains(next)) return;
    setFocused(false);
    emitChange();
  }, [emitChange]);

  const handleInput = useCallback(() => {
    emitChange();
    refreshFormats();
  }, [emitChange, refreshFormats]);

  const handleToolbarMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  const handleInsertMedia = useCallback(() => {
    showToast({ message: 'Insert media', variant: 'info' });
  }, [showToast]);

  const handleOpenFullEditor = useCallback(() => {
    emitChange();
    setFocused(false);
    setFullEditorOpen(true);
  }, [emitChange]);

  const handleFullEditorSave = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      const editor = editorRef.current;
      if (editor) {
        editor.innerHTML = toEditorHtml(nextValue);
      }
    },
    [onChange]
  );

  const editorClassName =
    variant === 'option'
      ? `${styles.editor} ${styles.editorOption}`
      : styles.editor;

  return (
    <>
      <div className={`${styles.field} ${variant === 'option' ? styles.fieldOption : ''}`}>
        <div
          className={`${styles.editorRow} ${focused ? styles.editorRowFocused : ''}`}
        >
          <div
            ref={editorRef}
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            className={editorClassName}
            aria-label={ariaLabel}
            data-placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onInput={handleInput}
            onKeyUp={refreshFormats}
            onMouseUp={refreshFormats}
            onClick={onPointerDown}
            onPointerDown={onPointerDown}
          />
        </div>

        {focused ? (
          <div
            ref={toolbarRef}
            className={`${styles.toolbar} ${
              toolbarAlign === 'end' ? styles.toolbarEnd : ''
            }`}
            role="toolbar"
            aria-label="Text formatting"
            onMouseDown={handleToolbarMouseDown}
          >
            <button
              type="button"
              className={`${styles.toolbarBtn} ${formats.bold ? styles.toolbarBtnActive : ''}`}
              aria-label="Bold"
              aria-pressed={formats.bold}
              onClick={() => runCommand('bold')}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnItalic} ${
                formats.italic ? styles.toolbarBtnActive : ''
              }`}
              aria-label="Italic"
              aria-pressed={formats.italic}
              onClick={() => runCommand('italic')}
            >
              I
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnUnderline} ${
                formats.underline ? styles.toolbarBtnActive : ''
              }`}
              aria-label="Underline"
              aria-pressed={formats.underline}
              onClick={() => runCommand('underline')}
            >
              U
            </button>
            <span className={styles.toolbarDivider} aria-hidden />
            <button
              type="button"
              className={styles.toolbarBtn}
              aria-label="Insert media"
              onClick={handleInsertMedia}
            >
              <span className={`wm-perm-media ${styles.toolbarIcon}`} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              aria-label="Open full editor"
              onClick={handleOpenFullEditor}
            >
              <span className={`wm-open-in-new-down ${styles.toolbarIcon}`} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <RichTextEditorModal
        open={fullEditorOpen}
        onOpenChange={setFullEditorOpen}
        value={value}
        onSave={handleFullEditorSave}
      />
    </>
  );
}
