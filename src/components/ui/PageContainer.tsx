import { cn } from '@/lib/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('min-w-0 p-4 sm:p-6', className)}>{children}</div>;
}
