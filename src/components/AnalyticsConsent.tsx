'use client';

// DPDP-style opt-in for Google Tag Manager.
// - Nothing from Google loads until the visitor clicks "Allow".
// - GTM never loads on admin, account, checkout or sign-in pages, and if it was
//   already loaded on a public page, Consent Mode is switched to "denied" while
//   the visitor is on one of those pages.
// - "Cookie preferences" in the footer withdraws or changes the choice.
// The choice is kept in localStorage only; no cookie is set by this component.

import { useEffect, useSyncExternalStore } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GTM_ID = 'GTM-TDLCQ9XB';
const STORAGE_KEY = 'mithila-analytics-consent';
const EXCLUDED_PREFIXES = [
  '/admin',
  '/account',
  '/checkout',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

type Consent = 'granted' | 'denied' | 'unset' | 'server';

const listeners = new Set<() => void>();

function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : 'unset';
  } catch {
    return 'unset';
  }
}

function writeConsent(value: 'granted' | 'denied' | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked: the choice lasts for this page view only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function useConsent(): Consent {
  return useSyncExternalStore(subscribe, readConsent, () => 'server');
}

function isExcluded(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export default function AnalyticsConsent() {
  const consent = useConsent();
  const pathname = usePathname();
  const excluded = isExcluded(pathname);
  const allowed = consent === 'granted' && !excluded;

  // Keep Consent Mode in step with the route and the choice once GTM exists.
  useEffect(() => {
    const w = window as GtagWindow;
    if (typeof w.gtag !== 'function') return;
    const state = allowed ? 'granted' : 'denied';
    w.gtag('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    });
  }, [allowed]);

  return (
    <>
      {allowed && (
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
              gtag('consent', 'update', {analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
              gtag('js', new Date());
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
      )}

      {consent === 'unset' && !excluded && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-3xl rounded-lg border-2 border-[var(--charcoal-ink)] bg-[var(--unbleached-cotton)] p-4 shadow-lg sm:flex sm:items-center sm:gap-4">
            <p className="text-sm text-[var(--text-primary)] sm:flex-1">
              We use Google analytics and ad measurement only if you allow it.{' '}
              <Link href="/legal/privacy-policy" className="underline underline-offset-2">
                Privacy policy
              </Link>
            </p>
            <div className="mt-3 flex gap-2 sm:mt-0">
              <button
                type="button"
                onClick={() => writeConsent('denied')}
                className="min-h-11 rounded-md border-2 border-[var(--charcoal-ink)] px-4 text-sm font-medium text-[var(--charcoal-ink)] hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--indigo-dye)]"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => writeConsent('granted')}
                className="min-h-11 rounded-md border-2 border-[var(--charcoal-ink)] bg-[var(--charcoal-ink)] px-4 text-sm font-medium text-[var(--unbleached-cotton)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--indigo-dye)]"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that re-opens the consent choice (withdrawal as easy as giving). */
export function ConsentPreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => writeConsent(null)} className={className}>
      Cookie preferences
    </button>
  );
}
