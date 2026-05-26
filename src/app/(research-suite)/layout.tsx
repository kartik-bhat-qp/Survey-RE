import { ResearchSuiteShell } from '@/components/surveys/ResearchSuiteShell';

export default function ResearchSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ResearchSuiteShell>{children}</ResearchSuiteShell>;
}
