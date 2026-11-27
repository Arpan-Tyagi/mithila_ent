# Integrations & Compliance Report (Playbook Step 4)

> **Date:** 2026-11-27 · **Base commit:** `04df537` plus this change set · **Skill:** `/indian-gst-crm-audit`
> **Evidence rule (CLAUDE.md):** a row is `PASS` only with a `file:line` or a passing test cited. Everything else is `PARTIAL`, `MISSING` or `BUG`.
> **Scope note:** this audit covers the code in this repository. The live domain www.mithilaenterprises.co.in is currently deployed from the fork `dheerajmishra24/mithila_ent` at `355184e`, which predates these fixes (see PR dheerajmishra24/mithila_ent#1).

## Summary

| Area | PASS | PARTIAL | MISSING | BUG fixed this run |
|---|---|---|---|---|
| 1. Razorpay payments & refunds | 4 | 1 | 4 | 0 |
| 2. GST 2.0 & Rule 46 invoicing | 2 | 2 | 6 | 3 |
| 3. OTP, TRAI DLT & e-mail | 1 | 2 | 6 | 2 |
| 4. Lead CRM & ad attribution | 2 | 1 | 6 | 0 |
| 5. Logistics & COD | 1 | 1 | 4 | 1 |
| 6. DPDP 2025 & E-Commerce Rules 2020 | 2 | 1 | 6 | 0 |

**Go/No-Go for this pillar: NO-GO.** The payment-capture path is sound. The blockers are missing features: refunds, Rule 46-complete invoices, credit notes, OTP, lead ingestion and DPDP rights. They need business inputs listed in §8.

## Fixes made in this step

| ID | Finding | Fix | Proof |
|---|---|---|---|
| INT-01 | **BUG:** the checkout preview used 18% GST (`src/lib/pricing.ts:3` before), but the server charges 5% (`COALESCE(p.gst_rate, 5.00)`, migration 0040). Customers saw a tax 3.6× too high until they entered a PIN. | `TAX_RATE = 0.05` (`src/lib/pricing.ts:5`), test updated. | `tests/pricing.test.ts` 5/5; `tests/integrations/gst-place-of-supply.test.ts` "uses 5%" |
| INT-02 | **BUG:** place of supply compared free-text state names with `'Delhi'`, so "New Delhi" / "NCT of Delhi" were billed IGST. | New `src/lib/gst.ts`: 2-digit GST state codes, `SUPPLIER_STATE_CODE = '07'` (from GSTIN 07AGUPM2548P1ZH), `splitGst()`. `calculateGST` now delegates to it (`src/lib/shipping.ts:100`). | `gst-place-of-supply.test.ts` 7/7 |
| INT-03 | **BUG:** the downloadable invoice (`/api/invoice/[id]`) had no "TAX INVOICE" heading or supplier GSTIN, unlike the e-mailed one. | Route rewritten to render the same document as the e-mail (`src/app/api/invoice/[id]/route.ts`); UUID check, `Cache-Control: private, no-store`. | Type-check + build |
| INT-04 | **BUG:** the invoice PDF printed `₹` in the built-in Helvetica font, which has no rupee glyph. | Amounts print as `INR` (`src/utils/pdf/generateInvoice.tsx`). | Build |
| INT-05 | Status e-mails inserted the customer name and courier `tracking_status` into HTML unescaped. | `escapeHtml` on both (`src/lib/email.ts:108`, `:115`). The order-confirmation e-mail is React Email, which escapes by itself. | Build |
| INT-06 | Dead code with a wrong tax label: `sendInvoiceEmail` ("Tax (18% GST)", unescaped values), `src/lib/twilio.ts` and `src/lib/resend.ts` mocks, and a stub admin route `/api/logistics` that checked `profiles.role` instead of the DAL. | Deleted. No imports remained. | `grep` shows no references; build |
| INT-07 | The logistics webhook accepted any string, did not check the order id, and echoed database error text. | Zod (`uuid`, `plainText(200)`), 16 KB cap, generic errors, 404 for an unknown order (`src/app/api/webhooks/logistics/route.ts`). | `tests/integrations/logistics-webhook.test.ts` 4/4 |
| INT-08 | Cron routes `process-emails` and `timeouts` compared the bearer token with `!==`. | Constant-time `secretMatches`. | Build |
| INT-09 | No shared CSV sanitiser for CRM/order exports (no export exists yet). | `src/lib/csv.ts` (`toCsv`, `csvCell`): tab-prefixes `= + - @ \t \r \n` and the full-width forms, quotes every text cell, keeps numbers numeric. | `tests/integrations/csv-export.test.ts` 3/3 |

## 1. Razorpay payments & refunds

| Check | Status | Evidence |
|---|---|---|
| HMAC-SHA256 over the raw body, timing-safe | PASS | `src/app/api/webhooks/razorpay/route.ts:23` (`request.text()`), `src/lib/razorpay.ts:82`, `:57` (`timingSafeEqual`); `tests/webhook-route.test.ts` "rejects a bad signature" |
| Unique key on the event id, 200 ACK, async processing | PASS | `webhook_events` PK `(provider, event_id)` (migration 0048); upsert `ignoreDuplicates` `route.ts:50-52`; `after()` `route.ts:63`; `supabase/tests/11_…` "cannot be stored twice"; `webhook-route.test.ts` "processes a repeated delivery … once" |
| Server-side total before the Razorpay order | PASS | `src/app/api/payment/razorpay/create-order/route.ts:33` takes `orders.total_amount` (priced in SQL by `create_order_atomic`); `tests/validation.test.ts` drops client `price` |
| Captured amount and currency reconciled | PASS | `src/lib/payments/razorpay-webhook.ts:92-93` (INR and amount required), `:100`; verify route fetches `GET /v1/payments/:id` (`tests/verify-route.test.ts` 8/8) |
| Refunds via the API with `X-Refund-Idempotency` and receipt | **MISSING** | The admin "Refund Only" action (`src/app/admin/orders/[id]/page.tsx:180`) marks an item `refunded` in the database but never calls Razorpay. Needs a `refund_requests` table and `POST /v1/payments/{id}/refund`. |
| `refund.*` webhooks, monotonic state, `captured === false` auto-refunds | MISSING | `reduceRazorpayEvent` ignores refund events (`webhook-route.test.ts` "ignores event types it does not handle") |
| Pre-cut vs post-cut cancellation boundary | MISSING | No cut state on orders or items |
| Nightly reconciliation of pending refunds | MISSING | No refund data to reconcile |
| Payment-failure / timeout cleanup | PARTIAL | `/api/cron/timeouts` exists and fails closed without `CRON_SECRET`. No test exercises the RPC end to end. |

## 2. GST 2.0 & CGST Rule 46 invoicing

| Check | Status | Evidence / gap |
|---|---|---|
| Flat 5% default for fabrics | PASS | `products.gst_rate DEFAULT 5.00` and `COALESCE(p.gst_rate, 5.00)` (migration 0040); preview fixed (INT-01) |
| Place of supply → CGST+SGST vs IGST by state code | PASS (quote) | `src/lib/gst.ts`; `gst-place-of-supply.test.ts`. **Gap:** orders store one `tax_amount` with no CGST/SGST/IGST columns, so the invoice cannot show the split. |
| 5%/18% cliff at ₹2,500 for stitched Ch. 61–62 | MISSING | `gst_rate` is set per product by hand with no HSN chapter rule. The catalogue is unstitched fabric only today; add the rule before selling stitched items. |
| HSN product master, digit depth by AATO | MISSING | No `hsn_code` column on products or order items |
| "TAX INVOICE" + supplier legal name and GSTIN | PASS | `src/utils/pdf/generateInvoice.tsx:69-71` (now on both e-mail and download, INT-03) |
| Supplier address | PARTIAL | Prints "Delhi, India" only (`generateInvoice.tsx:72`). Rule 46(a) needs the full registered address. |
| Consecutive FY invoice serial ≤16 chars | **MISSING** | The invoice uses the first 8 hex digits of the order UUID. Needs a gap-free per-FY sequence (e.g. `ME/26-27/000142`). |
| Buyer state + code, place of supply, B2B buyer GSTIN | MISSING | Address is printed; state code and GSTIN are not captured |
| HSN, UQC `MTR`, taxable value, CGST/SGST/IGST lines, amount in words, reverse charge, signatory, 46(s) declaration | MISSING | Not in the document |
| Section 34 credit note on refund | MISSING | No credit-note table or PDF |
| IRP e-invoice hook (AATO > ₹5 Cr) | MISSING | Not needed unless AATO crosses ₹5 Cr; add a `e_invoice_enabled` setting |

## 3. OTP, TRAI DLT & transactional e-mail

| Check | Status | Evidence / gap |
|---|---|---|
| OTP (CSPRNG, hashed, TTL, single use, purpose-bound, 5 attempts) | **MISSING** | No OTP service. Sign-in is Supabase e-mail/password and Google. |
| Owner MFA (TOTP / passkey, AAL2) | **MISSING** | `requireAdmin` (`src/lib/dal/session.ts`) checks the role only, not AAL2 |
| Login brute-force lockout | PASS | `src/actions/auth.ts:48` sends the lockout alert after 5 failures |
| WhatsApp Cloud API authentication template + DLT SMS fallback | MISSING | `src/lib/whatsapp.ts:13` sends free-form `type: 'text'` messages on Graph **v17.0**. Free-form text is only delivered inside a 24-hour customer-service window, so owner alerts can silently fail. Use an approved utility template and a current Graph version. |
| DLT typed tags, no legacy `{#var#}` | N/A today | No SMS code exists. Draft templates with typed tags are in `docs/DLT_OPS_CHECKLIST.md`. |
| Durable e-mail queue with retries | PASS | `pending_emails` claim-then-send (`src/lib/email.ts` `processEmailRow`), cron `/api/cron/process-emails` |
| Separate transactional stream / sender domain | PARTIAL | `EMAIL_FROM` defaults to `onboarding@resend.dev` (`src/lib/email.ts:10`). Production must set a verified sender on a dedicated subdomain. |
| SPF / DKIM / DMARC, signed bounce/complaint webhooks | MISSING | No DNS records can be checked from code; no Resend webhook handler. Checklist in §8. |
| Stuck `sending` e-mail rows | PARTIAL | A crash between claim and send leaves the row in `sending` forever. Add a sweep that resets rows older than 15 minutes. |

## 4. Multi-channel lead CRM

| Check | Status | Evidence / gap |
|---|---|---|
| Contact Us: rate limit, then bot check | PASS | `src/app/api/contact/route.ts:18-23` (Upstash limit, then Vercel BotID). BotID is used instead of Turnstile, so there is no test-key risk. |
| Input bounded and escaped into the owner e-mail | PASS | `contact/route.ts:26-30`, `:55-60`; same in `src/app/api/wholesale/route.ts:26-28` |
| UTM / `gclid` / `fbclid` / `_fbp` / `_fbc` capture on leads | **MISSING** | No attribution columns or capture code |
| Unified `leads` table with pipeline, dedupe, assignee | PARTIAL | Separate `contact_inquiries` and wholesale tables. No stages or dedupe. |
| Meta Lead Ads webhook (GET handshake, `X-Hub-Signature-256` raw body, async Graph fetch, `UNIQUE(leadgen_id)`) | MISSING | No route |
| Google Ads lead form webhook (`google_key`, `is_test`, `column_id`, `UNIQUE(lead_id)`) | MISSING | No route |
| Meta CAPI / Google Data Manager closed loop | MISSING | GTM tags only, loaded after consent |
| Export formula-injection safety | PASS (helper) | `src/lib/csv.ts` + `csv-export.test.ts`. No export exists yet; any new export must use it. |

## 5. Logistics & COD

| Check | Status | Evidence / gap |
|---|---|---|
| Courier webhook auth (constant time, fail closed) | PASS | `src/app/api/webhooks/logistics/route.ts` + `logistics-webhook.test.ts` |
| PIN serviceability and rate quote | PARTIAL | Shiprocket rates with fallback (`src/lib/shipping.ts`); fallback rates are placeholders (owner to set) |
| AWB timeline, NDR alerts | MISSING | One `tracking_status` text field, no event history |
| COD and 3-tier risk scoring | MISSING | Prepaid only today, which is the safe default |
| RTO analytics | MISSING | — |

## 6. DPDP Rules 2025 & E-Commerce Rules 2020

| Check | Status | Evidence / gap |
|---|---|---|
| Analytics/ads consent, default denied, withdrawal link | PASS | `src/components/AnalyticsConsent.tsx:101` (Consent Mode default denied), `:150` (footer link re-opens the choice) |
| Seller GSTIN shown publicly | PASS | `src/components/Footer.tsx:60` |
| Grievance officer name and contact, full legal address | **MISSING** | Not on the footer or `/legal/*` (Consumer Protection (E-Commerce) Rules 2020, rule 4) |
| Unbundled marketing consent at signup / checkout | MISSING | No marketing opt-in exists, which is compliant until marketing messages are sent |
| Privacy Rights Centre (access, correction, erasure) | MISSING | Profile edit covers correction only; no export or erasure flow |
| Retention schedule (GST records 8 years vs other data) | MISSING | No policy or job |
| Under-18 gate for behavioural ads | MISSING | — |
| 72-hour breach runbook | MISSING | Not in `docs/` |

## 7. Tests run for this step

```
npx vitest run tests/integrations tests/pricing.test.ts
 ✓ tests/pricing.test.ts (5 tests)
 ✓ tests/integrations/gst-place-of-supply.test.ts (7 tests)
 ✓ tests/integrations/logistics-webhook.test.ts (4 tests)
 ✓ tests/integrations/csv-export.test.ts (3 tests)
```

The Razorpay checks (bad signature, raw body, replayed event id, wrong-order binding, amount from Razorpay) are covered by the existing `tests/webhook-route.test.ts` (9) and `tests/verify-route.test.ts` (8). Full-suite results are in `docs/E2E_QA_REPORT.md`.

## 8. Manual operations and business inputs (owner)

These cannot be done from code:

1. **CA sign-off:** HSN code per product, confirmation of the 5% rate, AATO band (4- vs 6-digit HSN), and the invoice series format.
2. **Invoice master data:** full registered address, legal name as on the GST certificate, and the authorised signatory.
3. **Grievance officer:** name, e-mail, phone. Publish them in the footer and the privacy policy.
4. **E-mail:** verify a sending subdomain in Resend (e.g. `orders.mithilaenterprises.co.in`), set `EMAIL_FROM`, publish SPF (one record, ≤10 lookups), DKIM (2048-bit) and DMARC `p=none`, then move to `quarantine` after 14 days of clean reports.
5. **WhatsApp:** create a utility template for owner alerts in Meta Business Manager and give its name and language code; set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`.
6. **DLT (only if SMS is added):** see `docs/DLT_OPS_CHECKLIST.md`.
7. **Ads:** Meta app with `leads_retrieval`, Page access token, and webhook verify token; Google Ads lead-form webhook key. Both are needed before the lead webhooks can be built and tested.
8. **Razorpay:** dashboard webhook URL `https://www.mithilaenterprises.co.in/api/webhooks/razorpay` with events `payment.captured`, `payment.failed`, `order.paid` (plus `refund.*` once refunds ship).
