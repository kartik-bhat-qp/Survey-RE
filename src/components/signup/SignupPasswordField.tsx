'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const PASSWORD_TOGGLE_SELECTOR = '[data-slot="wu-input-password-toggle"]';

function skipPasswordToggleInTabOrder(root: HTMLElement): boolean {
  const toggle = root.querySelector<HTMLButtonElement>(PASSWORD_TOGGLE_SELECTOR);
  if (!toggle) return false;
  if (toggle.tabIndex !== -1) {
    toggle.tabIndex = -1;
  }
  return true;
}

interface SignupPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * WickUI password inputs render the visibility toggle before the field in the DOM.
 * Remove the toggle from tab order so Email → Password input → Create account.
 */
export function SignupPasswordField({ value, onChange }: SignupPasswordFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const apply = () => skipPasswordToggleInTabOrder(root);

    apply();

    const observer = new MutationObserver(() => {
      apply();
    });
    observer.observe(root, { childList: true, subtree: true });

    const frameId = window.requestAnimationFrame(apply);
    const timeoutId = window.setTimeout(apply, 0);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <WuFormGroup
        Input={
          <WuInput
            id="signup-password"
            Label="Password"
            variant="outlined"
            type="password"
            placeholder="8+ characters"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        }
      />
    </div>
  );
}
