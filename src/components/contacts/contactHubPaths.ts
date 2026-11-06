export type ContactHubSection =
  | 'overview'
  | 'contacts'
  | 'groups'
  | 'attributes'
  | 'import'
  | 'suppression'
  | 'access';

export const CONTACT_HUB_NAV: { id: ContactHubSection; label: string; path: string }[] = [
  { id: 'overview', label: 'Overview', path: '' },
  { id: 'contacts', label: 'All Contacts', path: '/contacts' },
  { id: 'groups', label: 'Groups', path: '/groups' },
  { id: 'attributes', label: 'Custom Attributes', path: '/attributes' },
  { id: 'import', label: 'Import', path: '/import' },
  { id: 'suppression', label: 'Suppression', path: '/suppression' },
  { id: 'access', label: 'Access', path: '/access' },
];

export function contactHubBasePath(surveyId: number): string {
  return `/surveys/${surveyId}/contacts`;
}

export function contactHubPath(
  surveyId: number,
  section: ContactHubSection | 'contact' | 'group',
  id?: string,
): string {
  const base = contactHubBasePath(surveyId);
  if (section === 'overview') return base;
  if (section === 'contact' && id) return `${base}/contacts/${id}`;
  if (section === 'group' && id) return `${base}/groups/${id}`;
  const item = CONTACT_HUB_NAV.find((entry) => entry.id === section);
  return `${base}${item?.path ?? ''}`;
}

export function contactHubSectionFromPathname(
  pathname: string,
  surveyId: number,
): ContactHubSection {
  const base = contactHubBasePath(surveyId);
  if (pathname.startsWith(`${base}/contacts`)) return 'contacts';
  if (pathname.startsWith(`${base}/groups`)) return 'groups';
  if (pathname.startsWith(`${base}/attributes`)) return 'attributes';
  if (pathname.startsWith(`${base}/import`)) return 'import';
  if (pathname.startsWith(`${base}/suppression`)) return 'suppression';
  if (pathname.startsWith(`${base}/access`)) return 'access';
  return 'overview';
}
