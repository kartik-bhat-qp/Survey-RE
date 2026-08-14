'use client';

import { useLayoutEffect, useState, type CSSProperties, type RefObject, type WheelEvent } from 'react';

const PICKER_MAX_HEIGHT = 280;
const PICKER_GAP = 4;

export function useAnchoredPickerStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition(): void {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - PICKER_GAP;
      const spaceAbove = rect.top - PICKER_GAP;
      const openUpward =
        spaceBelow < Math.min(PICKER_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;

      if (openUpward) {
        setStyle({
          position: 'fixed',
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top + PICKER_GAP,
          top: 'auto',
          maxHeight: Math.min(PICKER_MAX_HEIGHT, Math.max(120, spaceAbove)),
          zIndex: 10050,
        });
        return;
      }

      setStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: rect.bottom + PICKER_GAP,
        bottom: 'auto',
        maxHeight: Math.min(PICKER_MAX_HEIGHT, Math.max(120, spaceBelow)),
        zIndex: 10050,
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

  return style;
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
