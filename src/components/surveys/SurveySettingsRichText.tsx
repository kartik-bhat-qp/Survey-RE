'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { IWuHtmlSourceProps } from '@npm-questionpro/wick-ui-editor';
import { toEditorHtml } from '@/components/surveys/rich-text-utils';
import styles from './SurveySettingsRichText.module.css';

const WuContentEditor = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-editor').then((m) => ({
      default: m.WuContentEditor,
    })),
  { ssr: false }
);

interface SurveySettingsRichTextProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  toolbarPosition?: 'top' | 'bottom';
}

function toDefaultHtml(value: string): string {
  const html = toEditorHtml(value).trim();
  if (!html) return '<p></p>';
  if (/^<(p|div|ul|ol|h[1-6])\b/i.test(html)) return html;
  return `<p>${html}</p>`;
}

export function SurveySettingsRichText({
  value,
  onChange,
  ariaLabel,
  toolbarPosition = 'top',
}: SurveySettingsRichTextProps) {
  const [isHtml, setIsHtml] = useState(false);
  const [ready, setReady] = useState(false);
  const [HtmlSource, setHtmlSource] = useState<ComponentType<IWuHtmlSourceProps> | null>(
    null
  );
  const onChangeRef = useRef(onChange);
  const lastEmittedHtmlRef = useRef(toDefaultHtml(value));
  onChangeRef.current = onChange;

  const handleUpdate = useCallback((html: string) => {
    if (html === lastEmittedHtmlRef.current) return;
    lastEmittedHtmlRef.current = html;
    onChangeRef.current(html);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void import('@npm-questionpro/wick-ui-editor/html').then((m) => {
      if (!cancelled) setHtmlSource(() => m.WuHtmlSource);
    });

    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!ready || !HtmlSource) {
    return <div className={styles.shell} aria-label={ariaLabel} aria-busy />;
  }

  return (
    <div className={styles.shell} aria-label={ariaLabel}>
      <WuContentEditor
        defaultValue={lastEmittedHtmlRef.current}
        onUpdate={handleUpdate}
        isHtml={isHtml}
        setIsHtml={setIsHtml}
        htmlSource={HtmlSource}
        toolbarPosition={toolbarPosition}
        className={styles.editor}
      />
    </div>
  );
}
