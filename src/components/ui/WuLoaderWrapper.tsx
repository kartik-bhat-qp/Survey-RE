'use client';

import dynamic from 'next/dynamic';
import styles from './WuLoaderWrapper.module.css';

const WuLoader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLoader })),
  { ssr: false }
);

interface WuLoaderWrapperProps {
  children: React.ReactNode;
  showLoader: boolean;
  showContentWhileLoading?: boolean;
  className?: string;
  message?: string;
}

export function WuLoaderWrapper({
  children,
  showLoader,
  showContentWhileLoading = true,
  className,
  message,
}: WuLoaderWrapperProps) {
  const showContent = showContentWhileLoading || !showLoader;

  return (
    <div
      className={['wu-loader-wrapper', styles.wrapper, className].filter(Boolean).join(' ')}
    >
      {showLoader && (
        <div className={styles.overlay} role="status" aria-busy="true" aria-live="polite">
          <WuLoader variant="spinner" size="md" message={message} />
        </div>
      )}
      {showContent && children}
    </div>
  );
}
