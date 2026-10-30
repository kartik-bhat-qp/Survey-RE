'use client';

import { CommunitiesList } from '@/components/communities/CommunitiesList';

export default function CommunitiesPage() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
      <CommunitiesList />
    </div>
  );
}
