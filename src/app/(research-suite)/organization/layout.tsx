import { OrganizationShell } from '@/components/account/OrganizationShell';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrganizationShell>{children}</OrganizationShell>;
}
