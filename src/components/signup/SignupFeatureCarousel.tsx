'use client';

import { useEffect, useRef, useState } from 'react';
import { SignupFeaturePreview } from '@/components/signup/SignupFeaturePreview';
import { SIGNUP_FEATURE_SLIDES } from '@/data/mock-signup-page';
import styles from './SignupFeatureCarousel.module.css';

const CAROUSEL_INTERVAL_MS = 3000;

type TransitionPhase = 'idle' | 'out' | 'in';

export function SignupFeatureCarousel() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const pendingIndexRef = useRef<number | null>(null);
  const slideIndexRef = useRef(slideIndex);
  const phaseRef = useRef(phase);

  slideIndexRef.current = slideIndex;
  phaseRef.current = phase;

  const activeSlide = SIGNUP_FEATURE_SLIDES[slideIndex];

  function requestSlide(nextIndex: number) {
    if (nextIndex === slideIndexRef.current || phaseRef.current !== 'idle') return;
    pendingIndexRef.current = nextIndex;
    setPhase('out');
  }

  function goToPrevSlide() {
    const current = slideIndexRef.current;
    const nextIndex =
      current === 0 ? SIGNUP_FEATURE_SLIDES.length - 1 : current - 1;
    requestSlide(nextIndex);
  }

  function goToNextSlide() {
    const current = slideIndexRef.current;
    const nextIndex =
      current === SIGNUP_FEATURE_SLIDES.length - 1 ? 0 : current + 1;
    requestSlide(nextIndex);
  }

  function handleSlideAnimationEnd(event: React.AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;

    if (phaseRef.current === 'out' && pendingIndexRef.current !== null) {
      setSlideIndex(pendingIndexRef.current);
      pendingIndexRef.current = null;
      setPhase('in');
      return;
    }

    if (phaseRef.current === 'in') {
      setPhase('idle');
    }
  }

  useEffect(() => {
    if (phase === 'idle') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) return;

    if (phase === 'out' && pendingIndexRef.current !== null) {
      setSlideIndex(pendingIndexRef.current);
      pendingIndexRef.current = null;
      setPhase('in');
      return;
    }

    if (phase === 'in') {
      setPhase('idle');
    }
  }, [phase]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      if (phaseRef.current !== 'idle') return;
      const current = slideIndexRef.current;
      const nextIndex =
        current === SIGNUP_FEATURE_SLIDES.length - 1 ? 0 : current + 1;
      pendingIndexRef.current = nextIndex;
      setPhase('out');
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const slideClassName =
    phase === 'out'
      ? `${styles.slideContent} ${styles.slideFadeOut}`
      : phase === 'in'
        ? `${styles.slideContent} ${styles.slideFadeIn}`
        : styles.slideContent;

  return (
    <>
      <div className={styles.featureCard}>
        <div className={styles.slideViewport}>
          <div
            key={activeSlide.id}
            className={slideClassName}
            onAnimationEnd={phase !== 'idle' ? handleSlideAnimationEnd : undefined}
          >
            <p
              className={
                activeSlide.aiFeatured
                  ? `${styles.featureEyebrow} ${styles.featureEyebrowAi}`
                  : styles.featureEyebrow
              }
            >
              {activeSlide.aiFeatured ? (
                <>
                  <span className={`wc-ai ${styles.featureEyebrowAiIcon}`} aria-hidden />
                  {activeSlide.eyebrow}
                </>
              ) : (
                activeSlide.eyebrow
              )}
            </p>
            <h2 className={styles.featureTitle}>{activeSlide.title}</h2>
            <SignupFeaturePreview slide={activeSlide} />
          </div>
        </div>
      </div>

      <nav className={styles.carouselNav} aria-label="Feature highlights">
        <button
          type="button"
          className={styles.carouselBtn}
          onClick={goToPrevSlide}
          aria-label="Previous feature"
        >
          <span className="wm-chevron-left" />
        </button>
        <div className={styles.carouselDots}>
          {SIGNUP_FEATURE_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={
                index === slideIndex
                  ? `${styles.carouselDot} ${styles.carouselDotActive}`
                  : styles.carouselDot
              }
              onClick={() => requestSlide(index)}
              aria-label={`Show ${slide.eyebrow}`}
              aria-current={index === slideIndex ? 'true' : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.carouselBtn}
          onClick={goToNextSlide}
          aria-label="Next feature"
        >
          <span className="wm-chevron-right" />
        </button>
      </nav>
    </>
  );
}
