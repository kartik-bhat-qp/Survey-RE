export function plainTextFromRichValue(value: string): string {
  if (!value) return '';
  if (typeof document === 'undefined') {
    return value.replace(/<[^>]*>/g, '');
  }
  const node = document.createElement('div');
  node.innerHTML = value;
  return node.textContent?.trim() ?? '';
}

export function isHtmlContent(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function toEditorHtml(value: string): string {
  if (!value) return '';
  return isHtmlContent(value) ? value : value.replace(/\n/g, '<br>');
}

export function serializeEditorContent(editor: HTMLElement): string {
  const html = editor.innerHTML;
  const hasFormatting = /<(b|strong|i|em|u|span|font|p|div|ul|ol|li|sub|sup|a)[\s>]/i.test(
    html
  );
  if (!hasFormatting) {
    return editor.textContent?.trim() ?? '';
  }
  return html;
}
