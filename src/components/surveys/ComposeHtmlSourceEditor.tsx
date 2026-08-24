'use client';

import { useEffect, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { ComposeHtmlPreviewFrame } from '@/components/surveys/ComposeHtmlPreviewFrame';
import {
  COMPOSE_BLOB_UNSUPPORTED_MESSAGE,
  COMPOSE_HTML_INSERT_SNIPPETS,
  composeHtmlContainsBlobUrl,
  composeHtmlContainsUnsupportedBlob,
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
  const hasNotifiedBlobRef = useRef(false);

  const containsBlob = composeHtmlContainsUnsupportedBlob(draftHtml);

  function notifyBlobUnsupported(): void {
    showToast({ message: COMPOSE_BLOB_UNSUPPORTED_MESSAGE, variant: 'error' });
  }

  function handleDraftHtmlChange(nextHtml: string): void {
    setDraftHtml(nextHtml);

    if (!composeHtmlContainsUnsupportedBlob(nextHtml)) {
      hasNotifiedBlobRef.current = false;
      return;
    }

    if (hasNotifiedBlobRef.current) return;
    hasNotifiedBlobRef.current = true;
    notifyBlobUnsupported();
  }

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const nextHtml = composePlainTextToHtml(body);
      setDraftHtml(nextHtml);
      setActiveTab('code');
      setSelectionRange({ start: 0, end: 0 });
      hasNotifiedBlobRef.current = false;
      if (composeHtmlContainsUnsupportedBlob(nextHtml)) {
        hasNotifiedBlobRef.current = true;
        showToast({ message: COMPOSE_BLOB_UNSUPPORTED_MESSAGE, variant: 'error' });
      }
    }
    wasOpenRef.current = open;
  }, [open, body, showToast]);

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

    handleDraftHtmlChange(nextHtml);
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
    if (composeHtmlContainsBlobUrl(draftHtml)) {
      hasNotifiedBlobRef.current = true;
      notifyBlobUnsupported();
      return;
    }

    if (composeHtmlContainsUnsupportedBlob(draftHtml)) {
      hasNotifiedBlobRef.current = true;
      notifyBlobUnsupported();
    }

    onApply(draftHtml.trim());
    onOpenChange(false);
    if (!composeHtmlContainsUnsupportedBlob(draftHtml)) {
      showToast({ message: 'HTML source applied', variant: 'success' });
    }
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
            Image
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
              onChange={(event) => handleDraftHtmlChange(event.target.value)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                if (composeHtmlContainsUnsupportedBlob(pasted)) {
                  hasNotifiedBlobRef.current = true;
                  notifyBlobUnsupported();
                }
              }}
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

        {containsBlob ? (
          <p className={styles.blobWarning} role="alert">
            {COMPOSE_BLOB_UNSUPPORTED_MESSAGE}
          </p>
        ) : null}

        <p className={styles.hint}>
          Edit raw HTML here. Applied source is rendered in the email body — open Source again to
          see the markup.
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
