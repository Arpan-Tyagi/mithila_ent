---
name: indian-gst-crm-audit
description: Audits Indian e-commerce payment webhooks (Razorpay), GST 2.0/CGST Rule 46 invoice PDFs, Section 34 credit notes, WhatsApp/TRAI DLT OTP systems, Shiprocket/COD risk scoring, Meta/Google Ads lead webhooks and CAPI/Data Manager loops, and India DPDP compliance. Use when testing checkout, billing, OTP, or CRM integrations.
allowed-tools: Read, Glob, Grep, Bash(npm test *), Bash(npx vitest *), Bash(python3 *)
---

# Indian Commerce, Tax, Messaging & Ad-CRM Compliance Auditor

Audit each integration against exact 2025–2026 technical contracts and Indian statutory requirements. Report `file:line` evidence for every check.

## 1. Razorpay Payments & Refunds

- Verify `X-Razorpay-Signature` HMAC-SHA256 runs over the raw unparsed body (`await req.text()` / raw Buffer) with timing-safe comparison.
- Confirm `UNIQUE` DB constraint on `x-razorpay-event-id` header and <5s HTTP `200` ACK via async durable inbox.
- Confirm server-side recomputation of order total in paise before Razorpay order creation and capture reconciliation.
- Verify refunds record `refund_requests` transactionally, send `X-Refund-Idempotency` (≥10 chars) + unique `receipt`, check `payload.payment.entity.captured` for auto-refunds, reject backward webhook transitions, and enforce the Pre-Cut vs. Post-Cut cancellation boundary.

## 2. GST 2.0 & CGST Rule 46 Tax Invoicing

- Verify HSN product master aligns with GST 2.0 (effective Sept 22, 2025): flat 5% GST for fabrics (Chapters 50–60, sarees, unstitched dress materials) and 5% / 18% cliff at ₹2,500 for stitched apparel (Ch. 61–62), flagging any technical/coated fabrics (Ch. 59) or trims for CA HSN verification.
- Verify Place of Supply logic: `supplier_state_code === delivery_state_code` -> CGST + SGST; else -> IGST.
- Use the `pdf` skill or test script to parse a generated invoice PDF and verify all Rule 46 fields: `"TAX INVOICE"`, Supplier GSTIN/Address, sequential ≤16-char FY invoice number, Buyer GSTIN (B2B) or Name/Address/State (B2C ≥ ₹50,000), 4-digit/6-digit HSN depth per ₹5 Cr AATO flag, UQC (`MTR`), taxable value, tax split, Reverse Charge (`Yes/No`), signatory, clause 46(s) non-e-invoice declaration where applicable, and IRP IRN/QR hook when AATO > ₹5 Cr.
- Verify Section 34 Credit Note generation on post-invoice refunds.

## 3. OTP, TRAI DLT & Email Deliverability

- Confirm OTP codes use CSPRNG (6 digits), stored hashed, 5–10 min TTL, single-use, purpose-bound, ≤5 verify attempts (resend does not reset failure count), Turnstile `siteverify` + per-IP (`/64` IPv6) and per-phone rate limits before send.
- Check WhatsApp Cloud API Authentication Template payload (preset category, no URLs/offers/emojis) + 10–20s DLT SMS fallback.
- Verify DLT SMS templates use typed pre-tags (`{#numeric#}`, `{#alphanumeric#}`, `#url#`, `#cbn#`)—flag any legacy `{#var#}`—and output `DLT_OPS_CHECKLIST.md` tracking PE ID, 6-char Header, Template IDs, URL whitelisting, and PE-TM Chain binding.
- Verify transactional email stream isolation, SPF/DKIM/DMARC rollout checklist, and signed bounce/complaint webhook handlers.

## 4. Multi-Channel Lead CRM & Ad Attribution

- Contact Us: Rate limit before Turnstile `siteverify` (forbid `1x…AA` test keys in prod) + UTM/`gclid`/`fbclid`/`_fbp`/`_fbc` capture.
- Meta Lead Ads: GET verify handshake; POST `X-Hub-Signature-256` on raw bytes in constant time; immediate 200 ACK + async Graph API `/{leadgen_id}` fetch; DB `UNIQUE(leadgen_id)`; raw payload archive + replay + token expiry alert + daily bulk backfill.
- Google Ads Lead Forms: Constant-time `google_key` check; `is_test` segregation; parse `user_column_data` by `column_id`; ignore unknown fields; `UNIQUE(lead_id)`; exact `200 {}` / `4XX` / `5XX` responses.
- Closed-Loop CAPI & Google Data Manager: Meta CAPI shared `eventID`/`event_id` deduplication, SHA-256 hashing ONLY normalized contact fields (`91` prefix for Indian phones; IP/UA/`fbp`/`fbc`/`lead_id` unhashed), `test_event_code` stripped in prod; Google offline conversions targeting Data Manager API (not legacy `UploadClickConversions` closed to new adopters June 15, 2026).

## 5. DPDP Rules 2025 & E-Commerce Rules 2020

- Unbundled purpose-specific consent toggles (no pre-ticked boxes), withdrawal propagation to email/WhatsApp/ad tags, Privacy Rights Centre, GST 6–8 yr vs. non-statutory retention separation, under-18 behavioral ad block, and public seller GSTIN/grievance officer footer.
