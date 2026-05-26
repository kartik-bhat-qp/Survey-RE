import { cn } from '@/lib/cn';

interface TableScrollWrapProps {
  children: React.ReactNode;
  className?: string;
}

export function TableScrollWrap({ children, className }: TableScrollWrapProps) {
  return (
    <div className={cn('overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0', className)}>
      {children}
    </div>
  );
}
