'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { IntegrityEntry } from '@/components/integrity/IntegrityEntry';
import { PageContainer } from '@/components/ui/PageContainer';
import { MOCK_SURVEYS } from '@/data/mock-surveys';
import { getCommunityById } from '@/data/mock-communities';
import { type CommunityId } from '@/data/mock-question-communities';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  findCommunityProtection,
  findSurveyProtection,
} from '@/lib/integrity/coverage';
import type { IntegrityEntry as CheckEntry } from '@/lib/integrity/policy';
import styles from './IntegrityCoverage.module.css';

const CHECKS: CheckEntry[] = ['survey', 'registration', 'login', 'recovery', 'invitation'];

function isCheck(value: string | null): value is CheckEntry {
  return CHECKS.includes(value as CheckEntry);
}

export function IntegrityCheck() {
  const searchParams = useSearchParams();
  const entryParam = searchParams.get('entry');
  const entry = isCheck(entryParam) ? entryParam : 'survey';
  const [coverage] = usePersistedState(INTEGRITY_COVERAGE_KEY, EMPTY_INTEGRITY_COVERAGE);
  const [ready, setReady] = useState(false);
  const survey = MOCK_SURVEYS.find((item) => String(item.id) === searchParams.get('survey'));
  const communityId = searchParams.get('community') as CommunityId | null;
  const listed = communityId ? getCommunityById(communityId) : undefined;
  const community = listed ? { label: listed.name } : undefined;
  const surveyRecord = survey ? findSurveyProtection(coverage, survey.id) : null;
  const communityRecord = communityId ? findCommunityProtection(coverage, communityId) : null;

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  const blocked = blockedReason(entry, surveyRecord?.protections ?? [], communityRecord);
  if (blocked) {
    return (
      <PageContainer>
        <section className={styles.card}>
          <h2>This check is off</h2>
          <p className={styles.hint}>{blocked}</p>
          <Link
            className={styles.link}
            href={
              entry === 'survey'
                ? '/surveys/integrity'
                : communityId
                  ? `/communities/${communityId}`
                  : '/communities'
            }
          >
            Back to protection
          </Link>
        </section>
      </PageContainer>
    );
  }

  const subject = survey?.name ?? community?.label ?? 'this product';
  return (
    <div>
      <PageContainer>
        <p className={styles.hint}>
          Respondent check for {subject}. Ordinary visits continue. This uses the protection
          you saved.
        </p>
      </PageContainer>
      <IntegrityEntry entry={entry} />
    </div>
  );
}

function blockedReason(
  entry: CheckEntry,
  protections: string[],
  community: ReturnType<typeof findCommunityProtection>,
): string {
  if (entry === 'survey') {
    return protections.includes('start')
      ? ''
      : 'Survey start is not turned on for this survey.';
  }
  if (!community) return 'Choose a community before running this check.';
  if (entry === 'registration' && !community.signups) {
    return 'Signup protection is off for this community.';
  }
  if (entry === 'login' && community.loginCheck === 'off') {
    return 'Login checks are off for this community.';
  }
  if (entry === 'recovery' && !community.recovery) {
    return 'Account recovery protection is off for this community.';
  }
  if (entry === 'invitation' && !community.invitations) {
    return 'Invitation protection is off for this community.';
  }
  return '';
}
