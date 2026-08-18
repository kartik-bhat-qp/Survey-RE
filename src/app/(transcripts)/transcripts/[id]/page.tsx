'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTranscriptById, type Transcript, type TranscriptStatus } from '@/data/mock-transcripts';
import { formatDate } from '@/data/mock-utils';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const STATUS_CLASS: Record<TranscriptStatus, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <WuCard rounded className="p-4">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </WuCard>
  );
}

function OverviewTab({ transcript }: { transcript: Transcript }) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Status"
          value={
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_CLASS[transcript.status]}`}
            >
              {transcript.status}
            </span>
          }
        />
        <StatCard label="Duration" value={transcript.duration ?? '—'} />
        <StatCard label="Speakers" value={transcript.speakers} />
        <StatCard label="Created" value={formatDate(transcript.createdAt)} />
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-gray-700">Summary</h3>
        <p className="text-sm text-gray-600">{transcript.excerpt}</p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-gray-700">Owner</h3>
        <p className="text-sm text-gray-600">{transcript.owner}</p>
      </div>
    </div>
  );
}

function TextTab({ transcript }: { transcript: Transcript }) {
  if (!transcript.body) {
    return (
      <div className="pt-4">
        <EmptyState
          icon="wm-description"
          title={
            transcript.status === 'processing'
              ? 'Transcript is still processing'
              : transcript.status === 'failed'
                ? 'Transcript is unavailable'
                : 'No transcript text yet'
          }
          description={transcript.excerpt}
        />
      </div>
    );
  }

  return (
    <WuCard rounded className="mt-4 p-4">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-700">
        {transcript.body}
      </pre>
    </WuCard>
  );
}

export default function TranscriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const transcript = getTranscriptById(String(params.id));

  if (!transcript) {
    return (
      <PageContainer>
        <EmptyState
          icon="wm-description"
          title="Transcript not found"
          description="This transcript does not exist or may have been removed."
          action={
            <WuButton variant="secondary" onClick={() => router.push('/transcripts')}>
              Back to transcripts
            </WuButton>
          }
        />
      </PageContainer>
    );
  }

  const tabs: IWuTabItem[] = [
    {
      value: 'overview',
      Trigger: 'Overview',
      Content: <OverviewTab transcript={transcript} />,
    },
    {
      value: 'text',
      Trigger: 'Transcript',
      Content: <TextTab transcript={transcript} />,
    },
  ];

  return (
    <PageContainer>
      <Link
        href="/transcripts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <span className="wm-arrow-back text-base" /> Back to Transcripts
      </Link>
      <PageHeader
        title={transcript.name}
        description={`${transcript.source} · ${transcript.language}`}
        action={
          <div className="flex items-center gap-2">
            <WuButton
              variant="secondary"
              onClick={() =>
                showToast({ message: `Downloading ${transcript.name}`, variant: 'success' })
              }
            >
              Download
            </WuButton>
            <WuButton
              variant="secondary"
              onClick={() => showToast({ message: 'Share link copied', variant: 'success' })}
            >
              Share
            </WuButton>
          </div>
        }
      />
      <WuTab items={tabs} defaultValue="overview" />
    </PageContainer>
  );
}
