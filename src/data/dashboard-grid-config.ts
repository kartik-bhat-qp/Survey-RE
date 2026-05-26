/** Default widget footprint on the AI dashboard canvas (width × height). */
export const WIDGET_DEFAULT_WIDTH_PX = 500;
export const WIDGET_DEFAULT_HEIGHT_PX = 500;

/** Comparative Bar default width (height matches other widgets). */
export const WIDGET_COMPARATIVE_BAR_WIDTH_PX = 700;
export const COMPARATIVE_BAR_LAYOUT_W =
  WIDGET_COMPARATIVE_BAR_WIDTH_PX / WIDGET_DEFAULT_WIDTH_PX;

export const GRID_ROW_HEIGHT = WIDGET_DEFAULT_HEIGHT_PX;
export const GRID_MARGIN: [number, number] = [20, 20];

/** Shorter rows on mobile — one widget per line without oversized tiles. */
export const MOBILE_GRID_ROW_HEIGHT = 320;
export const MOBILE_GRID_MARGIN: [number, number] = [12, 12];

/** Suggested column count for a given container width (e.g. when adding new widgets). */
export function suggestGridCols(containerWidth: number): number {
  return Math.max(
    1,
    Math.floor((containerWidth + GRID_MARGIN[0]) / (WIDGET_DEFAULT_WIDTH_PX + GRID_MARGIN[0]))
  );
}
