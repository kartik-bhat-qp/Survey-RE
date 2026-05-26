'use client';

import dynamic from 'next/dynamic';

const WuLoader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLoader })),
  { ssr: false }
);

interface StandardLoaderProps {
  className?: string;
  message?: string;
}

/** WickUI standard spinner — use for dynamic import fallbacks and loading overlays. */
export function StandardLoader({ className, message }: StandardLoaderProps) {
  return (
    <div
      className={['wu-loader-wrapper', 'flex items-center justify-center min-h-[240px] w-full', className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <WuLoader variant="spinner" size="md" message={message} />
    </div>
  );
}
