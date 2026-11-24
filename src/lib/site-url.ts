/**
 * Centralized site URL resolver for Mithila Enterprises.
 * Ensures the canonical production domain (https://www.mithilaenterprises.co.in)
 * is consistently returned and guards against stale or legacy environment values.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!envUrl || envUrl.includes('mithilaenterprises.com') || envUrl.includes('localhost')) {
    return 'https://www.mithilaenterprises.co.in';
  }
  return envUrl.replace(/\/$/, '');
}
