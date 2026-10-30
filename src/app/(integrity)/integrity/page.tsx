import { redirect } from 'next/navigation';

export default async function IntegritySurveyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ survey?: string }>;
}) {
  const { survey } = await searchParams;
  redirect(
    survey
      ? `/surveys/integrity?survey=${encodeURIComponent(survey)}`
      : '/surveys/integrity'
  );
}
