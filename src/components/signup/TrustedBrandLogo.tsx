'use client';

import { useMemo, useState } from 'react';
import {
  getTrustedBrandLogoUrl,
  getTrustedBrandSimpleIconUrl,
  type TrustedBrand,
} from '@/data/mock-signup-trusted-brands';
import styles from './TrustedBrandLogo.module.css';

type LogoSource = 'clearbit' | 'simpleicons' | 'text';

interface TrustedBrandLogoProps {
  brand: TrustedBrand;
  variant?: 'default' | 'panel';
}

function getInitialSource(brand: TrustedBrand, variant: 'default' | 'panel'): LogoSource {
  if (brand.simpleIconSlug) return 'simpleicons';
  if (variant === 'panel') return 'text';
  return 'clearbit';
}

export function TrustedBrandLogo({ brand, variant = 'default' }: TrustedBrandLogoProps) {
  const [source, setSource] = useState<LogoSource>(() => getInitialSource(brand, variant));

  const iconColor = variant === 'panel' ? 'FFFFFF' : '1e293b';

  const src = useMemo(() => {
    if (source === 'clearbit') return getTrustedBrandLogoUrl(brand.domain);
    if (source === 'simpleicons' && brand.simpleIconSlug) {
      return getTrustedBrandSimpleIconUrl(brand.simpleIconSlug, iconColor);
    }
    return '';
  }, [brand.domain, brand.simpleIconSlug, iconColor, source]);

  function handleError(): void {
    if (source === 'simpleicons') {
      setSource('text');
      return;
    }
    if (source === 'clearbit' && brand.simpleIconSlug) {
      setSource('simpleicons');
      return;
    }
    setSource('text');
  }

  if (source === 'text') {
    return (
      <span
        className={variant === 'panel' ? styles.fallbackPanel : styles.fallback}
        title={brand.name}
      >
        {brand.name}
      </span>
    );
  }

  return (
    <img
      key={`${brand.id}-${source}`}
      src={src}
      alt=""
      className={styles.logo}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}
