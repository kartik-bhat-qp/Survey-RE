/** Local raster export. Production export formatting is not yet independently verified. */
export function rasterPdf(jpeg: Uint8Array, width: number, height: number): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = [0];
  let length = 0;
  const append = (value: string | Uint8Array) => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; chunks.push(bytes); length += bytes.length; };
  const object = (id: number, content: string) => { offsets[id] = length; append(`${id} 0 obj\n${content}\nendobj\n`); };
  const pageWidth = width * .75;
  const pageHeight = height * .75;
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  append(jpeg); append('\nendstream\nendobj\n');
  const command = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
  object(5, `<< /Length ${encoder.encode(command).length} >>\nstream\n${command}\nendstream`);
  const xref = length;
  append('xref\n0 6\n0000000000 65535 f \n');
  for (let id = 1; id <= 5; id++) append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const result = new Uint8Array(length);
  let position = 0;
  chunks.forEach(chunk => { result.set(chunk, position); position += chunk.length; });
  return result;
}

export async function exportHeatMap(widget: HTMLElement, format: 'Image' | 'PDF', title: string): Promise<void> {
  const table = widget.querySelector('table');
  if (!table) throw new Error('There is no heat map to export.');
  await document.fonts.ready;
  const bounds = table.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = Math.ceil(bounds.width + 32) * scale;
  canvas.height = Math.ceil(bounds.height + 76) * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export is unavailable in this browser.');
  context.scale(scale, scale);
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#1b3380'; context.font = '500 18px "Fira Sans", sans-serif';
  context.fillText(title, 16, 28, bounds.width);
  for (const cell of table.querySelectorAll('th,td')) {
    const rect = cell.getBoundingClientRect();
    const css = getComputedStyle(cell);
    const x = rect.x - bounds.x + 16; const y = rect.y - bounds.y + 52;
    context.fillStyle = css.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : css.backgroundColor;
    context.fillRect(x, y, rect.width, rect.height);
    context.strokeStyle = '#dedede'; context.strokeRect(x, y, rect.width, rect.height);
    context.fillStyle = css.color; context.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const lines: string[] = [];
    for (const paragraph of (cell as HTMLElement).innerText.split('\n').filter(Boolean)) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > rect.width - 16) { lines.push(line); line = word; } else line = next;
      }
      lines.push(line);
    }
    const lineHeight = parseFloat(css.fontSize) * 1.35;
    context.textAlign = css.textAlign === 'center' ? 'center' : 'left'; context.textBaseline = 'middle';
    lines.forEach((line, index) => context.fillText(line, context.textAlign === 'center' ? x + rect.width / 2 : x + 8, y + rect.height / 2 + (index - (lines.length - 1) / 2) * lineHeight, rect.width - 16));
  }
  const blob = format === 'Image' ? await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not render the image.')), 'image/png')) : new Blob([rasterPdf(Uint8Array.from(atob(canvas.toDataURL('image/jpeg', .95).split(',')[1]), character => character.charCodeAt(0)), canvas.width, canvas.height).buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `${title.replace(/[^a-z0-9 _-]/gi, '').trim() || 'Heat Map Chart'}.${format === 'Image' ? 'png' : 'pdf'}`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
