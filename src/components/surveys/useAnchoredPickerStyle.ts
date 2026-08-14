'use client';

import { useLayoutEffect, useState, type CSSProperties, type RefObject, type WheelEvent } from 'react';

const PICKER_MAX_HEIGHT = 280;
/** Keeps an expanded list clear of the window edge. */
const VIEWPORT_MARGIN = 8;
/** Overlaps the field border so field and list share a single hairline. */
const ANCHOR_OVERLAP = 1;

export type AnchoredPickerPlacement = 'below' | 'above';

export interface AnchoredPicker {
  style: CSSProperties;
  placement: AnchoredPickerPlacement;
}

export function useAnchoredPickerStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>
): AnchoredPicker {
  const [picker, setPicker] = useState<AnchoredPicker>({ style: {}, placement: 'below' });

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition(): void {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - VIEWPORT_MARGIN;
      const openUpward =
        spaceBelow < Math.min(PICKER_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;

      if (openUpward) {
        setPicker({
          placement: 'above',
          style: {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            bottom: window.innerHeight - rect.top - ANCHOR_OVERLAP,
            top: 'auto',
            maxHeight: Math.min(PICKER_MAX_HEIGHT, Math.max(120, spaceAbove)),
            zIndex: 10050,
          },
        });
        return;
      }

      setPicker({
        placement: 'below',
        style: {
          position: 'fixed',
          left: rect.left,
          width: rect.width,
          top: rect.bottom - ANCHOR_OVERLAP,
          bottom: 'auto',
          maxHeight: Math.min(PICKER_MAX_HEIGHT, Math.max(120, spaceBelow)),
          zIndex: 10050,
        },
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, open]);

  return picker;
}

/**
 * Radix Dialog / react-remove-scroll preventDefault wheel events outside the
 * modal. Portaled pickers must apply delta manually to scroll.
 */
export function handlePortaledPickerWheel(event: WheelEvent<HTMLElement>): void {
  const node = event.currentTarget;
  if (node.scrollHeight <= node.clientHeight) return;
  node.scrollTop += event.deltaY;
  event.stopPropagation();
}
