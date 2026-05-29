export const SIGNUP_TRUSTED_BRANDS_HEADLINE =
  'Trusted by Market Research, CX, and HR teams at leading brands';

export const SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT = 5;

export const SIGNUP_TRUSTED_BRANDS_ROTATE_MS = 4500;

export interface TrustedBrand {
  id: string;
  name: string;
  /** Used to load logo from Clearbit (and similar services). */
  domain: string;
  /** Fallback slug for https://cdn.simpleicons.org/{slug} */
  simpleIconSlug?: string;
}

export const SIGNUP_TRUSTED_BRANDS: TrustedBrand[] = [
  { id: 'google', name: 'Google', domain: 'google.com', simpleIconSlug: 'google' },
  { id: 'audi', name: 'Audi', domain: 'audi.com', simpleIconSlug: 'audi' },
  { id: 'energizer', name: 'Energizer', domain: 'energizer.com' },
  { id: 'bmw', name: 'BMW', domain: 'bmw.com', simpleIconSlug: 'bmw' },
  { id: 'legalshield', name: 'LegalShield', domain: 'legalshield.com' },
  { id: 'roku', name: 'Roku', domain: 'roku.com', simpleIconSlug: 'roku' },
  { id: 'microsoft', name: 'Microsoft', domain: 'microsoft.com', simpleIconSlug: 'microsoft' },
  { id: 'amazon', name: 'Amazon', domain: 'amazon.com', simpleIconSlug: 'amazon' },
  { id: 'salesforce', name: 'Salesforce', domain: 'salesforce.com', simpleIconSlug: 'salesforce' },
  { id: 'adobe', name: 'Adobe', domain: 'adobe.com', simpleIconSlug: 'adobe' },
  { id: 'ibm', name: 'IBM', domain: 'ibm.com', simpleIconSlug: 'ibm' },
  { id: 'deloitte', name: 'Deloitte', domain: 'deloitte.com' },
  { id: 'mckinsey', name: 'McKinsey', domain: 'mckinsey.com' },
  { id: 'nike', name: 'Nike', domain: 'nike.com', simpleIconSlug: 'nike' },
  { id: 'starbucks', name: 'Starbucks', domain: 'starbucks.com', simpleIconSlug: 'starbucks' },
  { id: 'visa', name: 'Visa', domain: 'visa.com', simpleIconSlug: 'visa' },
  { id: 'mastercard', name: 'Mastercard', domain: 'mastercard.com', simpleIconSlug: 'mastercard' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', simpleIconSlug: 'spotify' },
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', simpleIconSlug: 'netflix' },
  { id: 'uber', name: 'Uber', domain: 'uber.com', simpleIconSlug: 'uber' },
  { id: 'airbnb', name: 'Airbnb', domain: 'airbnb.com', simpleIconSlug: 'airbnb' },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', simpleIconSlug: 'linkedin' },
  { id: 'fedex', name: 'FedEx', domain: 'fedex.com' },
  { id: 'intel', name: 'Intel', domain: 'intel.com', simpleIconSlug: 'intel' },
  { id: 'oracle', name: 'Oracle', domain: 'oracle.com', simpleIconSlug: 'oracle' },
  { id: 'hubspot', name: 'HubSpot', domain: 'hubspot.com', simpleIconSlug: 'hubspot' },
  { id: 'toyota', name: 'Toyota', domain: 'toyota.com' },
  { id: 'samsung', name: 'Samsung', domain: 'samsung.com', simpleIconSlug: 'samsung' },
  { id: 'walmart', name: 'Walmart', domain: 'walmart.com' },
  { id: 'pfizer', name: 'Pfizer', domain: 'pfizer.com' },
];

export function getTrustedBrandLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function getTrustedBrandSimpleIconUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}

export function getTrustedBrandGroupCount(
  brandCount: number = SIGNUP_TRUSTED_BRANDS.length,
  visibleCount: number = SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT
): number {
  return Math.ceil(brandCount / visibleCount);
}

export function getTrustedBrandsForGroup(
  groupIndex: number,
  brands: TrustedBrand[] = SIGNUP_TRUSTED_BRANDS,
  visibleCount: number = SIGNUP_TRUSTED_BRANDS_VISIBLE_COUNT
): TrustedBrand[] {
  const start = groupIndex * visibleCount;
  return brands.slice(start, start + visibleCount);
}
