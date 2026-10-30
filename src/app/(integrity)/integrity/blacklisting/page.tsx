import { redirect } from 'next/navigation';

export default function IntegrityBlacklistRedirect() {
  redirect('/organization/blocklist');
}