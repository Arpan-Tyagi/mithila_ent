---
name: race-condition-redteam
description: Executes controlled parallel-request TOCTOU race-condition exploits, horizontal IDOR sweeps, vertical privilege-escalation probes, OTP brute-force tests, and CSV/XLSX formula-injection verification against a local or staging environment. Manual invocation only.
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Bash(node *), Bash(python3 *), Bash(npx tsx *)
---

# Adversarial Concurrency, Access-Control & Export Red-Team Harness

SAFETY GATE: Before firing any request, verify `TARGET_URL` is `http://localhost:*`, `http://127.0.0.1:*`, or an explicitly approved staging domain. Abort immediately if pointed at production.

## Attack Suite to Generate & Execute (Save under `tests/security-redteam/`)

1. Coupon TOCTOU Double-Redemption: Seed a coupon with `usage_limit = 1` (and a per-user limit `1`). Prepare 15–20 valid checkout requests using the same coupon and release them simultaneously via an async barrier (`Promise.all` / Python `asyncio` + HTTP/2). PASS invariant: `succeeded === 1` and `coupon_redemptions COUNT === 1`.
2. Fabric Roll Continuous-Cut Oversell Race: Seed a fabric roll with `remaining_meters = 3.00`. Fire 15 parallel orders requesting `2.00m` each. PASS invariant: `succeeded === 1` and `remaining_meters === 1.00` (never negative).
3. Swatch Credit Double-Spend Race: Seed `₹500` swatch recovery credit. Fire 10 parallel checkouts applying the credit. PASS invariant: credit debited at most once; balance never negative.
4. Concurrent Refund & Cancellation Race: Fire 10 parallel cancellation/refund requests on one paid order. PASS invariant: exactly one `refund_requests` row and one Razorpay refund idempotency key generated.
5. OTP Brute-Force, Replay & Purpose-Swap:
   - Replay a valid consumed OTP across 5 concurrent threads -> must allow max 1 success.
   - Submit 10 sequential invalid 6-digit codes -> must lock out at attempt 5 and return `429`/`423`; requesting a resend must NOT reset the lockout.
   - Try submitting a `signup` OTP against `order_cancel` or `cod_confirm` -> must fail.
6. Horizontal IDOR & Mass Assignment Sweep:
   - Authenticate as `Customer B`; attempt to `GET/POST/PATCH` `Customer A`'s order ID, tracking endpoint, cancel Server Action, and GST invoice download URL -> every attempt must return `403`/`404` and zero bytes of `Customer A` data.
   - Inject `"role": "owner"`, `"is_admin": true`, `"price_paise": 100`, `"discount_paise": 999999` into signup, profile update, and checkout payloads -> must be stripped or rejected by Zod/DAL.
7. Middleware Bypass (`CVE-2025-29927`) Probe:
   - Send unauthenticated requests to `/admin`, `/dashboard`, and `/api/owner/*` carrying `x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware` and `src/middleware:...` -> must still return `401`/`403`/redirect from the DAL.
8. CRM CSV/XLSX Formula Injection Test:
   - Submit benign probe leads containing `=1+1`, `+SUM(1,1)`, `-1+1`, `@SUM(1,1)`, `\t=1+1`, and `",=1+1` via Contact Us / test webhook.
   - Download the Owner CRM CSV/XLSX export and inspect raw output -> confirm zero cells start unescaped with `=`, `+`, `-`, `@`, `\t`, `\r`, `\n` (verify Excel-resistant quoted `\t` prefix or typed XLSX string cell).

## Output Format

Produce `docs/SECURITY_REDTEAM_REPORT.md` with exact reproduction scripts, HTTP status histograms, DB invariant before/after assertions, and CVSS v4.0 scores (invoking `trailofbits:cvss-scoring` and `trailofbits:fp-check`) for every failure.
