-- Durable email queue. Confirmation/invoice and status emails are enqueued here
-- and sent by a service-role worker (instant best-effort inline + cron retries),
-- so a transient Resend/PDF failure no longer silently loses the email.
CREATE TABLE IF NOT EXISTS pending_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  kind TEXT NOT NULL,                       -- order_confirmation | order_shipped | order_delivered | order_cancelled
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | sending | sent | failed
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_emails_due
  ON pending_emails(next_attempt_at)
  WHERE status = 'pending';

ALTER TABLE pending_emails ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service-role worker (bypasses RLS) touches this
-- table. anon/authenticated are denied by default — no client can read recipients.
REVOKE ALL ON pending_emails FROM anon, authenticated;
