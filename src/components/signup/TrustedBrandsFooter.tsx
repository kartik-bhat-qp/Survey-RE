'use client';

import { useEffect, useState } from 'react';
import { TrustedBrandLogo } from '@/components/signup/TrustedBrandLogo';
import {
  getTrustedBrandGroupCount,
  getTrustedBrandsForGroup,
  SIGNUP_TRUSTED_BRANDS,
  SIGNUP_TRUSTED_BRANDS_HEADLINE,
  SIGNUP_TRUSTED_BRANDS_ROTATE_MS,
  SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT,
} from '@/data/mock-signup-trusted-brands';
import styles from './TrustedBrandsFooter.module.css';

const GROUP_COUNT = getTrustedBrandGroupCount();

interface TrustedBrandsFooterProps {
  layout?: 'footer' | 'panel';
}

export function TrustedBrandsFooter({ layout = 'footer' }: TrustedBrandsFooterProps) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || GROUP_COUNT <= 1) {
      return;
    }

    let fadeTimeoutId: number | undefined;

    const intervalId = window.setInterval(() => {
      setVisible(false);
      fadeTimeoutId = window.setTimeout(() => {
        setGroupIndex((current) => (current + 1) % GROUP_COUNT);
        setVisible(true);
      }, 280);
    }, SIGNUP_TRUSTED_BRANDS_ROTATE_MS);

    return () => {
      window.clearInterval(intervalId);
      if (fadeTimeoutId) window.clearTimeout(fadeTimeoutId);
    };
  }, []);

  const visibleBrands = getTrustedBrandsForGroup(groupIndex);

  return (
    <footer
      className={`${styles.footer} ${layout === 'panel' ? styles.footerPanel : ''}`}
      aria-label="Trusted brands"
    >
      <p className={`${styles.headline} ${layout === 'panel' ? styles.headlinePanel : ''}`}>
        {SIGNUP_TRUSTED_BRANDS_HEADLINE}
      </p>
      <div
        className={styles.logoViewport}
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Showing ${visibleBrands.length} of ${SIGNUP_TRUSTED_BRANDS.length} partner brands`}
      >
        <ul
          key={groupIndex}
          className={`${styles.logoRow} ${visible ? styles.logoRowVisible : styles.logoRowHidden}`}
        >
          {visibleBrands.map((brand) => (
            <li key={brand.id} className={styles.logoItem}>
              <TrustedBrandLogo
                brand={brand}
                variant={layout === 'panel' ? 'panel' : 'default'}
              />
            </li>
          ))}
          {visibleBrands.length < SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT
            ? Array.from({
                length: SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT - visibleBrands.length,
              }).map((_, index) => (
                <li
                  key={`spacer-${groupIndex}-${index}`}
                  className={styles.logoItemSpacer}
                  aria-hidden
                />
              ))
            : null}
        </ul>
      </div>
    </footer>
  );
}
