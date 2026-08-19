'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { QuestionProLogo } from '@/components/signup/QuestionProLogo';
import { SignupPasswordField } from '@/components/signup/SignupPasswordField';
import { registerReviewerAccount } from '@/data/mock-reviewer-accounts';
import { getSurveyReviewerPagePath, surveyHasApprovalTab } from '@/data/mock-survey-approval';
import styles from '@/app/signup/SignupPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface SurveyReviewSignupViewProps {
  surveyId: number;
  email: string;
}

export function SurveyReviewSignupView({ surveyId, email }: SurveyReviewSignupViewProps) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [name, setName] = useState('');
  const [accountEmail, setAccountEmail] = useState(email);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setAccountEmail(email);
  }, [email]);

  function handleCreateAccount(): void {
    if (!surveyHasApprovalTab(surveyId)) {
      router.replace(getSurveyReviewerPagePath(surveyId));
      return;
    }
    if (!name.trim()) {
      showToast({ message: 'Please enter your name', variant: 'error' });
      return;
    }
    if (!accountEmail.trim()) {
      showToast({ message: 'Please enter your email address', variant: 'error' });
      return;
    }
    if (password.length < 8) {
      showToast({ message: 'Password must be at least 8 characters', variant: 'error' });
      return;
    }

    registerReviewerAccount(accountEmail, name);
    showToast({
      message: 'Account created. Continuing to your survey review…',
      variant: 'success',
    });
    router.push(getSurveyReviewerPagePath(surveyId));
  }

  return (
    <div className={styles.page}>
      <div className={styles.split}>
        <aside className={styles.brandPanel} aria-label="Product highlights">
          <div className={styles.brandPanelGlow} aria-hidden />
          <div className={styles.brandPanelInner}>
            <p className={styles.brandPanelKicker}>
              <span className={`wc-ai ${styles.brandPanelKickerIcon}`} aria-hidden />
              Survey review
            </p>
            <p className={styles.tagline}>
              Create a free QuestionPro account to review this survey and approve or reject it.
            </p>
          </div>
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.formContent}>
            <div className={styles.emailView}>
              <div className={styles.formIntro}>
                <QuestionProLogo centered compact showAiStar />
                <h1 className={styles.formHeading}>Create your account to review the survey</h1>
                <p className={styles.formSubheading}>
                  Sign up to continue to the approval page. Your account will be created
                  automatically and you will be taken straight to the review.
                </p>
              </div>

              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateAccount();
                }}
              >
                <WuInput
                  id="review-signup-name"
                  variant="outlined"
                  placeholder="Name"
                  aria-label="Name"
                  value={name}
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                />
                <WuInput
                  id="review-signup-email"
                  variant="outlined"
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                />
                <SignupPasswordField value={password} onChange={setPassword} />
                <WuButton type="submit" variant="primary" className={styles.submitBtn}>
                  Create account and review survey
                </WuButton>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
