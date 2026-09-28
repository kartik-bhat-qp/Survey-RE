import test from 'node:test';
import assert from 'node:assert/strict';
import { rasterPdf } from '../src/components/dashboards/heat-map/exportHeatMap.ts';

test('raster PDF uses binary byte offsets and preserves image stream bytes', () => {
  // The encoder treats an existing JPEG as opaque; browser canvas owns JPEG rendering.
  const jpeg = Uint8Array.from([255, 216, 255, 224, 0, 16, 128, 200, 255, 217]);
  const bytes = rasterPdf(jpeg, 800, 600);
  const text = new TextDecoder('latin1').decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4\n'));
  assert.ok(text.includes('/MediaBox [0 0 600 450]'));
  const xref = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(new TextDecoder().decode(bytes.slice(xref, xref + 4)), 'xref');
  const rows = new TextDecoder().decode(bytes.slice(xref)).split('\n').slice(3, 8);
  rows.forEach((row, index) => {
    const offset = Number(row.slice(0, 10));
    assert.ok(new TextDecoder().decode(bytes.slice(offset, offset + 8)).startsWith(`${index + 1} 0 obj`));
  });
  const imageStart = bytes.findIndex((value, index) => value === 255 && bytes[index + 1] === 216);
  assert.deepEqual(bytes.slice(imageStart, imageStart + jpeg.length), jpeg);
});
