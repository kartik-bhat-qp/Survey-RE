import type { Layout } from 'react-grid-layout';

/** Stack grid items in visual order for a single-column mobile layout. */
export function stackLayoutSingleColumn(layout: Layout): Layout {
  return [...layout]
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    })
    .map((item, index) => ({
      ...item,
      x: 0,
      y: index,
      w: 1,
      minW: 1,
      maxW: 1,
    }));
}
