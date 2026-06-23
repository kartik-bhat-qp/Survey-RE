import { redirect } from 'next/navigation';
import { biLitePath } from '@/lib/bi-lite-paths';

export default function BiLiteHomePage() {
  redirect(biLitePath('/dashboards'));
}
