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

function skipPasswordToggleInTabOrder(root: HTMLElement) {
  const toggle = root.querySelector<HTMLButtonElement>(PASSWORD_TOGGLE_SELECTOR);
  if (toggle) {
    toggle.tabIndex = -1;
  }
}

interface SignupPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** WickUI renders the visibility toggle before the input; keep it out of tab order. */
export function SignupPasswordField({ value, onChange }: SignupPasswordFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const apply = () => skipPasswordToggleInTabOrder(root);

    apply();
    const frameId = window.requestAnimationFrame(apply);
    return () => window.cancelAnimationFrame(frameId);
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
