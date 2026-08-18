import { TranscriptsShell } from '@/components/transcripts/TranscriptsShell';

export default function TranscriptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TranscriptsShell>{children}</TranscriptsShell>;
}
