interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {action && (
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{action}</div>
      )}
    </div>
  );
}
