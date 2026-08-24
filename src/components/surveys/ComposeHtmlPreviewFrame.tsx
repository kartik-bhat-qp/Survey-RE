'use client';

import { useEffect, useRef } from 'react';
import { buildComposeHtmlPreviewDocument } from '@/data/mock-survey-distribute';
import styles from './ComposeHtmlPreviewFrame.module.css';

interface ComposeHtmlPreviewFrameProps {
  html: string;
  title?: string;
  className?: string;
}

export function ComposeHtmlPreviewFrame({
  html,
  title = 'HTML preview',
  className,
}: ComposeHtmlPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.srcdoc = buildComposeHtmlPreviewDocument(html);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className={className ?? styles.frame}
      title={title}
      sandbox="allow-same-origin"
    />
  );
}
