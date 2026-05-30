'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { setSurveyFooterBrand } from '@/lib/survey-suite-footer-brand';
import { QuestionProLogo } from '@/components/signup/QuestionProLogo';
import { SignupAiHighlights } from '@/components/signup/SignupAiHighlights';
import { SignupFeatureCarousel } from '@/components/signup/SignupFeatureCarousel';
import { SignupPasswordField } from '@/components/signup/SignupPasswordField';
import { TrustedBrandsFooter } from '@/components/signup/TrustedBrandsFooter';
import {
  SIGNUP_LANGUAGES,
  SIGNUP_SOCIAL_PROVIDERS,
  SIGNUP_TAGLINE,
  type SignupLanguage,
} from '@/data/mock-signup-page';
import styles from './SignupPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

type SignupFormState = {
  name: string;
  email: string;
  password: string;
};

const DEFAULT_LANGUAGE: SignupLanguage =
  SIGNUP_LANGUAGES.find((l) => l.value === 'en') ?? SIGNUP_LANGUAGES[0];

const INITIAL_FORM: SignupFormState = {
  name: '',
  email: '',
  password: '',
};

function GoogleIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
      <path d="M11.4 11.4H3V3h8.4v8.4z" fill="#F25022" />
      <path d="M21 11.4h-8.4V3H21v8.4z" fill="#7FBA00" />
      <path d="M11.4 21H3v-8.4h8.4V21z" fill="#00A4EF" />
      <path d="M21 21h-8.4v-8.4H21V21z" fill="#FFB900" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  google: GoogleIcon,
  microsoft: MicrosoftIcon,
} as const;

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [form, setForm] = useState<SignupFormState>(INITIAL_FORM);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [showEmailForm, setShowEmailForm] = useState(false);

  function updateField<K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCreateAccount() {
    if (!form.name.trim()) {
      showToast({ message: 'Please enter your name', variant: 'error' });
      return;
    }
    if (!form.email.trim()) {
      showToast({ message: 'Please enter your email address', variant: 'error' });
      return;
    }
    if (form.password.length < 8) {
      showToast({ message: 'Password must be at least 8 characters', variant: 'error' });
      return;
    }
    showToast({ message: 'Account created — welcome to QuestionPro!', variant: 'success' });
    setSurveyFooterBrand('essentials');
    router.push('/surveys/create');
  }

  function handleLogin() {
    showToast({ message: 'Log in is not available in this prototype', variant: 'info' });
  }

  function handleSocialSignup(provider: string) {
    showToast({ message: `${provider} is not available in this prototype`, variant: 'info' });
  }

  function handleLegalLink(label: string) {
    showToast({ message: `${label} opened`, variant: 'info' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.split}>
        <aside className={styles.brandPanel} aria-label="Product highlights">
          <div className={styles.brandPanelGlow} aria-hidden />
          <div className={styles.brandPanelInner}>
            <p className={styles.brandPanelKicker}>
              <span className={`wc-ai ${styles.brandPanelKickerIcon}`} aria-hidden />
              AI-ready research platform
            </p>
            <SignupFeatureCarousel />
          </div>
        </aside>

        <main className={styles.formPanel}>
        <header className={styles.topBar}>
          <div className={styles.languageWrap}>
            <span className={`wm-language ${styles.languageIcon}`} aria-hidden />
            <WuSelect
              data={SIGNUP_LANGUAGES}
              accessorKey={{ value: 'value', label: 'label' }}
              value={language}
              variant="outlined"
              onSelect={(option) => {
                if (option) setLanguage(option as SignupLanguage);
              }}
            />
          </div>
          <p className={styles.topLogin}>
            Already have an account?{' '}
            <button type="button" className={styles.textLink} onClick={handleLogin}>
              Log in
            </button>
          </p>
        </header>

        <div className={styles.formContent}>
          {!showEmailForm ? (
            <div className={styles.choiceView}>
              <QuestionProLogo centered showAiStar />
              <p className={styles.tagline}>{SIGNUP_TAGLINE}</p>

              <SignupAiHighlights />

              <div className={styles.socialStack}>
                {SIGNUP_SOCIAL_PROVIDERS.map((provider) => {
                  const Icon = SOCIAL_ICONS[provider.id];
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={styles.socialBtn}
                      onClick={() => handleSocialSignup(provider.label)}
                    >
                      <Icon />
                      {provider.label}
                    </button>
                  );
                })}
              </div>

              <div className={styles.divider} aria-hidden>
                <span>or</span>
              </div>

              <WuButton
                type="button"
                variant="primary"
                className={styles.emailCta}
                onClick={() => setShowEmailForm(true)}
              >
                Continue with email
              </WuButton>
            </div>
          ) : (
            <div className={styles.emailView}>
              <button
                type="button"
                className={styles.backLink}
                onClick={() => setShowEmailForm(false)}
              >
                <span className="wm-chevron-left" aria-hidden />
                Back
              </button>

              <div className={styles.formIntro}>
                <QuestionProLogo centered compact showAiStar />
                <h1 className={styles.formHeading}>Create your free account</h1>
                <p className={styles.formSubheading}>
                  QuestionPro AI can draft your first survey after signup — no credit card required.
                </p>
              </div>

              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateAccount();
                }}
              >
                  <WuFormGroup
                    Input={
                      <WuInput
                        id="signup-name"
                        Label="Name"
                        variant="outlined"
                        placeholder="Your name"
                        value={form.name}
                        autoFocus
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    }
                  />

                  <WuFormGroup
                    Input={
                      <WuInput
                        id="signup-email"
                        Label="Email"
                        variant="outlined"
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    }
                  />

                  <SignupPasswordField
                    value={form.password}
                    onChange={(value) => updateField('password', value)}
                  />

                  <WuButton type="submit" variant="primary" className={styles.submitBtn}>
                    Create account
                  </WuButton>

                  <p className={styles.legalText}>
                    By continuing, you agree to our{' '}
                    <button
                      type="button"
                      className={styles.legalLink}
                      onClick={() => handleLegalLink('Terms of Service')}
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      className={styles.legalLink}
                      onClick={() => handleLegalLink('Privacy Policy')}
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
              </form>
            </div>
          )}
        </div>
        </main>
      </div>

      <TrustedBrandsFooter />
    </div>
  );
}
