'use client';

import { useEffect } from 'react';

const WICK_POPUP_SELECTOR = '[class*="_wuMenuPositioner_"], [class*="_wuDropdownPositioner_"]';

/**
 * WuModal's scroll lock (react-remove-scroll) cancels wheel/touch scrolling for
 * anything outside the dialog. WuMenu / WuDropdown popups portal to <body>, so
 * long option lists inside a modal can't be scrolled. Stopping these events at
 * the window capture phase keeps them from reaching the lock's document listener
 * while native scrolling still happens.
 */
export function WickPopupScrollUnlock() {
  useEffect(() => {
    const handler = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(WICK_POPUP_SELECTOR)) {
        event.stopPropagation();
      }
    };
    const options: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('wheel', handler, options);
    window.addEventListener('touchmove', handler, options);
    return () => {
      window.removeEventListener('wheel', handler, options);
      window.removeEventListener('touchmove', handler, options);
    };
  }, []);

  return null;
}
