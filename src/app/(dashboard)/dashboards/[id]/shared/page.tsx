import { SharedDashboardViewer } from '@/components/dashboards/SharedDashboardViewer';

export default async function SharedDashboardPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ profile?: string | string[] }>;
}) {
  const { id } = await params;
  const { profile } = await searchParams;
  return <SharedDashboardViewer dashboardId={Number(id)} profile={typeof profile === 'string' ? profile : 'default'} />;
}
