import { BiLiteDashboardShell } from '@/components/bi-lite/BiLiteDashboardShell';

export default function BiLiteLayout({ children }: { children: React.ReactNode }) {
  return <BiLiteDashboardShell>{children}</BiLiteDashboardShell>;
}
