'use client';

import { useEffect, useState } from 'react';
import {
  getSurveyFooterBrand,
  SURVEY_FOOTER_BRAND_CHANGED,
  type SurveyFooterBrand,
} from '@/lib/survey-suite-footer-brand';

export function useSurveyFooterBrand(): SurveyFooterBrand {
  const [brand, setBrand] = useState<SurveyFooterBrand>('research');

  useEffect(() => {
    setBrand(getSurveyFooterBrand());

    function sync() {
      setBrand(getSurveyFooterBrand());
    }

    window.addEventListener(SURVEY_FOOTER_BRAND_CHANGED, sync);
    return () => window.removeEventListener(SURVEY_FOOTER_BRAND_CHANGED, sync);
  }, []);

  return brand;
}
