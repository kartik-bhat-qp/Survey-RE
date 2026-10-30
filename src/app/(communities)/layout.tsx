import { CommunitiesShell } from '@/components/communities/CommunitiesShell';

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommunitiesShell>{children}</CommunitiesShell>;
}
