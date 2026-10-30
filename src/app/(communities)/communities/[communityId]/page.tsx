'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CommunityInterior } from '@/components/communities/CommunityInterior';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCommunityById } from '@/data/mock-communities';

export default function CommunityPage() {
  const params = useParams();
  const community = getCommunityById(String(params.communityId ?? ''));

  if (!community) {
    return (
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
        <EmptyState
          icon="wm-groups"
          title="Community not found"
          description="This community does not exist or may have been removed."
          action={<Link href="/communities">Back to communities</Link>}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', width: '100%' }}>
      <CommunityInterior community={community} />
    </div>
  );
}
