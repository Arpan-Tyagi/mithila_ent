---
name: verify
description: Build-and-test recipe for this repo. Runs types, lint, unit tests, pgTAP RLS tests, the red-team suite and the multi-role Playwright + axe E2E suite against a LOCAL Supabase stack and a local production build. Use before claiming a change works, before committing, or when asked to verify, test or prove something.
---

# Verify (local stack only)

Never point any of this at production. `tests/security-redteam/run.mjs` and `tests/e2e/run.mjs` refuse non-localhost targets; keep it that way. Do not edit `.env*`.

## 1. Fast checks (no database)

```bash
npx tsc --noEmit
npm run lint
npm test            # vitest: unit + tests/integrations; red-team suites self-skip
```

## 2. Database

```bash
npx supabase start                 # Docker must be running
npx supabase db reset --local      # applies every migration in supabase/migrations
npx supabase test db               # pgTAP: RLS, grants, money paths
npx supabase db lint --level warning --fail-on error
```

## 3. App against the local stack

`.env.local` points at production. A variable already present in `process.env` (even an empty string) beats `.env.local`, so set the local values in the shell instead of editing files:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: from `npx supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`).
- `RAZORPAY_WEBHOOK_SECRET=rt_whsec_local`, `LOGISTICS_WEBHOOK_SECRET=rt_logi_local`, `CRON_SECRET=rt_cron_local`, `NEXT_PUBLIC_SITE_URL=http://localhost:3100`.
- Blank out every other third-party key (Upstash, Gemini, Resend, Razorpay key id/secret, Shiprocket, WhatsApp, Sentry), so nothing reaches a real service.

Then build and start, with the server in the background:

```bash
npm run build && npx next start -p 3100
```

Before reporting, confirm the build points at the local stack: grep `.next/server` for `127.0.0.1:54321`, and make sure the production project ref does not appear. When done, rebuild normally (`npm run build` with the real env) so `.next` isn't left pointing at localhost.

## 4. Red-team and E2E

```bash
REDTEAM_APP_URL=http://localhost:3100 npm run test:redteam     # 22 tests: races, IDOR, HTTP layer
REDTEAM_APP_URL=http://localhost:3100 npm run test:e2e:local   # 26 tests: 3 roles x 2 viewports + axe WCAG 2.2 AA
```

- Each probe prints `REDTEAM <name> <json>`. Quote those lines as evidence.
- E2E artefacts go to `test-results/e2e-local` (git-ignored).
- Expected noise: desktop pages log `ERR_SSL_PROTOCOL_ERROR` for `https://localhost:3100/login`. The production CSP's `upgrade-insecure-requests` upgrades the prefetch, and the local server only speaks http. It is not a defect.

## Reporting

Follow CLAUDE.md: no PASS without a `file:line`, a SQL policy, or test output. Reports live in `docs/SECURITY_REDTEAM_REPORT.md`, `docs/E2E_QA_REPORT.md` and `docs/INTEGRATIONS_COMPLIANCE_REPORT.md`. CI runs the same steps in `.github/workflows/production-security-qa.yml`.
