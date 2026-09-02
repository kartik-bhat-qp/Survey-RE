'use client';

interface AiDashboardConfirmationProps {
  surveyName: string;
  themeReferenceName?: string;
}

export function AiDashboardConfirmation({
  surveyName,
  themeReferenceName,
}: AiDashboardConfirmationProps) {
  return (
    <div className="px-4 py-8 text-center font-['Fira_Sans',sans-serif] sm:px-6 sm:py-10">
      <p className="text-sm text-gray-900 sm:text-base">
        Are you sure you want to create an AI dashboard from &ldquo;{surveyName}&rdquo; survey?
      </p>
      <p className="mt-3 text-sm text-gray-500">
        When you create, QuestionPro will automatically generate widgets for you.
      </p>
      {themeReferenceName ? (
        <p className="mt-2 text-sm text-gray-500">
          Theme, color palette, and sentiment colors will follow &ldquo;{themeReferenceName}&rdquo;.
        </p>
      ) : null}
    </div>
  );
}
