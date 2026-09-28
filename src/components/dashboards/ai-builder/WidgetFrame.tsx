'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { widgetPayload, type BuiltWidget } from '@/data/ai-widget-builder';
import type { DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import styles from './Builder.module.css';
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export function WidgetFrame({ widget, dashboardFilter, onReady }: { widget: BuiltWidget; dashboardFilter?: DashboardActiveFilter; onReady?: (ready: boolean) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [failure, setFailure] = useState('');
  const payload = useMemo(() => widgetPayload(widget, dashboardFilter), [widget, dashboardFilter]);
  const document = useMemo(() => {
    const nonce = crypto.randomUUID();
    const html = DOMPurify.sanitize(widget.output.html, { FORBID_TAGS: ['script', 'iframe', 'form', 'object', 'embed', 'link', 'meta', 'base', 'style'], FORBID_ATTR: ['src', 'srcset', 'href', 'action', 'formaction', 'target'] });
    const css = widget.output.css.replace(/<\/style/gi, '<\\/style');
    // Encode code as JSON so closing script tags cannot escape the script element.
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html,body{margin:0;max-width:100%;overflow-wrap:anywhere}*{box-sizing:border-box}${css}</style></head><body><div id="widget-root">${html}</div><script nonce="${nonce}">const report=(error)=>parent.postMessage({type:'ai-widget-result',error},'*');window.addEventListener('error',e=>report(e.message));window.addEventListener('unhandledrejection',e=>report(String(e.reason)));try{new Function(${json(widget.output.javascript)})();if(typeof window.renderWidget!=='function')throw new Error('JavaScript must define window.renderWidget');Promise.resolve(window.renderWidget({root:document.getElementById('widget-root'),data:${json(payload)},settings:${json(widget.settings)}})).then(()=>report('')).catch(e=>report(String(e)));}catch(e){report(String(e));}</script></body></html>`;
  }, [widget, payload]);
  useEffect(() => {
    onReady?.(false);
    let settled = false;
    const timeout = window.setTimeout(() => { if (!settled) { setFailure('No render confirmation. Check the AI output and preview again.'); onReady?.(false); } }, 7000);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'ai-widget-result') return;
      settled = true;
      window.clearTimeout(timeout);
      const error = typeof event.data.error === 'string' ? event.data.error.slice(0, 500) : 'Invalid render confirmation.';
      setFailure(error); onReady?.(!error);
    };
    window.addEventListener('message', receive);
    return () => { window.clearTimeout(timeout); window.removeEventListener('message', receive); };
  }, [document, onReady]);
  return <div className={styles.frameWrap}>
    {failure && <p role="alert" className={styles.error}>{failure}</p>}
    {payload.error ? <p role="status" className={styles.error}>{payload.error}</p> : <iframe ref={frame} title={`${widget.settings.name} preview`} className={styles.frame} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={document} />}
  </div>;
}
