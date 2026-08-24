'use client';

import { useEffect, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { ComposeHtmlPreviewFrame } from '@/components/surveys/ComposeHtmlPreviewFrame';
import {
  COMPOSE_HTML_INSERT_SNIPPETS,
  composePlainTextToHtml,
  insertTextAtComposeHtmlCursor,
} from '@/data/mock-survey-distribute';
import styles from './ComposeHtmlSourceEditor.module.css';

type SourceEditorTab = 'code' | 'preview';

interface ComposeHtmlSourceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  body: string;
  onApply: (html: string) => void;
}

export function ComposeHtmlSourceEditor({
  open,
  onOpenChange,
  body,
  onApply,
}: ComposeHtmlSourceEditorProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const codeFieldRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SourceEditorTab>('code');
  const [draftHtml, setDraftHtml] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraftHtml(composePlainTextToHtml(body));
      setActiveTab('code');
      setSelectionRange({ start: 0, end: 0 });
    }
    wasOpenRef.current = open;
  }, [open, body]);

  function updateSelection(): void {
    const field = codeFieldRef.current;
    if (!field) return;
    setSelectionRange({
      start: field.selectionStart ?? 0,
      end: field.selectionEnd ?? 0,
    });
  }

  function insertSnippet(snippet: string, label: string): void {
    const field = codeFieldRef.current;
    const start = field?.selectionStart ?? selectionRange.start;
    const end = field?.selectionEnd ?? selectionRange.end;
    const { nextHtml, nextCursor } = insertTextAtComposeHtmlCursor(
      draftHtml,
      snippet,
      start,
      end
    );

    setDraftHtml(nextHtml);
    setSelectionRange({ start: nextCursor, end: nextCursor });
    showToast({ message: `Inserted ${label}`, variant: 'info' });

    requestAnimationFrame(() => {
      if (!field) return;
      field.focus();
      field.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ message: 'Choose an image file', variant: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        showToast({ message: 'Could not read image file', variant: 'error' });
        return;
      }

      const alt = file.name.replace(/\.[^.]+$/, '') || 'Image';
      insertSnippet(`<img src="${dataUrl}" alt="${alt}" />`, 'image');
    };
    reader.onerror = () => {
      showToast({ message: 'Could not read image file', variant: 'error' });
    };
    reader.readAsDataURL(file);
  }

  function handleApply(): void {
    onApply(draftHtml.trim());
    onOpenChange(false);
    showToast({ message: 'HTML source applied', variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="lg">
      <WuModalHeader>HTML Source</WuModalHeader>
      <WuModalContent className={styles.modalContent}>
        <div className={styles.tabBar} role="tablist" aria-label="HTML source views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'code'}
            className={`${styles.tabBtn} ${activeTab === 'code' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>

        <div className={styles.insertBar}>
          <span className={styles.insertLabel}>Insert:</span>
          {COMPOSE_HTML_INSERT_SNIPPETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.insertBtn}
              onClick={() => insertSnippet(item.snippet, item.label)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.insertBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Image / blob
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleImageUpload}
          />
        </div>

        <div className={styles.editorPane}>
          {activeTab === 'code' ? (
            <textarea
              ref={codeFieldRef}
              className={styles.codeField}
              value={draftHtml}
              onChange={(event) => setDraftHtml(event.target.value)}
              onSelect={updateSelection}
              onKeyUp={updateSelection}
              onMouseUp={updateSelection}
              spellCheck={false}
              aria-label="HTML source code"
            />
          ) : (
            <div className={styles.previewPane} aria-label="HTML preview">
              {draftHtml.trim() ? (
                <ComposeHtmlPreviewFrame
                  html={draftHtml}
                  title="Email HTML preview"
                  className={styles.previewFrame}
                />
              ) : (
                <p className={styles.previewEmpty}>Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Edit raw HTML, insert tags, or upload images as base64 data URLs. Tiny images are
          enlarged in Preview so they are easier to verify.
        </p>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton color="primary" onClick={handleApply}>
          Apply
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
