---
name: fabric-commerce-audit
description: Audits a luxury fabric e-commerce storefront, customer dashboard, and owner CRM against a 10-domain functional and architectural specification. Use when generating or verifying the master feature checklist, fabric meterage/roll/dye-lot mechanics, customer order flows, or owner CRM workflows.
allowed-tools: Read, Glob, Grep, Write
---

# Fabric E-Commerce & Dual-Dashboard CRM Feature Auditor

Inspect the actual repository code—never assume a feature works because a UI button exists. For every requirement in `$ARGUMENTS` (or all 10 domains by default), trace Frontend UI -> Server Action / Route Handler -> Data Access Layer -> Supabase Schema/RLS.

## Verification Domains

1. Identity & Auth: Sign-up generating both internal UUID and immutable human-readable unique User ID (e.g., `FAB-YYYY-XXXXXX`), login, session refresh, logout (`scope: 'local'` vs `'global'`), password reset, TOTP/Passkey MFA for Owner Admin, and OTP confirmation flows.
2. Fabric Catalog & Precision Mechanics: Fractional meterage (`0.5m` increments stored as `NUMERIC(10,2)`), roll/bolt inventory (`fabric_rolls`), dye-lot/shade grouping, single-bolt continuity checks, remnant tracking, swatch ordering, and swatch-recovery credit ledger.
3. Order Immutability & Snapshot: Confirm every order freezes `user_id`, customer human ID, billing/delivery addresses with state code, Razorpay payment metadata, product SKU, colour, shade/dye-lot, cut length (UQC `MTR`), HSN code, GST breakdown, and coupon applied—immune to later catalog edits or soft-archives.
4. Customer Dashboard: Order history, live shipment tracking timeline (AWB + webhook events), Pre-Cut self-service cancel vs. Post-Cut cancellation request workflow, saved addresses, swatch credit balance, and GST PDF invoice download.
5. Owner Inventory & Catalog CMS: Roll-level stock adjustments (available vs. reserved vs. committed), low-stock alerts, remnant management, product creation (macro imagery, GSM, weave, width, HSN, colour variants), and soft-archiving old products.
6. Owner Order, Refund & Revenue Analytics: Order status transitions, cut-sheet dispatch view, cancellation approval/rejection queue, GST Section 34 Credit Note triggers, Gross vs. Net revenue, CGST/SGST/IGST liability reports, COD vs. Prepaid split, and RTO analytics.
7. Discount Coupons & Offers Engine: Percentage/flat/free-shipping/first-order/minimum-cart/per-user/global usage limits, start/end timestamps, non-stacking rules, and atomic redemption counters.
8. Multi-Channel Lead CRM: Unified inbox for Contact Us, Meta Lead Ads, and Google Ads Lead Forms with source attribution (`utm_*`, `gclid`, `fbclid`, `_fbp`, `_fbc`), status pipeline (`New -> Contacted -> Swatch Sent -> Qualified -> Won/Lost`), assignee, follow-up notes, deduplication, and sanitized CSV/XLSX export.
9. Communications & Tracking: Transactional order + PDF invoice email, WhatsApp/DLT SMS OTP, and courier tracking/NDR notifications.
10. Privacy & Performance: DPDP consent/withdrawal/erasure flows, Consumer Protection E-Commerce disclosures, WCAG 2.1/2.2 AA accessibility, and `<0.8s` mobile LCP / `0ms` TBT performance budget.

## Output Standard

Emit a Markdown table per domain with columns:

`| Req ID | Feature / Sub-Check | Status (PASS / PARTIAL / MISSING / BUG) | Code Evidence (file:line) | Gap / Risk | Concrete Fix |`
