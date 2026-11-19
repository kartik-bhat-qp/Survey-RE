import type { Layout } from 'react-grid-layout';

/** Stack grid items in visual order for a single-column mobile layout. */
export function stackLayoutSingleColumn(layout: Layout, heights: Readonly<Record<string, number>> = {}): Layout {
  let nextY = 0;
  return [...layout]
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    })
    .map(item => {
      const h = heights[item.i] ?? 1;
      const next = { ...item, x: 0, y: nextY, w: 1, h, minW: 1, maxW: 1, minH: 1 };
      nextY += h;
      return next;
    });
}

/** Apply type constraints after restoring or interacting with a saved layout. */
export function enforceFullWidthWidgets(layout: Layout, ids: ReadonlySet<string>, columns: number, heights: Readonly<Record<string, number>> = {}): Layout {
  return layout.map(item => ids.has(item.i) ? {
    ...item, x: 0, w: columns, minW: columns, maxW: columns, h: heights[item.i] ?? item.h, isResizable: false, resizeHandles: [],
  } : item);
}

/** Include grid gaps when converting natural content height into occupied rows. */
export function contentHeightToGridRows(height: number, rowHeight: number, gap: number): number {
  return Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
}
