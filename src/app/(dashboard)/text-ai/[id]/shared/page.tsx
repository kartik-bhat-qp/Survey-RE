import { SharedTextAiDashboardViewer } from '@/components/text-ai/SharedTextAiDashboardViewer';

export default async function SharedTextAiDashboardPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SharedTextAiDashboardViewer key={id} dashboardId={Number(id)} />;
}
