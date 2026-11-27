# E2E & Accessibility QA Report (Playbook Step 6)

**Date:** 2026-11-27
**Target:** production build (`next build` / `next start -p 3100`) on localhost, wired to the local Supabase stack (all migrations through 0049). No production URL was used.
**Suite:** `tests/e2e/fabric-platform.spec.ts`, config `tests/e2e/playwright.config.ts`, runner `tests/e2e/run.mjs` (refuses non-local targets).
**Viewports:** `desktop-1440` (1440×900, Desktop Chrome) and `mobile-375` (375×812, Pixel 7 touch emulation), `prefers-reduced-motion: reduce`.
**Checks on every page:** axe-core 4.14.0 with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`; uncaught exceptions; hydration errors; 5xx responses; 404 sub-requests; console errors (recorded).

## How to reproduce

```powershell
npx supabase start
npm run build
npx next start -p 3100
```

The app must be built and started with the local stack's URL and keys (`npx supabase status -o env`) and throwaway webhook/cron secrets. The CI job `database-and-e2e` in `.github/workflows/production-security-qa.yml` shows the exact variables. Then:

```powershell
$env:REDTEAM_APP_URL = 'http://localhost:3100'; npm run test:e2e:local
```

## Result

Final run: **26 passed (1.2m)**, 13 tests × 2 viewports. Zero axe violations of any impact on every page tested. No uncaught exceptions, no hydration errors, no 5xx and no 404s.

| Persona | Page | Desktop axe | Mobile axe | 5xx / hydration / exceptions |
|---|---|---|---|---|
| anon | `/` | 0 | 0 | none |
| anon | `/shop` | 0 | 0 | none |
| anon | `/product/<slug>` | 0 | 0 | none |
| anon | `/cart` | 0 | 0 | none |
| anon | `/login` | 0 | 0 | none |
| anon | `/signup` | 0 | 0 | none |
| anon | `/contact` | 0 | 0 | none |
| anon | `/wholesale` | 0 | 0 | none |
| anon | `/blog` | 0 | 0 | none |
| customer A | `/account/orders` | 0 | 0 | none |
| customer A | `/account/profile` | 0 | 0 | none |
| owner admin | `/admin/dashboard` | 0 | 0 | none |
| owner admin | `/admin/orders` | 0 | 0 | none |
| owner admin | `/admin/orders/<id>` | 0 | 0 | none |

### Role journeys

- **Customer A:** sees their own paid order (`ORDER #<id>`) on `/account/orders`. The new "Download GST invoice (PDF)" link points at `/api/invoice/<id>`, and the download returns 200 with a body starting `%PDF-`.
- **Customer B:** the same order is absent from B's `/account/orders`. `/api/invoice/<A's id>` returns 404. `/admin/dashboard` and `/admin/orders/<id>` both land on `/`. Evidence: `{"invoice":404,"landed_on":"/"}` on both viewports.
- **Owner admin:** "Executive Ledger" dashboard, the orders list and the order detail all render customer A's order.

### Layout stability and LCP (home page)

| Viewport | CLS | LCP |
|---|---|---|
| desktop-1440 | 0 | 248 ms |
| mobile-375 | 0 | 1,280 ms |

CLS 0 meets the `0.00` budget. These LCP numbers come from a local, unthrottled machine with no network latency, so they are **not field data** and do not prove the `<0.8s` mobile LCP budget. The mobile figure (1.28 s, device emulation, no throttling) is above that budget. Treat mobile LCP as **unproven / at risk** until it is measured on real devices (CrUX, or Vercel Speed Insights on the production domain).

### Console noise (not a defect)

Desktop pages log one `net::ERR_SSL_PROTOCOL_ERROR` for `https://localhost:3100/login`. The enforced production CSP includes `upgrade-insecure-requests` (`next.config.ts:45`), so the browser upgrades the header's `/login` prefetch to https, and the local server only speaks http. On the real https domain this request succeeds. Mobile hides that header link, so it shows no error.

## Defects found and fixed in this step

The first run failed 22 of 26 tests. Every fix below was re-verified by the final run.

| ID | WCAG | Defect | Fix |
|---|---|---|---|
| A11Y-01 | 1.3.1 / 4.1.2 (critical) | Login, signup and profile `<label>`s were not tied to their inputs | `htmlFor`/`id` pairs plus `autoComplete` (`src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/account/profile/page.tsx`); `aria-label` on address inputs that only had placeholders |
| A11Y-02 | 4.1.2 (critical) | `/shop` sort `<select>` and admin "Update Status" `<select>` had no accessible name | `aria-label="Sort products"` (`src/components/SortDropdown.tsx`); `htmlFor="order-status"` (`src/app/admin/orders/[id]/page.tsx`) |
| A11Y-03 | 1.4.3 (serious) | Brand red `#dc2626` as text on the cotton backgrounds measured 3.88–4.28:1 | `--madder-red` darkened to `#b91c1c` (5.0–5.75:1 on the three cotton/card backgrounds) in `src/app/globals.css` |
| A11Y-04 | 1.4.3 (serious) | Turmeric `#f59e0b` as text on light backgrounds measured 1.72:1 | New `--turmeric-ink: #92400e` (5.5–6.3:1) for text on light backgrounds; turmeric stays for fills and for text on the dark admin panels |
| A11Y-05 | 1.4.3 (serious) | Faded `opacity-40/50/60` labels (contact, account, admin) and the `opacity-80` wholesale list measured 2.4–3.9:1 | Raised to `opacity-70/75` or `/85` text colour |
| A11Y-06 | 1.4.3 (serious) | `lotus-pink` button variant had cream text on pink, and a peacock-blue hover with white text | Charcoal text, indigo hover (`src/components/ui/Button.tsx`) |
| A11Y-07 | 2.5.8 (serious) | Password show/hide toggle was smaller than 24×24 px and had its focus outline removed | 40×40 target with a `focus-visible` outline (`src/components/PasswordInput.tsx`) |
| UX-01 | — | Account sidebar linked to `/account/addresses`, which does not exist (404 caught by the suite) | Link to `/account/profile#addresses`, where saved addresses live |
| UX-02 | — | Customers had no way to download their GST invoice from the dashboard | "Download GST invoice (PDF)" link on paid orders (`src/app/account/orders/page.tsx`) |

The red change (A11Y-03) alters the brand colour everywhere it's used. Review it visually before release. Red text on the dark admin panels was already below AA before this change and is not covered by these pages; check it in the next admin pass.

## Not covered

- Checkout and Razorpay payment UI. The test order is created and paid through the server RPCs. Razorpay's hosted checkout can't run against a local stack without live test keys; the webhook path is covered in `docs/SECURITY_REDTEAM_REPORT.md`.
- Admin pages other than dashboard, orders and order detail (inventory, products, promotions, categories, content, customers, settings).
- Screen-reader and keyboard-only walkthroughs. axe covers roughly 30–40% of WCAG success criteria; a manual pass with NVDA or VoiceOver is still needed before claiming full AA.
- Features that do not exist yet (fractional meterage, roll/dye-lot selection, swatch credit, OTP login, refund requests, lead CRM). These are listed as MISSING in `docs/INTEGRATIONS_COMPLIANCE_REPORT.md`.
