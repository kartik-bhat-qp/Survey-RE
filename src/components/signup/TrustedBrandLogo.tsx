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
}

export function TrustedBrandLogo({ brand }: TrustedBrandLogoProps) {
  const [source, setSource] = useState<LogoSource>('clearbit');

  const src = useMemo(() => {
    if (source === 'clearbit') return getTrustedBrandLogoUrl(brand.domain);
    if (source === 'simpleicons' && brand.simpleIconSlug) {
      return getTrustedBrandSimpleIconUrl(brand.simpleIconSlug);
    }
    return '';
  }, [brand.domain, brand.simpleIconSlug, source]);

  function handleError(): void {
    if (source === 'clearbit' && brand.simpleIconSlug) {
      setSource('simpleicons');
      return;
    }
    setSource('text');
  }

  if (source === 'text') {
    return <span className={styles.fallback}>{brand.name}</span>;
  }

  return (
    <img
      src={src}
      alt={brand.name}
      className={styles.logo}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}
